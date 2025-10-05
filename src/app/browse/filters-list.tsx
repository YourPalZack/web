"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import Pagination from './pagination';
import AmazonBuyLink from './amazon-buy-link';
import { useBuildStore } from '../../lib/store';

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

  useEffect(()=>{ const t = setTimeout(()=> setDq(q), 200); return ()=> clearTimeout(t); }, [q]);
  useEffect(() => {
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
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading filters…</div>}
        {!loading && !error && paged.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((f) => (
          <div key={f.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.filter === f.id ? 'ring-2 ring-blue-400' : ''}`}>
            <a href={`/part/filters/${f.id}`} className="font-medium hover:underline">{f.brand ?? '—'} {f.model ?? ''}</a>
            <div className="text-xs text-gray-600">{f.type} • {f.gph} gph • up to {f.maxTankGal} gal</div>
            <div className="mt-2 flex justify-between items-center">
              <AmazonBuyLink productType="FILTER" productId={f.id} />
              <Button onClick={() => choose(f)}>{equipment.filter === f.id ? 'Selected' : 'Select'}</Button>
            </div>
          </div>
        ))}
        {!loading && total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} />
        )}
      </CardContent>
    </Card>
  );
}
