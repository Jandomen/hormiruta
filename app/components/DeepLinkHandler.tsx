'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { App } from '@capacitor/app';

export default function DeepLinkHandler() {
    const router = useRouter();

    useEffect(() => {
        // Only run on client
        if (typeof window === 'undefined') return;

        // Listener for Capacitor App URLs
        const setupListener = async () => {
            App.addListener('appUrlOpen', (event: any) => {
                console.log("[DEEP LINK] Received URL:", event.url);

                // If the URL contains an auth response from Google
                if (event.url.includes('auth') || event.url.includes('callback')) {
                    // Force a route to the dashboard, NextAuth will pick up the cookie/session
                    router.push('/dashboard');
                }
            });
        };

        setupListener();

        return () => {
            // Capacitor listeners are usually cleaned up differently or stay active
            // but we can remove them if needed via App.removeAllListeners()
        };
    }, [router]);

    return null;
}
