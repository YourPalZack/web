"use client";
import { useEffect, useState } from 'react';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, Chip } from '@aquabuilder/ui';
import Pagination from './pagination';
import { useBuildStore } from '../../lib/store';
import AmazonBuyLink from './amazon-buy-link';
import AmazonPopular from './amazon-popular';

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

  function toggle(id: string) {
    const exists = equipment.extras.includes(id);
    const extras = exists ? equipment.extras.filter((x) => x !== id) : [...equipment.extras, id];
    set('equipment', { ...equipment, extras });
  }

  return (
    <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Extras</CardTitle>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search extras..." className="w-48" />
          <div className="hidden sm:flex items-center gap-2">
            {categories.map((c) => (
              <Chip key={c} active={category===c} onClick={() => { setCategory(category===c?null:c); setPage(1); }}>{c}</Chip>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-3">
        {items.map((e) => (
          <div key={e.id} className={`border rounded-2xl p-3 shadow-sm ${equipment.extras.includes(e.id) ? 'ring-2 ring-blue-400' : ''}`}>
            <div className="font-medium">{e.category}</div>
            <div className="text-xs text-gray-600">{e.brand ?? '—'} {e.model ?? ''}</div>
            <div className="mt-2 flex justify-between items-center">
              <AmazonBuyLink productType="EQUIPMENT" productId={e.id} />
              <Button onClick={() => toggle(e.id)}>{equipment.extras.includes(e.id) ? 'Remove' : 'Add'}</Button>
            </div>
          </div>
        ))}
        {total > pageSize && (
          <Pagination page={page} total={total} pageSize={pageSize} onPage={setPage} />
        )}
        <AmazonPopular category="equipment" />
      </CardContent>
    </Card>
  );
}
