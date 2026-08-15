'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Map as GoogleMap, AdvancedMarker, useMap, useMapsLibrary, APIProvider } from '@vis.gl/react-google-maps';
import { Capacitor } from '@capacitor/core';
import { reportUsage } from '../lib/reportUsage';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

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
                        reportUsage('directions');
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

        const stopsChanged = lastCalculatedStops.current !== stopsHash;

        let userMovedSignificantly = false;
        if (userCurrentPos) {
            if (!lastUserLoc.current) {
                userMovedSignificantly = true;
            } else {
                const latDiff = Math.abs(userCurrentPos.lat - lastUserLoc.current.lat);
                const lngDiff = Math.abs(userCurrentPos.lng - lastUserLoc.current.lng);
                if (latDiff > 0.0003 || lngDiff > 0.0003) userMovedSignificantly = true;
            }
        }

        const timer = setTimeout(() => {
            if (stopsChanged) {
                if (visited.length > 0) {
                    calculate(origin, { lat: visited[visited.length - 1].lat, lng: visited[visited.length - 1].lng }, visited.slice(0, -1).map(s => ({ location: { lat: s.lat, lng: s.lng } })), 'past');
                } else setPaths(prev => ({ ...prev, past: [] }));

                if (pending.length > 1 || (pending.length > 0 && returnToStart)) {
                    const dest = returnToStart ? origin : pending[pending.length - 1];
                    const wps = pending.slice(1, returnToStart ? undefined : -1).map(s => ({ location: { lat: s.lat, lng: s.lng } }));
                    calculate({ lat: pending[0].lat, lng: pending[0].lng }, dest, wps, 'future');
                } else setPaths(prev => ({ ...prev, future: [] }));

                lastCalculatedStops.current = stopsHash;
            }

            if (userMovedSignificantly || stopsChanged) {
                if (pending.length > 0) {
                    calculate(currentOrigin, { lat: pending[0].lat, lng: pending[0].lng }, [], 'next');
                } else if (returnToStart && visited.length > 0) {
                    calculate(currentOrigin, origin, [], 'next');
                } else setPaths(prev => ({ ...prev, next: [] }));

                if (userCurrentPos) lastUserLoc.current = userCurrentPos;
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [map, stopsHash, returnToStart, routesLib, geometryLib, JSON.stringify(userCurrentPos)]);

    return (
        <>
            {paths.past[0] && <Polyline path={paths.past[0]} options={{ strokeColor: '#64748b', strokeOpacity: 0.4, strokeWeight: 7, zIndex: 10 }} />}

            {paths.next[0] && <Polyline path={paths.next[0]} options={{ strokeColor: '#3b82f6', strokeOpacity: 1, strokeWeight: 9, zIndex: 100 }} />}

            {paths.future[0] && <Polyline path={paths.future[0]} options={{ strokeColor: '#10b981', strokeOpacity: 0.6, strokeWeight: 7, zIndex: 5 }} />}
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

const StopPin = ({ number, isCurrent, isCompleted, isFailed, isSelected }: any) => {
    let bg = '#3B82F6';
    let pulseColor = 'bg-blue-500';

    if (isCompleted) {
        bg = '#059669';
    } else if (isFailed) {
        bg = '#EF4444';
    } else if (isCurrent) {
        bg = '#10B981';
        pulseColor = 'bg-green-500';
    }

    if (isSelected) bg = '#f59e0b';

    return (
        <div className="relative flex flex-col items-center group">
            <div className="relative -translate-y-full mb-[-2px]">
                <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl transition-transform group-hover:scale-110">
                    <circle cx="22" cy="22" r="20" fill={bg} stroke="white" strokeWidth="3" />
                    <circle cx="22" cy="22" r="15" fill="white" />
                    <text
                        x="22"
                        y="27"
                        fontSize="16"
                        fontWeight="1000"
                        textAnchor="middle"
                        fill={bg}
                        className="italic font-black"
                    >
                        {number}
                    </text>

                    {(isCompleted || isFailed) && (
                        <g transform="translate(30, 6)">
                            <circle r="8" fill={isCompleted ? '#10B981' : '#EF4444'} stroke="white" strokeWidth="2" />
                            <text
                                x="0"
                                y="4"
                                fontSize="10"
                                fontWeight="bold"
                                textAnchor="middle"
                                fill="white"
                            >
                                {isCompleted ? '✔' : '✘'}
                            </text>
                        </g>
                    )}
                </svg>
            </div>
            {isCurrent && (
                <div className={`absolute top-1 w-3 h-3 ${pulseColor} rounded-full animate-ping`} />
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

const MapInner = (props: MapProps) => {
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 1024;
    const isNative = Capacitor.isNativePlatform();
    const [isFollowingUser, setIsFollowingUser] = useState(true);
    // En la app nativa se retrasa el montaje del mapa para que el WebView
    // se asiente tras la navegación y no se dispare el pico de memoria
    // (causa frecuente de cierre de la app en equipos limitados).
    const [mapReady, setMapReady] = useState(!isNative);
    useEffect(() => {
        if (!isNative) return;
        const t = setTimeout(() => setMapReady(true), 1200);
        return () => clearTimeout(t);
    }, [isNative]);
    const [userPos, setUserPos] = useState<{ lat: number, lng: number } | null>(props.userCoordsProp || null);
    const map = useMap();
    const alertedStopsRef = useRef<Set<string>>(new Set());
    const lastPanTarget = useRef<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (props.userCoordsProp) setUserPos(props.userCoordsProp);
    }, [props.userCoordsProp]);

    // Follow the user only when active, throttled to avoid panning the map on
    // every GPS tick (the watcher lives in useDashboardLocation).
    useEffect(() => {
        if (!map || !userPos || !props.userVehicle.isActive || !isFollowingUser) return;

        const last = lastPanTarget.current;
        const movedEnough = !last ||
            Math.abs(userPos.lat - last.lat) > 0.0005 ||
            Math.abs(userPos.lng - last.lng) > 0.0005;

        if (movedEnough) {
            lastPanTarget.current = userPos;
            map.panTo(userPos);
        }
    }, [map, userPos, props.userVehicle.isActive, isFollowingUser]);

    // Geofence detection: compare user position against pending stops
    useEffect(() => {
        if (!userPos || !props.onGeofenceAlert) return;
        const radius = props.geofenceRadius ?? 100;
        const pending = props.stops.filter(s => !s.isCompleted && !s.isFailed);
        for (const stop of pending) {
            if (alertedStopsRef.current.has(stop.id)) continue;
            const R = 6371000;
            const dLat = ((stop.lat - userPos.lat) * Math.PI) / 180;
            const dLng = ((stop.lng - userPos.lng) * Math.PI) / 180;
            const a = Math.sin(dLat / 2) ** 2 + Math.cos((userPos.lat * Math.PI) / 180) * Math.cos((stop.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
            const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            if (dist <= radius) {
                alertedStopsRef.current.add(stop.id);
                props.onGeofenceAlert({ stopId: stop.id, stopOrder: stop.order, address: stop.address, timestamp: Date.now() });
            }
        }
    }, [userPos, props.stops, props.geofenceRadius, props.onGeofenceAlert]);

    // Reset alerted stops when stops change (new route, etc.)
    useEffect(() => {
        alertedStopsRef.current = new Set();
    }, [props.stops.length]);

    const stopsStateKey = useMemo(() =>
        props.stops.map(s => `${s.id}:${s.isCurrent}:${s.isCompleted}:${s.isFailed}`).join('|'),
        [props.stops]
    );

    useEffect(() => {
        if (!map) return;

        if (props.center) {
            map.panTo(props.center);
            if (map.getZoom()! < 15) map.setZoom(16);
            setIsFollowingUser(true);
            return;
        }

        const activeStop = props.stops.find(s => s.isCurrent) || props.stops.find(s => !s.isCompleted && !s.isFailed);
        if (activeStop) {
            map.panTo({ lat: activeStop.lat, lng: activeStop.lng });
            if (map.getZoom()! < 14) map.setZoom(15);
            return;
        }

        if (userPos && (props.userVehicle.isActive || props.stops.length === 0)) {
            map.panTo(userPos);
            if (map.getZoom()! < 14) map.setZoom(16);
        }
    }, [map, props.center, stopsStateKey, userPos === null]);

    return (
        <div className="w-full h-full rounded-3xl overflow-hidden border border-white/5 relative bg-[#0b1121]">
            {mapReady && (
            <GoogleMap
                defaultCenter={{ lat: 20.6597, lng: -103.3496 }}
                defaultZoom={12}
                className="w-full h-full"
                mapId="4504f9d373b138cf"
                colorScheme={props.theme === 'dark' ? 'DARK' : 'LIGHT'}
                renderingType={isNative ? 'RASTER' : 'VECTOR'}
                disableDefaultUI={true}
                clickableIcons={false}
                mapTypeControl={false}
                zoomControl={false}
                fullscreenControl={false}
                streetViewControl={false}
                gestureHandling="greedy"
                onDragstart={() => setIsFollowingUser(false)}
                onZoomChanged={() => setIsFollowingUser(false)}
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
            )}
        </div>
    );
};

export default function Map(props: MapProps) {
    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <MapInner {...props} />
        </APIProvider>
    );
}
