"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Heater = { id: string; brand?: string; model?: string; wattage: number; minTankGal: number; maxTankGal: number };

export default function HeatersList() {
  const [heaters, setHeaters] = useState<Heater[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();

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

  const filtered = heaters.filter((h) => `${h.brand ?? ''} ${h.model ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Heaters</CardTitle>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search heaters..." className="w-48" />
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading heaters…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {filtered.map((h) => (
          <div key={h.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.heater === h.id ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{h.brand ?? '—'} {h.model ?? ''}</div>
            <div className="text-xs text-gray-600">{h.wattage} W • {h.minTankGal}–{h.maxTankGal} gal</div>
            <div className="mt-2 flex justify-end"><Button onClick={() => choose(h)}>{equipment.heater === h.id ? 'Selected' : 'Select'}</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
