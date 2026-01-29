'use client';

import React, { useState, useCallback } from 'react';
import GeofenceAlert from './GeofenceAlert';

interface GeofenceAlertStop {
    stopId: string;
    stopOrder: number;
    address?: string;
    timestamp: number;
}

interface GeofenceAlertsManagerProps {
    onGeofenceAlert?: (stop: GeofenceAlertStop) => void;
}


export default function GeofenceAlertsManager({ onGeofenceAlert }: GeofenceAlertsManagerProps) {
    const [alerts, setAlerts] = useState<globalThis.Map<string, GeofenceAlertStop>>(new globalThis.Map<string, GeofenceAlertStop>());

    const handleNewAlert = useCallback((stop: GeofenceAlertStop) => {
        setAlerts(prev => new Map(prev).set(stop.stopId, stop));
        onGeofenceAlert?.(stop);
    }, [onGeofenceAlert]);

    const handleDismissAlert = useCallback((stopId: string) => {
        setAlerts(prev => {
            const newAlerts = new Map(prev);
            newAlerts.delete(stopId);
            return newAlerts;
        });
    }, []);

    return (
        <>
            {Array.from(alerts.values()).map((alert, index) => (
                <div key={alert.stopId} style={{ marginTop: `${index * 90}px` }}>
                    <GeofenceAlert
                        stopId={alert.stopId}
                        stopOrder={alert.stopOrder}
                        address={alert.address}
                        onDismiss={handleDismissAlert}
                    />
                </div>
            ))}
        </>
    );
}
