export function openInGoogleMaps(lat: number, lng: number) {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const googleMapsUrl = isIOS
        ? `comgooglemaps://?q=${lat},${lng}`
        : `google.navigation:q=${lat},${lng}`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

    window.open(googleMapsUrl, '_blank');
    // Fallback if app not installed
    setTimeout(() => {
        window.open(webUrl, '_blank');
    }, 500);
}

export function openInWaze(lat: number, lng: number) {
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(wazeUrl, '_blank');
}
