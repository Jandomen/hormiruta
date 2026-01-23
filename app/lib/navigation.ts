export function openInGoogleMaps(lat: number, lng: number) {
    // Usamos el formato Universal Link de Google Maps que es el más estable y compatible
    // https://developers.google.com/maps/documentation/urls/get-started#directions-action
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

    // Intentamos abrir en una nueva pestaña. 
    // En móviles, esto disparará automáticamente la App de Google Maps si está instalada.
    window.open(url, '_blank');
}

export function openInWaze(lat: number, lng: number) {
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(wazeUrl, '_blank');
}
