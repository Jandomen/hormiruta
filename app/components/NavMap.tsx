'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Map as GoogleMap, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { Geolocation } from '@capacitor/geolocation';

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
    userCoordsProp?: { lat: number, lng: number } | null;
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

// --- COMPONENTE DE RUTA (CON FALLBACK) ---
const RoutePath = ({ stops, origin, returnToStart, userCurrentPos }: { stops: Stop[], origin: any, returnToStart?: boolean, userCurrentPos?: { lat: number, lng: number } | null }) => {
    const map = useMap();
    const routesLib = useMapsLibrary('routes');
    const geometryLib = useMapsLibrary('geometry');
    const lastCalculatedStops = useRef<string>("");
    const lastUserLoc = useRef<{ lat: number, lng: number } | null>(null);

    const [paths, setPaths] = useState<{
        past: google.maps.LatLngLiteral[][],
        next: google.maps.LatLngLiteral[][],
        future: google.maps.LatLngLiteral[][]
    }>({ past: [], next: [], future: [] });

    const stopsHash = useMemo(() => JSON.stringify(stops.map(s => ({ id: s.id, state: s.isCompleted || s.isFailed }))), [stops]);

    useEffect(() => {
        if (!map || !origin || !routesLib || !geometryLib) return;

        const calculate = async (originPos: any, destinationPos: any, waypoints: any[], type: 'past' | 'next' | 'future', retryCount = 0) => {
            if (!originPos.lat || !originPos.lng || !destinationPos.lat || !destinationPos.lng) {
                setPaths(prev => ({ ...prev, [type]: [] }));
                return;
            }

            try {

                const ds = new google.maps.DirectionsService();
                const request: google.maps.DirectionsRequest = {
                    origin: { lat: Number(originPos.lat), lng: Number(originPos.lng) },
                    destination: { lat: Number(destinationPos.lat), lng: Number(destinationPos.lng) },
                    waypoints: waypoints.map(wp => ({
                        location: { lat: Number(wp.location.lat), lng: Number(wp.location.lng) },
                        stopover: true
                    })),
                    travelMode: google.maps.TravelMode.DRIVING,
                };

                ds.route(request, (result, status) => {
                    if (status === google.maps.DirectionsStatus.OK && result?.routes[0]) {
                        // Extraer cada punto de cada paso para máxima precisión (snapping real a las calles)
                        const fullPath: google.maps.LatLngLiteral[] = [];
                        result.routes[0].legs.forEach(leg => {
                            leg.steps.forEach(step => {
                                step.path.forEach(p => {
                                    fullPath.push({ lat: p.lat(), lng: p.lng() });
                                });
                            });
                        });
                        setPaths(prev => ({ ...prev, [type]: [fullPath] }));
                    } else if (status === 'UNKNOWN_ERROR' && retryCount < 2) {
                        const delay = (retryCount + 1) * 1500;
                        setTimeout(() => calculate(originPos, destinationPos, waypoints, type, retryCount + 1), delay);
                    } else {
                        console.warn(`[NavMap] API ${type} skipping: ${status}`);
                    }
                });
            } catch (err) {
                console.error(`Route error [${type}]:`, err);
            }
        };

        const visited = stops.filter(s => s.isCompleted || s.isFailed).sort((a, b) => a.order - b.order);
        const pending = stops.filter(s => !s.isCompleted && !s.isFailed).sort((a, b) => a.order - b.order);
        const currentOrigin = userCurrentPos || origin;

        // LÓGICA DE OPTIMIZACIÓN DE LLAMADAS:
        // Solo recalculamos tramos estáticos (Pasado y Futuro) si cambian las paradas
        const stopsChanged = lastCalculatedStops.current !== stopsHash;

        // Solo recalculamos tramo activo (Azul) si el usuario se mueve más de 30 metros (zona de tolerancia)
        let userMovedSignificantly = false;
        if (userCurrentPos) {
            if (!lastUserLoc.current) {
                userMovedSignificantly = true;
            } else {
                const latDiff = Math.abs(userCurrentPos.lat - lastUserLoc.current.lat);
                const lngDiff = Math.abs(userCurrentPos.lng - lastUserLoc.current.lng);
                // ~30 metros de umbral
                if (latDiff > 0.0003 || lngDiff > 0.0003) userMovedSignificantly = true;
            }
        }

        const timer = setTimeout(() => {
            if (stopsChanged) {
                // 1. PASADO (Gris) - Punto de Inicio a última completada
                if (visited.length > 0) {
                    calculate(origin, { lat: visited[visited.length - 1].lat, lng: visited[visited.length - 1].lng }, visited.slice(0, -1).map(s => ({ location: { lat: s.lat, lng: s.lng } })), 'past');
                } else setPaths(prev => ({ ...prev, past: [] }));

                // 3. FUTURO (Verde) - Siguiente parada hasta el destino final
                if (pending.length > 1 || (pending.length > 0 && returnToStart)) {
                    const dest = returnToStart ? origin : pending[pending.length - 1];
                    const wps = pending.slice(1, returnToStart ? undefined : -1).map(s => ({ location: { lat: s.lat, lng: s.lng } }));
                    calculate({ lat: pending[0].lat, lng: pending[0].lng }, dest, wps, 'future');
                } else setPaths(prev => ({ ...prev, future: [] }));

                lastCalculatedStops.current = stopsHash;
            }

            if (userMovedSignificantly || stopsChanged) {
                // 2. ACTIVO (Azul) - De Ubicación Actual a siguiente parada
                if (pending.length > 0) {
                    calculate(currentOrigin, { lat: pending[0].lat, lng: pending[0].lng }, [], 'next');
                } else if (returnToStart && visited.length > 0) {
                    // Si ya acabamos pero volvemos al inicio, el azul es hacia el origen
                    calculate(currentOrigin, origin, [], 'next');
                } else setPaths(prev => ({ ...prev, next: [] }));

                if (userCurrentPos) lastUserLoc.current = userCurrentPos;
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [map, stopsHash, returnToStart, routesLib, geometryLib, JSON.stringify(userCurrentPos)]);

    return (
        <>
            {/* Pasado - Gris Sólido Robusto */}
            {paths.past[0] && <Polyline path={paths.past[0]} options={{ strokeColor: '#64748b', strokeOpacity: 0.4, strokeWeight: 7, zIndex: 10 }} />}
            
            {/* Activo - Azul Destacado */}
            {paths.next[0] && <Polyline path={paths.next[0]} options={{ strokeColor: '#3b82f6', strokeOpacity: 1, strokeWeight: 9, zIndex: 100 }} />}
            
            {/* Futuro - Verde Sólido Transparente (Ya no es punteado para evitar 'efecto desplazamiento') */}
            {paths.future[0] && <Polyline path={paths.future[0]} options={{ strokeColor: '#22c55e', strokeOpacity: 0.4, strokeWeight: 7, zIndex: 5 }} />}
        </>
    );
};

const Polyline = ({ path, options }: any) => {
    const map = useMap();
    useEffect(() => {
        if (!map || !path) return;
        const line = new google.maps.Polyline({
            path,
            geodesic: true,
            ...options,
            map
        });
        return () => line.setMap(null);
    }, [map, path, JSON.stringify(options)]);
    return null;
};

// --- COMPONENTES DE PINES REACT ---
const StopPin = ({ number, isCurrent, isCompleted, isFailed, isSelected }: any) => {
    let color = '#10B981'; // Verde por defecto (Pendiente Futuro)
    
    if (isCompleted) {
        color = '#94a3b8'; // Gris/Slate (Completado)
    } else if (isFailed) {
        color = '#EF4444'; // Rojo (Fallo)
    } else if (isCurrent) {
        color = '#2563EB'; // Azul (Activo)
    }

    if (isSelected) color = '#f59e0b'; // Ámbar (Seleccionado)

    const statusIcon = isCompleted ? '✔' : isFailed ? '✘' : number;

    return (
        <div className="relative flex flex-col items-center group">
            {/* Contenedor con margen inferior para forzar que el SVG se apoye en su punta */}
            <div className="relative -translate-y-full mb-[-2px]">
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
            </div>
            {isCurrent && (
                <div className="absolute top-0 w-2 h-2 bg-info rounded-full animate-ping" />
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
        <div className="relative flex items-center justify-center w-[60px] h-[60px] -translate-y-1/2">
            <div className="absolute w-[45px] h-[45px] bg-blue-500/20 rounded-full animate-[ping_1.5s_linear_infinite]" />
            <div className="absolute w-[25px] h-[25px] bg-blue-500/40 rounded-full animate-pulse" />
            <div className="relative text-3xl drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-none flex items-center justify-center select-none active:scale-90 transition-transform">{emoji}</div>
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
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    const [userPos, setUserPos] = useState<{ lat: number, lng: number } | null>(props.userCoordsProp || null);
    const map = useMap();
    const watchIdRes = useRef<string | null>(null);

    // Sincronizar userPos con prop si cambia externamente
    useEffect(() => {
        if (props.userCoordsProp) setUserPos(props.userCoordsProp);
    }, [props.userCoordsProp]);

    // Seguimiento GPS nativo con Capacitor
    useEffect(() => {
        const startTracking = async () => {
            try {
                if (watchIdRes.current) await Geolocation.clearWatch({ id: watchIdRes.current });

                watchIdRes.current = await Geolocation.watchPosition(
                    { enableHighAccuracy: true, timeout: 20000 },
                    (position) => {
                        if (position) {
                            const newPos = { lat: position.coords.latitude, lng: position.coords.longitude };
                            setUserPos(newPos);
                            if (props.onUserLocationUpdate) props.onUserLocationUpdate(newPos);

                            // Seguir al usuario si estamos en modo navegación
                            if (props.userVehicle.isActive && isFollowingUser && map) {
                                map.panTo(newPos);
                                if (map.getZoom()! < 15) map.setZoom(17);
                            }
                        }
                    }
                );
            } catch (e) {
                console.error("Capacitor Map Tracking failed", e);
            }
        };

        if (props.userVehicle.isActive) startTracking();

        return () => {
            if (watchIdRes.current) Geolocation.clearWatch({ id: watchIdRes.current });
        };
    }, [map, props.userVehicle.isActive, isFollowingUser]);

    // --- LÓGICA DE CENTRADO INICIAL Y ACTUALIZACIÓN ---
    useEffect(() => {
        if (!map) return;

        // Prioridad 1: Centro explícito desde props (ej: cuando se pica una parada en la lista)
        if (props.center) {
            map.panTo(props.center);
            if (map.getZoom()! < 15) map.setZoom(16);
            setIsFollowingUser(true);
            return;
        }

        // Prioridad 2: Centrar en la parada activa o primera pendiente al cargar
        const activeStop = props.stops.find(s => s.isCurrent) || props.stops.find(s => !s.isCompleted && !s.isFailed);
        if (activeStop) {
            map.panTo({ lat: activeStop.lat, lng: activeStop.lng });
            if (map.getZoom()! < 14) map.setZoom(15);
            return;
        }

        // Prioridad 3: Centrar en el usuario si ya tenemos su posición y no hay paradas
        if (userPos && (props.userVehicle.isActive || props.stops.length === 0)) {
            map.panTo(userPos);
            if (map.getZoom()! < 14) map.setZoom(16);
        }
    }, [map, props.center, props.stops.length, userPos === null]);

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
                <RoutePath stops={props.stops} origin={props.origin} returnToStart={props.returnToStart} userCurrentPos={userPos} />
                <TrafficLayer enabled={!!props.showTraffic} />

                {userPos && (
                    <AdvancedMarker key="user-location" position={userPos} zIndex={1000}>
                        <VehiclePin type={props.userVehicle.type} />
                    </AdvancedMarker>
                )}

                {props.fleetDrivers?.filter(d => d && (d.id || (d as any)._id) && d.lastLocation).map((driver, idx) => (
                    <AdvancedMarker
                        key={`driver-${driver.id || (driver as any)._id || idx}`}
                        position={{ lat: driver.lastLocation!.lat, lng: driver.lastLocation!.lng }}
                        zIndex={1100}
                        onClick={() => props.onDriverClick?.(driver.id || (driver as any)._id)}
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
