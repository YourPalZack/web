"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip, Skeleton, ListTile, Thumbnail } from '@aquabuilder/ui';
import Pagination from './pagination';
import AmazonBuyLink from './amazon-buy-link';
import RetailerBadge from './retailer-badge';
import { useBuildStore } from '../../lib/store';
import { logEvent } from '../../lib/analytics-client';

type Filter = { id: string; brand?: string; model?: string; type: string; gph: number; maxTankGal: number };

export default function FiltersList() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();
  const [type, setType] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  // Read initial state from URL
  useEffect(()=>{
    try {
      const sp = new URLSearchParams(window.location.search);
      const p = Number(sp.get('page')||'1')||1; setPage(p);
      const q0 = sp.get('q'); if (q0) setQ(q0);
      const t0 = sp.get('type'); if (t0) setType(t0);
    } catch {}
  }, []);

  // Reflect filters in URL (without navigation)
  useEffect(()=>{
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set('tab','filters');
      sp.set('page', String(page));
      if (dq) sp.set('q', dq); else sp.delete('q');
      if (type) sp.set('type', type); else sp.delete('type');
      const url = `${window.location.pathname}?${sp.toString()}`;
      window.history.replaceState({}, '', url);
    } catch {}
  }, [dq, type, page]);

  useEffect(()=>{ const t = setTimeout(()=> setDq(q), 200); return ()=> clearTimeout(t); }, [q]);
  useEffect(() => {
    try { const sp = new URLSearchParams(window.location.search); const p = Number(sp.get('page')||'1')||1; setPage(p); } catch {}
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        params.set('count', '1');
        if (dq) params.set('q', dq);
        if (type) params.set('type', type);
        const r = await fetch(`/api/parts/filters?${params.toString()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) { setFilters(data); setTotal(data.length); }
        else { setFilters(data.items ?? []); setTotal(data.total ?? 0); }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setFilters([]); setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [dq, type, page]);

  function choose(f: Filter) {
    set('equipment', { ...equipment, filter: f.id });
    try { logEvent('add_to_build', { source: 'filters_list', itemType: 'FILTER', id: f.id }); } catch {}
  }

  const paged = filters;

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Filters</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filters..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {['HOB','CANISTER','SPONGE'].map((t) => (
              <Chip key={t} active={type===t} onClick={() => { setType(type===t?null:t); setPage(1); }}>{t}</Chip>
            ))}
          </div>
          {(dq || type || page>1) && (
            <Button variant="secondary" onClick={()=>{ setQ(''); setType(null); setPage(1); }}>Clear</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-2xl p-3 shadow-sm">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-56 mb-3" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))
        )}
        {!loading && !error && paged.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((f) => (
          <ListTile
            key={f.id}
            active={equipment.filter === f.id}
            title={<span onClick={() => { try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'detail_nav_click', props: { from: 'filters_list', productType: 'FILTER', productId: f.id } })); } catch {} }}>{f.brand ?? '—'} {f.model ?? ''}</span>}
            href={`/part/filters/${f.id}`}
            leading={<Thumbnail src={null} alt={`${f.brand ?? ''} ${f.model ?? f.id}`} size={48} />}
            subtitle={<span>{f.type} • {f.gph} gph • up to {f.maxTankGal} gal</span>}
            meta={<RetailerBadge productType="FILTER" productId={f.id} />}
            actions={
              <>
                <AmazonBuyLink productType="FILTER" productId={f.id} />
                <Button onClick={() => choose(f)}>{equipment.filter === f.id ? 'Selected' : 'Select'}</Button>
              </>
            }
          />
        ))}
        {!loading && total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} makeHref={(p)=> {
            const sp = new URLSearchParams();
            sp.set('tab','filters'); sp.set('page', String(p));
            if (dq) sp.set('q', dq);
            if (type) sp.set('type', type);
            return `/browse?${sp.toString()}`;
          }} />
        )}
      </CardContent>
    </Card>
  );
}
