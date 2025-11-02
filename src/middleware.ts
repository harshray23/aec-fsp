// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_ROUTES = {
  '/admin': 'admin',
  '/teacher': 'teacher',
  '/student': 'student',
  '/host': 'host',
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionCookie = req.cookies.get('session')?.value;
  const absoluteUrl = req.nextUrl.clone();

  // Define the base URL based on the environment
  const baseUrl = process.env.NODE_ENV === 'production' 
    ? absoluteUrl.origin 
    : 'http://localhost:3000';

  const verificationUrl = `${baseUrl}/api/auth/verify-session`;

  // Determine if the current path is a protected route
  const protectedPath = Object.keys(PROTECTED_ROUTES).find(p => pathname.startsWith(p));

  if (protectedPath) {
    if (!sessionCookie) {
      const role = PROTECTED_ROUTES[protectedPath as keyof typeof PROTECTED_ROUTES];
      const loginUrl = new URL(`/login?role=${role}`, req.url);
      return NextResponse.redirect(loginUrl);
    }

    try {
      // Verify session by calling the internal API route
      const response = await fetch(verificationUrl, {
        headers: {
          'Cookie': `session=${sessionCookie}`,
        },
      });

      if (!response.ok) {
        throw new Error('Session verification failed.');
      }
      
      const { user } = await response.json();

      if (!user) {
        throw new Error('Invalid user data in session.');
      }
      
      const expectedRole = PROTECTED_ROUTES[protectedPath as keyof typeof PROTECTED_ROUTES];

      if (user.role !== expectedRole) {
        // If roles don't match, redirect to the root page.
        return NextResponse.redirect(new URL('/', req.url));
      }

      // If everything is fine, proceed to the requested page
      return NextResponse.next();

    } catch (error) {
      // Any error in verification means the session is invalid.
      // Clear the cookie and redirect to login.
      console.error('Middleware error:', error);
      const role = PROTECTED_ROUTES[protectedPath as keyof typeof PROTECTED_ROUTES];
      const loginUrl = new URL(`/login?role=${role}`, req.url);
      const res = NextResponse.redirect(loginUrl);
      // Advise the browser to clear the session cookie
      res.cookies.set('session', '', { maxAge: -1, path: '/' });
      return res;
    }
  }

  // Allow the request to proceed for public routes
  return NextResponse.next();
}

// Define which paths the middleware should run on
export const config = {
  matcher: ['/admin/:path*', '/teacher/:path*', '/student/:path*', '/host/:path*'],
};
