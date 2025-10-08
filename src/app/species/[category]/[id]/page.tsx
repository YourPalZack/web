import type { Metadata } from 'next';
import Link from 'next/link';
import { prisma } from '@aquabuilder/db';
import { JsonLd, breadcrumbJsonLd } from '../../../../lib/structured';
import { getSiteUrl } from '../../../../lib/site';
import SpeciesPageView from './page-view';
import { Chip } from '@aquabuilder/ui';
import { Breadcrumb } from '@aquabuilder/ui';
import { notFound } from 'next/navigation';

type Category = 'fish'|'plants'|'invertebrates'|'corals';

async function fetchSpecies(category: Category, id: string): Promise<any | null> {
  try {
    switch (category) {
      case 'fish': return await prisma.fish.findUnique({ where: { id } });
      case 'plants': return await prisma.plant.findUnique({ where: { id } });
      case 'invertebrates': return await prisma.invertebrate.findUnique({ where: { id } });
      case 'corals': return await prisma.coral.findUnique({ where: { id } });
    }
  } catch {}
  try {
    const res = await fetch(`${process.env.NEXTAUTH_URL ?? ''}/api/parts/${category}`, { cache: 'no-store' });
    const arr = res.ok ? await res.json() : [];
    return Array.isArray(arr) ? arr.find((x: any) => x.id === id) ?? null : null;
  } catch { return null; }
}

export default async function SpeciesPage({ params }: { params: { category: Category; id: string } }) {
  const { category, id } = params;
  const data = await fetchSpecies(category, id);
  if (!data) return notFound();
  const base = getSiteUrl();
  const title = formatTitle(category, data);
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-4">
      <SpeciesPageView category={category} id={id} />
      <JsonLd data={breadcrumbJsonLd([
        { name: 'Home', url: base + '/' },
        { name: 'Browse', url: base + '/browse' },
        { name: humanCat(category), url: base + `/browse?tab=${category}` },
        { name: title, url: base + `/species/${category}/${id}` },
      ])} />
      <JsonLd data={buildSpeciesJsonLd(category, data, base + `/species/${category}/${id}`)} />
      <Breadcrumb items={[
        { href: '/', label: 'Home' },
        { href: '/browse', label: 'Browse' },
        { href: `/browse?tab=${category}`, label: humanCat(category) },
        { href: `/species/${category}/${id}`, label: title },
      ]} />
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex flex-wrap gap-2 text-xs">
        {category==='fish' && (
          <>
            {data.minTankGal != null && <Chip active={false}>min {data.minTankGal} gal</Chip>}
            <Chip active={false}>{data.tempMinC}–{data.tempMaxC} °C</Chip>
            <Chip active={false}>pH {data.phMin}–{data.phMax}</Chip>
            <Chip active={false}>{data.temperament}</Chip>
          </>
        )}
        {category==='plants' && (
          <>
            <Chip active={false}>{data.lightNeeds} light</Chip>
            <Chip active={false}>{data.co2Required ? 'CO2' : 'No CO2'}</Chip>
            <Chip active={false}>{data.difficulty}</Chip>
          </>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2 text-sm text-gray-700">
          {category==='fish' && (
            <>
              <Row k="Scientific" v={data.scientificName} />
              <Row k="Min Tank" v={`${data.minTankGal} gal`} />
              <Row k="Temperature" v={`${data.tempMinC}–${data.tempMaxC} °C`} />
              <Row k="pH" v={`${data.phMin}–${data.phMax}`} />
              <Row k="Size" v={`${data.adultSizeCm} cm`} />
              {data.schoolingMin ? <Row k="Schooling" v={`${data.schoolingMin}+`} /> : null}
            </>
          )}
          {category==='plants' && (
            <>
              <Row k="Difficulty" v={data.difficulty} />
              <Row k="Light" v={data.lightNeeds} />
              <Row k="CO₂" v={data.co2Required ? 'Required' : 'Optional'} />
            </>
          )}
          {(category==='invertebrates' || category==='corals') && (
            <>
              {'scientificName' in data ? <Row k="Scientific" v={data.scientificName} /> : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export async function generateMetadata({ params }: { params: { category: Category; id: string } }): Promise<Metadata> {
  const data = await fetchSpecies(params.category, params.id);
  const title = data ? formatTitle(params.category, data) : 'Species';
  const desc = data ? `${title} care info and parameters.` : 'Species details.';
  const subtitle = `${params.category.charAt(0).toUpperCase() + params.category.slice(1)} • Species Detail`;
  const og = `/api/og?title=${encodeURIComponent(title)}&subtitle=${encodeURIComponent(subtitle)}`;
  return {
    title,
    description: desc,
    alternates: { canonical: `/species/${params.category}/${params.id}` },
    openGraph: { title, description: desc, url: `/species/${params.category}/${params.id}` , images: [{ url: og }]},
    twitter: { card: 'summary_large_image', title, description: desc, images: [og] },
  };
}

function humanCat(c: Category) {
  return c.charAt(0).toUpperCase() + c.slice(1);
}
function formatTitle(c: Category, data: any) {
  if (c === 'fish' || c === 'plants') return data.commonName ?? data.scientificName ?? data.id;
  return data.commonName ?? data.id;
}

function Row({ k, v }: { k: string; v?: string }) {
  if (!v) return null;
  return (
    <div>
      <div className="text-gray-600">{k}</div>
      <div className="font-medium">{v}</div>
    </div>
  );
}

function buildSpeciesJsonLd(category: Category, data: any, url: string) {
  const base: any = { '@context': 'https://schema.org', '@type': 'CreativeWork', name: formatTitle(category, data), url };
  const props: Array<{ name: string; value: string }> = [];
  if (category === 'fish') {
    if (data.scientificName) props.push({ name: 'Scientific Name', value: data.scientificName });
    if (data.minTankGal != null) props.push({ name: 'Min Tank', value: `${data.minTankGal} gal` });
    if (data.tempMinC != null && data.tempMaxC != null) props.push({ name: 'Temperature', value: `${data.tempMinC}–${data.tempMaxC} °C` });
    if (data.phMin != null && data.phMax != null) props.push({ name: 'pH', value: `${data.phMin}–${data.phMax}` });
    if (data.adultSizeCm != null) props.push({ name: 'Adult Size', value: `${data.adultSizeCm} cm` });
    if (data.schoolingMin != null) props.push({ name: 'Schooling', value: `${data.schoolingMin}+` });
  }
  if (category === 'plants') {
    if (data.difficulty) props.push({ name: 'Difficulty', value: data.difficulty });
    if (data.lightNeeds) props.push({ name: 'Light', value: data.lightNeeds });
    if (data.co2Required != null) props.push({ name: 'CO2', value: data.co2Required ? 'Required' : 'Optional' });
  }
  if (props.length) base.additionalProperty = props.map((p) => ({ '@type': 'PropertyValue', ...p }));
  return base;
}
