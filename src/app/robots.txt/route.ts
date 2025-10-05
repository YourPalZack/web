import { NextResponse } from 'next/server';
import { getSiteUrl } from '../../lib/site';

export function GET() {
  const body = `User-agent: *
Allow: /
Disallow: /admin/
Sitemap: ${getSiteUrl()}/sitemap.xml
`;
  return new NextResponse(body, { headers: { 'Content-Type': 'text/plain' } as any });
}

