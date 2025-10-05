"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Heater = { id: string; brand?: string; model?: string; wattage: number; minTankGal: number; maxTankGal: number };

export default function HeatersList() {
  const [heaters, setHeaters] = useState<Heater[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();
  const [bucket, setBucket] = useState<'<=100'|'101-200'|'201-300'|'>300'|null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/heaters', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        setHeaters(txt ? JSON.parse(txt) : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setHeaters([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function choose(h: Heater) {
    set('equipment', { ...equipment, heater: h.id });
  }

  const filtered = heaters.filter((h) => {
    const text = `${h.brand ?? ''} ${h.model ?? ''}`.toLowerCase().includes(q.trim().toLowerCase());
    let match = true;
    if (bucket === '<=100') match = h.wattage <= 100;
    else if (bucket === '101-200') match = h.wattage > 100 && h.wattage <= 200;
    else if (bucket === '201-300') match = h.wattage > 200 && h.wattage <= 300;
    else if (bucket === '>300') match = h.wattage > 300;
    return text && match;
  });
  const paged = filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);

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
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((h) => (
          <div key={h.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.heater === h.id ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{h.brand ?? '—'} {h.model ?? ''}</div>
            <div className="text-xs text-gray-600">{h.wattage} W • {h.minTankGal}–{h.maxTankGal} gal</div>
            <div className="mt-2 flex justify-end"><Button onClick={() => choose(h)}>{equipment.heater === h.id ? 'Selected' : 'Select'}</Button></div>
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
