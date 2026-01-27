
import * as admin from 'firebase-admin';

export function initFirebaseAdmin() {
    if (!admin.apps.length) {
        // En Producción (Vercel) usamos variables de entorno
        // En Desarrollo Local intentamos usar credenciales por defecto o mock
        try {
            if (process.env.FIREBASE_PRIVATE_KEY) {
                // Limpiar la clave de posibles comillas accidentales y manejar saltos de línea
                const privateKey = process.env.FIREBASE_PRIVATE_KEY
                    .trim()
                    .replace(/^"|"$/g, '')
                    .replace(/\\n/g, '\n');

                console.log("[FIREBASE-ADMIN] Initializing for project:", process.env.FIREBASE_PROJECT_ID);
                admin.initializeApp({
                    credential: admin.credential.cert({
                        projectId: process.env.FIREBASE_PROJECT_ID,
                        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                        privateKey: privateKey,
                    }),
                });
                console.log("[FIREBASE-ADMIN] Initialization successful.");
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
