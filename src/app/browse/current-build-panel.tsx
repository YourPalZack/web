"use client";
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';
import { useRouter } from 'next/navigation';

export default function CurrentBuildPanel() {
  const router = useRouter();
  const { buildType, tank, equipment, livestock } = useBuildStore();
  const [name, setName] = useState('My Aqua Build');
  const fish = livestock.filter((l) => l.type === 'FISH' && l.qty > 0);
  const plants = livestock.filter((l) => l.type === 'PLANT' && l.qty > 0);

  async function save() {
    try {
      const res = await fetch('/api/builds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          buildType: buildType ?? 'FRESH_COMMUNITY',
          components: { tank, equipment, livestock },
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        router.push(`/build/${data.id}`);
      } else {
        alert('Failed to save build');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save build');
    }
  }

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader>
        <CardTitle>Current Build</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <div className="text-gray-600">Type</div>
          <div className="font-medium">{buildType ?? 'Not set'}</div>
        </div>
        <div className="text-sm">
          <div className="text-gray-600">Tank</div>
          <div className="font-medium">{tank?.volumeGal ? `${tank.volumeGal} gal` : 'Not set'}</div>
        </div>
        <div className="text-sm">
          <div className="text-gray-600">Equipment</div>
          <div className="font-medium break-words">
            {equipment.filter || equipment.heater || equipment.light ? (
              <>
                {equipment.filter && <div>Filter: {equipment.filter}</div>}
                {equipment.heater && <div>Heater: {equipment.heater}</div>}
                {equipment.light && <div>Light: {equipment.light}</div>}
              </>
            ) : (
              'None'
            )}
          </div>
        </div>
        <div className="text-sm">
          <div className="text-gray-600">Livestock</div>
          <ul className="font-medium space-y-1">
            {fish.map((f) => (
              <li key={f.id}>FISH: {f.id} × {f.qty}</li>
            ))}
            {plants.map((p) => (
              <li key={p.id}>PLANT: {p.id} × {p.qty}</li>
            ))}
            {fish.length + plants.length === 0 && <li>None</li>}
          </ul>
        </div>
        <div className="pt-2 border-t" />
        <div className="space-y-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Build name" />
          <Button onClick={save} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500">Save & Share</Button>
        </div>
      </CardContent>
    </Card>
  );
}
