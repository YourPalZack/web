"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, QuantityStepper, Chip } from '@aquabuilder/ui';
import Pagination from './pagination';
import { calcBioloadPct } from '@aquabuilder/core';
import { useBuildStore, type WarningItem } from '../../lib/store';
import { logEvent } from '../../lib/analytics-client';
import { useDebouncedValue } from '../../lib/hooks/use-debounce';

type Fish = {
  id: string;
  commonName: string;
  adultSizeCm: number;
  bioloadFactor: number;
  minTankGal: number;
  tempMinC: number;
  tempMaxC: number;
  phMin: number;
  phMax: number;
  temperament: string;
};

export function FishList() {
  const [fish, setFish] = useState<Fish[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState('');
  const dq = useDebouncedValue(q, 200);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tank, livestock, set, setWarnings } = useBuildStore();
  const [minTank, setMinTank] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        params.set('count', '1');
        if (dq) params.set('q', dq);
        if (minTank != null) params.set('minTankGal', String(minTank));
        const r = await fetch(`/api/parts/fish?${params.toString()}`, { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) { setFish(data); setTotal(data.length); }
        else { setFish(data.items ?? []); setTotal(data.total ?? 0); }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setFish([]); setTotal(0);
      } finally {
        setLoading(false);
      }
    })();
  }, [dq, minTank, page]);

  useEffect(() => {
    if (!tank?.volumeGal) return;
    const load = livestock
      .filter((l) => l.type === 'FISH')
      .map((l) => {
        const f = fish.find((x) => x.id === l.id);
        return f ? { adultSizeCm: f.adultSizeCm, bioloadFactor: f.bioloadFactor, qty: l.qty } : null;
      })
      .filter(Boolean) as { adultSizeCm: number; bioloadFactor: number; qty: number }[];
    const pct = calcBioloadPct({ fish: load, tankGal: tank.volumeGal, filterGph: undefined });
    const next: WarningItem[] = [];
    if (pct > 110) next.push({ level: 'BLOCK', code: 'BIOLOAD_HIGH', message: `Bioload ${pct.toFixed(0)}% exceeds capacity.` });
    else if (pct > 90) next.push({ level: 'WARN', code: 'BIOLOAD_NEAR_LIMIT', message: `Bioload ${pct.toFixed(0)}% near capacity.` });
    setWarnings(next);
  }, [tank?.volumeGal, livestock, fish, setWarnings]);

  function add(f: Fish) {
    if (livestock.some((l) => l.type === 'FISH' && l.id === f.id)) return;
    set('livestock', [...livestock, { type: 'FISH', id: f.id, qty: 1 }]);
    try { logEvent('add_to_build', { source: 'fish_list', itemType: 'FISH', id: f.id }); } catch {}
  }

  function setQty(id: string, qty: number) {
    set(
      'livestock',
      livestock.map((l) => (l.type === 'FISH' && l.id === id ? { ...l, qty } : l))
    );
    try { logEvent('update_qty', { source: 'fish_list', itemType: 'FISH', id, qty }); } catch {}
  }

  const filtered = fish; // server filtered
  const paged = fish; // server paged

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Fish</CardTitle>
        <div className="flex gap-2 items-center">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fish..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            <Chip active={minTank===10} onClick={() => { setMinTank(minTank===10?null:10); setPage(1); }}>10g+</Chip>
            <Chip active={minTank===20} onClick={() => { setMinTank(minTank===20?null:20); setPage(1); }}>20g+</Chip>
            <Chip active={minTank===40} onClick={() => { setMinTank(minTank===40?null:40); setPage(1); }}>40g+</Chip>
            <Chip active={minTank===75} onClick={() => { setMinTank(minTank===75?null:75); setPage(1); }}>75g+</Chip>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading fish…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {paged.map((f) => {
          const inBuild = livestock.find((l) => l.type === 'FISH' && l.id === f.id);
          return (
            <div key={f.id} className="border rounded-md p-3 flex items-center justify-between">
              <div>
                <a
                  href={`/species/fish/${f.id}`}
                  className="font-medium underline-offset-2 hover:underline"
                  onClick={() => { try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'species_detail_nav_click', props: { from: 'fish_list', id: f.id } })); } catch {} }}
                >
                  {f.commonName}
                </a>
                <div className="text-xs text-gray-600">
                  Size {f.adultSizeCm} cm • Min {f.minTankGal} gal • {f.temperament}
                </div>
                <div className="text-xs text-gray-500">{f.tempMinC}–{f.tempMaxC} °C • pH {f.phMin}–{f.phMax}</div>
              </div>
              {inBuild ? (
                <QuantityStepper value={inBuild.qty} onChange={(v) => setQty(f.id, v)} min={0} />
              ) : (
                <Button onClick={() => add(f)}>Add</Button>
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
