
import * as admin from 'firebase-admin';

export function initFirebaseAdmin() {
    if (!admin.apps.length) {
        // En Producción (Vercel) usamos variables de entorno
        // En Desarrollo Local intentamos usar credenciales por defecto o mock
        try {
            if (process.env.FIREBASE_PRIVATE_KEY) {
                console.log("[FIREBASE-ADMIN] Initializing with explicit credentials for project:", process.env.FIREBASE_PROJECT_ID);
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    }),
                });
                console.log("[FIREBASE-ADMIN] Initialization successful. Private Key Length:", process.env.FIREBASE_PRIVATE_KEY?.length);
                if (process.env.FIREBASE_PRIVATE_KEY?.includes('\\n')) {
                    console.log("[FIREBASE-ADMIN] Private key contains literal \\n characters (expected)");
                } else {
                    console.log("[FIREBASE-ADMIN] Private key does NOT contain literal \\n. This might be an issue if it's not already multiline.");
                }
            } else {
                // Fallback for local development without proper service account
                // This might fail if verification is strict
                console.warn("[FIREBASE-ADMIN] WARNING: Initialized without explicit credentials. Token verification might fail locally.");
                admin.initializeApp();
            }
        } catch (error) {
            console.error('[FIREBASE-ADMIN] Initialization Error:', error);
        }
    }
    return admin;
}
