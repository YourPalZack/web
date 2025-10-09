"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip, Skeleton, ListTile, Thumbnail } from '@aquabuilder/ui';
import Pagination from './pagination';
import AmazonBuyLink from './amazon-buy-link';
import RetailerBadge from './retailer-badge';
import { useBuildStore } from '../../lib/store';
import { logEvent } from '../../lib/analytics-client';

type Light = { id: string; brand?: string; model?: string; type: string; intensity: 'LOW'|'MEDIUM'|'HIGH'; coverageCm?: number };

export default function LightsList() {
  const [lights, setLights] = useState<Light[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();
  const [intensity, setIntensity] = useState<'LOW'|'MEDIUM'|'HIGH'|null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(()=>{ const t=setTimeout(()=> setDq(q),200); return ()=> clearTimeout(t); }, [q]);
  // Initialize from URL
  useEffect(()=>{
    try{
      const sp = new URLSearchParams(window.location.search);
      const p = Number(sp.get('page')||'1')||1; setPage(p);
      const q0 = sp.get('q'); if (q0) setQ(q0);
      const i0 = sp.get('intensity'); if (i0 && (['LOW','MEDIUM','HIGH'] as const).includes(i0 as any)) setIntensity(i0 as any);
    }catch{}
  }, []);
  // Reflect filters to URL
  useEffect(()=>{
    try{
      const sp = new URLSearchParams(window.location.search);
      sp.set('tab','lights'); sp.set('page', String(page));
      if (dq) sp.set('q', dq); else sp.delete('q');
      if (intensity) sp.set('intensity', intensity); else sp.delete('intensity');
      window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`);
    }catch{}
  }, [dq, intensity, page]);
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
        if (intensity) params.set('type', intensity);
        const r = await fetch(`/api/parts/lights?${params.toString()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) { setLights(data); setTotal(data.length); }
        else { setLights(data.items ?? []); setTotal(data.total ?? 0); }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setLights([]); setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [dq, intensity, page]);

  function choose(l: Light) {
    set('equipment', { ...equipment, light: l.id });
    try { logEvent('add_to_build', { source: 'lights_list', itemType: 'LIGHT', id: l.id }); } catch {}
  }

  const paged = lights;

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-green-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Lights</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lights..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {(['LOW','MEDIUM','HIGH'] as const).map((t) => {
              const next = intensity===t ? null : t;
              const sp = new URLSearchParams(); sp.set('tab','lights'); sp.set('page','1'); if (dq) sp.set('q', dq); if (next) sp.set('intensity', next);
              return (
                <a key={t} href={`/browse?${sp.toString()}`}>
                  <Chip active={intensity===t}>{t}</Chip>
                </a>
              );
            })}
          </div>
          {(dq || intensity || page>1) && (
            <Button variant="secondary" onClick={()=>{ setQ(''); setIntensity(null); setPage(1); }}>Clear</Button>
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
        {paged.map((l) => (
          <ListTile
            key={l.id}
            active={equipment.light === l.id}
            title={<span onClick={() => { try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'detail_nav_click', props: { from: 'lights_list', productType: 'LIGHT', productId: l.id } })); } catch {} }}>{l.brand ?? '—'} {l.model ?? ''}</span>}
            href={`/part/lights/${l.id}`}
            leading={<Thumbnail src={null} alt={`${l.brand ?? ''} ${l.model ?? l.id}`} size={48} />}
            subtitle={<span>{l.type} • {l.intensity} • {l.coverageCm ? `${l.coverageCm} cm` : '—'} coverage</span>}
            meta={<RetailerBadge productType="LIGHT" productId={l.id} />}
            actions={
              <>
                <AmazonBuyLink productType="LIGHT" productId={l.id} />
                <Button onClick={() => choose(l)}>{equipment.light === l.id ? 'Selected' : 'Select'}</Button>
              </>
            }
          />
        ))}
        {!loading && total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} makeHref={(p)=> {
            const sp = new URLSearchParams(); sp.set('tab','lights'); sp.set('page', String(p));
            if (dq) sp.set('q', dq); if (intensity) sp.set('intensity', intensity);
            return `/browse?${sp.toString()}`;
          }} />
        )}
      </CardContent>
    </Card>
  );
}
