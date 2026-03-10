'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Map as GoogleMap, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface Stop {
    id: string;
    lat: number;
    lng: number;
    address?: string;
    isCompleted: boolean;
    isFailed: boolean;
    isCurrent: boolean;
    order: number;
}

interface Driver {
    id: string;
    name: string;
    email: string;
    lastLocation?: {
        lat: number;
        lng: number;
        updatedAt: string;
    };
    vehicleType?: 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup' | 'ufo';
}

interface MapProps {
    stops: Stop[];
    onMarkerClick?: (stopId: string) => void;
    onDriverClick?: (driverId: string) => void;
    onRemoveStop?: (stopId: string) => void;
    onMapClick?: (coords?: { lat: number; lng: number }) => void;
    onGeofenceAlert?: (stop: any) => void;
    onMarkerDragEnd?: (stopId: string, newCoords: { lat: number; lng: number }) => void;
    onUserLocationUpdate?: (coords: { lat: number; lng: number }) => void;
    userVehicle: {
        type: 'car' | 'truck' | 'van' | 'motorcycle' | 'pickup' | 'ufo';
        isActive: boolean;
    };
    fleetDrivers?: Driver[];
    showTraffic?: boolean;
    geofenceRadius?: number;
    selectedStopId?: string | null;
    selectedDriverId?: string | null;
    theme?: 'light' | 'dark';
    center?: { lat: number; lng: number };
    origin?: { lat: number; lng: number; address?: string };
    returnToStart?: boolean;
    onUserVehicleClick?: () => void;
}

