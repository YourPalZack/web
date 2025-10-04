"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Light = { id: string; brand?: string; model?: string; type: string; intensity: 'LOW'|'MEDIUM'|'HIGH'; coverageCm?: number };

export default function LightsList() {
  const [lights, setLights] = useState<Light[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();

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

  const filtered = lights.filter((l) => `${l.brand ?? ''} ${l.model ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Lights</CardTitle>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lights..." className="w-48" />
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading lights…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {filtered.map((l) => (
          <div key={l.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.light === l.id ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{l.brand ?? '—'} {l.model ?? ''}</div>
            <div className="text-xs text-gray-600">{l.type} • {l.intensity} • {l.coverageCm ? `${l.coverageCm} cm` : '—'} coverage</div>
            <div className="mt-2 flex justify-end"><Button onClick={() => choose(l)}>{equipment.light === l.id ? 'Selected' : 'Select'}</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
