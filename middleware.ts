import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (pathname.startsWith('/admin')) {
    if (process.env.NODE_ENV !== 'production') return NextResponse.next();
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const ok = (token as any)?.isAdmin === true;
    if (!ok) return NextResponse.redirect(new URL('/signin', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
