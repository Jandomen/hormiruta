'use client';

import { SessionProvider } from 'next-auth/react';
import { APIProvider } from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <SessionProvider>
                {children}
            </SessionProvider>
        </APIProvider>
    );
}
