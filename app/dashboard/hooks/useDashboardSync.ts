import { useState, useEffect, useCallback } from 'react';

export function useDashboardSync(status: string, currentRouteId: string | null) {
    const [isOnline, setIsOnline] = useState(true);
    const [statusBanner, setStatusBanner] = useState<{ type: 'online' | 'offline', visible: boolean }>({ type: 'online', visible: false });

    const syncWithServer = useCallback(async () => {
        if (typeof window === "undefined" || !navigator.onLine || status !== 'authenticated' || !currentRouteId) return;

        console.log("[SYNC] Starting automatic synchronization...");
        try {
            const savedStops = localStorage.getItem('hormiruta_stops');
            if (savedStops) {
                const stopsToSync = JSON.parse(savedStops);
                const response = await fetch('/api/routes', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: currentRouteId,
                        stops: stopsToSync,
                    })
                });

                if (response.ok) {
                    console.log("[SYNC] Stops synchronized successfully");
                }
            }
        } catch (error) {
            console.error("[SYNC] Error during auto-sync:", error);
        }
    }, [status, currentRouteId]);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setIsOnline(navigator.onLine);

        const handleOnline = () => {
            setIsOnline(true);
            setStatusBanner({ type: 'online', visible: true });
            setTimeout(() => setStatusBanner(prev => ({ ...prev, visible: false })), 4000);
            syncWithServer();
        };

        const handleOffline = () => {
            setIsOnline(false);
            setStatusBanner({ type: 'offline', visible: true });
            setTimeout(() => setStatusBanner(prev => ({ ...prev, visible: false })), 4000);
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [syncWithServer]);

    return { isOnline, statusBanner, setStatusBanner, syncWithServer };
}
