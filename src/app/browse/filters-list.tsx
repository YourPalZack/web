"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Filter = { id: string; brand?: string; model?: string; type: string; gph: number; maxTankGal: number };

export default function FiltersList() {
  const [filters, setFilters] = useState<Filter[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { equipment, set } = useBuildStore();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/filters', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        setFilters(txt ? JSON.parse(txt) : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setFilters([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function choose(f: Filter) {
    set('equipment', { ...equipment, filter: f.id });
  }

  const filtered = filters.filter((f) => `${f.brand ?? ''} ${f.model ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Filters</CardTitle>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search filters..." className="w-48" />
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading filters…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {filtered.map((f) => (
          <div key={f.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.filter === f.id ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{f.brand ?? '—'} {f.model ?? ''}</div>
            <div className="text-xs text-gray-600">{f.type} • {f.gph} gph • up to {f.maxTankGal} gal</div>
            <div className="mt-2 flex justify-end"><Button onClick={() => choose(f)}>{equipment.filter === f.id ? 'Selected' : 'Select'}</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
