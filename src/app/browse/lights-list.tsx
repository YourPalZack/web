"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Light = { id: string; brand?: string; model?: string; type: string; intensity: 'LOW'|'MEDIUM'|'HIGH'; coverageCm?: number };

export default function LightsList() {
  const [lights, setLights] = useState<Light[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();
  const [intensity, setIntensity] = useState<'LOW'|'MEDIUM'|'HIGH'|null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/lights', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        setLights(txt ? JSON.parse(txt) : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setLights([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function choose(l: Light) {
    set('equipment', { ...equipment, light: l.id });
  }

  const filtered = lights.filter((l) => {
    const text = `${l.brand ?? ''} ${l.model ?? ''}`.toLowerCase().includes(q.trim().toLowerCase());
    const match = intensity ? l.intensity === intensity : true;
    return text && match;
  });
  const paged = filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);

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
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((l) => (
          <div key={l.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.light === l.id ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{l.brand ?? '—'} {l.model ?? ''}</div>
            <div className="text-xs text-gray-600">{l.type} • {l.intensity} • {l.coverageCm ? `${l.coverageCm} cm` : '—'} coverage</div>
            <div className="mt-2 flex justify-end"><Button onClick={() => choose(l)}>{equipment.light === l.id ? 'Selected' : 'Select'}</Button></div>
          </div>
        ))}
        {!loading && filtered.length > pageSize && (
          <div className="col-span-full flex justify-end items-center gap-2 pt-2">
            <Button variant="secondary" onClick={() => setPage(Math.max(1, page-1))}>Prev</Button>
            <span className="text-xs text-gray-600">Page {page} of {Math.ceil(filtered.length / pageSize)}</span>
            <Button variant="secondary" onClick={() => setPage(Math.min(Math.ceil(filtered.length/pageSize), page+1))}>Next</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
