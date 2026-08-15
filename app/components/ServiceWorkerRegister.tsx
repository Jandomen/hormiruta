'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

        const register = () => {
            navigator.serviceWorker
                .register('/sw.js', { scope: '/', updateViaCache: 'none' })
                .catch(() => {});
        };

        if (document.readyState === 'complete') {
            register();
        } else {
            window.addEventListener('load', register);
        }
        return () => window.removeEventListener('load', register);
    }, []);

    return null;
}
