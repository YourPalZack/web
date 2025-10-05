import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@aquabuilder/db';
import { JsonLd, breadcrumbJsonLd } from '../../../../lib/structured';
import { getSiteUrl } from '../../../../lib/site';

type Category = 'filters'|'heaters'|'lights'|'substrate'|'equipment';

async function fetchPart(category: Category, id: string): Promise<any | null> {
  try {
    // Try DB first for richer data; fallback to API route
    switch (category) {
      case 'filters': return await prisma.filter.findUnique({ where: { id } });
      case 'heaters': return await prisma.heater.findUnique({ where: { id } });
      case 'lights': return await prisma.light.findUnique({ where: { id } });
      case 'substrate': return await prisma.substrate.findUnique({ where: { id } });
      case 'equipment': return await prisma.equipment.findUnique({ where: { id } });
    }
  } catch {}
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/parts/${category}`, { cache: 'no-store' });
    const arr = res.ok ? await res.json() : [];
    return Array.isArray(arr) ? arr.find((x: any) => x.id === id) ?? null : null;
  } catch { return null; }
}

async function fetchLatestPrice(productType: string, productId: string) {
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/prices/${productType}/${productId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const rows = await res.json();
    return Array.isArray(rows) && rows.length ? rows[rows.length - 1] : null;
  } catch { return null; }
}

function productTypeFor(category: Category): string {
  switch (category) {
    case 'filters': return 'FILTER';
    case 'heaters': return 'HEATER';
    case 'lights': return 'LIGHT';
    case 'substrate': return 'SUBSTRATE';
    case 'equipment': return 'EQUIPMENT';
  }
}

export default async function PartPage({ params }: { params: { category: Category; id: string } }) {
  const { category, id } = params;
  const part = await fetchPart(category, id);
  if (!part) return <div className="max-w-4xl mx-auto p-6">Not found</div>;
  const productType = productTypeFor(category);
  const price = await fetchLatestPrice(productType, id);
  const base = getSiteUrl();
  const title = formatTitle(category, part);
  const image = undefined as string | undefined; // could derive from a CDN later
  const offerPrice = typeof price?.priceCents === 'number' ? (price.priceCents / 100).toFixed(2) : undefined;
  const offerUrl = (price as any)?.url;
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: base + '/' },
        { name: 'Browse', url: base + '/browse' },
        { name: humanCat(category), url: base + `/browse?tab=${category}` },
        { name: title, url: base + `/part/${category}/${id}` },
      ])} />
      {/* Product JSON-LD */}
      <JsonLd data={{
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: title,
        image,
        sku: id,
        brand: part.brand ?? undefined,
        model: part.model ?? undefined,
        category: humanCat(category),
        offers: offerPrice ? {
          '@type': 'Offer', priceCurrency: 'USD', price: offerPrice, url: offerUrl, availability: 'https://schema.org/InStock'
        } : undefined,
      }} />
      <div className="text-xs text-gray-500"><Link href="/browse">Browse</Link> / <Link href={`/browse?tab=${category}`}>{humanCat(category)}</Link></div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="text-sm text-gray-600">ID</div>
          <div className="font-mono text-sm">{id}</div>
        </div>
        {part.brand && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Brand</div>
            <div className="text-sm">{part.brand} {part.model ?? ''}</div>
          </div>
        )}
        {category==='filters' && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Flow</div>
            <div className="text-sm">{part.gph} gph • up to {part.maxTankGal} gal</div>
          </div>
        )}
        {category==='heaters' && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Wattage</div>
            <div className="text-sm">{part.wattage} W • {part.minTankGal}–{part.maxTankGal} gal</div>
          </div>
        )}
        {category==='lights' && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Intensity</div>
            <div className="text-sm">{part.intensity} • coverage {part.coverageCm ?? '—'} cm</div>
          </div>
        )}
        {category==='substrate' && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">Type</div>
            <div className="text-sm">{part.type} • {part.color ?? '—'}</div>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-700">
        {offerPrice ? (
          <div>
            Latest price: <span className="font-medium">${offerPrice}</span>{offerUrl && (<a className="ml-2 text-blue-600 underline" href={offerUrl} target="_blank">Buy</a>)}
          </div>
        ) : (
          <div>No price data available.</div>
        )}
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { category: Category; id: string } }): Promise<Metadata> {
  const part = await fetchPart(params.category, params.id);
  const title = part ? formatTitle(params.category, part) : 'Part';
  const description = part ? `${title} specs and latest pricing.` : 'Part details and pricing.';
  return {
    title,
    description,
    alternates: { canonical: `/part/${params.category}/${params.id}` },
    openGraph: { title, description, url: `/part/${params.category}/${params.id}` },
  };
}

function humanCat(c: Category) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}
function formatTitle(c: Category, part: any) {
  const base = humanCat(c).slice(0,-1); // crude: Filter/Heater/Light/Substrate/Equipmen
  const name = part.brand || part.model ? `${part.brand ?? ''} ${part.model ?? ''}`.trim() : part.id;
  return `${name} ${base}`.trim();
}

