"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import Pagination from './pagination';
import AmazonBuyLink from './amazon-buy-link';
import { useBuildStore } from '../../lib/store';
import { logEvent } from '../../lib/analytics-client';

type Heater = { id: string; brand?: string; model?: string; wattage: number; minTankGal: number; maxTankGal: number };

export default function HeatersList() {
  const [heaters, setHeaters] = useState<Heater[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();
  const [bucket, setBucket] = useState<'<=100'|'101-200'|'201-300'|'>300'|null>(null);
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
        if (bucket){
          const [min, max] = bucket === '<=100' ? [0,100] : bucket==='101-200' ? [101,200] : bucket==='201-300' ? [201,300] : [301, 100000];
          if (min) params.set('wattMin', String(min));
          params.set('wattMax', String(max));
        }
        const r = await fetch(`/api/parts/heaters?${params.toString()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) { setHeaters(data); setTotal(data.length); }
        else { setHeaters(data.items ?? []); setTotal(data.total ?? 0); }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setHeaters([]); setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [dq, bucket, page]);

  function choose(h: Heater) {
    set('equipment', { ...equipment, heater: h.id });
    try { logEvent('add_to_build', { source: 'heaters_list', itemType: 'HEATER', id: h.id }); } catch {}
  }

  const paged = heaters;

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Heaters</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search heaters..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {(['<=100','101-200','201-300','>300'] as const).map((t) => (
              <Chip key={t} active={bucket===t} onClick={() => { setBucket(bucket===t?null:t); setPage(1); }}>{t} W</Chip>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading heaters…</div>}
        {!loading && !error && paged.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((h) => (
          <div key={h.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.heater === h.id ? 'ring-2 ring-blue-400' : ''}`}>
            <a href={`/part/heaters/${h.id}`} className="font-medium hover:underline" onClick={() => {
              try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'detail_nav_click', props: { from: 'heaters_list', productType: 'HEATER', productId: h.id } })); } catch {}
            }}>{h.brand ?? '—'} {h.model ?? ''}</a>
            <div className="text-xs text-gray-600">{h.wattage} W • {h.minTankGal}–{h.maxTankGal} gal</div>
            <div className="mt-2 flex justify-between items-center">
              <AmazonBuyLink productType="HEATER" productId={h.id} />
              <Button onClick={() => choose(h)}>{equipment.heater === h.id ? 'Selected' : 'Select'}</Button>
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
