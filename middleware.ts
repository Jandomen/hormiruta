import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
    function middleware(req) {
        console.log("[MIDDLEWARE] Path:", req.nextUrl.pathname, "Token present:", !!req.nextauth.token);
        return NextResponse.next();
    },
    {
        pages: {
            signIn: "/auth/login",
        },
    }
)

export const config = { matcher: ["/dashboard/:path*", "/admin/:path*"] }
