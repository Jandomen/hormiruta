// Región local por defecto: Guadalajara, Jalisco. Cuando una dirección no
// incluye ciudad/estado/código postal explícito, se concatena esta región
// antes de geocodificar para no ubicar el punto en otro estado o país.
export const DEFAULT_REGION = 'Guadalajara, Jalisco, México';

// Centro de la zona metropolitana de Guadalajara (fallback de último recurso).
export const DEFAULT_CENTER = { lat: 20.6597, lng: -103.3496 };

const MEXICAN_ZIP_REGEX = /\b\d{5}\b/;

// Estados, ciudades y municipios principales. En minúsculas y sin acentos
// (la dirección se normaliza antes de comparar).
const REGION_KEYWORDS = [
    // Estados
    'aguascalientes', 'baja california', 'baja california sur', 'campeche',
    'chiapas', 'chihuahua', 'coahuila', 'colima', 'durango', 'guanajuato',
    'guerrero', 'hidalgo', 'jalisco', 'estado de mexico', 'michoacan',
    'morelos', 'nayarit', 'nuevo leon', 'oaxaca', 'puebla', 'queretaro',
    'quintana roo', 'san luis potosi', 'sinaloa', 'sonora', 'tabasco',
    'tamaulipas', 'tlaxcala', 'veracruz', 'yucatan', 'zacatecas',
    // Ciudades / municipios principales
    'guadalajara', 'zapopan', 'tlaquepaque', 'tonala', 'tlajomulco',
    'el salto', 'monterrey', 'tijuana', 'ciudad de mexico', 'cdmx', 'gdl',
    'ciudad juarez', 'leon', 'cancun', 'merida', 'morelia', 'toluca',
    'mexicali', 'hermosillo', 'saltillo', 'torreon', 'culiacan', 'tampico',
    'xalapa', 'acapulco', 'cuernavaca', 'pachuca', 'villahermosa', 'tepic',
    'la paz', 'chetumal', 'tuxtla', 'chilpancingo',
    // Marcadores
    'mexico',
];

const normalize = (value: string): string =>
    value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// Detecta si una dirección ya incluye una referencia de región suficiente
// (código postal de 5 dígitos, estado o ciudad). Sólo se revisa el último
// segmento (tras la última coma) para evitar que el nombre de una calle
// (p. ej. "Río Sonora") se confunda con un estado.
export function hasRegionQualifier(address: string): boolean {
    const normalized = normalize(address.trim());
    if (!normalized) return false;

    const segments = normalized.split(',').map(s => s.trim()).filter(Boolean);
    const last = segments[segments.length - 1] || '';

    if (MEXICAN_ZIP_REGEX.test(last)) return true;

    const lastWord = last.split(/\s+/).filter(Boolean).pop() || '';
    return REGION_KEYWORDS.some(k => last === k || lastWord === k);
}

// Concatena la región local por defecto cuando la dirección no tiene
// ciudad/código postal/estado explícito.
export function withDefaultRegion(address: string): string {
    const clean = address.trim();
    if (!clean || hasRegionQualifier(clean)) return clean;
    return `${clean}, ${DEFAULT_REGION}`;
}

// Geocodificación gratuita con OpenStreetMap (Nominatim): restringida a
// México y con la región por defecto concatenada cuando hace falta.
// No usa API key de Google, por lo que no afecta la facturación de Google Cloud.
export async function geocodeWithNominatim(address: string): Promise<{ lat: number; lng: number } | null> {
    const clean = address.trim();
    if (!clean) return null;

    const query = withDefaultRegion(clean);

    try {
        const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=mx&q=${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: { 'Accept-Language': 'es-MX' },
        });
        if (!res.ok) {
            console.warn(`[Geocode] Nominatim responded ${res.status} for "${query}"`);
            return null;
        }
        const results: any[] = await res.json();
        if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lng = parseFloat(results[0].lon);
            if (!isNaN(lat) && !isNaN(lng)) {
                return { lat, lng };
            }
        }
        console.warn(`[Geocode] Geocoding failed for "${query}"`);
        return null;
    } catch (err) {
        console.warn(`[Geocode] Geocoding error for "${query}":`, err);
        return null;
    }
}
