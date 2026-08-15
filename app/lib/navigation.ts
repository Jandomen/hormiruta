// Deep links de navegación. SIEMPRE se transmiten coordenadas numéricas exactas
// (lat,lng), nunca texto de dirección, para evitar destinos ambiguos o erróneos.
// En Android (Capacitor) se abren las apps nativas (Google Maps / Waze) con sus
// deep links; en navegador web se abre la página web correspondiente.

import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';

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

async function launchNative(schemeUrl: string, webUrl: string) {
    try {
        // Si la app está instalada, el deep link la abre directamente.
        const canOpen = await AppLauncher.canOpenUrl({ url: schemeUrl });
        if (canOpen?.value) {
            await AppLauncher.openUrl({ url: schemeUrl });
            return;
        }
    } catch (e) {
        console.warn('[navigation] No se pudo abrir la app nativa, fallback a web:', e);
    }
    // Fallback: abrir la versión web en el navegador del sistema.
    try {
        await AppLauncher.openUrl({ url: webUrl });
    } catch (e) {
        console.warn('[navigation] Fallback web falló:', e);
        window.open(webUrl, '_blank');
    }
}

export function openInGoogleMaps(lat: unknown, lng: unknown) {
    const coord = formatCoordPair(lat, lng);
    if (!coord) {
        console.warn('[navigation] Coordenadas inválidas para Google Maps:', { lat, lng });
        return;
    }
    if (Capacitor.isNativePlatform()) {
        const scheme = `comgooglemaps://?daddr=${coord}&directionsmode=driving`;
        const web = `https://www.google.com/maps/dir/?api=1&destination=${coord}&travelmode=driving`;
        launchNative(scheme, web);
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
        const scheme = `waze://?ll=${coord}&navigate=yes`;
        const web = `https://waze.com/ul?ll=${coord}&navigate=yes`;
        launchNative(scheme, web);
    } else {
        const url = buildWazeUrl(lat, lng);
        if (url) window.open(url, '_blank');
    }
}
