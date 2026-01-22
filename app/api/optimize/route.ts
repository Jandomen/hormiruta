import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const { stops, origin, returnToStart, avoidTolls } = await req.json();

        // VALIDATION
        if (!stops || stops.length < 2) {
            return NextResponse.json({ error: 'Not enough stops to optimize' }, { status: 400 });
        }

        const serviceTime = 5 * 60; // 5 minutes in seconds

        let apiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

        // Helper to formatting result with ETAs
        const attachETAs = (orderedStops: any[], startTime: Date) => {
            let currentTime = startTime.getTime();
            return orderedStops.map((stop, index) => {
                // Estimate travel time (mock or real should populate this)
                // If we don't have real duration, estimate: 3 mins per km roughly in city
                const prevStop = index === 0 ? origin : orderedStops[index - 1];
                const distKm = Math.sqrt(Math.pow(stop.lat - prevStop.lat, 2) + Math.pow(stop.lng - prevStop.lng, 2)) * 111;
                const travelSeconds = (distKm * 3 * 60); // ~3 min/km

                currentTime += travelSeconds * 1000;
                const arrivalTime = new Date(currentTime);

                // Add service time for departure
                currentTime += serviceTime * 1000;

                return {
                    ...stop,
                    estimatedArrival: arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    estimatedDeparture: new Date(currentTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                };
            });
        };

        // 1. TRY GOOGLE ROUTES API (Real Traffic)
        if (apiKey && stops.length <= 25) { // API limits
            try {
                // If returnToStart, Origin = Start, Dest = Start, Waypoints = All
                // If Open, Origin = Start, Dest = Furthest/Last, Waypoints = Rest
                // For simplicity in Open mode: Pick the last stop in current list as destination to define general direction, optimize rest.

                let destination = origin;
                let intermediates = [...stops];

                if (!returnToStart && stops.length > 0) {
                    // Find the stop furthest from origin to use as anchor/destination for the open route
                    // This helps the API formulate a directional path
                    let maxDist = 0;
                    let furthestIdx = 0;
                    stops.forEach((s: any, i: number) => {
                        const d = Math.sqrt(Math.pow(s.lat - origin.lat, 2) + Math.pow(s.lng - origin.lng, 2));
                        if (d > maxDist) {
                            maxDist = d;
                            furthestIdx = i;
                        }
                    });
                    destination = stops[furthestIdx];
                    intermediates = stops.filter((_: any, i: number) => i !== furthestIdx);
                }

                const response = await fetch(`https://routes.googleapis.com/directions/v2:computeRoutes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Goog-Api-Key': apiKey,
                        'X-Goog-FieldMask': 'routes.optimizedIntermediateWaypointIndex,routes.duration,routes.distanceMeters'
                    },
                    body: JSON.stringify({
                        origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
                        destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
                        intermediates: intermediates.map(s => ({ location: { latLng: { latitude: s.lat, longitude: s.lng } } })),
                        travelMode: 'DRIVE',
                        routingPreference: 'TRAFFIC_AWARE',
                        optimizeWaypointOrder: true,
                        routeModifiers: {
                            avoidTolls: avoidTolls || false
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.routes && data.routes[0]) {
                        const order = data.routes[0].optimizedIntermediateWaypointIndex;
                        // Reorder intermediates based on API response
                        let optimizedIntermediates: any[] = [];
                        if (order) {
                            optimizedIntermediates = order.map((index: number) => intermediates[index]);
                        } else {
                            // If no waypoints (e.g. 1 stops), logic holds
                            optimizedIntermediates = intermediates;
                        }

                        // Reassemble
                        let finalOrder = [...optimizedIntermediates];
                        if (!returnToStart && stops.length > 0) {
                            finalOrder.push(destination);
                        }

                        // Attach Service Time & ETA
                        const stopsWithTime = attachETAs(finalOrder, new Date());

                        return NextResponse.json({
                            optimizedStops: stopsWithTime,
                            message: 'Ruta optimizada con tráfico real (Google API)'
                        });
                    }
                }
            } catch (err) {
                console.warn("API Optimization failed, usage internal fallback", err);
            }
        }

        // 2. FALLBACK INTERNAL ALGORITHM (Enhanced Priority + Time)
        const calculateDistance = (p1: any, p2: any) => {
            return Math.sqrt(Math.pow(p2.lat - p1.lat, 2) + Math.pow(p2.lng - p1.lng, 2));
        };

        const parseTime = (timeStr?: string) => {
            if (!timeStr) return 9999;
            const match = timeStr.match(/(\d{1,2}):(\d{2})/);
            if (!match) return 9999;
            return parseInt(match[1]) * 60 + parseInt(match[2]);
        };

        let unvisited = [...stops];
        const result = [];
        let currentPos = origin;

        // If returnToStart, reserve closest to origin
        let reservedStop: any = null;
        if (returnToStart && unvisited.length > 2) {
            let closestToOriginIdx = 0;
            let minToOrigin = calculateDistance(origin, unvisited[0]);
            for (let i = 1; i < unvisited.length; i++) {
                const d = calculateDistance(origin, unvisited[i]);
                if (d < minToOrigin) {
                    minToOrigin = d;
                    closestToOriginIdx = i;
                }
            }
            reservedStop = unvisited.splice(closestToOriginIdx, 1)[0];
        }

        while (unvisited.length > 0) {
            let bestIndex = 0;
            let bestScore = Infinity;

            for (let i = 0; i < unvisited.length; i++) {
                const stop = unvisited[i];
                const dist = calculateDistance(currentPos, stop);
                const timeValue = parseTime(stop.timeWindow);

                let score = dist * 1000;
                if (stop.priority === 'HIGH') score -= 2000;
                if (timeValue < 1200) score -= (1200 - timeValue) * 0.5;

                if (score < bestScore) {
                    bestScore = score;
                    bestIndex = i;
                }
            }

            const nextStop = unvisited.splice(bestIndex, 1)[0];
            result.push(nextStop);
            currentPos = nextStop;
        }

        if (reservedStop) {
            result.push(reservedStop);
        }

        // Attach ETAs for Fallback
        const fallbackResult = attachETAs(result, new Date());

        return NextResponse.json({
            optimizedStops: fallbackResult,
            message: 'Ruta optimizada (Motor Interno - Prioridad/Horarios)'
        });

    } catch (error) {
        console.error('Optimization error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
