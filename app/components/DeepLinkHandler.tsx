'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeepLinkHandler() {
    const router = useRouter();

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        // Listener for Capacitor App URLs
        const handleAppUrl = (event: any) => {
            console.log("[DEEP LINK] Received URL:", event.url);

            // If the URL contains an auth response from Google
            if (event.url.includes('auth') || event.url.includes('callback')) {
                // Force a route to the dashboard, NextAuth will pick up the cookie/session
                router.push('/dashboard');
            }
        };

        // This requires @capacitor/app, but we'll use a standard web listener as fallback
        window.addEventListener('appUrlOpen', handleAppUrl);

        return () => {
            window.removeEventListener('appUrlOpen', handleAppUrl);
        };
    }, [router]);

    return null;
}
