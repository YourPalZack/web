type BuildRow = { id:string; name:string; buildType:string };
import CommunityTrackLink from './track-link';
import CommunityFilterLink from './filter-link';
import CommunityPageView from './page-view';

export default async function CommunityPage({ searchParams }: { searchParams?: { type?: string; page?: string } }) {
  // SEO metadata via headers set in layout; this server component renders canonical content
  const type = searchParams?.type;
  const page = Number(searchParams?.page ?? '1') || 1;
  const pageSize = 12;
  const url = new URL(`${process.env.NEXTAUTH_URL ?? ''}/api/builds/list`, 'http://localhost');
  url.searchParams.set('count', '1');
  url.searchParams.set('page', String(page));
  url.searchParams.set('pageSize', String(pageSize));
  if (type) url.searchParams.set('type', type);
  const res = await fetch(url.toString().replace('http://localhost', ''), { cache: 'no-store' });
  let rows: BuildRow[] = [];
  let total = 0;
  if (res.ok) {
    const data = await res.json();
    rows = Array.isArray(data) ? data : (data.items ?? []);
    total = Array.isArray(data) ? data.length : (data.total ?? 0);
  }
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-4">
      <CommunityPageView type={type} page={page} />
      {/* Breadcrumbs for SEO */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: '/' },
          { '@type': 'ListItem', position: 2, name: 'Community', item: '/community' },
        ],
      }) }} />
      {/* ItemList for builds on current page */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        url: `/community${type || page>1 ? `?${new URLSearchParams({ ...(type?{type}:{}), ...(page>1?{page:String(page)}:{}) }).toString()}` : ''}`,
        itemListOrder: 'https://schema.org/ItemListOrderDescending',
        numberOfItems: rows.length,
        itemListElement: rows.map((b, idx) => ({ '@type': 'ListItem', position: idx + 1, url: `/build/${b.id}` })),
      }) }} />
      <h1 className="text-2xl font-semibold">Community Builds</h1>
      <div className="flex gap-2 text-xs">
        {['FRESH_COMMUNITY','FRESH_PLANTED','FRESH_CICHLID','BRACKISH','FOWLR','REEF','NANO_REEF','PALUDARIUM','BIOTOPE'].map((t) => (
          <CommunityFilterLink key={t} href={`/community?type=${t}`} active={type===t} label={t.replace('_',' ')} meta={{ type: t }} />
        ))}
        {type && (
          <CommunityFilterLink href={`/community`} active={false} label="Clear" meta={{ action: 'clear', prevType: type }} />
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.length === 0 && <div className="text-sm text-gray-600">No builds yet.</div>}
        {rows.map((b) => (
          <CommunityTrackLink key={b.id} href={`/build/${b.id}`} buildId={b.id}>
            <div className="font-medium">{b.name}</div>
            <div className="text-xs text-gray-600">{b.buildType}</div>
          </CommunityTrackLink>
        ))}
        {total > pageSize && (
          <div className="col-span-full flex justify-end items-center gap-2 pt-2 text-xs">
            <a className={`px-2 py-1 border rounded ${page<=1?'pointer-events-none opacity-50':''}`} href={`/community?${new URLSearchParams({ ...(type?{type}:{}), page: String(Math.max(1,page-1)) }).toString()}`}>Prev</a>
            <span className="text-gray-600">Page {page} of {Math.max(1, Math.ceil(total / pageSize))}</span>
            <a className={`px-2 py-1 border rounded ${page>=Math.ceil(total/pageSize)?'pointer-events-none opacity-50':''}`} href={`/community?${new URLSearchParams({ ...(type?{type}:{}), page: String(Math.min(Math.ceil(total/pageSize), page+1)) }).toString()}`}>Next</a>
          </div>
        )}
      </div>
    </div>
  );
}

export function generateMetadata({ searchParams }: { searchParams?: { type?: string; page?: string } }) {
  const type = searchParams?.type;
  const page = Number(searchParams?.page ?? '1') || 1;
  const baseTitle = 'Community Builds';
  const title = type ? `${baseTitle} — ${type.replace('_',' ')}` : baseTitle;
  return {
    title,
    description: 'Browse public aquarium builds shared by the community.',
    alternates: { canonical: `/community${type || page>1 ? `?${new URLSearchParams({ ...(type?{type}:{}), ...(page>1?{page:String(page)}:{}) }).toString()}` : ''}` },
    openGraph: { title, description: 'Browse public aquarium builds shared by the community.' },
  } as const;
}
