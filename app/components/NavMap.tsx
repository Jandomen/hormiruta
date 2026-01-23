'use client';

import React, { useEffect, useState } from 'react';
import { Map as GoogleMap, Marker, useMap } from '@vis.gl/react-google-maps';
import { Compass } from 'lucide-react';

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
    onGeofenceAlert?: (stop: any) => void;
    onUserLocationUpdate?: (coords: { lat: number; lng: number }) => void;
    userVehicle: {
        type: 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup';
        isActive: boolean;
    };
    showTraffic?: boolean;
    geofenceRadius?: number;
    selectedStopId?: string | null;
    theme?: 'light' | 'dark';
    center?: { lat: number; lng: number };
}

const logisticMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#0B1121" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#242d38" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#060914" }] },
];

const svgToDataUrl = (svg: string): string => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const createStopPin = (number: number, isCurrent: boolean, isCompleted: boolean, isSelected: boolean) => {
    const color = isCompleted ? '#10b981' : isCurrent ? '#22c55e' : isSelected ? '#f59e0b' : '#3b82f6';
    return `<svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M 20 2 C 28 2 35 9 35 17 C 35 30 20 48 20 48 C 20 48 5 30 5 17 C 5 9 12 2 20 2 Z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="20" cy="18" r="10" fill="white"/>
        <text x="20" y="23" font-size="12" font-weight="bold" text-anchor="middle" fill="${color}">${number}</text>
    </svg>`;
};

const Map = (props: MapProps) => {
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    const [userPos, setUserPos] = useState<{ lat: number, lng: number } | null>(null);
    const map = useMap();

    useEffect(() => {
        if (!navigator.geolocation || !map) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserPos(newPos);
                if (props.onUserLocationUpdate) props.onUserLocationUpdate(newPos);
                if (props.userVehicle.isActive && isFollowingUser) {
                    map.panTo(newPos);
                    if (map.getZoom()! < 17) map.setZoom(18);
                }
            },
            () => { }, { enableHighAccuracy: true }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [map, props.userVehicle.isActive, isFollowingUser]);

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-white/5 relative bg-[#0b1121]">
            {/* GPS CENTER BUTTON - ROSE NEON TO CONFIRM VERSION */}
            {props.userVehicle.isActive && !isFollowingUser && (
                <div id="new-gps-control-v2" className="absolute bottom-24 right-4 z-[9999] flex flex-col items-center gap-2">
                    <button
                        onClick={() => setIsFollowingUser(true)}
                        className="w-20 h-20 bg-[#ff0066] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,0,102,0.6)] border-4 border-white/30 active:scale-75 transition-all animate-bounce"
                    >
                        <Compass className="w-10 h-10 text-white" />
                    </button>
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase">Centrar</span>
                </div>
            )}

            <GoogleMap
                defaultCenter={{ lat: 19.4326, lng: -99.1332 }}
                defaultZoom={12}
                className="w-full h-full"
                disableDefaultUI={true}
                gestureHandling="greedy"
                styles={(props.theme === 'dark' ? logisticMapStyles : []) as any}
                onDragstart={() => setIsFollowingUser(false)}
                onClick={(e: any) => props.onMapClick?.(e.detail.latLng ? { lat: e.detail.latLng.lat, lng: e.detail.latLng.lng } : undefined)}
            >
                {userPos && (
                    <Marker
                        position={userPos}
                        label={{ text: props.userVehicle.type === 'car' ? '🚗' : '🚛', fontSize: '40px' }}
                        icon={{ path: 0, scale: 0 }}
                        zIndex={1000}
                    />
                )}

                {props.stops.map(stop => (
                    <Marker
                        key={stop.id}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        icon={{
                            url: svgToDataUrl(createStopPin(stop.order, stop.isCurrent, stop.isCompleted, stop.id === props.selectedStopId)),
                            scaledSize: { width: 40, height: 50 } as any,
                            anchor: { x: 20, y: 50 } as any
                        }}
                        onClick={() => props.onMarkerClick?.(stop.id)}
                    />
                ))}
            </GoogleMap>
        </div>
    );
};

export default Map;
