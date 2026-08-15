import dbConnect from '@/app/lib/mongodb';
import Pricing from '@/app/models/Pricing';

// Caché corta (60s) de la config de planes para no pegar a la BD en cada gate.
let cachedPlans: Map<string, any> | null = null;
let cacheFetchedAt = 0;
const CACHE_TTL_MS = 60_000;

function legacyGrants(p: any): { grantsPro: boolean; grantsFleet: boolean } {
    // Ambos flags definidos: respetar lo configurado.
    if (p.grantsPro !== undefined && p.grantsFleet !== undefined) {
        return { grantsPro: p.grantsPro === true, grantsFleet: p.grantsFleet === true };
    }
    // Planes históricos sin los flags (id 'premium'/'fleet') se derivan igual que antes.
    if (p.id === 'premium') return { grantsPro: true, grantsFleet: false };
    if (p.id === 'fleet') return { grantsPro: true, grantsFleet: true };
    return { grantsPro: p.grantsPro === true, grantsFleet: p.grantsFleet === true };
}

export async function getPlanConfig(planId: string): Promise<any | null> {
    if (!cachedPlans || Date.now() - cacheFetchedAt > CACHE_TTL_MS) {
        cachedPlans = new Map();
        cacheFetchedAt = Date.now();
        try {
            await dbConnect();
            const pricing = await Pricing.findOne().lean();
            const plans = (pricing as any)?.plans || [];
            for (const p of plans) {
                cachedPlans.set((p as any).id, {
                    ...(p as any),
                    ...legacyGrants(p),
                });
            }
        } catch (err) {
            console.error('[PLAN_CONFIG] Error cargando planes:', err);
        }
    }
    return cachedPlans.get(planId) || null;
}

// Borra la caché (se llama tras editar planes desde el admin).
export function clearPlanCache() {
    cachedPlans = null;
    cacheFetchedAt = 0;
}

export function isPlanExpired(user: any): boolean {
    const expiry = user?.subscriptionExpiry;
    if (!expiry) return false;
    const t = new Date(expiry).getTime();
    return !isNaN(t) && t < Date.now();
}

function isUserActive(user: any): boolean {
    const st = user?.subscriptionStatus;
    return st === 'active' || st === 'trialing';
}

export async function isProUser(user: any): Promise<boolean> {
    if (user?.adminGranted === true) return true;
    if (!user?.plan || user.plan === 'free') return false;
    if (!isUserActive(user) || isPlanExpired(user)) return false;
    const cfg = await getPlanConfig(user.plan);
    return cfg?.grantsPro === true;
}

export async function isFleetActive(user: any): Promise<boolean> {
    if (user?.adminGranted === true) return true;
    if (!user?.plan || user.plan === 'free') return false;
    if (!isUserActive(user) || isPlanExpired(user)) return false;
    const cfg = await getPlanConfig(user.plan);
    return cfg?.grantsFleet === true;
}

// Flags que se inyectan en la sesión para gating del lado del cliente.
export async function planGrants(user: any): Promise<{ grantsPro: boolean; grantsFleet: boolean }> {
    if (user?.adminGranted === true) return { grantsPro: true, grantsFleet: true };
    if (!user?.plan || user.plan === 'free') return { grantsPro: false, grantsFleet: false };
    if (!isUserActive(user) || isPlanExpired(user)) return { grantsPro: false, grantsFleet: false };
    const cfg = await getPlanConfig(user.plan);
    return { grantsPro: cfg?.grantsPro === true, grantsFleet: cfg?.grantsFleet === true };
}

// Límite de choferes de flotilla del plan del usuario. 0 = ilimitado.
export async function getPlanMaxMembers(user: any): Promise<number> {
    if (user?.adminGranted === true) return 0;
    const cfg = await getPlanConfig(user?.plan || '');
    const max = cfg?.maxMembers;
    return max && Number(max) > 0 ? Number(max) : 0;
}
