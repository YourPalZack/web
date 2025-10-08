"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import Pagination from './pagination';
import AmazonBuyLink from './amazon-buy-link';
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
  useEffect(() => {
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
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Lights</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lights..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {(['LOW','MEDIUM','HIGH'] as const).map((t) => (
              <Chip key={t} active={intensity===t} onClick={() => { setIntensity(intensity===t?null:t); setPage(1); }}>{t}</Chip>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading lights…</div>}
        {!loading && !error && paged.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((l) => (
          <div key={l.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.light === l.id ? 'ring-2 ring-blue-400' : ''}`}>
            <a href={`/part/lights/${l.id}`} className="font-medium hover:underline" onClick={() => {
              try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'detail_nav_click', props: { from: 'lights_list', productType: 'LIGHT', productId: l.id } })); } catch {}
            }}>{l.brand ?? '—'} {l.model ?? ''}</a>
            <div className="text-xs text-gray-600">{l.type} • {l.intensity} • {l.coverageCm ? `${l.coverageCm} cm` : '—'} coverage</div>
            <div className="mt-2 flex justify-between items-center">
              <AmazonBuyLink productType="LIGHT" productId={l.id} />
              <Button onClick={() => choose(l)}>{equipment.light === l.id ? 'Selected' : 'Select'}</Button>
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
