import type { MetadataRoute } from 'next';
import { getSiteUrl } from '../lib/site';
import { prisma } from '@aquabuilder/db';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${base}/browse`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/community`, changeFrequency: 'daily', priority: 0.7 },
    { url: `${base}/build/new`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.3 },
  ];
  try {
    const builds = await prisma.userBuild.findMany({ where: { isPublic: true }, orderBy: { updatedAt: 'desc' }, take: 100 });
    const buildUrls: MetadataRoute.Sitemap = builds.map((b) => ({ url: `${base}/build/${b.id}`, lastModified: b.updatedAt }));
    // Include a subset of part detail pages for discoverability
    const [filters, heaters, lights, substrate, equipment] = await Promise.all([
      prisma.filter.findMany({ take: 100 }),
      prisma.heater.findMany({ take: 100 }),
      prisma.light.findMany({ take: 100 }),
      prisma.substrate.findMany({ take: 100 }),
      prisma.equipment.findMany({ take: 100 }),
    ]);
    const partUrls: MetadataRoute.Sitemap = [
      ...filters.map((x) => ({ url: `${base}/part/filters/${x.id}` })),
      ...heaters.map((x) => ({ url: `${base}/part/heaters/${x.id}` })),
      ...lights.map((x) => ({ url: `${base}/part/lights/${x.id}` })),
      ...substrate.map((x) => ({ url: `${base}/part/substrate/${x.id}` })),
      ...equipment.map((x) => ({ url: `${base}/part/equipment/${x.id}` })),
    ];
    // Include a subset of species pages for fish and plants
    const [fish, plants, inverts, corals] = await Promise.all([
      prisma.fish.findMany({ take: 100 }),
      prisma.plant.findMany({ take: 100 }),
      prisma.invertebrate.findMany({ take: 100 }).catch(()=>[] as any),
      prisma.coral.findMany({ take: 100 }).catch(()=>[] as any),
    ]);
    const speciesUrls: MetadataRoute.Sitemap = [
      ...fish.map((x) => ({ url: `${base}/species/fish/${x.id}` })),
      ...plants.map((x) => ({ url: `${base}/species/plants/${x.id}` })),
      ...inverts.map((x: any) => ({ url: `${base}/species/invertebrates/${x.id}` })),
      ...corals.map((x: any) => ({ url: `${base}/species/corals/${x.id}` })),
    ];
    return [...staticPages, ...buildUrls, ...partUrls, ...speciesUrls];
  } catch {
    return staticPages;
  }
}
