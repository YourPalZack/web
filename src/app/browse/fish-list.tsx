"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, QuantityStepper } from '@aquabuilder/ui';
import { calcBioloadPct } from '@aquabuilder/core';
import { useBuildStore, type WarningItem } from '../../lib/store';

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
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tank, livestock, set, setWarnings } = useBuildStore();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/fish', { cache: 'no-store' });
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        const txt = await r.text();
        setFish(txt ? JSON.parse(txt) : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load');
        setFish([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
  }

  function setQty(id: string, qty: number) {
    set(
      'livestock',
      livestock.map((l) => (l.type === 'FISH' && l.id === id ? { ...l, qty } : l))
    );
  }

  const filtered = useMemo(
    () => fish.filter((f) => f.commonName.toLowerCase().includes(q.trim().toLowerCase())),
    [fish, q]
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle>Fish</CardTitle>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search fish..." className="w-48" />
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {loading && <div className="text-sm text-gray-600">Loading fish…</div>}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-sm text-gray-600">No results</div>
        )}
        {error && <div className="text-sm text-red-600">{error}</div>}
        {filtered.map((f) => {
          const inBuild = livestock.find((l) => l.type === 'FISH' && l.id === f.id);
          return (
            <div key={f.id} className="border rounded-md p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{f.commonName}</div>
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
      </CardContent>
    </Card>
  );
}
