import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Get the token from cookies
    const token = request.cookies.get('token')?.value

    // Define paths that do not require authentication
    const publicPaths = ['/login', '/register', '/assets', '/_next']

    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path)) || request.nextUrl.pathname === '/favicon.ico'

    if (!token && !isPublicPath) {
        // Redirect to login if not authenticated and trying to access private route
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('from', request.nextUrl.pathname)
        return NextResponse.redirect(loginUrl)
    }

    if (token && (request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/register')) {
        // Redirect to dashboard if trying to access login while already authenticated
        return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
