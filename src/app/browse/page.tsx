import BrowseTabs from './tabs';
import CurrentBuildPanel from './current-build-panel';
import { JsonLd, breadcrumbJsonLd } from '../../lib/structured';
import { getSiteUrl } from '../../lib/site';
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

export default function BrowsePage() {
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-4">
      <JsonLd data={breadcrumbJsonLd([{ name: 'Home', url: getSiteUrl() + '/' }, { name: 'Browse', url: getSiteUrl() + '/browse' }])} />
      <h1 className="text-2xl font-semibold">Browse Parts</h1>
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <BrowseTabs />
        </div>
        <div className="space-y-4">
          <CurrentBuildPanel />
        </div>
      </div>
    </div>
  );
}
