"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FishList } from './fish-list';
import PlantsList from './plants-list';
import FiltersList from './filters-list';
import HeatersList from './heaters-list';
import LightsList from './lights-list';
import SubstrateList from './substrate-list';
import ExtrasList from './extras-list';

const tabs = [
  { key: 'fish', label: 'Fish' },
  { key: 'plants', label: 'Plants' },
  { key: 'filters', label: 'Filters' },
  { key: 'heaters', label: 'Heaters' },
  { key: 'lights', label: 'Lights' },
  { key: 'substrate', label: 'Substrate' },
  { key: 'extras', label: 'Extras' },
];

export default function BrowseTabs() {
  const search = useSearchParams();
  const router = useRouter();
  const tabParam = search.get('tab') ?? 'fish';
  const [active, setActive] = useState(tabParam);
  useEffect(()=>{ setActive(tabParam); }, [tabParam]);
  function go(tab: string){
    const params = new URLSearchParams(Array.from(search.entries()));
    params.set('tab', tab);
    router.replace(`/browse?${params.toString()}`);
    try {
      (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'browse_tab_click', props: { tab } }));
    } catch {}
  }
  function clearAll(){
    const params = new URLSearchParams();
    if (active !== 'fish') params.set('tab', active);
    // Reset page and known filter keys
    const drop = ['page','q','type','bucket','intensity','substrateType','category','light','difficulty','co2','minTank'];
    drop.forEach(k => params.delete(k));
    const href = `/browse${params.toString() ? `?${params.toString()}` : ''}`;
    router.replace(href);
    try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'browse_clear_filters', props: { tab: active } })); } catch {}
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => go(t.key)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              active === t.key
                ? 'bg-gradient-to-r from-green-600 to-emerald-500 text-white shadow-lg shadow-green-200'
                : 'bg-white text-gray-700 border hover:shadow'
            }`}
          >
            {t.label}
          </button>
        ))}
        </div>
        <button
          onClick={clearAll}
          className="px-3 py-1.5 rounded-md border text-sm text-gray-700 hover:shadow"
          aria-label="Clear all filters"
        >
          Clear Filters
        </button>
      </div>
      {active === 'fish' && <FishList />}
      {active === 'plants' && <PlantsList />}
      {active === 'filters' && <FiltersList />}
      {active === 'heaters' && <HeatersList />}
      {active === 'lights' && <LightsList />}
      {active === 'substrate' && <SubstrateList />}
      {active === 'extras' && <ExtrasList />}
    </div>
  );
}
