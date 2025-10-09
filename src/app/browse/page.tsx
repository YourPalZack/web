import BrowseTabs from './tabs';
import CurrentBuildPanel from './current-build-panel';
import { JsonLd, breadcrumbJsonLd } from '../../lib/structured';
import { getSiteUrl } from '../../lib/site';
import AmazonPopularSSR from './amazon-popular-ssr';
import { prisma } from '@aquabuilder/db';
import type { Metadata } from 'next';
import BrowsePageView from './page-view';

export function generateMetadata({ searchParams }: { searchParams?: { tab?: string; page?: string } }): Metadata {
  const tab = (searchParams?.tab ?? 'fish').toLowerCase();
  const page = Number(searchParams?.page ?? '1') || 1;
  const titles: Record<string, string> = {
    fish: 'Browse Fish',
    plants: 'Browse Plants',
    filters: 'Browse Filters',
    heaters: 'Browse Heaters',
    lights: 'Browse Lights',
    substrate: 'Browse Substrate',
    extras: 'Browse Extras',
  };
  const title = titles[tab] ?? 'Browse Parts';
  const descriptions: Record<string, string> = {
    fish: 'Discover compatible freshwater fish with size, tank, and parameter guidance.',
    plants: 'Find aquarium plants by light, CO₂, and difficulty with build fit.',
    filters: 'Compare aquarium filters and specs to match your tank and bioload.',
    heaters: 'Pick the right aquarium heater wattage for your tank size.',
    lights: 'Explore aquarium LED lights by intensity and coverage.',
    substrate: 'Browse aquarium substrate types and plant-friendly options.',
    extras: 'Shop extras like CO₂ kits and skimmers for your setup.',
  };
  const description = descriptions[tab] ?? `${title} for your aquarium build with compatibility and pricing info.`;
  const og = `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(`Browse • ${tab}`)}`;
  const canonical = tab === 'fish'
    ? (page > 1 ? `/browse?page=${page}` : '/browse')
    : `/browse?tab=${tab}${page>1?`&page=${page}`:''}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, images: [{ url: og }] },
    twitter: { card: 'summary_large_image', title, description, images: [og] },
  };
}

export default async function BrowsePage({ searchParams }: { searchParams?: { tab?: string } }) {
  const tab = (searchParams?.tab ?? 'fish').toLowerCase();
  const popularCategory = (['filters','heaters','lights','substrate','equipment'] as const).includes(tab as any) ? (tab as any) : null;
  // Generate ItemList JSON-LD (SSR) for the active tab's first page
  let itemListJson: any | null = null;
  try {
    if (popularCategory) {
      const items = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/parts/${popularCategory}?page=1&pageSize=6`, { cache: 'no-store' }).then(r=>r.json());
      const arr = Array.isArray(items) ? items : (items.items ?? []);
      itemListJson = {
        '@context': 'https://schema.org', '@type': 'ItemList', url: `/browse?tab=${popularCategory}`,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: arr.length,
        itemListElement: arr.map((it: any, idx: number) => ({ '@type':'ListItem', position: idx+1, url: `/part/${popularCategory}/${it.id}` }))
      };
    } else if (tab === 'fish' || tab === 'plants') {
      const items = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/parts/${tab}?page=1&pageSize=6`, { cache: 'no-store' }).then(r=>r.json());
      const arr = Array.isArray(items) ? items : (items.items ?? []);
      itemListJson = {
        '@context': 'https://schema.org', '@type': 'ItemList', url: `/browse?tab=${tab}`,
        itemListOrder: 'https://schema.org/ItemListOrderAscending',
        numberOfItems: arr.length,
        itemListElement: arr.map((it: any, idx: number) => ({ '@type':'ListItem', position: idx+1, url: `/species/${tab}/${it.id}` }))
      };
    }
  } catch {}
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <BrowsePageView tab={tab} />
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', url: getSiteUrl() + '/' }, { name: 'Browse', url: getSiteUrl() + '/browse' }])} />
      {itemListJson && <JsonLd data={itemListJson} />}
      <h1 className="text-2xl font-semibold">Browse Parts</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BrowseTabs />
          {popularCategory ? <AmazonPopularSSR category={popularCategory} /> : null}
        </div>
        <div className="space-y-4">
          <CurrentBuildPanel />
        </div>
      </div>
    </div>
  );
}
