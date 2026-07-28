'use client';

import { useCallback, useEffect, useRef } from 'react';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

let permissionRequested = false;

export function useLocalNotifications() {
  const readyRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    LocalNotifications.registerActionTypes({
      types: [
        {
          id: 'GEOFENCE_ARRIVAL',
          actions: [
            { id: 'mark-done', title: 'Hecho' },
            { id: 'snooze', title: 'Posponer' },
          ],
        },
        {
          id: 'SOS_ALERT',
          actions: [
            { id: 'call', title: 'Llamar' },
            { id: 'dismiss', title: 'Ignorar' },
          ],
        },
      ],
    }).then(() => {
      readyRef.current = true;
    });
  }, []);

  const requestPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return true;
    if (permissionRequested) return true;
    permissionRequested = true;
    const perm = await LocalNotifications.requestPermissions();
    return perm.display === 'granted';
  }, []);

  const sendGeofenceNotification = useCallback(
    async (stopOrder: number, address?: string) => {
      if (!Capacitor.isNativePlatform()) return;
      await requestPermission();
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '¡Parada detectada!',
            body: address
              ? `Llegaste a la parada #${stopOrder}: ${address}`
              : `Llegaste a la parada #${stopOrder}`,
            id: Date.now(),
            schedule: { at: new Date() },
            sound: 'beep.wav',
            smallIcon: 'ic_launcher',
            actionTypeId: 'GEOFENCE_ARRIVAL',
            group: 'hormiruta-geofence',
            ongoing: true,
          },
        ],
      });
    },
    [requestPermission],
  );

  const sendSOSNotification = useCallback(
    async (contact?: string) => {
      if (!Capacitor.isNativePlatform()) return;
      await requestPermission();
      await LocalNotifications.schedule({
        notifications: [
          {
            title: '🚨 SOS — Emergencia',
            body: contact
              ? `Alerta enviada a ${contact}. Abre la app para más detalles.`
              : 'Botón de pánico presionado. Abre la app.',
            id: Date.now(),
            schedule: { at: new Date() },
            sound: 'beep.wav',
            smallIcon: 'ic_launcher',
            actionTypeId: 'SOS_ALERT',
            group: 'hormiruta-sos',
            ongoing: true,
          },
        ],
      });
    },
    [requestPermission],
  );

  return { sendGeofenceNotification, sendSOSNotification, requestPermission, readyRef };
}
