"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip, Skeleton, EmptyState, ListTile, Thumbnail } from '@aquabuilder/ui';
import Pagination from './pagination';
import { useBuildStore } from '../../lib/store';
import { logEvent } from '../../lib/analytics-client';
import AmazonBuyLink from './amazon-buy-link';
import RetailerBadge from './retailer-badge';

type Extra = { id: string; category: string; brand?: string; model?: string };

export default function ExtrasList() {
  const [items, setItems] = useState<Extra[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [q, setQ] = useState('');
  const [dq, setDq] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 6;
  const { equipment, set } = useBuildStore();
  const [category, setCategory] = useState<string | null>(null);
  const categories = ['Protein Skimmer', 'CO2 Kit'];

  useEffect(()=>{ const t = setTimeout(()=> setDq(q), 200); return ()=> clearTimeout(t); }, [q]);
  useEffect(() => {
    try { const sp = new URLSearchParams(window.location.search); const p = Number(sp.get('page')||'1')||1; setPage(p); const q0=sp.get('q'); if(q0) setQ(q0); const c0=sp.get('category'); if(c0) setCategory(c0); } catch {}
    (async () => {
      try {
        const params = new URLSearchParams();
        params.set('page', String(page));
        params.set('pageSize', String(pageSize));
        params.set('count', '1');
        if (dq) params.set('q', dq);
        if (category) params.set('category', category);
        const r = await fetch(`/api/parts/equipment?${params.toString()}`, { cache: 'no-store' });
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) { setItems(data); setTotal(data.length); }
        else { setItems(data.items ?? []); setTotal(data.total ?? 0); }
      } catch { setItems([]); setTotal(0); }
    })();
  }, [dq, page, category]);

  useEffect(()=>{
    try{ const sp=new URLSearchParams(window.location.search); sp.set('tab','extras'); sp.set('page', String(page)); if(dq) sp.set('q', dq); else sp.delete('q'); if(category) sp.set('category', category); else sp.delete('category'); window.history.replaceState({}, '', `${window.location.pathname}?${sp.toString()}`);}catch{}
  }, [dq, category, page]);

  function toggle(id: string) {
    const exists = equipment.extras.includes(id);
    const extras = exists ? equipment.extras.filter((x) => x !== id) : [...equipment.extras, id];
    set('equipment', { ...equipment, extras });
    try { logEvent('add_to_build', { source: 'extras_list', itemType: 'EQUIPMENT', id, action: exists ? 'remove' : 'add' }); } catch {}
  }

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Extras</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search extras..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {categories.map((c) => {
              const next = category===c ? null : c;
              const sp = new URLSearchParams(); sp.set('tab','extras'); sp.set('page','1'); if(dq) sp.set('q', dq); if(next) sp.set('category', next);
              return (
                <a key={c} href={`/browse?${sp.toString()}`}>
                  <Chip active={category===c}>{c}</Chip>
                </a>
              );
            })}
          </div>
          {(dq || category || page>1) && (
            <Button variant="secondary" onClick={()=>{ setQ(''); setCategory(null); setPage(1); }}>Clear</Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {items.length === 0 && (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border rounded-2xl p-3 shadow-sm">
              <Skeleton className="h-4 w-28 mb-2" />
              <Skeleton className="h-3 w-40 mb-3" />
              <div className="flex justify-between items-center">
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))
        )}
        {items.length === 0 && !dq && (
          <div className="sm:col-span-2"><EmptyState title="No extras yet" description="Try a different category or search term." /></div>
        )}
        {items.map((e) => (
          <ListTile
            key={e.id}
            active={equipment.extras.includes(e.id)}
            title={<span onClick={() => { try { (window as any).navigator?.sendBeacon?.('/api/analytics', JSON.stringify({ name: 'detail_nav_click', props: { from: 'equipment_list', productType: 'EQUIPMENT', productId: e.id } })); } catch {} }}>{e.category}</span>}
            href={`/part/equipment/${e.id}`}
            leading={<Thumbnail src={null} alt={`${e.category}`} size={48} />}
            subtitle={<span>{e.brand ?? '—'} {e.model ?? ''}</span>}
            meta={<RetailerBadge productType="EQUIPMENT" productId={e.id} />}
            actions={
              <>
                <AmazonBuyLink productType="EQUIPMENT" productId={e.id} />
                <Button onClick={() => toggle(e.id)}>{equipment.extras.includes(e.id) ? 'Remove' : 'Add'}</Button>
              </>
            }
          />
        ))}
        {total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} makeHref={(p)=> { const sp=new URLSearchParams(); sp.set('tab','extras'); sp.set('page', String(p)); if(dq) sp.set('q', dq); if(category) sp.set('category', category); return `/browse?${sp.toString()}`; }} />
        )}
      </CardContent>
    </Card>
  );
}
