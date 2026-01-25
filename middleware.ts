import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { withAuth } from "next-auth/middleware"

// --- SISTEMA DE CONTROL DE TRÁFICO (Rate Limiting) ---
const ipCache = new Map<string, { count: number, resetTime: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60 * 1000;

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const record = ipCache.get(ip);
    if (!record || now > record.resetTime) {
        ipCache.set(ip, { count: 1, resetTime: now + WINDOW_MS });
        return false;
    }
    record.count++;
    return record.count > RATE_LIMIT;
}

export default withAuth(
    function middleware(req) {
        const path = req.nextUrl.pathname;
        const query = req.nextUrl.search;
        const ip = req.headers.get('x-forwarded-for') || 'unknown';

        // 1. SISTEMA DE BLINDAJE (WAF)
        const maliciousPatterns = [
            /<script/i,
            /UNION SELECT/i,
            /\.\.\//,
            /etc\/passwd/i
        ];
        const isMalicious = maliciousPatterns.some(pattern =>
            pattern.test(decodeURIComponent(path)) || pattern.test(decodeURIComponent(query))
        );

        if (isMalicious) {
            console.error(`[SECURITY_SHIELD] Bloqueo de petición sospechosa en ${path} desde IP: ${ip}`);
            return new NextResponse(null, { status: 403 });
        }

        // 2. RATE LIMITING PARA RUTAS SENSIBLES
        if (path.startsWith('/api/auth') || path.startsWith('/api/register')) {
            if (isRateLimited(ip)) {
                console.warn(`[SECURITY_BRUTEFORCE] Bloqueo por exceso de peticiones desde IP: ${ip} en ${path}`);
                return new NextResponse(JSON.stringify({ error: 'Demasiadas peticiones. Intenta más tarde.' }), {
                    status: 429,
                    headers: { 'Content-Type': 'application/json' }
                });
            }
        }

        console.log(`[ACCESS] ${req.nextauth.token ? 'AUTH' : 'GUEST'} -> ${path}`);
        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/auth/login",
        },
    }
)

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*", "/api/auth/:path*", "/api/register/:path*"] }
