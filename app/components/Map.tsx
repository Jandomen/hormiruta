'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Map as GoogleMap, Marker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Navigation, Compass } from 'lucide-react';

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
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#242d38" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3d3228" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#060914" }] },
];

const createStopPin = (number: number, isCurrentStop: boolean, isCompleted: boolean, isSelected?: boolean): string => {
    const bgColor = isCompleted ? '#10b981' : isCurrentStop ? '#22c55e' : isSelected ? '#f59e0b' : '#3b82f6';
    const borderColor = isCompleted ? '#059669' : isCurrentStop ? '#16a34a' : isSelected ? '#d97706' : '#1d4ed8';

    return `
        <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
            <ellipse cx="20" cy="45" rx="10" ry="3" fill="rgba(0,0,0,0.2)"/>
            <path d="M 20 2 C 28 2 35 9 35 17 C 35 30 20 48 20 48 C 20 48 5 30 5 17 C 5 9 12 2 20 2 Z" fill="${bgColor}" stroke="${borderColor}" stroke-width="2"/>
            <circle cx="20" cy="18" r="10" fill="white" opacity="0.95"/>
            ${isCompleted ? '<path d="M 16 18 L 19 21 L 24 16" stroke="' + bgColor + '" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' :
            '<text x="20" y="23" font-size="14" font-weight="bold" text-anchor="middle" fill="' + bgColor + '">' + number + '</text>'}
        </svg>`.trim();
};

const svgToDataUrl = (svg: string): string => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const Directions = ({ stops, userVehicle, userPosition, theme, navigationTargetId, onInstructionsUpdate }: any) => {
    const map = useMap();
    const routesLibrary = useMapsLibrary('routes');
    const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService>();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer>();

    useEffect(() => {
        if (!routesLibrary || !map) return;
        setDirectionsService(new routesLibrary.DirectionsService());
        const renderer = new routesLibrary.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: theme === 'dark' ? '#FFD600' : '#03A9F4',
                strokeWeight: 8,
                strokeOpacity: 0.8,
                zIndex: 50
            }
        });
        setDirectionsRenderer(renderer);
        return () => renderer.setMap(null);
    }, [routesLibrary, map, theme]);

    useEffect(() => {
        if (!directionsService || !directionsRenderer) return;
        const activeStops = stops.filter((s: Stop) => !s.isCompleted);
        const targetStop = navigationTargetId ? stops.find((s: Stop) => s.id === navigationTargetId) : null;

        if ((navigationTargetId && targetStop && userPosition) || (activeStops.length > 0 && userPosition && userVehicle.isActive)) {
            const dest = targetStop ? { lat: targetStop.lat, lng: targetStop.lng } : { lat: activeStops[activeStops.length - 1].lat, lng: activeStops[activeStops.length - 1].lng };
            const waypoints = targetStop ? [] : activeStops.slice(0, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true }));

            directionsService.route({
                origin: userPosition,
                destination: dest,
                waypoints: waypoints.slice(0, 23),
                travelMode: google.maps.TravelMode.DRIVING,
            }).then(response => {
                directionsRenderer.setDirections(response);
                const leg = response.routes[0]?.legs[0];
                if (leg) {
                    onInstructionsUpdate({
                        step: leg.steps[0]?.instructions.replace(/<[^>]*>?/gm, '') || '',
                        dist: leg.distance?.text || '',
                        dur: leg.duration?.text || ''
                    });
                }
            }).catch(() => onInstructionsUpdate(null));
        } else {
            directionsRenderer.setDirections({ routes: [] } as any);
            onInstructionsUpdate(null);
        }
    }, [directionsService, directionsRenderer, stops, userPosition, navigationTargetId, userVehicle.isActive]);

    return null;
};

