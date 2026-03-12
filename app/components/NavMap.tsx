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
    zipCode?: string;
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

// --- COMPONENTE DE RUTA (DIRECTIONS SERVICE) ---
const RoutePath = ({ stops, origin, returnToStart }: { stops: Stop[], origin: any, returnToStart?: boolean }) => {
    const map = useMap();
    const routesLib = useMapsLibrary('routes');
    const [paths, setPaths] = useState<{
        past: google.maps.LatLngLiteral[][],
        next: google.maps.LatLngLiteral[][],
        future: google.maps.LatLngLiteral[][]
    }>({ past: [], next: [], future: [] });

    useEffect(() => {
        if (!map || !origin || !routesLib) return;

        // Aseguramos que google maps esté disponible globalmente (lo está gracias a useMapsLibrary)
        const ds = new google.maps.DirectionsService();

        const calculate = async (originPos: any, destinationPos: any, waypoints: any[], type: 'past' | 'next' | 'future') => {
            try {
                const request: google.maps.DirectionsRequest = {
                    origin: { lat: originPos.lat, lng: originPos.lng },
                    destination: { lat: destinationPos.lat, lng: destinationPos.lng },
                    waypoints: waypoints.map(wp => ({
                        location: { lat: wp.location.lat, lng: wp.location.lng },
                        stopover: true
                    })),
                    travelMode: google.maps.TravelMode.DRIVING,
                };

                ds.route(request, (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK && result?.routes[0]?.overview_path) {
                        const path = result.routes[0].overview_path.map(p => ({ lat: p.lat(), lng: p.lng() }));
                        setPaths(prev => ({ ...prev, [type]: [path] }));
                    } else {
                        console.warn(`DirectionsService [${type}] failed:`, status);
                    }
                });
            } catch (err) {
                console.error(`DirectionsService error [${type}]:`, err);
            }
        };

        const visited = stops.filter(s => s.isCompleted || s.isFailed).sort((a, b) => a.order - b.order);
        const pending = stops.filter(s => !s.isCompleted && !s.isFailed).sort((a, b) => a.order - b.order);

        // 1. PASADO (Gris): Desde origen por todos los visitados
        if (visited.length > 0) {
            calculate(
                { lat: origin.lat, lng: origin.lng },
                { lat: visited[visited.length - 1].lat, lng: visited[visited.length - 1].lng },
                visited.slice(0, -1).map(s => ({ location: { lat: s.lat, lng: s.lng } })),
                'past'
            );
        } else {
            setPaths(prev => ({ ...prev, past: [] }));
        }

        // 2. ACTIVO (Azul): Del último visitado a la siguiente pendiente
        if (pending.length > 0) {
            const startPoint = visited.length > 0 ? visited[visited.length - 1] : origin;
            calculate(
                { lat: startPoint.lat, lng: startPoint.lng },
                { lat: pending[0].lat, lng: pending[0].lng },
                [],
                'next'
            );
        } else {
            setPaths(prev => ({ ...prev, next: [] }));
        }

        // 3. FUTURO (Verde): De la siguiente pendiente al resto
        if (pending.length > 0) {
            const dest = returnToStart ? origin : pending[pending.length - 1];
            const wps = pending.slice(1, returnToStart ? undefined : -1).map(s => ({ location: { lat: s.lat, lng: s.lng } }));
            
            if (pending.length > 1 || returnToStart) {
                calculate(
                    { lat: pending[0].lat, lng: pending[0].lng },
                    { lat: dest.lat, lng: dest.lng },
                    wps,
                    'future'
                );
            } else {
                setPaths(prev => ({ ...prev, future: [] }));
            }
        } else if (returnToStart && visited.length > 0) {
             calculate(
                { lat: visited[visited.length - 1].lat, lng: visited[visited.length-1].lng },
                { lat: origin.lat, lng: origin.lng },
                [],
                'future'
            );
        } else {
            setPaths(prev => ({ ...prev, future: [] }));
        }
    }, [map, stops, origin, returnToStart, routesLib]);

    return (
        <>
            {paths.past.map((p, i) => <Polyline key={`past-${i}`} path={p} color="#9CA3AF" weight={5} opacity={0.6} />)}
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
    let color = '#9CA3AF'; // Gris por defecto (pendiente lejano)
    if (isCompleted) color = '#10B981'; // Verde (Éxito)
    else if (isFailed) color = '#EF4444'; // Rojo (Fallo)
    else if (isCurrent) color = '#2563EB'; // Azul (Activo)
    else color = '#10B981'; // Verde (Pendiente Futuro)

    if (isSelected) color = '#f59e0b'; // Ámbar (Seleccionado)

    const statusIcon = isCompleted ? '✔' : isFailed ? '✘' : number;

    return (
        <div className="relative flex flex-col items-center group">
            <svg width="42" height="52" viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl transition-transform group-hover:scale-110">
                <path 
                    d="M 20 2 C 28 2 35 9 35 17 C 35 30 20 48 20 48 C 20 48 5 30 5 17 C 5 9 12 2 20 2 Z" 
                    fill={color} 
                    stroke="white" 
                    strokeWidth="2.5" 
                />
                <circle cx="20" cy="18" r="11" fill="white" />
                <text 
                    x="20" 
                    y={isCompleted || isFailed ? 25 : 24} 
                    fontSize={isCompleted || isFailed ? 18 : 14} 
                    fontWeight="1000" 
                    textAnchor="middle" 
                    fill={color}
                    className="italic font-black"
                >
                    {statusIcon}
                </text>
            </svg>
            {isCurrent && (
                <div className="absolute -bottom-1 w-2 h-2 bg-info rounded-full animate-ping" />
            )}
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

    // --- LÓGICA DE CENTRADO INICIAL Y ACTUALIZACIÓN ---
    useEffect(() => {
        if (!map) return;
        
        // Prioridad 1: Centro explícito desde props
        if (props.center) {
            map.panTo(props.center);
            if (map.getZoom()! < 17) map.setZoom(18);
            setIsFollowingUser(true);
            return;
        }

        // Prioridad 2: Centrar en la parada activa o primera pendiente al cargar
        const activeStop = props.stops.find(s => s.isCurrent) || props.stops.find(s => !s.isCompleted && !s.isFailed);
        if (activeStop) {
            map.panTo({ lat: activeStop.lat, lng: activeStop.lng });
            map.setZoom(15);
            return;
        }

        // Prioridad 3: Centrar en el usuario si el GPS está activo
        if (userPos && props.userVehicle.isActive) {
            map.panTo(userPos);
            map.setZoom(17);
        }
    }, [map, props.center, props.stops.length]); // Solo reacciona a cambios importantes

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
                    <AdvancedMarker key="user-location" position={userPos} zIndex={1000}>
                        <VehiclePin type={props.userVehicle.type} />
                    </AdvancedMarker>
                )}

                {props.fleetDrivers?.filter(d => d.lastLocation).map(driver => (
                    <AdvancedMarker
                        key={`driver-${driver.id}`}
                        position={{ lat: driver.lastLocation!.lat, lng: driver.lastLocation!.lng }}
                        zIndex={1100}
                        onClick={() => props.onDriverClick?.(driver.id)}
                    >
                        <VehiclePin type={driver.vehicleType || 'car'} />
                    </AdvancedMarker>
                ))}

                {props.stops.map(stop => (
                    <AdvancedMarker
                        key={`stop-${stop.id}`}
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