const logisticMapStyles = [
    { elementType: "geometry", stylers: [{ color: "#0B1121" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0B1121" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8E9BB1" }] },
    {
        featureType: "administrative.locality",
        elementType: "labels.text.fill",
        stylers: [{ color: "#D1D5DB" }],
    },
    {
        featureType: "poi",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8E9BB1" }],
    },
    {
        featureType: "poi.park",
        elementType: "geometry",
        stylers: [{ color: "#111827" }],
    },
    {
        featureType: "poi.park",
        elementType: "labels.text.fill",
        stylers: [{ color: "#4B5563" }],
    },
    {
        featureType: "road",
        elementType: "geometry",
        stylers: [{ color: "#1F2937" }],
    },
    {
        featureType: "road",
        elementType: "geometry.stroke",
        stylers: [{ color: "#374151" }],
    },
    {
        featureType: "road",
        elementType: "labels.text.fill",
        stylers: [{ color: "#9CA3AF" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry",
        stylers: [{ color: "#374151" }],
    },
    {
        featureType: "road.highway",
        elementType: "geometry.stroke",
        stylers: [{ color: "#1F2937" }],
    },
    {
        featureType: "road.highway",
        elementType: "labels.text.fill",
        stylers: [{ color: "#E5E7EB" }],
    },
    {
        featureType: "transit",
        elementType: "geometry",
        stylers: [{ color: "#1F2937" }],
    },
    {
        featureType: "transit.station",
        elementType: "labels.text.fill",
        stylers: [{ color: "#8E9BB1" }],
    },
    {
        featureType: "water",
        elementType: "geometry",
        stylers: [{ color: "#111827" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.fill",
        stylers: [{ color: "#4B5563" }],
    },
    {
        featureType: "water",
        elementType: "labels.text.stroke",
        stylers: [{ color: "#111827" }],
    },
];

// --- COMPONENTE DE RUTA (ROUTES API 2026) ---
const RoutePath = ({ stops, origin, returnToStart }: { stops: Stop[], origin: any, returnToStart?: boolean }) => {
    const map = useMap();
    const routesLib = useMapsLibrary('routes');
    const geometryLib = useMapsLibrary('geometry'); // Para decodificar curvas precisas
    const [paths, setPaths] = useState<{
        past: google.maps.LatLngLiteral[][],
        next: google.maps.LatLngLiteral[][],
        future: google.maps.LatLngLiteral[][]
    }>({ past: [], next: [], future: [] });

    useEffect(() => {
        if (!map || !origin || !routesLib || !geometryLib) return;

        const ds = new routesLib.DirectionsService();

        const calculate = (opts: any, type: 'past' | 'next' | 'future') => {
            ds.route({
                ...opts,
                travelMode: google.maps.TravelMode.DRIVING,
                optimizeWaypoints: false,
                provideRouteAlternatives: false
            }, (res, status) => {
                if (status === 'OK' && res?.routes[0]) {
                    // Recolectamos TODOS los puntos de cada step para máxima precisión en las curvas
                    const highResPath: google.maps.LatLngLiteral[] = [];
                    res.routes[0].legs.forEach(leg => {
                        leg.steps.forEach(step => {
                            step.path.forEach(p => highResPath.push({ lat: p.lat(), lng: p.lng() }));
                        });
                    });

                    if (highResPath.length > 0) {
                        setPaths(prev => ({ ...prev, [type]: [highResPath] }));
                    } else if (res.routes[0].overview_path) {
                        // Respaldo por si fallan los steps
                        const path = res.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
                        setPaths(prev => ({ ...prev, [type]: [path] }));
                    }
                }
            });
        };






        const visited = stops.filter(s => s.isCompleted || s.isFailed).sort((a, b) => a.order - b.order);
        if (visited.length >= 2) {
            calculate({
                origin: { lat: visited[0].lat, lng: visited[0].lng },
                destination: { lat: visited[visited.length - 1].lat, lng: visited[visited.length - 1].lng },
                waypoints: visited.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true })),
            }, 'past');
        }

        const pending = stops.filter(s => !s.isCompleted && !s.isFailed).sort((a, b) => a.order - b.order);
        if (pending.length > 0) {
            calculate({
                origin: { lat: origin.lat, lng: origin.lng },
                destination: { lat: pending[0].lat, lng: pending[0].lng },
            }, 'next');
        }

        if (pending.length >= 2) {
            const dest = returnToStart ? origin : pending[pending.length - 1];
            const wps = pending.slice(1, -1).map(s => ({ location: { lat: s.lat, lng: s.lng }, stopover: true }));
            if (returnToStart) wps.push({ location: { lat: pending[pending.length - 1].lat, lng: pending[pending.length - 1].lng }, stopover: true });
            calculate({
                origin: { lat: pending[0].lat, lng: pending[0].lng },
                destination: { lat: dest.lat, lng: dest.lng },
                waypoints: wps,
            }, 'future');
        }
    }, [map, stops, origin, returnToStart, routesLib]);

    return (
        <>
            {paths.past.map((p, i) => <Polyline key={`past-${i}`} path={p} color="#4B5563" weight={5} opacity={0.6} />)}
            {paths.next.map((p, i) => <Polyline key={`next-${i}`} path={p} color="#2563EB" weight={7} opacity={1} zIndex={100} />)}
            {paths.future.map((p, i) => <Polyline key={`future-${i}`} path={p} color="#10B981" weight={4} opacity={0.5} />)}
        </>
    );
};

const Polyline = ({ path, color, weight, opacity, zIndex }: any) => {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const line = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: color,
            strokeOpacity: opacity,
            strokeWeight: weight,
            zIndex: zIndex || 50,
            map
        });
        return () => line.setMap(null);
    }, [map, path, color, weight, opacity, zIndex]);
    return null;
};

