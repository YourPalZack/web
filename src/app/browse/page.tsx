import BrowseTabs from './tabs';
import CurrentBuildPanel from './current-build-panel';
import { JsonLd, breadcrumbJsonLd } from '../../lib/structured';
import { getSiteUrl } from '../../lib/site';
import AmazonPopularSSR from './amazon-popular-ssr';
import { prisma } from '@aquabuilder/db';
import type { Metadata } from 'next';

export function generateMetadata({ searchParams }: { searchParams?: { tab?: string } }): Metadata {
  const tab = (searchParams?.tab ?? 'fish').toLowerCase();
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
  return {
    title,
    description: `${title} for your aquarium build with compatibility and pricing info.`,
    alternates: { canonical: `/browse?tab=${tab}` },
    openGraph: { title, description: `${title} for your aquarium build.` },
  };
}

export default async function BrowsePage({ searchParams }: { searchParams?: { tab?: string } }) {
  const tab = (searchParams?.tab ?? 'fish').toLowerCase();
  const popularCategory = (['filters','heaters','lights','substrate','equipment'] as const).includes(tab as any) ? (tab as any) : null;
  // Generate ItemList JSON-LD for equipment tabs (first page SSR)
  let itemListJson: any | null = null;
  if (popularCategory) {
    try {
      const items = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/parts/${popularCategory}?page=1&pageSize=6`, { cache: 'no-store' }).then(r=>r.json());
      const arr = Array.isArray(items) ? items : (items.items ?? []);
      itemListJson = {
        '@context': 'https://schema.org', '@type': 'ItemList',
        itemListElement: arr.map((it: any, idx: number) => ({ '@type':'ListItem', position: idx+1, url: `/part/${popularCategory}/${it.id}` }))
      };
    } catch {}
  }
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
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
