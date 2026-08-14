import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';
import { VehicleType } from '../types';

const isNative = () => Capacitor.isNativePlatform();

function watchPositionNative(options: PositionOptions, cb: (pos: GeolocationPosition | null, err?: any) => void): Promise<string> {
    return Geolocation.watchPosition(options, (position: any, err?: any) => {
        if (err) { cb(null, err); return; }
        if (position) {
            cb({
                coords: {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                    accuracy: position.coords.accuracy,
                    altitude: position.coords.altitude,
                    altitudeAccuracy: position.coords.altitudeAccuracy,
                    heading: position.coords.heading,
                    speed: position.coords.speed,
                },
                timestamp: position.timestamp
            } as GeolocationPosition);
        }
    });
}

function watchPositionWeb(options: PositionOptions, cb: (pos: GeolocationPosition | null, err?: any) => void): string {
    const id = navigator.geolocation.watchPosition(
        (position) => cb(position),
        (err) => cb(null, err),
        options
    );
    return String(id);
}

async function getCurrentPositionNative(options: PositionOptions): Promise<GeolocationPosition> {
    const pos = await Geolocation.getCurrentPosition(options);
    return {
        coords: {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            altitude: pos.coords.altitude,
            altitudeAccuracy: pos.coords.altitudeAccuracy,
            heading: pos.coords.heading,
            speed: pos.coords.speed,
        },
        timestamp: pos.timestamp
    } as GeolocationPosition;
}

function getCurrentPositionWeb(options: PositionOptions): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos),
            (err) => reject(err),
            options
        );
    });
}

async function clearWatchNative(id: string) {
    await Geolocation.clearWatch({ id });
}

function clearWatchWeb(id: string) {
    navigator.geolocation.clearWatch(Number(id));
}

async function requestPermissionNative(): Promise<boolean> {
    const perm = await Geolocation.checkPermissions();
    if (perm.location !== 'granted') {
        const req = await Geolocation.requestPermissions();
        return req.location === 'granted';
    }
    return true;
}

async function requestPermissionWeb(): Promise<boolean> {
    if (!navigator.permissions || !navigator.permissions.query) return true;
    try {
        const result = await navigator.permissions.query({ name: 'geolocation' as any });
        return result.state === 'granted' || result.state === 'prompt';
    } catch {
        return true;
    }
}

