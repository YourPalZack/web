"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Substrate = { id: string; type: 'SAND'|'GRAVEL'|'SOIL'|'BARE_BOTTOM'; plantFriendly?: boolean; color?: string };

export default function SubstrateList() {
  const [subs, setSubs] = useState<Substrate[]>([]);
  const [q, setQ] = useState('');
  const [type, setType] = useState<Substrate['type'] | null>(null);
  const { equipment, set } = useBuildStore();

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/substrate', { cache: 'no-store' });
        const txt = await r.text();
        setSubs(txt ? JSON.parse(txt) : []);
      } catch { setSubs([]); }
    })();
  }, []);

  const filtered = subs.filter((s) => {
    const text = `${s.type} ${s.color ?? ''}`.toLowerCase().includes(q.trim().toLowerCase());
    const match = type ? s.type === type : true;
    return text && match;
  });

  function choose(s: Substrate) {
    set('equipment', { ...equipment, substrate: s.id });
  }

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Substrate</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search substrate..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {(['SAND','GRAVEL','SOIL','BARE_BOTTOM'] as const).map((t) => (
              <Chip key={t} active={type===t} onClick={() => setType(type===t?null:t)}>{t}</Chip>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {filtered.map((s) => (
          <div key={s.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.substrate === s.id ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{s.type}</div>
            <div className="text-xs text-gray-600">{s.color ?? '—'} {s.plantFriendly ? '• plant-friendly' : ''}</div>
            <div className="mt-2 flex justify-end"><Button onClick={() => choose(s)}>{equipment.substrate === s.id ? 'Selected' : 'Select'}</Button></div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

