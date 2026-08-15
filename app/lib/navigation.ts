// Deep links de navegación. SIEMPRE se transmiten coordenadas numéricas exactas
// (lat,lng), nunca texto de dirección, para evitar destinos ambiguos o erróneos.
// En Android (Capacitor) se abren las apps nativas (Google Maps / Waze) con sus
// deep links; si la app no está instalada se ofrece instalarla desde Play Store;
// en navegador web se abre la página web correspondiente.

import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';
import { Dialog } from '@capacitor/dialog';

const COORD_PRECISION = 6;

function toCoordinate(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : Number(String(value).trim().replace(',', '.'));
    return Number.isFinite(num) ? num : null;
}

function formatCoordPair(lat: unknown, lng: unknown): string | null {
    const latNum = toCoordinate(lat);
    const lngNum = toCoordinate(lng);
    if (latNum === null || lngNum === null) return null;
    return `${latNum.toFixed(COORD_PRECISION)},${lngNum.toFixed(COORD_PRECISION)}`;
}

export function buildGoogleMapsUrl(lat: unknown, lng: unknown): string | null {
    const coord = formatCoordPair(lat, lng);
    if (!coord) {
        console.warn('[navigation] Coordenadas inválidas para Google Maps:', { lat, lng });
        return null;
    }
    return `https://www.google.com/maps/dir/?api=1&destination=${coord}&travelmode=driving`;
}

export function buildWazeUrl(lat: unknown, lng: unknown): string | null {
    const coord = formatCoordPair(lat, lng);
    if (!coord) {
        console.warn('[navigation] Coordenadas inválidas para Waze:', { lat, lng });
        return null;
    }
    return `https://waze.com/ul?ll=${coord}&navigate=yes`;
}

interface NavAppInfo {
    schemeUrl: string;
    webUrl: string;
    marketUrl: string;
    displayName: string;
}

async function promptToInstall(info: NavAppInfo): Promise<void> {
    try {
        const { value } = await Dialog.confirm({
            title: `${info.displayName} no está instalado`,
            message: `Para abrir la navegación necesitas ${info.displayName}. ¿Quieres ir a Play Store para instalarlo?`,
            okButtonTitle: 'Instalar',
            cancelButtonTitle: 'Usar web',
        });
        if (value) {
            await AppLauncher.openUrl({ url: info.marketUrl });
        } else {
            await AppLauncher.openUrl({ url: info.webUrl });
        }
    } catch (e) {
        console.warn('[navigation] No se pudo mostrar el diálogo de instalación:', e);
        try {
            await AppLauncher.openUrl({ url: info.webUrl });
        } catch (e2) {
            console.warn('[navigation] Fallback web falló:', e2);
            window.open(info.webUrl, '_blank');
        }
    }
}

async function launchNative(info: NavAppInfo) {
    try {
        // Si la app está instalada, el deep link la abre directamente.
        const canOpen = await AppLauncher.canOpenUrl({ url: info.schemeUrl });
        if (canOpen?.value) {
            await AppLauncher.openUrl({ url: info.schemeUrl });
            return;
        }
    } catch (e) {
        console.warn('[navigation] No se pudo consultar la app nativa:', e);
    }
    // No está instalada → ofrecer instalarla desde Play Store.
    await promptToInstall(info);
}

export function openInGoogleMaps(lat: unknown, lng: unknown) {
    const coord = formatCoordPair(lat, lng);
    if (!coord) {
        console.warn('[navigation] Coordenadas inválidas para Google Maps:', { lat, lng });
        return;
    }
    if (Capacitor.isNativePlatform()) {
        const info: NavAppInfo = {
            schemeUrl: `comgooglemaps://?daddr=${coord}&directionsmode=driving`,
            webUrl: `https://www.google.com/maps/dir/?api=1&destination=${coord}&travelmode=driving`,
            marketUrl: 'market://details?id=com.google.android.apps.maps',
            displayName: 'Google Maps',
        };
        launchNative(info);
    } else {
        const url = buildGoogleMapsUrl(lat, lng);
        if (url) window.open(url, '_blank');
    }
}

export function openInWaze(lat: unknown, lng: unknown) {
    const coord = formatCoordPair(lat, lng);
    if (!coord) {
        console.warn('[navigation] Coordenadas inválidas para Waze:', { lat, lng });
        return;
    }
    if (Capacitor.isNativePlatform()) {
        const info: NavAppInfo = {
            schemeUrl: `waze://?ll=${coord}&navigate=yes`,
            webUrl: `https://waze.com/ul?ll=${coord}&navigate=yes`,
            marketUrl: 'market://details?id=com.waze',
            displayName: 'Waze',
        };
        launchNative(info);
    } else {
        const url = buildWazeUrl(lat, lng);
        if (url) window.open(url, '_blank');
    }
}
