"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Extra = { id: string; category: string; brand?: string; model?: string };

export default function ExtrasList() {
  const [items, setItems] = useState<Extra[]>([]);
  const [q, setQ] = useState('');
  const { equipment, set } = useBuildStore();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/equipment', { cache: 'no-store' });
        const txt = await r.text();
        setItems(txt ? JSON.parse(txt) : []);
      } catch { setItems([]); }
    })();
  }, []);

  const filtered = items.filter((e) => `${e.category} ${e.brand ?? ''} ${e.model ?? ''}`.toLowerCase().includes(q.trim().toLowerCase()));

  function toggle(id: string) {
    const exists = equipment.extras.includes(id);
    const extras = exists ? equipment.extras.filter((x) => x !== id) : [...equipment.extras, id];
    set('equipment', { ...equipment, extras });
  }

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>Extras</CardTitle>
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search extras..." className="w-48" />
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {filtered.map((e) => (
          <div key={e.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.extras.includes(e.id) ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{e.category}</div>
            <div className="text-xs text-gray-600">{e.brand ?? '—'} {e.model ?? ''}</div>
            <div className="mt-2 flex justify-end"><Button onClick={() => toggle(e.id)}>{equipment.extras.includes(e.id) ? 'Remove' : 'Add'}</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

