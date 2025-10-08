import { prisma } from '@aquabuilder/db';
import type { Metadata } from 'next';
import { JsonLd, breadcrumbJsonLd, buildCreativeWorkJsonLd } from '../../../lib/structured';
import { getSiteUrl } from '../../../lib/site';
import { Card, CardHeader, CardTitle, CardContent, PriceSparkline, ScoreBadge, CompatibilityPanel } from '@aquabuilder/ui';
import { compatibilityScore, calcBioloadPct, checkFishParams, computeMonthlyCost } from '@aquabuilder/core';
import BuildAdminControls from '../admin-controls';
import BuildPageView from '../page-view';
import CopyLink from '../copy-link';

export default async function BuildPage({ params }: { params: { id: string } }) {
  const build = await prisma.userBuild.findUnique({ where: { id: params.id } });
  if (!build) return <div className="p-6">Not found</div>;

  type BuildComponents = {
    tank?: { volumeGal?: number };
    equipment?: { filter?: string; heater?: string; light?: string; substrate?: string; extras?: string[] };
    livestock?: { type: string; id: string; qty: number }[];
  };
  const items = (build.components as unknown as BuildComponents) ?? {};
  const warnings: { level: 'WARN'|'BLOCK'; code: string; message: string }[] = [];

  async function fetchJson<T>(url: string, fallback: T): Promise<T> {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return fallback;
    const txt = await res.text();
    if (!txt) return fallback;
    try { return JSON.parse(txt) as T; } catch { return fallback; }
  }

  const [fishList, filters, heaters] = await Promise.all([
    fetchJson<Array<{ id: string; tempMinC: number; tempMaxC: number; phMin: number; phMax: number; adultSizeCm: number; bioloadFactor: number; schoolingMin?: number | null }>>('/api/parts/fish', []),
    fetchJson<Array<{ id: string; gph?: number }>>('/api/parts/filters', []),
    fetchJson<Array<{ id: string; wattage?: number }>>('/api/parts/heaters', []),
  ]);

  // Livestock-derived warnings
  const fishLoad = (items.livestock ?? [])
    .filter((l) => l.type === 'FISH' && l.qty > 0)
    .map((l) => {
      const f = fishList.find((x) => x.id === l.id);
      return f ? { adultSizeCm: f.adultSizeCm, bioloadFactor: f.bioloadFactor, qty: l.qty } : null;
    })
    .filter(Boolean) as { adultSizeCm: number; bioloadFactor: number; qty: number }[];

  if (items.tank?.volumeGal && fishLoad.length) {
    const pct = calcBioloadPct({ fish: fishLoad, tankGal: items.tank.volumeGal });
    if (pct > 110) warnings.push({ level: 'BLOCK', code: 'BIOLOAD_HIGH', message: `Bioload ${pct.toFixed(0)}% exceeds capacity.` });
    else if (pct > 90) warnings.push({ level: 'WARN', code: 'BIOLOAD_NEAR_LIMIT', message: `Bioload ${pct.toFixed(0)}% near capacity.` });
  }
  for (const l of (items.livestock ?? []).filter((x) => x.type === 'FISH')) {
    const f = fishList.find((x) => x.id === l.id);
    if (f?.schoolingMin && l.qty < f.schoolingMin) {
      warnings.push({ level: 'WARN', code: 'SCHOOLING_MIN', message: `${f.schoolingMin}+ required for groups. You have ${l.qty}.` });
    }
  }
  const paramsList = (items.livestock ?? [])
    .filter((l) => l.type === 'FISH' && l.qty > 0)
    .map((l) => fishList.find((x) => x.id === l.id))
    .filter(Boolean) as Array<{ tempMinC: number; tempMaxC: number; phMin: number; phMax: number }>;
  if (paramsList.length > 1) {
    const pr = checkFishParams(paramsList);
    if (!pr.ok) warnings.push({ level: 'BLOCK', code: 'PARAM_CONFLICT', message: `Temp ${pr.temp[0]}–${pr.temp[1]}C / pH ${pr.ph[0]}–${pr.ph[1]} no overlap.` });
  }

  // Equipment compatibility
  const tankGal = items.tank?.volumeGal;
  if (tankGal) {
    if (items.equipment?.filter) {
      const f = filters.find((x) => x.id === items.equipment!.filter);
      if (f?.gph) {
        const turnover = f.gph / tankGal;
        if (turnover < 2) warnings.push({ level: 'BLOCK', code: 'FILTER_TOO_WEAK', message: `Turnover ${turnover.toFixed(1)}x < 2x.` });
        else if (turnover < 4 || turnover > 10) warnings.push({ level: 'WARN', code: 'FILTER_TURNOVER', message: `Turnover ${turnover.toFixed(1)}x outside 4–10x.` });
      }
    }
    if (items.equipment?.heater) {
      const h = heaters.find((x) => x.id === items.equipment!.heater);
      if (h?.wattage) {
        const wpg = h.wattage / tankGal;
        const min = 3, max = 5;
        const pctLow = (min - wpg) / min;
        const pctHigh = (wpg - max) / max;
        const offPct = Math.max(pctLow, pctHigh);
        if (offPct > 0.4) warnings.push({ level: 'BLOCK', code: 'HEATER_MISMATCH', message: `Heater ${h.wattage}W ≈ ${wpg.toFixed(1)} W/gal outside 3–5 by >40%.` });
        else if (offPct > 0.2) warnings.push({ level: 'WARN', code: 'HEATER_NEAR_LIMIT', message: `Heater ≈ ${wpg.toFixed(1)} W/gal outside 3–5 by >20%.` });
      }
    }
    // Light coverage check omitted here without tank length; will add later if dimensions are stored
  }

  const score = compatibilityScore(warnings);

  // Fetch price data for sparkline and compute initial cost via server API
  let spark = [] as { t: string; price: number }[];
  let initialCostCents = 0;
  async function fetchPriceRows(type:string, id:string){
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/prices/${type}/${id}`, { cache: 'no-store' });
    if (!res.ok) return [] as { timestamp: string; priceCents: number }[];
    return (await res.json()) as { timestamp: string; priceCents: number }[];
  }
  if (items?.equipment?.filter) {
    const rows = await fetchPriceRows('FILTER', items.equipment.filter);
    spark = rows.slice(-30).map((r) => ({ t: r.timestamp, price: r.priceCents / 100 }));
  }
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/costs/initial`.replace('http://localhost',''), { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ equipment: items?.equipment ?? { extras: [] } }) });
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.priceCents === 'number') initialCostCents = data.priceCents;
    }
  } catch {}

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <BuildPageView id={build.id} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: getSiteUrl() + '/' },
        { name: 'Community', url: getSiteUrl() + '/community' },
        { name: build.name, url: getSiteUrl() + `/build/${build.id}` },
      ])} />
      <JsonLd data={buildCreativeWorkJsonLd({ id: build.id, name: build.name, buildType: build.buildType, url: getSiteUrl() + `/build/${build.id}`, datePublished: (build as any).createdAt, dateModified: (build as any).updatedAt, parts: [] })} />
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold">{build.name}</h1>
        <div className="flex items-center gap-2">
          <ScoreBadge score={score} />
          <CopyLink href={`${getSiteUrl()}/build/${build.id}`} id={build.id} />
        </div>
      </div>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Parts</CardTitle></CardHeader>
            <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-gray-600">Tank</div>
                <div className="font-medium">{items?.tank?.volumeGal ? `${items.tank.volumeGal} gal` : '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Filter</div>
                <div className="font-medium">{items?.equipment?.filter ?? '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Heater</div>
                <div className="font-medium">{items?.equipment?.heater ?? '—'}</div>
              </div>
              <div>
                <div className="text-gray-600">Light</div>
                <div className="font-medium">{items?.equipment?.light ?? '—'}</div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Livestock</CardTitle></CardHeader>
            <CardContent>
              {(!items.livestock || items.livestock.length === 0) ? (
                <div className="text-sm text-gray-600">None</div>
              ) : (
                <ul className="text-sm space-y-1">
                  {items.livestock!.map((l) => (
                    <li key={`${l.type}-${l.id}`}>{l.type}: {l.id} × {l.qty}</li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Price Trend</CardTitle></CardHeader>
            <CardContent>{spark.length ? <PriceSparkline data={spark} /> : <div className="text-sm text-gray-600">No price data.</div>}</CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Cost Estimates</CardTitle></CardHeader>
            <CardContent>
              {items.tank?.volumeGal ? (
                (()=>{ const est = computeMonthlyCost({ tankGal: items.tank!.volumeGal! }); return (
                  <div className="text-sm">Estimated monthly energy: ${est.cost.toFixed(2)} (≈ {est.kwh.toFixed(1)} kWh @ $0.15/kWh)</div>
                ); })()
              ) : (
                <div className="text-sm text-gray-600">No tank volume provided.</div>
              )}
              <div className="text-sm mt-2">Initial equipment cost (latest prices): ${ (initialCostCents/100).toFixed(2) }</div>
            </CardContent>
          </Card>
          <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
            <CardHeader><CardTitle>Compatibility</CardTitle></CardHeader>
            <CardContent>
              <CompatibilityPanel items={warnings} />
            </CardContent>
          </Card>
          <BuildAdminControls id={build.id} initialName={build.name} initialPublic={(build as any).isPublic} />
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const build = await prisma.userBuild.findUnique({ where: { id: params.id } });
    if (!build) return { title: 'Build Not Found' };
    const title = `${build.name} (${build.buildType})`;
    const description = `Aquarium build ${build.name} — ${build.buildType}. View parts, costs, and compatibility.`;
    return {
      title,
      description,
      alternates: { canonical: `/build/${params.id}` },
      openGraph: { title, description, url: `/build/${params.id}` },
      twitter: { title, description, card: 'summary_large_image' },
    };
  } catch {
    return { title: 'Build' };
  }
}
