"use client";
import { useState } from 'react';
import { FishList } from './fish-list';
import PlantsList from './plants-list';
import FiltersList from './filters-list';
import HeatersList from './heaters-list';
import LightsList from './lights-list';

const tabs = [
  { key: 'fish', label: 'Fish' },
  { key: 'plants', label: 'Plants' },
  { key: 'filters', label: 'Filters' },
  { key: 'heaters', label: 'Heaters' },
  { key: 'lights', label: 'Lights' },
];

export default function BrowseTabs() {
  const [active, setActive] = useState('fish');
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setActive(t.key)}
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
    </div>
  );
}

