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
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => go(t.key)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              active === t.key
                ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-700 border hover:shadow'
            }`}
          >
            {t.label}
          </button>
        ))}
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
