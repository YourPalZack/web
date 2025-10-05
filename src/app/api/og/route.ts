import { NextResponse } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { compatibilityScore, calcBioloadPct, checkFishParams } from '@aquabuilder/core';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id') || '';
  let title = (searchParams.get('title') || 'AquaBuilder').slice(0, 80);
  let subtitle = (searchParams.get('subtitle') || 'Build smart, compatible aquariums').slice(0, 120);
  if (id) {
    try {
      const b = await prisma.userBuild.findUnique({ where: { id } });
      if (b) {
        title = (b.name || 'My Aquarium').slice(0, 80);
        const comp: any = (b.components as any) ?? {};
        const vol = comp?.tank?.volumeGal ? `${comp.tank.volumeGal} gal` : '';
        subtitle = `${b.buildType}${vol ? ' • ' + vol : ''}`.slice(0, 120);
        try {
          const items = (b.components as any) ?? {};
          const warnings: { level: 'WARN'|'BLOCK'; code: string; message: string }[] = [];
          const fish = await prisma.fish.findMany();
          const fishLoad = (items.livestock ?? [])
            .filter((l: any) => l.type === 'FISH' && l.qty > 0)
            .map((l: any) => {
              const f = fish.find((x: any) => x.id === l.id);
              return f ? { adultSizeCm: f.adultSizeCm, bioloadFactor: f.bioloadFactor, qty: l.qty } : null;
            })
            .filter(Boolean) as { adultSizeCm: number; bioloadFactor: number; qty: number }[];
          if (items.tank?.volumeGal && fishLoad.length) {
            const pct = calcBioloadPct({ fish: fishLoad, tankGal: items.tank.volumeGal });
            if (pct > 110) warnings.push({ level: 'BLOCK', code: 'BIOLOAD_HIGH', message: '' });
            else if (pct > 90) warnings.push({ level: 'WARN', code: 'BIOLOAD_NEAR_LIMIT', message: '' });
          }
          const paramsList = (items.livestock ?? [])
            .filter((l: any) => l.type === 'FISH' && l.qty > 0)
            .map((l: any) => fish.find((x: any) => x.id === l.id))
            .filter(Boolean) as Array<{ tempMinC: number; tempMaxC: number; phMin: number; phMax: number }>;
          if (paramsList.length > 1) {
            const pr = checkFishParams(paramsList);
            if (!pr.ok) warnings.push({ level: 'BLOCK', code: 'PARAM_CONFLICT', message: '' });
          }
          const score = compatibilityScore(warnings);
          subtitle = `${subtitle} • Score ${score}`.slice(0, 120);
        } catch {}
      }
    } catch {
      const { fallback } = getPrismaSafe();
      const b = await fallback.userBuild.findUnique?.({ where: { id } });
      if (b) {
        title = (b.name || 'My Aquarium').slice(0, 80);
        const comp: any = (b.components as any) ?? {};
        const vol = comp?.tank?.volumeGal ? `${comp.tank.volumeGal} gal` : '';
        subtitle = `${b.buildType}${vol ? ' • ' + vol : ''}`.slice(0, 120);
      }
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0%" stop-color="#0ea5e9"/>
      <stop offset="100%" stop-color="#22d3ee"/>
    </linearGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="12"/></filter>
  </defs>
  <rect width="1200" height="630" fill="#0b1220"/>
  <circle cx="980" cy="80" r="120" fill="url(#g)" opacity="0.25" filter="url(#blur)"/>
  <circle cx="120" cy="540" r="160" fill="url(#g)" opacity="0.25" filter="url(#blur)"/>
  <rect x="40" y="40" width="1120" height="550" rx="24" fill="#0f172a" stroke="#1f2a44"/>
  <text x="80" y="220" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="72" font-weight="700" fill="#e2e8f0">${escapeXml(title)}</text>
  <text x="80" y="290" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="30" fill="#a3b2c2">${escapeXml(subtitle)}</text>
  <g transform="translate(80,360)">
    <rect width="260" height="60" rx="12" fill="url(#g)"/>
    <text x="20" y="40" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif" font-size="26" font-weight="600" fill="#06202d">aquabuilder.dev</text>
  </g>
</svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=0, s-maxage=300',
    },
  });
}

function escapeXml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
