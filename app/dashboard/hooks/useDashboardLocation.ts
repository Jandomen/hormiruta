import { useState, useEffect, useRef, useCallback } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { VehicleType } from '../types';

export function useDashboardLocation(status: string, session: any, vehicleType: VehicleType, isGpsActive: boolean, setIsGpsActive: (val: boolean) => void, setNotification: (msg: string | null) => void) {
    const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [originPoint, setOriginPoint] = useState<{ lat: number, lng: number, address: string }>({
        lat: 19.4326,
        lng: -99.1332,
        address: 'Ciudad de México'
    });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [fleetDrivers, setFleetDrivers] = useState<any[]>([]);
    const lastOriginCoords = useRef<{ lat: number, lng: number } | null>(null);
    const watchId = useRef<string | null>(null);
    const failureCountRef = useRef(0);

    useEffect(() => {
        const initGPS = async () => {
            try {
                const perm = await Geolocation.checkPermissions();
                if (perm.location !== 'granted') {
                    await Geolocation.requestPermissions();
                }

                if (watchId.current) await Geolocation.clearWatch({ id: watchId.current });

                watchId.current = await Geolocation.watchPosition(
                    { enableHighAccuracy: true, timeout: 25000, maximumAge: 3000 },
                    (position, err) => {
                        if (err) {
                            const errorDetail = `Watch GPS Error: [Code: ${err?.code || '?'}] ${err?.message || 'Unknown'}`;
                            console.error(errorDetail, err);
                            return;
                        }
                        if (position) {
                            const newCoords = { lat: position.coords.latitude, lng: position.coords.longitude };
                            setUserCoords(newCoords);
                        }
                    }
                );
            } catch (e) {
                console.error('Capacitor GPS Setup failed:', e);
            }
        };

        if (status === 'authenticated') initGPS();
        return () => {
            if (watchId.current) Geolocation.clearWatch({ id: watchId.current });
        };
    }, [status]);

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
        if (status !== 'authenticated' || !userCoords) return;
        
        try {
            const updateRes = await fetch('/api/user/location', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    vehicleType: vehicleType
                })
            });

            if (!updateRes.ok) throw new Error('Update failed');

            const res = await fetch('/api/user/location');
            if (res.ok) {
                const drivers = await res.json();
                setFleetDrivers(drivers.filter((d: any) => d.id !== session?.user?.id));
                failureCountRef.current = 0;
            }
        } catch (e) {
            failureCountRef.current++;
            console.warn(`[Sync] Intento fallido (${failureCountRef.current}). Revisar conexión DB.`);
        }
    }, [status, userCoords, vehicleType, session?.user?.id]);

    useEffect(() => {
        if (status === 'authenticated' && userCoords) {
            const getInterval = () => Math.min(8000 * (failureCountRef.current + 1), 60000);
            
            const interval = setInterval(syncLocation, getInterval());
            syncLocation();
            return () => clearInterval(interval);
        }
    }, [status, userCoords, syncLocation]);

    const refreshOriginLocation = useCallback(async (syncOrigin: boolean = true) => {
        try {
            setNotification('⏳ Buscando señal de satélite...');

            const perm = await Geolocation.checkPermissions();
            if (perm.location !== 'granted') {
                const req = await Geolocation.requestPermissions();
                if (req.location !== 'granted') {
                    setNotification('⚠️ Permiso de GPS denegado');
                    return;
                }
            }

            let position;
            try {
                // Intento 1: Alta precisión (Satélites)
                position = await Geolocation.getCurrentPosition({
                    enableHighAccuracy: true,
                    timeout: 20000, 
                    maximumAge: 0
                });
            } catch (innerError: any) {
                // Intento 2: Fallback (Red/WiFi) si el 1 falló
                if (innerError?.code === 3 || innerError?.code === 2) {
                    console.warn('GPS Satelital lento/indisponible, intentando modo híbrido...');
                    try {
                        position = await Geolocation.getCurrentPosition({
                            enableHighAccuracy: false,
                            timeout: 20000,
                            maximumAge: 30000 // Aceptamos hasta 30s de antigüedad para evitar el timeout
                        });
                    } catch (lastError: any) {
                        // Intento 3: Emergencia - Si tenemos coordenadas del watch, las usamos
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
                            } as any;
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
            
            // Forzar sincronización inmediata con el servidor
            syncLocation();
        } catch (error: any) {
            const errorReport = `GPS Error: [Code: ${error?.code || '?'}] ${error?.message || 'Unknown'}`;
            console.error(errorReport, error);
            
            console.log('GPS Detail JSON:', JSON.stringify({
                code: error?.code,
                message: error?.message,
                timestamp: new Date().toISOString()
            }));

            let msg = '⚠️ Error al obtener ubicación';
            if (error?.code === 3 || error?.message?.includes('timeout')) msg = '⏳ Señal débil (Timeout)';
            if (error?.code === 1 || error?.message?.includes('denied')) msg = '🚫 Permiso GPS denegado';

            setNotification(msg);
        }
    }, [setIsGpsActive, setNotification, syncLocation]);

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