const UserLocationMarker = (props: { vehicle: MapProps['userVehicle'], map: google.maps.Map | null, setPosition: (pos: { lat: number, lng: number } | null) => void, isFollowingUser: boolean, navigationTargetId?: string | null }) => {
    const { vehicle, map, setPosition, isFollowingUser } = props;
    const [localPos, setLocalPos] = useState<{ lat: number; lng: number } | null>(null);
    const [heading, setHeading] = useState<number>(0);

    useEffect(() => {
        const handleOrientation = (e: any) => {
            let compass = e.webkitCompassHeading || (360 - e.alpha);
            if (compass) {
                const screenOrientation = (window.screen as any).orientation?.angle || 0;
                setHeading((compass + screenOrientation) % 360);
            }
        };

        const init = async () => {
            const win = window as any;
            if ('ondeviceorientationabsolute' in win) {
                win.addEventListener('deviceorientationabsolute', handleOrientation);
            } else if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
                const res = await (DeviceOrientationEvent as any).requestPermission();
                if (res === 'granted') win.addEventListener('deviceorientation', handleOrientation);
            } else {
                win.addEventListener('deviceorientation', handleOrientation);
            }
        };

        if (vehicle.isActive) init();
        return () => {
            const win = window as any;
            win.removeEventListener('deviceorientationabsolute', handleOrientation);
            win.removeEventListener('deviceorientation', handleOrientation);
        };
    }, [vehicle.isActive]);

    // Map Sync Logic (Rotation and Tilt)
    useEffect(() => {
        if (!map) return;
        const isNavigating = vehicle.isActive && props.navigationTargetId;

        if (isNavigating && isFollowingUser) {
            map.setHeading(heading);
            map.setTilt(45);
        } else {
            map.setHeading(0);
            map.setTilt(0);
        }
    }, [map, heading, vehicle.isActive, isFollowingUser, props.navigationTargetId]);

    useEffect(() => {
        if (!navigator.geolocation || !map) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocalPos(newPos);
                setPosition(newPos);
                if (vehicle.isActive && isFollowingUser) {
                    map.panTo(newPos);
                    if (map.getZoom()! < 18) map.setZoom(19);
                }
            },
            () => { },
            { enableHighAccuracy: true, maximumAge: 1000, timeout: 5000 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [map, vehicle.isActive, isFollowingUser, setPosition]);

    if (!localPos) return null;
    const emoji = vehicle.type === 'car' ? '🚗' : vehicle.type === 'truck' ? '🚛' : vehicle.type === 'van' ? '🚐' : vehicle.type === 'pickup' ? '🛻' : '🏍️';

    return (
        <>
            {/* Direction Indicator (Blue Cone) - ONLY in Navigation Mode */}
            {vehicle.isActive && props.navigationTargetId && (
                <Marker
                    position={localPos}
                    icon={{
                        path: "M 0 0 L -20 -40 A 45 45 0 0 1 20 -40 Z",
                        fillColor: "#31CCEC",
                        fillOpacity: 0.4,
                        strokeColor: "#31CCEC",
                        strokeWeight: 2,
                        scale: 1.2,
                        rotation: heading,
                        anchor: { x: 0, y: 0 } as any,
                    }}
                    zIndex={1999}
                />
            )}
            <Marker position={localPos} label={{ text: emoji, fontSize: '42px' }} icon={{ path: 0, scale: 0 }} zIndex={2000} />
        </>
    );
};

const MapContent = (props: any) => {
    const map = useMap();
    const [userPosition, setUserPosition] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (map && props.center) map.panTo(props.center);
    }, [map, props.center]);

    useEffect(() => {
        if (userPosition && props.onUserLocationUpdate) props.onUserLocationUpdate(userPosition);
    }, [userPosition]);

    useEffect(() => {
        if (!map) return;
        const listener = map.addListener('dragstart', () => props.setIsFollowingUser(false));
        map.setOptions({ styles: props.theme === 'dark' ? logisticMapStyles : [] });
        return () => google.maps.event.removeListener(listener);
    }, [map, props.theme, props.setIsFollowingUser]);

    return (
        <>
            <Directions {...props} userPosition={userPosition} />
            <UserLocationMarker
                vehicle={props.userVehicle}
                map={map}
                setPosition={setUserPosition}
                isFollowingUser={props.isFollowingUser}
                navigationTargetId={props.navigationTargetId}
            />
            {props.stops.map((stop: Stop) => (
                <Marker
                    key={stop.id}
                    position={{ lat: stop.lat, lng: stop.lng }}
                    icon={{
                        url: svgToDataUrl(createStopPin(stop.order, stop.isCurrent, stop.isCompleted, stop.id === props.selectedStopId)),
                        scaledSize: { width: 40, height: 50 } as any,
                        anchor: { x: 20, y: 50 } as any,
                    }}
                    onClick={() => props.onMarkerClick?.(stop.id)}
                />
            ))}
        </>
    );
};

const Map = (props: MapProps) => {
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    const [instructions, setInstructions] = useState<any>(null);

    return (
        <div className="w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#0b1121]">
            {instructions && (
                <div className="absolute top-20 left-4 right-4 z-50 pointer-events-none">
                    <div className="bg-black/90 backdrop-blur-xl border border-white/10 p-4 rounded-2xl flex items-center gap-4 shadow-2xl">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                            <Navigation />
                        </div>
                        <div className="flex-1">
                            <p className="text-white font-bold leading-tight">{instructions.step}</p>
                            <p className="text-white/50 text-xs font-bold uppercase">{instructions.dist} • {instructions.dur}</p>
                        </div>
                    </div>
                </div>
            )}

            {props.userVehicle.isActive && !isFollowingUser && (
                <div className="absolute bottom-24 right-4 z-50 flex flex-col items-center gap-2">
                    <button
                        onClick={() => setIsFollowingUser(true)}
                        className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 animate-bounce cursor-pointer active:scale-90 transition-all"
                    >
                        <Compass className="w-8 h-8 text-white" />
                    </button>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">Centrar</span>
                </div>
            )}

            <GoogleMap
                defaultCenter={{ lat: 19.4326, lng: -99.1332 }}
                defaultZoom={12}
                className="w-full h-full"
                disableDefaultUI={true}
                gestureHandling="greedy"
            >
                <MapContent {...props} isFollowingUser={isFollowingUser} setIsFollowingUser={setIsFollowingUser} onInstructionsUpdate={setInstructions} />
            </GoogleMap>
        </div>
    );
};

export default Map;
