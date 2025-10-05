"use client";
import { useBuildStore } from '../../../lib/store';
import { Card, CardHeader, CardTitle, CardContent, Button, CompatibilityPanel, Input } from '@aquabuilder/ui';
import { useState, useEffect } from 'react';
import { calcBioloadPct, checkFishParams, beginnerFriendlyScore, recommendFilterGph, recommendHeaterWattage, computeMonthlyCost, computeFilterTurnoverStatus, computeHeaterStatus, computeLightCoverageStatus, computeWaterTypeConflicts, computePredationConflicts, computeAggressionTerritoryRules, computeSchoolingWarnings, recommendLightCoverage } from '@aquabuilder/core';
import TankPicker from '../tank-picker';
import { ScoreBadge } from '@aquabuilder/ui';
import { showToast } from '@aquabuilder/ui';
import { getLatestPriceCents } from '../../../lib/price';
import { logEventClient } from '../../../lib/analytics-client';

export default function NewBuildPage() {
  const { buildType, set, warnings, setWarnings, tank, livestock, equipment } = useBuildStore();
  const [gal, setGal] = useState<string>(tank?.volumeGal?.toString() ?? '');

  useEffect(() => {
    async function recompute() {
      async function fetchJson<T>(url: string, fallback: T): Promise<T> {
        try {
          const r = await fetch(url, { cache: 'no-store' });
          if (!r.ok) return fallback;
          const txt = await r.text();
          if (!txt) return fallback;
          return JSON.parse(txt) as T;
        } catch {
          return fallback;
        }
      }

      const fishList = await fetchJson<Array<{ id: string; tempMinC: number; tempMaxC: number; phMin: number; phMax: number; adultSizeCm: number; bioloadFactor: number; schoolingMin?: number | null; waterType?: 'FRESH'|'BRACKISH'|'SALT'; temperament?: 'PEACEFUL'|'SEMI_AGGRESSIVE'|'AGGRESSIVE'; diet?: 'CARNIVORE'|'OMNIVORE'|'HERBIVORE' }>>(
        '/api/parts/fish',
        []
      );
      type FilterLite = { id: string; gph?: number };
      type HeaterLite = { id: string; wattage?: number };
      type LightLite = { id: string; coverageCm?: number };
      const [filters, heaters, lights] = await Promise.all([
        fetchJson<FilterLite[]>('/api/parts/filters', []),
        fetchJson<HeaterLite[]>('/api/parts/heaters', []),
        fetchJson<LightLite[]>('/api/parts/lights', []),
      ]);
      const fishLoad = livestock
        .filter((l) => l.type === 'FISH' && l.qty > 0)
        .map((l) => {
          const f = fishList.find((x) => x.id === l.id);
          return f ? { adultSizeCm: f.adultSizeCm, bioloadFactor: f.bioloadFactor, qty: l.qty } : null;
        })
        .filter(Boolean) as { adultSizeCm: number; bioloadFactor: number; qty: number }[];

      const items: typeof warnings = [];
      if (tank?.volumeGal && fishLoad.length) {
        const pct = calcBioloadPct({ fish: fishLoad, tankGal: tank.volumeGal });
        if (pct > 110) items.push({ level: 'BLOCK', code: 'BIOLOAD_HIGH', message: `Bioload ${pct.toFixed(0)}% exceeds capacity.` });
        else if (pct > 90) items.push({ level: 'WARN', code: 'BIOLOAD_NEAR_LIMIT', message: `Bioload ${pct.toFixed(0)}% near capacity.` });
      }

      // Schooling (core)
      {
        const selections = livestock.filter(l=>l.type==='FISH').map(l=>({ id:l.id, qty:l.qty }));
        const school = computeSchoolingWarnings({ selections, catalog: fishList as Array<{ id:string; schoolingMin?:number|null; commonName?:string }> });
        items.push(...school);
      }

      // Parameter overlap across fish
      const params = livestock
        .filter((l) => l.type === 'FISH' && l.qty > 0)
        .map((l) => fishList.find((x) => x.id === l.id))
        .filter(Boolean) as Array<{ tempMinC: number; tempMaxC: number; phMin: number; phMax: number }>;
      if (params.length > 1) {
        const res = checkFishParams(params);
        if (!res.ok) {
          items.push({ level: 'BLOCK', code: 'PARAM_CONFLICT', message: `Temp ${res.temp[0]}–${res.temp[1]}C / pH ${res.ph[0]}–${res.ph[1]} no overlap.` });
        }
      }

      // Water-type and behavior
      if (buildType) {
        type FishSel = { id:string; waterType?: 'FRESH'|'BRACKISH'|'SALT'; temperament?: 'PEACEFUL'|'SEMI_AGGRESSIVE'|'AGGRESSIVE'; diet?: 'CARNIVORE'|'OMNIVORE'|'HERBIVORE'; adultSizeCm?: number };
        const fishSel = livestock.filter(l=>l.type==='FISH' && l.qty>0).map(l=> fishList.find(x=>x.id===l.id)).filter(Boolean) as FishSel[];
        items.push(...computeWaterTypeConflicts({ buildType, species: fishSel }));
        items.push(...computePredationConflicts({ fish: fishSel.map(f=>({ id: f.id, diet: f.diet, adultSizeCm: f.adultSizeCm })), inverts: [] }));
        items.push(...computeAggressionTerritoryRules({ fish: fishSel.map(f=>({ id: f.id, temperament: f.temperament })), tankGal: tank?.volumeGal }));
      }

      // Equipment compatibility
      if (tank?.volumeGal) {
        if (equipment.filter) {
          const f = filters.find((x) => x.id === equipment.filter);
          if (f?.gph) {
            const issue = computeFilterTurnoverStatus({ gph: f.gph, tankGal: tank.volumeGal });
            if (issue) items.push(issue);
          }
        }
        if (equipment.heater) {
          const h = heaters.find((x) => x.id === equipment.heater);
          if (h?.wattage) {
            const issue = computeHeaterStatus({ wattage: h.wattage, tankGal: tank.volumeGal });
            if (issue) items.push(issue);
          }
        }
        if (equipment.light && tank.lengthCm) {
          const l = lights.find((x) => x.id === equipment.light);
          if (l?.coverageCm) {
            const issue = computeLightCoverageStatus({ coverageCm: l.coverageCm, tankLengthCm: tank.lengthCm });
            if (issue) items.push(issue);
          }
        }
      }

      setWarnings(items);
    }
    recompute();
  }, [tank?.volumeGal, tank?.lengthCm, livestock, equipment, buildType, setWarnings]);

  // Build type currently unused in warnings; keeping for future steps

  return (
    <div className="max-w-5xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Build Wizard</h1>
        <ScoreBadge score={beginnerFriendlyScore(warnings)} />
      </div>
      <div className="grid md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Step 1: Select Build Type</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Button onClick={() => set('buildType', 'FRESH_COMMUNITY')}>Fresh Community</Button>
              <Button variant="secondary" onClick={() => set('buildType', 'FRESH_PLANTED')}>Planted</Button>
              <Button variant="secondary" onClick={() => set('buildType', 'REEF')}>Reef</Button>
              <div className="mt-4">
                <TankPicker />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Tank</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-700">Gallons</label>
                <Input
                  value={gal}
                  onChange={(e) => setGal(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(gal);
                    if (!isNaN(v)) set('tank', { volumeGal: v });
                  }}
                  className="w-28"
                  placeholder="e.g., 20"
                  inputMode="decimal"
                />
                <Button variant="secondary" onClick={() => set('tank', { volumeGal: parseFloat(gal) || undefined })}>Apply</Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Step 3: Livestock</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">Add fish from the Browse page; quantities will appear here.</p>
              <ul className="mt-2 space-y-1">
                {livestock.filter((l) => l.type === 'FISH' && l.qty > 0).map((l) => (
                  <li key={l.id} className="text-sm">{l.id} × {l.qty}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Step 5: Review & Share</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button onClick={async ()=>{
                  try{
                    const res = await fetch('/api/builds',{method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ name: 'My Build', buildType: buildType ?? 'FRESH_COMMUNITY', components: { tank, equipment, livestock } })});
                    const data = await res.json();
                    if(res.ok && data.id){
                      const url = `${window.location.origin}/build/${data.id}`;
                      await navigator.clipboard.writeText(url);
                      showToast('Link copied to clipboard');
                      logEventClient('build_share_copied', { id: data.id });
                    } else {
                      showToast('Failed to save build');
                    }
                  }catch{ showToast('Failed to save build'); }
                }}>Save & Copy Link</Button>
                <Button variant="secondary" onClick={async()=>{
                  try{
                    const { serializeBuildState } = await import('../../../lib/sharing');
                    const state = serializeBuildState({ tank, equipment, livestock, buildType });
                    const url = `${window.location.origin}/build/new?state=${state}`;
                    await navigator.clipboard.writeText(url);
                    showToast('Draft link copied');
                  } catch { showToast('Failed to copy draft link'); }
                }}>Copy Draft Link</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compatibility</CardTitle>
            </CardHeader>
            <CardContent>
              <CompatibilityPanel items={warnings} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Equipment Guidance</CardTitle>
            </CardHeader>
            <CardContent>
              {!tank?.volumeGal ? (
                <div className="text-sm text-gray-600">Set tank gallons to see recommendations.</div>
              ) : (
                <div className="space-y-2 text-sm">
                  <div>
                    <div className="text-gray-600">Filter turnover</div>
                    {(() => { const r = recommendFilterGph(tank.volumeGal); return (
                      <div>Recommended: 4–6× &middot; For {tank.volumeGal} gal, {r.minGph}–{r.maxGph} gph</div>
                    ); })()}
                  </div>
                  <div>
                    <div className="text-gray-600">Heater wattage</div>
                    {(() => { const r = recommendHeaterWattage(tank.volumeGal); return (
                      <div>Recommended: 3–5 W/gal &middot; For {tank.volumeGal} gal, {r.minW}–{r.maxW} W</div>
                    ); })()}
                  </div>
                  {!!tank.lengthCm && (
                    <div>
                      <div className="text-gray-600">Light coverage</div>
                      {(() => { const r = recommendLightCoverage({ tankLengthCm: tank.lengthCm! }); return (
                        <div>Recommended: cover at least {r.coverageMinCm} cm of tank length</div>
                      ); })()}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Cost Estimates</CardTitle>
            </CardHeader>
            <CardContent>
              {!tank?.volumeGal ? (
                <div className="text-sm text-gray-600">Set tank gallons to estimate monthly energy cost.</div>
              ) : (
                (() => { const est = computeMonthlyCost({ tankGal: tank.volumeGal! }); return (
                  <div className="space-y-1 text-sm">
                    <div>Estimated monthly energy: ${est.cost.toFixed(2)} (≈ {est.kwh.toFixed(1)} kWh @ $0.15/kWh)</div>
                    <InitialCost equipment={equipment} />
                  </div>
                ); })()
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

  function InitialCost({ equipment }:{ equipment: { filter?: string; heater?: string; light?: string; substrate?: string; extras: string[] } }){
    const [costCents, setCostCents] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const extrasKey = equipment.extras.join(',');
    useEffect(()=>{
      (async ()=>{
        setLoading(true);
        try{
          const res = await fetch('/api/costs/initial', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ equipment }) });
          if (!res.ok){ setCostCents(0); return; }
          const data = await res.json();
          setCostCents(typeof data?.priceCents === 'number' ? data.priceCents : 0);
        } catch {
          setCostCents(0);
        } finally {
          setLoading(false);
        }
      })();
    }, [equipment.filter, equipment.heater, equipment.light, equipment.substrate, extrasKey]);
    if (loading || costCents == null) return <div className="text-xs text-gray-500">Calculating initial cost…</div>;
    return <div className="text-xs text-gray-700">Initial equipment cost: ${ (costCents/100).toFixed(2) }</div>;
  }
