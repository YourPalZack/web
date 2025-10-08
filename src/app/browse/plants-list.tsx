"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, QuantityStepper, Input, Chip } from '@aquabuilder/ui';
import Pagination from './pagination';
import { useBuildStore } from '../../lib/store';
import { logEvent } from '../../lib/analytics-client';

type Plant = { id: string; commonName: string; lightNeeds: 'LOW' | 'MEDIUM' | 'HIGH'; co2Required: boolean; difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' };

export default function PlantsList() {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { livestock, set } = useBuildStore();
  const [light, setLight] = useState<'LOW'|'MEDIUM'|'HIGH'|null>(null);
  const [difficulty, setDifficulty] = useState<'BEGINNER'|'INTERMEDIATE'|'ADVANCED'|null>(null);
  const [needCo2, setNeedCo2] = useState<boolean|null>(null);
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
        if (light) params.set('lightNeeds', light);
        if (difficulty) params.set('difficulty', difficulty);
        if (needCo2 != null) params.set('co2', needCo2 ? '1' : '0');
        const r = await fetch(`/api/parts/plants?${params.toString()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) { setPlants(data); setTotal(data.length); }
        else { setPlants(data.items ?? []); setTotal(data.total ?? 0); }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setPlants([]); setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [dq, page, light, difficulty, needCo2]);

  function add(p: Plant) {
    if (livestock.some((l) => l.type === 'PLANT' && l.id === p.id)) return;
    set('livestock', [...livestock, { type: 'PLANT', id: p.id, qty: 1 }]);
    try { logEvent('add_to_build', { source: 'plants_list', itemType: 'PLANT', id: p.id }); } catch {}
  }
  function setQty(id: string, qty: number) {
    set('livestock', livestock.map((l) => (l.type === 'PLANT' && l.id === id ? { ...l, qty } : l)));
    try { logEvent('update_qty', { source: 'plants_list', itemType: 'PLANT', id, qty }); } catch {}
  }

  const filtered = plants; // server filtered
  const paged = plants;

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
            {(['BEGINNER','INTERMEDIATE','ADVANCED'] as const).map((t) => (
              <Chip key={t} active={difficulty===t} onClick={() => { setDifficulty(difficulty===t?null:t); setPage(1); }}>{t}</Chip>
            ))}
            <Chip active={needCo2===true} onClick={() => { setNeedCo2(needCo2===true?null:true); setPage(1); }}>CO2</Chip>
            <Chip active={needCo2===false} onClick={() => { setNeedCo2(needCo2===false?null:false); setPage(1); }}>No CO2</Chip>
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
                <a
                  href={`/species/plants/${p.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                  onClick={() => { try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'species_detail_nav_click', props: { from: 'plants_list', id: p.id } })); } catch {} }}
                >
                  {p.commonName}
                </a>
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
        {!loading && total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} />
        )}
      </CardContent>
    </Card>
  );
}
