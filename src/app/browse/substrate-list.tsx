"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip, Skeleton, ListTile, Thumbnail } from '@aquabuilder/ui';
import Pagination from './pagination';
import AmazonBuyLink from './amazon-buy-link';
import RetailerBadge from './retailer-badge';
import { useBuildStore } from '../../lib/store';
import { logEvent } from '../../lib/analytics-client';
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
    try {
      const sp = new URLSearchParams(window.location.search);
      const p = Number(sp.get('page')||'1')||1; setPage(p);
      const q0 = sp.get('q'); if (q0) setQ(q0);
      const t0 = sp.get('substrateType') as any; if (t0 && (['SAND','GRAVEL','SOIL','BARE_BOTTOM'] as const).includes(t0)) setType(t0);
    } catch {}
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

  // Reflect filter state to URL
  useEffect(()=>{
    try {
      const sp = new URLSearchParams(window.location.search);
      sp.set('tab','substrate'); sp.set('page', String(page));
      if (dq) sp.set('q', dq); else sp.delete('q');
      if (type) sp.set('substrateType', type); else sp.delete('substrateType');
      window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`);
    } catch {}
  }, [dq, type, page]);

  const filtered = subs.filter((s) => {
    const text = `${s.type} ${s.color ?? ''}`.toLowerCase().includes(q.trim().toLowerCase());
    const match = type ? s.type === type : true;
    return text && match;
  });

  function choose(s: Substrate) {
    set('equipment', { ...equipment, substrate: s.id });
    try { logEvent('add_to_build', { source: 'substrate_list', itemType: 'SUBSTRATE', id: s.id }); } catch {}
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
          {(dq || type || page>1) && (
            <Button variant="secondary" onClick={()=>{ setQ(''); setType(null); setPage(1); }}>Clear</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {!subs.length && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-2xl p-3 shadow-sm">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-3 w-40 mb-3" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))
        )}
        {filtered.map((s) => (
          <ListTile
            key={s.id}
            active={equipment.substrate === s.id}
            title={<span onClick={() => { try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'detail_nav_click', props: { from: 'substrate_list', productType: 'SUBSTRATE', productId: s.id } })); } catch {} }}>{s.type}</span>}
            href={`/part/substrate/${s.id}`}
            leading={<Thumbnail src={null} alt={`${s.type}`} size={48} />}
            subtitle={<span>{s.color ?? '—'} {s.plantFriendly ? '• plant-friendly' : ''}</span>}
            meta={<RetailerBadge productType="SUBSTRATE" productId={s.id} />}
            actions={
              <>
                <AmazonBuyLink productType="SUBSTRATE" productId={s.id} />
                <Button onClick={() => choose(s)}>{equipment.substrate === s.id ? 'Selected' : 'Select'}</Button>
              </>
            }
          />
        ))}
        {total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} makeHref={(p)=> { const sp=new URLSearchParams(); sp.set('tab','substrate'); sp.set('page', String(p)); if(dq) sp.set('q', dq); if(type) sp.set('substrateType', type); return `/browse?${sp.toString()}`; }} />
        )}
      </CardContent>
    </Card>
  );
}
