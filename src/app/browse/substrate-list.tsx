"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import Pagination from './pagination';
import AmazonPopular from './amazon-popular';
import AmazonBuyLink from './amazon-buy-link';
import { useBuildStore } from '../../lib/store';
import { recommendSubstrate } from '@aquabuilder/core';

type Substrate = { id: string; type: 'SAND'|'GRAVEL'|'SOIL'|'BARE_BOTTOM'; plantFriendly?: boolean; color?: string };

export default function SubstrateList() {
  const [subs, setSubs] = useState<Substrate[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [type, setType] = useState<Substrate['type'] | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { equipment, set } = useBuildStore();
  const { buildType } = useBuildStore.getState();

  useEffect(()=>{ const t = setTimeout(()=> setDq(q), 200); return ()=> clearTimeout(t); }, [q]);
  useEffect(() => {
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        params.set('count', '1');
        if (dq) params.set('q', dq);
        const r = await fetch(`/api/parts/substrate?${params.toString()}`, { cache: 'no-store' });
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) { setSubs(data); setTotal(data.length); }
        else { setSubs(data.items ?? []); setTotal(data.total ?? 0); }
      } catch { setSubs([]); setTotal(0); }
    })();
  }, [dq, page]);

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
          {buildType && (
            <span className="text-xs text-gray-500">
              Recommended for {buildType}: {recommendSubstrate({ buildType }).join(', ')}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {filtered.map((s) => (
          <div key={s.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.substrate === s.id ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{s.type}</div>
            <div className="text-xs text-gray-600">{s.color ?? '—'} {s.plantFriendly ? '• plant-friendly' : ''}</div>
            <div className="mt-2 flex justify-between items-center">
              <AmazonBuyLink productType="SUBSTRATE" productId={s.id} />
              <Button onClick={() => choose(s)}>{equipment.substrate === s.id ? 'Selected' : 'Select'}</Button>
            </div>
          </div>
        ))}
        {total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} />
        )}
        <AmazonPopular category="substrate" />
      </CardContent>
    </Card>
  );
}
