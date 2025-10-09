import type { Metadata } from 'next';
import Link from 'next/link';
import { Tooltip, Breadcrumb } from '@aquabuilder/ui';
import dynamic from 'next/dynamic';
const SparklinePanel = dynamic(()=> import('./sparkline-panel'), { ssr: false });
import { SpecPills, Thumbnail } from '@aquabuilder/ui';
import dynamic from 'next/dynamic';
const AmazonBuyLink = dynamic(() => import('../../../browse/amazon-buy-link'), { ssr: false });
import { prisma } from '@aquabuilder/db';
import { JsonLd, breadcrumbJsonLd } from '../../../../lib/structured';
import { getSiteUrl } from '../../../../lib/site';
import PartPageView from './page-view';
import PriceAlert from './price-alert';
import { notFound } from 'next/navigation';

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
  if (!part) return notFound();
  const productType = productTypeFor(category);
  let priceRows: Array<{ retailer: string; priceCents: number; timestamp: string; url?: string }> = [] as any;
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/prices/${productType}/${id}`, { cache: 'no-store' });
    if (res.ok) priceRows = await res.json();
  } catch {}
  const price = priceRows.length ? priceRows[priceRows.length - 1] : await fetchLatestPrice(productType, id);
  const base = getSiteUrl();
  const title = formatTitle(category, part);
  const image = undefined as string | undefined; // could derive from a CDN later
  const offerPrice = typeof price?.priceCents === 'number' ? (price.priceCents / 100).toFixed(2) : undefined;
  const offerUrl = (price as any)?.url;
  // Fetch sparkline history
  let spark: Array<{ t: string; price: number }> = [];
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/prices/${productType}/${id}`, { cache: 'no-store' });
    if (res.ok) {
      const rows = await res.json();
      spark = Array.isArray(rows) ? rows.slice(-30).map((r: any) => ({ t: r.timestamp, price: r.priceCents/100 })) : [];
    }
  } catch {}
  // Related items
  let related: Array<{ id: string; label: string }> = [];
  try {
    const list = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/parts/${category}?page=1&pageSize=6`, { cache: 'no-store' }).then(r=>r.json());
    const arr = Array.isArray(list) ? list : (list.items ?? []);
    related = arr.filter((x: any) => x.id !== id).slice(0,4).map((x:any)=> ({ id: x.id, label: `${x.brand ?? ''} ${x.model ?? x.commonName ?? x.id}`.trim() }));
  } catch {}
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <PartPageView category={category} id={id} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: base + '/' },
        { name: 'Browse', url: base + '/browse' },
        { name: humanCat(category), url: base + `/browse?tab=${category}` },
        { name: title, url: base + `/part/${category}/${id}` },
      ])} />
      {/* Product JSON-LD (AggregateOffer when multiple prices) */}
      <JsonLd data={buildProductJsonLd({
        title,
        image,
        id,
        brand: part.brand,
        model: part.model,
        category: humanCat(category),
        rows: priceRows,
        singlePrice: offerPrice,
        singleUrl: offerUrl,
      })} />
      <Breadcrumb items={[
        { href: '/', label: 'Home' },
        { href: '/browse', label: 'Browse' },
        { href: `/browse?tab=${category}`, label: humanCat(category) },
        { href: `/part/${category}/${id}`, label: title },
      ]} />
      <div className="flex items-start gap-3">
        <Thumbnail src={null} alt={title} size={56} />
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          <SpecPills items={
        category==='filters' ? [
          `Type: ${part.type}`, `${part.gph} gph`, `max ${part.maxTankGal} gal`
        ] : category==='heaters' ? [
          `${part.wattage} W`, `${part.minTankGal}–${part.maxTankGal} gal`
        ] : category==='lights' ? [
          `${part.type}`, `${part.intensity}`, part.coverageCm ? `${part.coverageCm} cm` : null
        ] : category==='substrate' ? [
          `${part.type}`, part.color ?? null, part.plantFriendly ? 'plant-friendly' : null
        ] : [part.category]
          } />
        </div>
      </div>
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
      <div className="text-sm text-gray-700 space-y-3">
        {offerPrice ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span>
                Latest price: <span className="font-medium">${offerPrice}</span>
              </span>
              {price?.retailer ? (
                <span className="ml-2 inline-flex items-center text-gray-500">
                  <img src={retailerFavicon(price.retailer)} alt={price.retailer} className="w-4 h-4 mr-1" />
                  via {price.retailer}
                </span>
              ) : null}
              {price?.timestamp ? <span className="ml-2 text-gray-400">({new Date(price.timestamp).toLocaleDateString()})</span> : null}
            </div>
            <AmazonBuyLink productType={productType} productId={id} />
          </div>
        ) : (
          <div>No price data available.</div>
        )}
        {spark.length ? (
          <div className="mt-2">
            <SparklinePanel data={spark} />
          </div>
        ) : null}
        <div className="text-xs text-gray-500 inline-flex items-center gap-1">
          Some links may be affiliate links; purchases may support the project at no extra cost.
          <Tooltip content="We may earn a commission from qualifying purchases.">
            <span aria-hidden className="inline-block w-4 h-4 rounded-full bg-gray-200 text-gray-700 text-center leading-4 cursor-default">i</span>
          </Tooltip>
        </div>
        <PriceAlert productType={productType} productId={id} />
        {priceRows.length ? (
          <div className="mt-2">
            <div className="text-sm font-medium mb-1">Retailers</div>
            <div className="text-xs text-gray-700 grid sm:grid-cols-2 gap-2">
              {[...priceRows].slice(-6).reverse().map((r, i) => (
                <div key={i} className="border rounded p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={retailerFavicon(r.retailer)} alt={r.retailer} className="w-4 h-4" />
                    <div>
                      <div className="font-medium">{r.retailer}</div>
                      <div className="text-[11px] text-gray-500">{new Date(r.timestamp).toLocaleString()}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium flex items-center gap-3">
                    ${ (r.priceCents/100).toFixed(2) }
                    {r.url ? (
                      <TrackedRetailerBuyLink href={r.url} retailer={r.retailer} meta={{ productType, productId: id, from: 'detail_retailer_list' }} />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
      {related.length ? (
        <div className="mt-6">
          <div className="text-sm font-medium mb-2">Related</div>
          <div className="grid sm:grid-cols-2 gap-2 text-sm">
            {related.map((r)=> (
              <TrackedRelated key={r.id} href={`/part/${category}/${r.id}`} label={r.label} meta={{ fromCategory: category, fromId: id, toId: r.id }} />
            ))}
          </div>
        </div>
      ) : null}
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
    openGraph: {
      title,
      description,
      url: `/part/${params.category}/${params.id}`,
      images: [{ url: `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(params.category)}` }],
    },
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

function retailerFavicon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('amazon')) return 'https://www.amazon.com/favicon.ico';
  if (lower.includes('chewy')) return 'https://www.chewy.com/favicon.ico';
  if (lower.includes('petco')) return 'https://www.petco.com/favicon.ico';
  if (lower.includes('bulk reef') || lower.includes('brs') || lower.includes('bulkreefsupply')) return 'https://www.bulkreefsupply.com/favicon.ico';
  // extend mapping as needed; fallback to globe icon
  return '/globe.svg';
}

function buildProductJsonLd(args: { title: string; image?: string; id: string; brand?: string; model?: string; category: string; rows: Array<{ retailer: string; priceCents: number; timestamp: string; url?: string }>; singlePrice?: string; singleUrl?: string }) {
  const base: any = { '@context': 'https://schema.org', '@type': 'Product', name: args.title, image: args.image, sku: args.id, brand: args.brand, model: args.model, category: args.category };
  if (args.rows && args.rows.length) {
    const prices = args.rows.map(r => r.priceCents/100);
    const lowPrice = Math.min(...prices).toFixed(2);
    const highPrice = Math.max(...prices).toFixed(2);
    base.offers = {
      '@type': 'AggregateOffer', priceCurrency: 'USD', offerCount: args.rows.length, lowPrice, highPrice,
      offers: args.rows.slice(-5).map((r) => ({ '@type':'Offer', priceCurrency:'USD', price:(r.priceCents/100).toFixed(2), url: r.url, availability:'https://schema.org/InStock', seller: { '@type':'Organization', name: r.retailer } })),
    };
  } else if (args.singlePrice) {
    base.offers = { '@type':'Offer', priceCurrency:'USD', price: args.singlePrice, url: args.singleUrl, availability: 'https://schema.org/InStock' };
  }
  return base;
}

function TrackedRelated({ href, label, meta }: { href: string; label: string; meta?: Record<string, any> }) {
  return (
    <a href={href} className="border rounded-lg p-2 hover:shadow" onClick={() => {
      try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'related_item_click', props: { href, ...meta } })); } catch {}
    }}>{label}</a>
  );
}

// Client subcomponent for tracking retailer buy clicks
function TrackedRetailerBuyLink({ href, retailer, meta }: { href: string; retailer: string; meta?: Record<string, any> }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="nofollow sponsored noopener noreferrer"
      onClick={() => {
        try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'detail_buy_click', props: { href, retailer, ...(meta ?? {}) } })); } catch {}
      }}
      className="text-green-700 underline"
    >
      Buy
    </a>
  );
}
