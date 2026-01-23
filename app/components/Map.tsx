'use client';

import React, { useEffect, useState, useRef } from 'react';
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
    onMapClick?: (coords?: { lat: number; lng: number }) => void;
    onUserLocationUpdate?: (coords: { lat: number; lng: number }) => void;
    userVehicle: {
        type: 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup';
        isActive: boolean;
    };
    showTraffic: boolean;
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

const UserLocationMarker = ({ vehicle, map, setPosition, isFollowingUser }: any) => {
    const [localPos, setLocalPos] = useState<{ lat: number; lng: number } | null>(null);

    useEffect(() => {
        if (!navigator.geolocation || !map) return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setLocalPos(newPos);
                setPosition(newPos);

                if (vehicle.isActive && isFollowingUser) {
                    map.panTo(newPos);
                    // Forzar siempre vista 2D estática
                    if (map.getHeading() !== 0) map.setHeading(0);
                    if (map.getTilt() !== 0) map.setTilt(0);
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
        <Marker
            position={localPos}
            label={{ text: emoji, fontSize: '42px' }}
            icon={{ path: 0, scale: 0 }}
            zIndex={2000}
        />
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
        map.setOptions({
            styles: props.theme === 'dark' ? logisticMapStyles : [],
            gestureHandling: 'greedy'
        });
        return () => google.maps.event.removeListener(listener);
    }, [map, props.theme, props.setIsFollowingUser]);

    return (
        <>
            <UserLocationMarker
                vehicle={props.userVehicle}
                map={map}
                setPosition={setUserPosition}
                isFollowingUser={props.isFollowingUser}
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

    return (
        <div className="w-full h-full rounded-2xl lg:rounded-3xl overflow-hidden border border-white/5 shadow-2xl relative bg-[#0b1121]">
            {props.userVehicle.isActive && !isFollowingUser && (
                <div className="absolute bottom-24 right-4 z-50 flex flex-col items-center gap-2">
                    <button
                        onClick={() => setIsFollowingUser(true)}
                        className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center shadow-2xl border-2 border-white/20 cursor-pointer active:scale-90 transition-all"
                    >
                        <Compass className="w-8 h-8 text-white" />
                    </button>
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-lg">Centrar</span>
                </div>
            )}

            <GoogleMap
                defaultCenter={{ lat: 19.4326, lng: -99.1332 }}
                defaultZoom={12}
                className="w-full h-full"
                disableDefaultUI={true}
                gestureHandling="greedy"
            >
                <MapContent {...props} isFollowingUser={isFollowingUser} setIsFollowingUser={setIsFollowingUser} />
            </GoogleMap>
        </div>
    );
};

export default Map;
