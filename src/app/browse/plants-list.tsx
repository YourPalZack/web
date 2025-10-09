"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, QuantityStepper, Input, Chip, Skeleton, ListTile, Thumbnail } from '@aquabuilder/ui';
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
    try { const sp = new URLSearchParams(window.location.search); const p = Number(sp.get('page')||'1')||1; setPage(p); const q0=sp.get('q'); if(q0) setQ(q0); const l0=sp.get('light'); if(l0 && (['LOW','MEDIUM','HIGH'] as const).includes(l0 as any)) setLight(l0 as any); const d0=sp.get('difficulty'); if(d0 && (['BEGINNER','INTERMEDIATE','ADVANCED'] as const).includes(d0 as any)) setDifficulty(d0 as any); const c0=sp.get('co2'); if(c0==='1'||c0==='0') setNeedCo2(c0==='1'); } catch {}
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

  useEffect(()=>{
    try{ const sp=new URLSearchParams(window.location.search); sp.set('tab','plants'); sp.set('page', String(page)); if(dq) sp.set('q', dq); else sp.delete('q'); if(light) sp.set('light', light); else sp.delete('light'); if(difficulty) sp.set('difficulty', difficulty); else sp.delete('difficulty'); if(needCo2!=null) sp.set('co2', needCo2 ? '1' : '0'); else sp.delete('co2'); window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`);}catch{}
  }, [dq, light, difficulty, needCo2, page]);

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
            {(['LOW','MEDIUM','HIGH'] as const).map((t) => {
              const next = light===t ? null : t;
              const sp = new URLSearchParams(); sp.set('tab','plants'); sp.set('page','1'); if(dq) sp.set('q', dq); if(next) sp.set('light', next); if(difficulty) sp.set('difficulty', difficulty); if(needCo2!=null) sp.set('co2', needCo2 ? '1' : '0');
              return (
                <a key={t} href={`/browse?${sp.toString()}`}><Chip active={light===t}>{t}</Chip></a>
              );
            })}
            {(['BEGINNER','INTERMEDIATE','ADVANCED'] as const).map((t) => {
              const next = difficulty===t ? null : t;
              const sp = new URLSearchParams(); sp.set('tab','plants'); sp.set('page','1'); if(dq) sp.set('q', dq); if(light) sp.set('light', light); if(next) sp.set('difficulty', next); if(needCo2!=null) sp.set('co2', needCo2 ? '1' : '0');
              return (
                <a key={t} href={`/browse?${sp.toString()}`}><Chip active={difficulty===t}>{t}</Chip></a>
              );
            })}
            {(() => {
              const next = needCo2===true ? null : true;
              const sp = new URLSearchParams(); sp.set('tab','plants'); sp.set('page','1'); if(dq) sp.set('q', dq); if(light) sp.set('light', light); if(difficulty) sp.set('difficulty', difficulty); if(next!=null) sp.set('co2', next ? '1' : '0');
              return <a href={`/browse?${sp.toString()}`}><Chip active={needCo2===true}>CO2</Chip></a>;
            })()}
            {(() => {
              const next = needCo2===false ? null : false;
              const sp = new URLSearchParams(); sp.set('tab','plants'); sp.set('page','1'); if(dq) sp.set('q', dq); if(light) sp.set('light', light); if(difficulty) sp.set('difficulty', difficulty); if(next!=null) sp.set('co2', next ? '1' : '0');
              return <a href={`/browse?${sp.toString()}`}><Chip active={needCo2===false}>No CO2</Chip></a>;
            })()}
          </div>
          {(dq || light || difficulty || needCo2!=null || page>1) && (
            <Button variant="secondary" onClick={()=>{ setQ(''); setLight(null); setDifficulty(null); setNeedCo2(null); setPage(1); }}>Clear</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-2xl p-3 shadow-sm">
              <Skeleton className="h-4 w-40 mb-2" />
              <Skeleton className="h-3 w-56 mb-3" />
              <div className="flex justify-end">
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))
        )}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((p) => {
          const inBuild = livestock.find((l) => l.type === 'PLANT' && l.id === p.id);
          return (
            <ListTile
              key={p.id}
              leading={<Thumbnail src={null} alt={p.commonName} size={48} />}
              title={<span onClick={() => { try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'species_detail_nav_click', props: { from: 'plants_list', id: p.id } })); } catch {} }}>{p.commonName}</span>}
              href={`/species/plants/${p.id}`}
              subtitle={<span>Light {p.lightNeeds} • {p.co2Required ? 'CO2' : 'No CO2'} • {p.difficulty}</span>}
              actions={inBuild ? (<QuantityStepper value={inBuild.qty} onChange={(v) => setQty(p.id, v)} min={0} />) : (<Button onClick={() => add(p)}>Add</Button>)}
            />
          );
        })}
        {!loading && total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} makeHref={(p)=> { const sp=new URLSearchParams(); sp.set('tab','plants'); sp.set('page', String(p)); if(dq) sp.set('q', dq); if(light) sp.set('light', light); if(difficulty) sp.set('difficulty', difficulty); if(needCo2!=null) sp.set('co2', needCo2 ? '1' : '0'); return `/browse?${sp.toString()}`; }} />
        )}
      </CardContent>
    </Card>
  );
}
