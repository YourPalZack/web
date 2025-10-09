"use client";
import { useEffect, useState } from 'react';
import { Card, CardContent, Input, Button } from '@aquabuilder/ui';
import { useBuildStore } from '../../lib/store';

type Tank = { id: string; model?: string; volumeGal: number; lengthCm: number; widthCm: number; heightCm: number };

export default function TankPicker() {
  const { tank, set } = useBuildStore();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/parts/tanks', { cache: 'no-store' });
        const txt = await r.text();
        setTanks(txt ? JSON.parse(txt) : []);
      } catch {
        setTanks([]);
      }
    })();
  }, []);

  const filtered = tanks.filter((t) => (t.model ?? '').toLowerCase().includes(q.trim().toLowerCase()));

  function choose(t: Tank) {
    set('tank', { id: t.id, volumeGal: t.volumeGal, lengthCm: t.lengthCm, widthCm: t.widthCm, heightCm: t.heightCm });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search tanks..." className="w-48" />
        {tank?.volumeGal && <div className="text-sm text-gray-600">Selected: {tank.volumeGal} gal</div>}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {filtered.map((t) => (
          <Card key={t.id} className={`border rounded-2xl ${tank?.id === t.id ? 'ring-2 ring-green-400' : ''}`}>
            <CardContent className="p-3 flex items-center justify-between">
              <div>
                <div className="font-medium">{t.model ?? t.id}</div>
                <div className="text-xs text-gray-600">{t.volumeGal} gal • {t.lengthCm}×{t.widthCm}×{t.heightCm} cm</div>
              </div>
              <Button onClick={() => choose(t)}>{tank?.id === t.id ? 'Selected' : 'Select'}</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
