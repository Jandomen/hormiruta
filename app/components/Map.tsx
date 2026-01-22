'use client';

import React, { useEffect, useState } from 'react';
import { APIProvider, Map as GoogleMap, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Navigation, Compass, Car, Truck, ArrowUp, Loader2, MapPin } from 'lucide-react';
import { createRoot } from 'react-dom/client';

interface Stop {
    id: string;
    lat: number;
    lng: number;
    address?: string;
    isCompleted: boolean;
    isCurrent: boolean;
    order: number;
}

interface MapProps {
    stops: Stop[];
    onMarkerClick?: (stopId: string) => void;
    onRemoveStop?: (stopId: string) => void;
    onMapClick?: (coords?: { lat: number; lng: number }) => void;
    userVehicle: {
        type: 'car' | 'truck' | 'arrow';
        isActive: boolean;
    };
}

const Directions = ({ stops, userVehicle, userPosition }: { stops: Stop[], userVehicle: MapProps['userVehicle'], userPosition: { lat: number, lng: number } | null }) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();
    const [currentStep, setCurrentStep] = useState<string>('');
    const [currentDistance, setCurrentDistance] = useState<string>('');
    const [currentDuration, setCurrentDuration] = useState<string>('');

    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        setDirectionsRenderer(new routesLibrary.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#31CCEC',
                strokeWeight: 6,
                strokeOpacity: 0.8
            }
        }));
    }, [routesLibrary, map]);

    useEffect(() => {
        if (!directionsService || !directionsRenderer) return;

        // Reset if stops are cleared
        if (stops.length < 2 && !userVehicle.isActive) {
            directionsRenderer.setDirections({ routes: [] } as any);
            setCurrentStep('');
            return;
        }

        const activeStops = stops.filter(s => !s.isCompleted);

        // Need at least 1 point if GPS is active, or 2 points if not
        if (activeStops.length === 0 || (!userVehicle.isActive && activeStops.length < 2)) {
            directionsRenderer.setDirections({ routes: [] } as any);
            setCurrentStep('');
            return;
        }

        // Determine Origin: LIVE GPS Location or First Stop
        let origin: google.maps.LatLngLiteral;
        let destination: google.maps.LatLngLiteral;
        let waypoints: google.maps.DirectionsWaypoint[] = [];

        if (userVehicle.isActive && userPosition) {
            origin = userPosition;
        } else {
            if (activeStops.length > 0) {
                origin = { lat: activeStops[0].lat, lng: activeStops[0].lng };
            } else {
                return;
            }
        }

        // Destination is the last active stop
        destination = { lat: activeStops[activeStops.length - 1].lat, lng: activeStops[activeStops.length - 1].lng };

        // Waypoints: all active stops between origin and destination
        if (userVehicle.isActive) {
            // If GPS is origin, all active stops are waypoints except the last one (destination)
            waypoints = activeStops.slice(0, -1).map(stop => ({
                location: { lat: stop.lat, lng: stop.lng },
                stopover: true
            }));
        } else {
            // If first stop is origin, waypoints are stops from the 2nd to the second-to-last
            waypoints = activeStops.slice(1, -1).map(stop => ({
                location: { lat: stop.lat, lng: stop.lng },
                stopover: true
            }));
        }

        directionsService.route({
            origin,
            destination,
            waypoints,
            travelMode: google.maps.TravelMode.DRIVING,
        }).then(response => {
            directionsRenderer.setDirections(response);

            if (response.routes[0] && response.routes[0].legs[0]) {
                const leg = response.routes[0].legs[0];
                if (leg.steps[0]) {
                    const instruction = leg.steps[0].instructions.replace(/<[^>]*>?/gm, '');
                    setCurrentStep(instruction);
                    setCurrentDistance(leg.distance?.text || '');
                    setCurrentDuration(leg.duration?.text || '');
                }
            }

        }).catch(err => {
            console.error("Directions failed", err);
        });
    }, [directionsService, directionsRenderer, stops, userVehicle.isActive, userPosition]);

    if (!currentStep) return null;

    return (
        <div className="absolute top-24 left-6 right-6 z-50 pointer-events-none">
            <div className="bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/5 p-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] flex items-center gap-5 animate-in slide-in-from-top-4 duration-500">
                <div className="w-14 h-14 bg-info rounded-2xl flex items-center justify-center text-dark shadow-[0_0_30px_rgba(49,204,236,0.3)]">
                    <Navigation className="w-7 h-7" />
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-black text-white leading-tight tracking-tight">{currentStep}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="bg-white/5 px-2 py-0.5 rounded-lg text-xs font-black uppercase text-blue-300 border border-white/5">{currentDistance}</span>
                        <span className="text-white/20">•</span>
                        <span className="text-xs font-black uppercase text-white/50">{currentDuration}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const UserLocationMarker = ({ vehicle, map, setPosition }: { vehicle: MapProps['userVehicle'], map: google.maps.Map | null, setPosition: (pos: { lat: number, lng: number } | null) => void }) => {
    const [localPos, setLocalPos] = useState<{ lat: number; lng: number } | null>(null);
    const [marker, setMarker] = useState<google.maps.Marker | null>(null);

    useEffect(() => {
        if (!navigator.geolocation || !map) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocalPos(newPos);
                setPosition(newPos);

                if (vehicle.isActive) {
                    map.panTo(newPos);
                    // Keep zoom if user changed it, or set to 18 if starting
                    if (map.getZoom()! < 12) map.setZoom(18);
                    map.setTilt(45);
                } else {
                    map.setTilt(0);
                }
            },
            (err) => console.error("GPS Error", err),
            { enableHighAccuracy: true, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [map, vehicle.isActive, setPosition]);

    useEffect(() => {
        if (!map || !localPos) return;
        if (marker) marker.setMap(null);

        let emoji = '🚛';
        if (vehicle.type === 'car') emoji = '🚗';
        if (vehicle.type === 'arrow') emoji = '⬆️';

        const newMarker = new google.maps.Marker({
            position: localPos,
            map,
            label: {
                text: emoji,
                fontSize: '40px',
            },
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 0,
            },
            zIndex: 2000
        });

        setMarker(newMarker);
        return () => { newMarker.setMap(null); };
    }, [map, localPos, vehicle.type]);

    return null;
};

const MapContent = ({ stops, onMarkerClick, onRemoveStop, userVehicle }: MapProps) => {
    const map = useMap();
    const [userPosition, setUserPosition] = useState<{ lat: number, lng: number } | null>(null);

    return (
        <>
            <Directions stops={stops} userVehicle={userVehicle} userPosition={userPosition} />
            <UserLocationMarker vehicle={userVehicle} map={map} setPosition={setUserPosition} />

            {stops.map((stop, index) => (
                <Marker
                    key={stop.id}
                    position={{ lat: stop.lat, lng: stop.lng }}
                    label={{
                        text: (index + 1).toString(),
                        color: 'white',
                        fontWeight: 'bold',
                    }}
                    onClick={() => {
                        // Click once to remove (since it's quick add/remove)
                        if (onRemoveStop) {
                            onRemoveStop(stop.id);
                        } else {
                            onMarkerClick?.(stop.id);
                        }
                    }}
                />
            ))}
        </>
    );
};

const Map = ({ stops, onMarkerClick, onRemoveStop, onMapClick, userVehicle }: MapProps) => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative">
            <APIProvider apiKey={apiKey}>
                <GoogleMap
                    defaultCenter={{ lat: 19.4326, lng: -99.1332 }}
                    defaultZoom={12}
                    mapId="HORMIRUTA_MAP_ID"
                    className="w-full h-full"
                    disableDefaultUI={true}
                    style={{ width: '100%', height: '100%' }}
                    onClick={(e) => onMapClick?.(e.detail.latLng ? { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng } : undefined)}
                >
                    <MapContent
                        stops={stops}
                        onMarkerClick={onMarkerClick}
                        onRemoveStop={onRemoveStop}
                        userVehicle={userVehicle}
                    />
                </GoogleMap>
            </APIProvider>
        </div>
    );
};

export default Map;
