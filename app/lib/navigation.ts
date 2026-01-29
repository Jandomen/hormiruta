export function openInGoogleMaps(lat: number, lng: number) {

    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;


    window.open(url, '_blank');
}

export function openInWaze(lat: number, lng: number) {
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    window.open(wazeUrl, '_blank');
}
