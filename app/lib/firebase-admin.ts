
import * as admin from 'firebase-admin';

export function initFirebaseAdmin() {
    if (!admin.apps.length) {
        // En Producción (Vercel) usamos variables de entorno
        // En Desarrollo Local intentamos usar credenciales por defecto o mock
        try {
            if (process.env.FIREBASE_PRIVATE_KEY) {
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
                    }),
                });
            } else {
                // Fallback for local development without proper service account
                // This might fail if verification is strict
                console.warn("Firebase Admin initialized without explicit credentials. Token verification might fail locally.");
                admin.initializeApp();
            }
        } catch (error) {
            console.error('Firebase Admin Init Error:', error);
        }
    }
    return admin;
}
