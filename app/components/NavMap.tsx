'use client';

import React, { useEffect, useState } from 'react';
import { Map as GoogleMap, Marker, useMap } from '@vis.gl/react-google-maps';

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
        type: 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup' | 'ufo';
        isActive: boolean;
    };
    showTraffic?: boolean;
    geofenceRadius?: number;
    selectedStopId?: string | null;
    theme?: 'light' | 'dark';
    center?: { lat: number; lng: number };
    origin?: { lat: number; lng: number; address?: string };
}

const Directions = ({ stops, origin }: { stops: Stop[], origin: any }) => {
    const map = useMap();
    const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

    useEffect(() => {
        if (!map) return;
        const renderer = new google.maps.DirectionsRenderer({
            map,
            suppressMarkers: true,
            polylineOptions: {
                strokeColor: '#3b82f6',
                strokeWeight: 5,
                strokeOpacity: 0.8
            }
        });
        setDirectionsRenderer(renderer);
        return () => renderer.setMap(null);
    }, [map]);

    useEffect(() => {
        if (!directionsRenderer || stops.length === 0 || !origin) return;

        const directionsService = new google.maps.DirectionsService();
        const pendingStops = stops.filter(s => !s.isCompleted).sort((a, b) => a.order - b.order);

        if (pendingStops.length === 0) {
            directionsRenderer.setDirections({ routes: [] } as any);
            return;
        }

        const waypoints = pendingStops.slice(0, -1).map(stop => ({
            location: { lat: stop.lat, lng: stop.lng },
            stopover: true
        }));

        const destination = pendingStops[pendingStops.length - 1];

        directionsService.route({
            origin: { lat: origin.lat, lng: origin.lng },
            destination: { lat: destination.lat, lng: destination.lng },
            waypoints: waypoints,
            travelMode: google.maps.TravelMode.DRIVING
        }, (result, status) => {
            if (status === google.maps.DirectionsStatus.OK) {
                directionsRenderer.setDirections(result);
            }
        });
    }, [directionsRenderer, stops, origin]);

    return null;
};

const logisticMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#0B1121" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#4B5563" }] }, // Texto gris apagado
    { elementType: "labels.text.stroke", stylers: [{ color: "#0B1121" }] }, // Contorno oscuro para que no brille
    { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#1F2937" }] },
    { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#6B7280" }] },
    { featureType: "poi", stylers: [{ visibility: "off" }] }, // Ocultar puntos de interés innecesarios
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#1A202C" }] },
    { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#4B5563" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2D3748" }] },
    { featureType: "transit", stylers: [{ visibility: "off" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#040914" }] },
    { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#374151" }] },
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

    useEffect(() => {
        if (map && props.center) {
            map.panTo(props.center);
            if (map.getZoom()! < 17) map.setZoom(18);
            setIsFollowingUser(true);
        }
    }, [map, props.center]);

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-white/5 relative bg-[#0b1121]">

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
                <Directions stops={props.stops} origin={props.origin} />

                {userPos && (
                    <Marker
                        position={userPos}
                        label={{
                            text: props.userVehicle.type === 'ufo' ? '🛸' :
                                props.userVehicle.type === 'truck' ? '🚛' :
                                    props.userVehicle.type === 'van' ? '🚐' :
                                        props.userVehicle.type === 'car' ? '🚗' :
                                            props.userVehicle.type === 'pickup' ? '🛻' : '🏍️',
                            fontSize: '40px'
                        }}
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
