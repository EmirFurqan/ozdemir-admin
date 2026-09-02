import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    const path = request.nextUrl.pathname

    // Define public paths and static assets that do not require authentication
    if (
        path.startsWith('/login') ||
        path.startsWith('/register') ||
        path.startsWith('/assets') ||
        path.startsWith('/_next') ||
        path.startsWith('/api') ||
        path.includes('.') // Exclude files like .svg, .png, .jpg, .ico, etc.
    ) {
        // If already authenticated and trying to access login/register, redirect to dashboard
        const token = request.cookies.get('token')?.value
        if (token && (path === '/login' || path === '/register')) {
            return NextResponse.redirect(new URL('/', request.url))
        }
        return NextResponse.next()
    }

    // Get the token from cookies
    const token = request.cookies.get('token')?.value

    if (!token) {
        // Redirect to login if not authenticated and trying to access private route
        const loginUrl = new URL('/login', request.url)
        loginUrl.searchParams.set('from', path)
        return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - image and static file extensions
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    ],
}
