import React from 'react';
import { getSiteUrl } from './site';

export function JsonLd({ data }: { data: Record<string, any> }) {
  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export function organizationJsonLd() {
  const base = getSiteUrl();
  const sameAs = [
    process.env.NEXT_PUBLIC_BRAND_TWITTER,
    process.env.NEXT_PUBLIC_BRAND_GITHUB,
    process.env.NEXT_PUBLIC_BRAND_LINKEDIN,
    process.env.NEXT_PUBLIC_BRAND_YOUTUBE,
  ].filter(Boolean);
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AquaBuilder',
    url: base,
    logo: `${base}/vercel.svg`,
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteJsonLd() {
  const base = getSiteUrl();
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'AquaBuilder',
    url: base,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${base}/browse?tab=filters&q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function buildCreativeWorkJsonLd(args: { id: string; name: string; buildType: string; url: string; datePublished?: string; dateModified?: string; parts?: Array<{ name: string; type: string }> }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: args.name,
    url: args.url,
    about: args.buildType.replace('_',' '),
    datePublished: args.datePublished,
    dateModified: args.dateModified,
    isAccessibleForFree: true,
    hasPart: (args.parts ?? []).map((p) => ({ '@type': 'Product', name: p.name || p.type })),
  };
}
