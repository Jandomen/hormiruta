import { useState, useEffect, useRef, useCallback } from 'react';
import { VehicleType } from '../types';

export function useDashboardLocation(status: string, session: any, vehicleType: VehicleType, isGpsActive: boolean, setIsGpsActive: (val: boolean) => void, setNotification: (msg: string | null) => void) {
    const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [originPoint, setOriginPoint] = useState<{ lat: number, lng: number, address: string }>({
        lat: 19.4326,
        lng: -99.1332,
        address: 'Mi Ubicación Actual'
    });
    const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number } | undefined>(undefined);
    const [fleetDrivers, setFleetDrivers] = useState<any[]>([]);
    const lastOriginCoords = useRef<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if (status === 'authenticated' && userCoords && isGpsActive) {
            const hasMovedSignificantly = !lastOriginCoords.current ||
                Math.abs(userCoords.lat - lastOriginCoords.current.lat) > 0.0005 ||
                Math.abs(userCoords.lng - lastOriginCoords.current.lng) > 0.0005;

            if (hasMovedSignificantly) {
                setOriginPoint({
                    lat: userCoords.lat,
                    lng: userCoords.lng,
                    address: 'Mi Ubicación Actual'
                });
                lastOriginCoords.current = userCoords;
            }

            const syncLocation = async () => {
                try {
                    await fetch('/api/user/location', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            lat: userCoords.lat,
                            lng: userCoords.lng,
                            vehicleType: vehicleType
                        })
                    });

                    const res = await fetch('/api/user/location');
                    if (res.ok) {
                        const drivers = await res.json();
                        setFleetDrivers(drivers.filter((d: any) => d.id !== session?.user?.id));
                    }
                } catch (e) {
                    console.error("Location sync/fetch failed", e);
                }
            };

            const interval = setInterval(syncLocation, 30000);
            syncLocation();
            return () => clearInterval(interval);
        }
    }, [status, userCoords, isGpsActive, vehicleType, session?.user]);

    const refreshOriginLocation = useCallback((syncOrigin: boolean = true) => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            setNotification('GPS no disponible en este navegador');
            return;
        }

        if (userCoords) {
            if (syncOrigin) {
                setOriginPoint({
                    ...userCoords,
                    address: 'Ubicación GPS Actual'
                });
            }
            setMapCenter({ ...userCoords, _f: Date.now() } as any);
            setIsGpsActive(true);
            setNotification(syncOrigin ? 'Inicio sincronizado' : 'Mapa centrado');
            return;
        }

        setNotification('Sincronizando con satélites...');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };

                if (syncOrigin) {
                    setOriginPoint({
                        ...coords,
                        address: 'Ubicación GPS Actual'
                    });
                }

                setMapCenter({ ...coords, _f: Date.now() } as any);
                setIsGpsActive(true);
                setNotification(syncOrigin ? 'Inicio sincronizado' : 'Mapa centrado');
                setUserCoords(coords);
            },
            (error) => {
                console.error('Error GPS Detallado:', { code: error.code, message: error.message });
                let msg = 'Error de conexión GPS';
                if (error.code === 1) msg = '⚠️ Por favor permite el acceso al GPS';
                if (error.code === 3) msg = '⏳ Tiempo agotado (Señal débil)';
                setNotification(msg);
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            }
        );
    }, [userCoords, setIsGpsActive, setNotification]);

    return { userCoords, setUserCoords, originPoint, setOriginPoint, mapCenter, setMapCenter, fleetDrivers, refreshOriginLocation };
}
