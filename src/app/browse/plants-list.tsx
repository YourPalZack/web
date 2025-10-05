"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, QuantityStepper, Input, Chip } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Plant = { id: string; commonName: string; lightNeeds: 'LOW' | 'MEDIUM' | 'HIGH'; co2Required: boolean; difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' };

export default function PlantsList() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { livestock, set } = useBuildStore();
  const [light, setLight] = useState<'LOW'|'MEDIUM'|'HIGH'|null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/plants', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        setPlants(txt ? JSON.parse(txt) : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setPlants([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  function add(p: Plant) {
    if (livestock.some((l) => l.type === 'PLANT' && l.id === p.id)) return;
    set('livestock', [...livestock, { type: 'PLANT', id: p.id, qty: 1 }]);
  }
  function setQty(id: string, qty: number) {
    set('livestock', livestock.map((l) => (l.type === 'PLANT' && l.id === id ? { ...l, qty } : l)));
  }

  const filtered = plants.filter((p) => {
    const text = p.commonName.toLowerCase().includes(q.trim().toLowerCase());
    const match = light ? p.lightNeeds === light : true;
    return text && match;
  });
  const paged = filtered.slice((page-1)*pageSize, (page-1)*pageSize + pageSize);

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Plants</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search plants..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {(['LOW','MEDIUM','HIGH'] as const).map((t) => (
              <Chip key={t} active={light===t} onClick={() => { setLight(light===t?null:t); setPage(1); }}>{t}</Chip>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading plants…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((p) => {
          const inBuild = livestock.find((l) => l.type === 'PLANT' && l.id === p.id);
          return (
            <div key={p.id} className="border rounded-2xl p-3 flex items-center justify-between shadow-sm">
              <div>
                <div className="font-medium">{p.commonName}</div>
                <div className="text-xs text-gray-600">Light {p.lightNeeds} • {p.co2Required ? 'CO2' : 'No CO2'} • {p.difficulty}</div>
              </div>
              {inBuild ? (
                <QuantityStepper value={inBuild.qty} onChange={(v) => setQty(p.id, v)} min={0} />
              ) : (
                <Button onClick={() => add(p)}>Add</Button>
              )}
            </div>
          );
        })}
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
