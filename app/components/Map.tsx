'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Map as GoogleMap, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Navigation, Compass, Car, Truck, ArrowUp, Loader2, MapPin, CheckCircle } from 'lucide-react';

interface Stop {
    id: string;
    lat: number;
    lng: number;
    address?: string;
    isCompleted: boolean;
    isCurrent: boolean;
    order: number;
}

interface GeofenceAlertStop {
    stopId: string;
    stopOrder: number;
    address?: string;
    timestamp: number;
}

interface MapProps {
    stops: Stop[];
    onMarkerClick?: (stopId: string) => void;
    onRemoveStop?: (stopId: string) => void;
    onMapClick?: (coords?: { lat: number; lng: number }) => void;
    onGeofenceAlert?: (stop: GeofenceAlertStop) => void;
    onUserLocationUpdate?: (coords: { lat: number; lng: number }) => void;
    userVehicle: {
        type: 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup';
        isActive: boolean;
    };
    showTraffic: boolean;
    geofenceRadius?: number;
    selectedStopId?: string | null;
    navigationTargetId?: string | null;
    theme?: 'light' | 'dark';
    center?: { lat: number; lng: number };
}

const logisticMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#0B1121" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0B1121" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#5ea5b3" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#263c3f" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b9a76" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#242d38" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1a222c" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#5a6a7a" }],
    },
    {
        // HIGHWAYS - Muted Bronze
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#3d3228" }], // Muted Bronze
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#2d241a" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#6b5a4a" }],
    },
    {
        // ARTERIALS - Subtle Grey
        featureType: "road.arterial",
        elementType: "geometry",
        stylers: [{ color: "#2a3441" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#2f3948" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#d59563" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#060914" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#515c6d" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#17263c" }],
    },
];

const createStopPin = (number: number, isCurrentStop: boolean, isCompleted: boolean, isSelected?: boolean): string => {
    const bgColor = isCompleted ? '#10b981' : isCurrentStop ? '#22c55e' : isSelected ? '#f59e0b' : '#3b82f6';
    const borderColor = isCompleted ? '#059669' : isCurrentStop ? '#16a34a' : isSelected ? '#d97706' : '#1d4ed8';

    return `
        <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <!-- Pin shadow -->
            <ellipse cx="20" cy="45" rx="10" ry="3" fill="rgba(0,0,0,0.2)"/>
            
            <!-- Pin body -->
            <path d="M 20 2 C 28 2 35 9 35 17 C 35 30 20 48 20 48 C 20 48 5 30 5 17 C 5 9 12 2 20 2 Z" 
                  fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
            
            <!-- Inner circle with checkmark or number -->
            <circle cx="20" cy="18" r="10" fill="white" opacity="0.95"/>
            
            ${isCompleted ? `
                <!-- Checkmark for completed stops -->
                <g transform="translate(20, 18)">
                    <path d="M -4 0 L -1 3 L 4 -2" 
                          stroke="${bgColor}" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </g>
            ` : `
                <!-- Number for active/pending stops -->
                <text x="20" y="23" font-size="14" font-weight="bold" text-anchor="middle" fill="${bgColor}">
                    ${number}
                </text>
            `}
            
            <!-- Glow effect for current stop or selected -->
            ${(isCurrentStop || isSelected) && !isCompleted ? `
                <circle cx="20" cy="18" r="12" fill="none" stroke="${bgColor}" stroke-width="1" opacity="0.3"/>
                <circle cx="20" cy="18" r="14" fill="none" stroke="${bgColor}" stroke-width="0.5" opacity="0.15"/>
            ` : ''}
        </svg>
    `.trim();
};

const svgToDataUrl = (svg: string): string => {
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml;utf8,${encoded}`;
};

const Directions = ({
    stops,
    userVehicle,
    userPosition,
    theme,
    navigationTargetId
}: {
    stops: Stop[],
    userVehicle: MapProps['userVehicle'],
    userPosition: { lat: number, lng: number } | null,
    theme: 'dark' | 'light',
    navigationTargetId?: string | null
}) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
    const [currentStep, setCurrentStep] = useState<string>('');
    const [currentDistance, setCurrentDistance] = useState<string>('');
    const [currentDuration, setCurrentDuration] = useState<string>('');

    // Dynamic color based on theme
    const polylineColor = theme === 'dark' ? '#FFD600' : '#03A9F4'; // Yellow for Night, Sky Blue for Day

    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: polylineColor,
                strokeWeight: 8,
                strokeOpacity: 1.0,
                zIndex: 50
            }
        }));
    }, [routesLibrary, map]);

    // Update color when theme changes
    useEffect(() => {
        if (directionsRenderer) {
            directionsRenderer.setOptions({
                polylineOptions: {
                    strokeColor: polylineColor,
                    strokeWeight: 8,
                    strokeOpacity: 1.0,
                    zIndex: 50
                }
            });
        }
    }, [directionsRenderer, polylineColor]);

    useEffect(() => {
        if (!directionsService || !directionsRenderer) return;

        const activeStops = stops.filter(s => !s.isCompleted);

        // Logic for specific navigation target
        if (navigationTargetId && userPosition) {
            const targetStop = stops.find(s => s.id === navigationTargetId);
            if (targetStop) {
                directionsService.route({
                    origin: userPosition,
                    destination: { lat: targetStop.lat, lng: targetStop.lng },
                    travelMode: google.maps.TravelMode.DRIVING,
                }).then(response => {
                    directionsRenderer.setDirections(response);
                    if (response.routes[0]?.legs[0]) {
                        const leg = response.routes[0].legs[0];
                        const instruction = leg.steps[0]?.instructions.replace(/<[^>]*>?/gm, '') || '';
                        setCurrentStep(instruction);
                        setCurrentDistance(leg.distance?.text || '');
                        setCurrentDuration(leg.duration?.text || '');
                    }
                });
                return;
            }
        }

        // Standard logic for full route
        if (activeStops.length === 0 || (!userVehicle.isActive && activeStops.length < 2)) {
            directionsRenderer.setDirections({ routes: [] } as any);
            setCurrentStep('');
            return;
        }

        let origin: google.maps.LatLngLiteral;
        let destination: google.maps.LatLngLiteral;
        let waypoints: google.maps.DirectionsWaypoint[] = [];

        if (userVehicle.isActive && userPosition) {
            origin = userPosition;
            destination = { lat: activeStops[activeStops.length - 1].lat, lng: activeStops[activeStops.length - 1].lng };
            waypoints = activeStops.slice(0, -1).map(stop => ({
                location: { lat: stop.lat, lng: stop.lng },
                stopover: true
            }));
        } else {
            origin = { lat: activeStops[0].lat, lng: activeStops[0].lng };
            destination = { lat: activeStops[activeStops.length - 1].lat, lng: activeStops[activeStops.length - 1].lng };
            waypoints = activeStops.slice(1, -1).map(stop => ({
                location: { lat: stop.lat, lng: stop.lng },
                stopover: true
            }));
        }

        if (waypoints.length > 23) waypoints = waypoints.slice(0, 23);

        const timeoutId = setTimeout(() => {
            directionsService.route({
                origin,
                destination,
                waypoints,
                travelMode: google.maps.TravelMode.DRIVING,
            }).then(response => {
                directionsRenderer.setDirections(response);
                if (response.routes[0]?.legs[0]) {
                    const leg = response.routes[0].legs[0];
                    const instruction = leg.steps[0]?.instructions.replace(/<[^>]*>?/gm, '') || '';
                    setCurrentStep(instruction);
                    setCurrentDistance(leg.distance?.text || '');
                    setCurrentDuration(leg.duration?.text || '');
                }
            }).catch(err => console.error("Directions failed", err));
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [directionsService, directionsRenderer, stops, userVehicle.isActive, userPosition, navigationTargetId]);

    if (!currentStep) return null;

    return (
        <div className="absolute top-20 lg:top-32 left-4 lg:left-8 right-4 lg:right-8 z-50 pointer-events-none">
            <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/5 p-3 lg:p-5 rounded-2xl lg:rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-3 lg:gap-5 animate-in slide-in-from-top-2 duration-500">
                <div className="w-10 h-10 lg:w-14 lg:h-14 bg-info rounded-xl lg:rounded-2xl flex items-center justify-center text-dark shadow-[0_0_20px_rgba(49,204,236,0.3)]">
                    <Navigation className="w-5 h-5 lg:w-7 lg:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm lg:text-base font-black text-white leading-tight tracking-tight truncate lg:whitespace-normal">{currentStep}</h3>
                    <div className="flex items-center gap-2 lg:gap-3 mt-0.5">
                        <span className="bg-white/5 px-1.5 py-0.5 rounded-lg text-[10px] lg:text-xs font-black uppercase text-blue-300 border border-white/5">{currentDistance}</span>
                        <span className="text-white/20 text-[10px]">•</span>
                        <span className="text-[10px] lg:text-xs font-black uppercase text-white/50">{currentDuration}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const GeofenceDetection = ({
    stops,
    userPosition,
    userVehicle,
    onGeofenceAlert,
    geofenceRadius = 100,
}: {
    stops: Stop[];
    userPosition: { lat: number; lng: number } | null;
    userVehicle: MapProps['userVehicle'];
    onGeofenceAlert?: (stop: GeofenceAlertStop) => void;
    geofenceRadius?: number;
}) => {
    const geofenceRef = useRef<globalThis.Map<string, boolean>>(new globalThis.Map<string, boolean>());
    const lastAlertRef = useRef<number>(0);

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
        const R = 6371000;
        const dLat = ((lat2 - lat1) * Math.PI) / 180;
        const dLng = ((lng2 - lng1) * Math.PI) / 180;
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    };

    useEffect(() => {
        if (!userVehicle.isActive || !userPosition || !onGeofenceAlert) return;
        const now = Date.now();
        if (now - lastAlertRef.current < 5000) return;

        const activeStops = stops.filter(s => !s.isCompleted);
        activeStops.forEach(stop => {
            const distance = calculateDistance(userPosition.lat, userPosition.lng, stop.lat, stop.lng);
            if (distance <= geofenceRadius && !geofenceRef.current.get(stop.id)) {
                geofenceRef.current.set(stop.id, true);
                lastAlertRef.current = now;
                onGeofenceAlert({ stopId: stop.id, stopOrder: stop.order, address: stop.address, timestamp: now });
            } else if (distance > geofenceRadius * 1.2) {
                geofenceRef.current.set(stop.id, false);
            }
        });
    }, [userPosition, userVehicle.isActive, stops, onGeofenceAlert, geofenceRadius]);

    return null;
};

const UserLocationMarker = ({ vehicle, map, setPosition }: { vehicle: MapProps['userVehicle'], map: google.maps.Map | null, setPosition: (pos: { lat: number, lng: number } | null) => void }) => {
    const [localPos, setLocalPos] = useState<{ lat: number; lng: number } | null>(null);
    const [heading, setHeading] = useState<number>(0);

    // Compass Sync Logic
    useEffect(() => {
        const handleOrientation = (e: any) => {
            // Priority to webkitCompassHeading (iOS), fallback to alpha (Android)
            const compass = e.webkitCompassHeading || (360 - e.alpha);
            if (compass !== undefined && compass !== null) {
                setHeading(compass);
            }
        };

        const initOrientation = async () => {
            // Handle iOS permission request
            if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                try {
                    const permission = await (DeviceOrientationEvent as any).requestPermission();
                    if (permission === 'granted') {
                        window.addEventListener('deviceorientation', handleOrientation);
                    }
                } catch (err) {
                    console.error("[GYRO] Permission rejected", err);
                }
            } else {
                window.addEventListener('deviceorientation', handleOrientation);
            }
        };

        if (vehicle.isActive) {
            initOrientation();
        }

        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [vehicle.isActive]);

    // Map Sync Logic
    useEffect(() => {
        if (!map) return;
        if (vehicle.isActive) {
            map.setHeading(heading);
            map.setTilt(45); // Enable 3D view automatically
        } else {
            map.setHeading(0);
            map.setTilt(0);
        }
    }, [map, heading, vehicle.isActive]);

    const isFirstRun = useRef(true);
    const lastPosRef = useRef<google.maps.LatLngLiteral | null>(null);

    useEffect(() => {
        if (!navigator.geolocation || !map) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocalPos(newPos);
                setPosition(newPos);

                if (vehicle.isActive) {
                    const shouldCenter = isFirstRun.current ||
                        (!!lastPosRef.current &&
                            (Math.abs(lastPosRef.current.lat - newPos.lat) > 0.0001 ||
                                Math.abs(lastPosRef.current.lng - newPos.lng) > 0.0001));

                    if (shouldCenter) {
                        map.panTo(newPos);
                        lastPosRef.current = newPos;
                        if (isFirstRun.current) {
                            map.setZoom(19);
                            isFirstRun.current = false;
                        }
                    }
                } else {
                    isFirstRun.current = true;
                }
            },
            () => { },
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [map, vehicle.isActive, setPosition]);

    const emoji = vehicle.type === 'car' ? '🚗' : vehicle.type === 'truck' ? '🚛' : vehicle.type === 'van' ? '🚐' : vehicle.type === 'pickup' ? '🛻' : '🏍️';
    if (!localPos) return null;

    return (
        <>
            {/* Direction Indicator (Blue Cone) synced with compass */}
            {vehicle.isActive && (
                <Marker
                    position={localPos}
                    icon={{
                        path: "M 0 0 L -20 -40 A 45 45 0 0 1 20 -40 Z",
                        fillColor: "#31CCEC",
                        fillOpacity: 0.4,
                        strokeColor: "#31CCEC",
                        strokeWeight: 2,
                        strokeOpacity: 0.8,
                        scale: 1.2,
                        rotation: heading,
                        anchor: { x: 0, y: 0 } as any,
                    }}
                    zIndex={1999}
                />
            )}
            <Marker
                position={localPos}
                label={{ text: emoji, fontSize: '42px' }}
                icon={{ path: 0, scale: 0 }}
                zIndex={2000}
            />
        </>
    );
};

const MapContent = ({ stops, onMarkerClick, onRemoveStop, onGeofenceAlert, onUserLocationUpdate, userVehicle, showTraffic, geofenceRadius, selectedStopId, navigationTargetId, theme = 'dark', center }: MapProps) => {
    const map = useMap();
    const [userPosition, setUserPosition] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (map && center) {
            map.panTo(center);
            if (map.getZoom()! < 12) map.setZoom(18);
        }
    }, [map, center]);

    useEffect(() => {
        if (userPosition && onUserLocationUpdate) onUserLocationUpdate(userPosition);
    }, [userPosition, onUserLocationUpdate]);

    const mapsLibrary = useMapsLibrary('maps');
    const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);
    const geofenceCirclesRef = useRef<google.maps.Circle[]>([]);

    useEffect(() => {
        if (!map) return;
        map.setOptions({ styles: theme === 'dark' ? logisticMapStyles : [] });
    }, [map, theme]);

    useEffect(() => {
        if (!map || !mapsLibrary) return;
        if (showTraffic) {
            const layer = new mapsLibrary.TrafficLayer();
            layer.setMap(map);
            setTrafficLayer(layer);
        } else if (trafficLayer) {
            trafficLayer.setMap(null);
            setTrafficLayer(null);
        }
        return () => { if (trafficLayer) trafficLayer.setMap(null); };
    }, [map, mapsLibrary, showTraffic]);

    useEffect(() => {
        if (!map || !mapsLibrary || !userVehicle.isActive) {
            geofenceCirclesRef.current.forEach(circle => circle.setMap(null));
            geofenceCirclesRef.current = [];
            return;
        }
        geofenceCirclesRef.current.forEach(circle => circle.setMap(null));
        geofenceCirclesRef.current = [];
        const radius = geofenceRadius || 100;
        const activeStops = stops.filter(s => !s.isCompleted);
        activeStops.forEach(stop => {
            const circle = new mapsLibrary.Circle({
                center: { lat: stop.lat, lng: stop.lng },
                radius,
                map,
                fillColor: '#22c55e',
                fillOpacity: 0.08,
                strokeColor: '#22c55e',
                strokeOpacity: 0.3,
                strokeWeight: 2,
                zIndex: 0,
            });
            geofenceCirclesRef.current.push(circle);
        });
        return () => { geofenceCirclesRef.current.forEach(circle => circle.setMap(null)); };
    }, [map, mapsLibrary, stops, userVehicle.isActive, geofenceRadius]);

    return (
        <>
            <Directions
                stops={stops}
                userVehicle={userVehicle}
                userPosition={userPosition}
                theme={theme as any}
                navigationTargetId={navigationTargetId}
            />
            <UserLocationMarker vehicle={userVehicle} map={map} setPosition={setUserPosition} />
            <GeofenceDetection
                stops={stops}
                userPosition={userPosition}
                userVehicle={userVehicle}
                onGeofenceAlert={onGeofenceAlert}
                geofenceRadius={geofenceRadius}
            />

            {stops.map((stop) => {
                const isSelected = stop.id === selectedStopId;
                const stopSvg = createStopPin(stop.order, stop.isCurrent, stop.isCompleted, isSelected);
                return (
                    <Marker
                        key={stop.id}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        icon={{
                            url: svgToDataUrl(stopSvg),
                            scaledSize: { width: 40, height: 50 } as any,
                            anchor: { x: 20, y: 50 } as any,
                        }}
                        zIndex={stop.isCurrent || isSelected ? 1000 : 100}
                        onClick={() => onMarkerClick?.(stop.id)}
                        title={`Parada ${stop.order}: ${stop.address || 'Sin dirección'}`}
                    />
                );
            })}
        </>
    );
};

const Map = (props: MapProps) => {
    return (
        <div className="w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
            <GoogleMap
                defaultCenter={{ lat: 19.4326, lng: -99.1332 }}
                defaultZoom={12}
                className="w-full h-full font-sans"
                disableDefaultUI={true}
                gestureHandling="greedy" // Better for mobile interaction
                keyboardShortcuts={false}
                mapTypeControl={false}
                streetViewControl={false}
                rotateControl={true}
                fullscreenControl={false}
                zoomControl={false}
                // Allow tilt and rotation gestures
                tilt={0}
                heading={0}
                onClick={(e: any) => props.onMapClick?.(e.detail.latLng ? { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng } : undefined)}
            >
                <MapContent {...props} />
            </GoogleMap>
        </div>
    );
};

export default Map;
