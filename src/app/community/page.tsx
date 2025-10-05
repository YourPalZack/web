type BuildRow = { id:string; name:string; buildType:string };

export default async function CommunityPage({ searchParams }: { searchParams?: { type?: string; page?: string } }) {
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
      <h1 className="text-2xl font-semibold">Community Builds</h1>
      <div className="flex gap-2 text-xs">
        {['FRESH_COMMUNITY','FRESH_PLANTED','FRESH_CICHLID','BRACKISH','FOWLR','REEF','NANO_REEF','PALUDARIUM','BIOTOPE'].map((t) => (
          <a key={t} href={`/community?type=${t}`} className={`px-3 py-1 rounded-full border ${type===t? 'bg-blue-600 text-white border-transparent':'bg-white'}`}>{t.replace('_',' ')}</a>
        ))}
        {type && <a href={`/community`} className="px-3 py-1 rounded-full border">Clear</a>}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {rows.length === 0 && <div className="text-sm text-gray-600">No builds yet.</div>}
        {rows.map((b) => (
          <a key={b.id} href={`/build/${b.id}`} className="border rounded-2xl p-3 hover:shadow">
            <div className="font-medium">{b.name}</div>
            <div className="text-xs text-gray-600">{b.buildType}</div>
          </a>
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
