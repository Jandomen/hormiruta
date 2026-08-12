// Deep links de navegación. SIEMPRE se transmiten coordenadas numéricas exactas
// (lat,lng), nunca texto de dirección, para evitar destinos ambiguos o erróneos.

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

export function openInGoogleMaps(lat: unknown, lng: unknown) {
    const url = buildGoogleMapsUrl(lat, lng);
    if (url) window.open(url, '_blank');
}

export function openInWaze(lat: unknown, lng: unknown) {
    const url = buildWazeUrl(lat, lng);
    if (url) window.open(url, '_blank');
}