export function useDashboardLocation(status: string, session: any, vehicleType: VehicleType, isGpsActive: boolean, setIsGpsActive: (val: boolean) => void, setNotification: (msg: string | null) => void) {
    const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [originPoint, setOriginPoint] = useState<{ lat: number, lng: number, address: string }>({
        lat: 20.6597,
        lng: -103.3496,
        address: 'Guadalajara, Jalisco'
    });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [fleetDrivers, setFleetDrivers] = useState<any[]>([]);
    const lastOriginCoords = useRef<{ lat: number, lng: number } | null>(null);
    const lastPushedCoords = useRef<{ lat: number, lng: number, t: number } | null>(null);
    const userCoordsRef = useRef<{ lat: number, lng: number } | null>(null);
    const watchId = useRef<string | null>(null);
    const failureCountRef = useRef(0);

    useEffect(() => {
        userCoordsRef.current = userCoords;
    }, [userCoords]);

    useEffect(() => {
        const initGPS = async () => {
            try {
                if (isNative()) {
                    // NO disparar el diálogo nativo de permisos automáticamente al
                    // montar el dashboard: en muchos equipos aparece justo tras el
                    // login/Google y mata la app (cierra el WebView). Solo se avisa;
                    // el usuario activa el GPS tocando el botón de ubicación.
                    const check = await Geolocation.checkPermissions();
                    const granted = check.location === 'granted' || check.coarseLocation === 'granted';
                    if (!granted) {
                        setNotification('⚠️ Activa el GPS tocando el botón de ubicación.');
                        return;
                    }
                } else {
                    const granted = await requestPermissionWeb();
                    if (!granted) {
                        setNotification('⚠️ Permiso de GPS denegado');
                        return;
                    }
                }

                if (watchId.current) {
                    isNative()
                        ? await clearWatchNative(watchId.current)
                        : clearWatchWeb(watchId.current);
                }

                const callback = (position: GeolocationPosition | null, err?: any) => {
                    if (err) {
                        const errorDetail = `Watch GPS Error: [Code: ${err?.code || '?'}] ${err?.message || 'Unknown'}`;
                        console.error(errorDetail, err);
                        return;
                    }
                    if (position) {
                        const newCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
                        const prev = lastPushedCoords.current;
                        const now = Date.now();
                        const moved = !prev ||
                            Math.abs(newCoords.lat - prev.lat) > 0.0001 ||
                            Math.abs(newCoords.lng - prev.lng) > 0.0001;
                        const stale = !prev || now - prev.t > 5000;
                        if (moved || stale) {
                            lastPushedCoords.current = { ...newCoords, t: now };
                            setUserCoords(newCoords);
                        }
                    }
                };

                const opts: PositionOptions = { enableHighAccuracy: true, timeout: 25000, maximumAge: 3000 };
                watchId.current = isNative()
                    ? await watchPositionNative(opts, callback)
                    : watchPositionWeb(opts, callback);
            } catch (e) {
                console.error('Web GPS Setup failed:', e);
            }
        };

        if (status === 'authenticated') initGPS();
        return () => {
            if (watchId.current) {
                isNative()
                    ? Geolocation.clearWatch({ id: watchId.current })
                    : navigator.geolocation.clearWatch(Number(watchId.current));
            }
        };
    }, [status, setNotification]);

    useEffect(() => {
        if (userCoords) {
            const isInitial = !lastOriginCoords.current;
            const hasMovedSignificantly = isInitial ||
                Math.abs(userCoords.lat - lastOriginCoords.current!.lat) > 0.0008 ||
                Math.abs(userCoords.lng - lastOriginCoords.current!.lng) > 0.0008;

            if (hasMovedSignificantly) {
                setOriginPoint({
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    address: isInitial ? 'Ubicación Detectada' : 'Ubicación Actualizada'
                });
                lastOriginCoords.current = userCoords;

                if (isInitial) {
                    setMapCenter({ ...userCoords, _f: Date.now() } as any);
                    setIsGpsActive(true);
                }
            }
        }
    }, [userCoords, setIsGpsActive]);

    const syncLocation = useCallback(async () => {
        const coords = userCoordsRef.current;
        if (status !== 'authenticated' || !coords) return;

        try {
            const updateRes = await fetch('/api/user/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: coords.lat,
                    lng: coords.lng,
                    vehicleType: vehicleType
                })
            });

            if (!updateRes.ok) throw new Error('Update failed');

            const res = await fetch('/api/user/location');
            if (res.ok) {
                const data = await res.json();
                const drivers = Array.isArray(data) ? data : (data.drivers || []);
                setFleetDrivers(drivers.filter((d: any) => d.id !== session?.user?.id));
                failureCountRef.current = 0;
            }
        } catch (e) {
            failureCountRef.current++;
            console.warn(`[Sync] Intento fallido (${failureCountRef.current}). Revisar conexión DB.`);
        }
    }, [status, vehicleType, session?.user?.id]);

    useEffect(() => {
        if (status !== 'authenticated') return;
        const getInterval = () => Math.min(8000 * (failureCountRef.current + 1), 60000);
        const interval = setInterval(syncLocation, getInterval());
        syncLocation();
        return () => clearInterval(interval);
    }, [status, syncLocation]);

    const refreshOriginLocation = useCallback(async (syncOrigin: boolean = true) => {
        try {
            setNotification('⏳ Buscando señal de satélite...');

            const granted = isNative()
                ? await requestPermissionNative()
                : await requestPermissionWeb();
            if (!granted) {
                setNotification('⚠️ Permiso de GPS denegado');
                return;
            }

            let position;
            try {
                position = await (isNative()
                    ? getCurrentPositionNative({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 })
                    : getCurrentPositionWeb({ enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }));
            } catch (innerError: any) {
                if (innerError?.code === 3 || innerError?.code === 2 || innerError?.message?.includes('timeout')) {
                    console.warn('GPS Satelital lento/indisponible, intentando modo híbrido...');
                    try {
                        position = await (isNative()
                            ? getCurrentPositionNative({ enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 })
                            : getCurrentPositionWeb({ enableHighAccuracy: false, timeout: 20000, maximumAge: 30000 }));
                    } catch (lastError: any) {
                        if (userCoords) {
                            console.log('Fallback a coordenadas de Watch detectado');
                            position = {
                                coords: {
                                    latitude: userCoords.lat,
                                    longitude: userCoords.lng,
                                    accuracy: 0,
                                    altitude: null,
                                    altitudeAccuracy: null,
                                    heading: null,
                                    speed: null
                                },
                                timestamp: Date.now()
                            } as GeolocationPosition;
                        } else {
                            throw lastError;
                        }
                    }
                } else {
                    throw innerError;
                }
            }

            const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
            if (syncOrigin) {
                setOriginPoint({ ...coords, address: 'Ubicación GPS Detectada' });
            }

            setMapCenter({ ...coords, _f: Date.now() } as any);
            setIsGpsActive(true);
            setUserCoords(coords);
            setNotification('✅ Ubicación Sincronizada');
            
            syncLocation();
        } catch (error: any) {
            const errorReport = `GPS Error: [Code: ${error?.code || '?'}] ${error?.message || 'Unknown'}`;
            console.error(errorReport, error);
            
            let msg = '⚠️ Error al obtener ubicación';
            if (error?.code === 3 || error?.message?.includes('timeout')) msg = '⏳ Señal débil (Timeout)';
            if (error?.code === 1 || error?.message?.includes('denied') || error?.message?.includes('denied')) msg = '🚫 Permiso GPS denegado';

            setNotification(msg);
        }
    }, [setIsGpsActive, setNotification, syncLocation, userCoords]);

    return { 
        userCoords, 
        setUserCoords, 
        originPoint, 
        setOriginPoint, 
        mapCenter, 
        setMapCenter, 
        fleetDrivers, 
        refreshOriginLocation,
        syncNow: syncLocation 
    };
}
