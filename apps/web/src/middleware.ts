import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const { nextUrl } = req;
  const sessionToken = req.cookies.get('__session')?.value;
  const isAuthenticated = !!sessionToken;

  const isAuthRoute = nextUrl.pathname === '/login';
  const isOnboardingRoute = nextUrl.pathname === '/onboarding';
  const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth');

  if (isApiAuthRoute) return;

  if (isAuthRoute) {
    if (isAuthenticated) {
      // Cannot reliably check onboarding state here without decoding token, 
      // rely on client components or another API check for exact redirect, 
      // but default to /assignments
      return NextResponse.redirect(new URL('/assignments', nextUrl));
    }
    // Allow unauthenticated users to view login page
    return;
  }

  // Redirect unauthenticated users to login page
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users through
  // Onboarding guard is now handled more precisely at the page level 
  // since we can't easily decode the custom MongoDB onboarding flag in Edge middleware without calling an API.
  return NextResponse.next();
}

export const config = {
  // Protect all routes except next internals, api, assets, uploads, and favicon
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|uploads|images).*)'],
};