// --- COMPONENTES DE PINES REACT ---
const StopPin = ({ number, isCurrent, isCompleted, isFailed, isSelected }: any) => {
    let color = '#10B981';
    if (isCompleted) color = '#10B981';
    else if (isFailed) color = '#EF4444';
    else if (isCurrent) color = '#2563EB';
    if (isSelected) color = '#f59e0b';

    const statusIcon = isCompleted ? '✓' : isFailed ? '✕' : number;

    return (
        <div className="relative flex flex-col items-center">
            <svg width="40" height="50" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
                <path d="M 20 2 C 28 2 35 9 35 17 C 35 30 20 48 20 48 C 20 48 5 30 5 17 C 5 9 12 2 20 2 Z" fill={color} stroke="white" strokeWidth="2.5" />
                <circle cx="20" cy="18" r="11" fill="white" />
                <text x="20" y={isCompleted || isFailed ? 25 : 24} fontSize={isCompleted || isFailed ? 18 : 14} fontWeight="1000" textAnchor="middle" fill={color}>{statusIcon}</text>
            </svg>
        </div>
    );
};

const VehiclePin = ({ type }: { type: string }) => {
    const emoji = useMemo(() => {
        return type === 'ufo' ? '🛸' :
            type === 'truck' ? '🚛' :
                type === 'van' ? '🚐' :
                    type === 'car' ? '🚗' :
                        type === 'pickup' ? '🛻' : '🏍️';
    }, [type]);

    return (
        <div className="relative flex items-center justify-center w-[80px] h-[80px]">
            <div className="absolute w-[40px] h-[40px] bg-blue-500/20 rounded-full animate-ping" />
            <div className="absolute w-[20px] h-[20px] bg-blue-500/40 rounded-full animate-pulse" />
            <div className="relative text-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)]">{emoji}</div>
        </div>
    );
};

const TrafficLayer = ({ enabled }: { enabled: boolean }) => {
    const map = useMap();
    const [trafficLayer, setTrafficLayer] = useState<google.maps.TrafficLayer | null>(null);

    useEffect(() => {
        if (!map) return;
        const layer = new google.maps.TrafficLayer();
        setTrafficLayer(layer);
        return () => layer.setMap(null);
    }, [map]);

    useEffect(() => {
        if (!trafficLayer) return;
        trafficLayer.setMap(enabled ? map : null);
    }, [trafficLayer, enabled, map]);

    return null;
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
                mapId="4504f9d373b138cf"
                colorScheme={props.theme === 'dark' ? 'DARK' : 'LIGHT'}
                renderingType="VECTOR"
                disableDefaultUI={true}
                gestureHandling="greedy"
                onDragstart={() => setIsFollowingUser(false)}
                onClick={(e: any) => {
                    if (e.detail.latLng) {
                        props.onMapClick?.({ lat: e.detail.latLng.lat, lng: e.detail.latLng.lng });
                    }
                }}
            >
                <RoutePath stops={props.stops} origin={props.origin} returnToStart={props.returnToStart} />
                <TrafficLayer enabled={!!props.showTraffic} />

                {userPos && (
                    <AdvancedMarker position={userPos} zIndex={1000}>
                        <VehiclePin type={props.userVehicle.type} />
                    </AdvancedMarker>
                )}

                {props.fleetDrivers?.map(driver => (
                    driver.lastLocation && (
                        <AdvancedMarker
                            key={driver.id}
                            position={{ lat: driver.lastLocation.lat, lng: driver.lastLocation.lng }}
                            zIndex={1100}
                            onClick={() => props.onDriverClick?.(driver.id)}
                        >
                            <VehiclePin type={driver.vehicleType || 'car'} />
                        </AdvancedMarker>
                    )
                ))}

                {props.stops.map(stop => (
                    <AdvancedMarker
                        key={stop.id}
                        position={{ lat: stop.lat, lng: stop.lng }}
                        onClick={() => props.onMarkerClick?.(stop.id)}
                    >
                        <StopPin
                            number={stop.order}
                            isCurrent={stop.isCurrent}
                            isCompleted={stop.isCompleted}
                            isFailed={stop.isFailed}
                            isSelected={stop.id === props.selectedStopId}
                        />
                    </AdvancedMarker>
                ))}
            </GoogleMap>
        </div>
    );
};

export default Map;
