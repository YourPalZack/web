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
    const dynamic: MetadataRoute.Sitemap = builds.map((b) => ({ url: `${base}/build/${b.id}`, lastModified: b.updatedAt }));
    return [...staticPages, ...dynamic];
  } catch {
    return staticPages;
  }
}
