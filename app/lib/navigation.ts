export function openNavigation(lat: number, lng: number, label?: string) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

    // Waze Link (Global)
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    // Google Maps Link
    const googleMapsUrl = isIOS
        ? `comgooglemaps://?q=${lat},${lng}`
        : `google.navigation:q=${lat},${lng}`;

    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    // Priority logic or simple prompt
    const choice = window.confirm(`¿Cómo deseas navegar a ${label || 'el destino'}?\n\nOK: Google Maps / Sistema\nCancel: Waze`);

    if (choice) {
        window.open(isIOS ? googleMapsUrl : googleMapsUrl, '_blank');
        // Fallback if app not installed
        setTimeout(() => {
            window.open(webUrl, '_blank');
        }, 500);
    } else {
        window.open(wazeUrl, '_blank');
    }
}
