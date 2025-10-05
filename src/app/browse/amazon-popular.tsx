"use client";
import { useEffect, useState } from 'react';

type Item = { asin: string; title?: string; priceCents?: number; url?: string; image?: string };

export default function AmazonPopular({ category, limit=4 }:{ category: 'filters'|'heaters'|'lights'|'substrate'|'equipment'; limit?: number }){
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(()=>{
    (async()=>{
      try{
        const r = await fetch(`/api/amazon/popular?category=${category}&limit=${limit}`, { cache: 'no-store' });
        const txt = await r.text();
        const data = txt ? JSON.parse(txt) : [];
        if (Array.isArray(data)) setItems(data);
      } catch (e: unknown) { setError(e instanceof Error ? e.message : ''); }
    })();
  }, [category, limit]);
  if (!items.length) return null;
  return (
    <div className="col-span-full mt-2">
      <div className="text-xs text-gray-600 mb-2">Popular on Amazon</div>
      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((it)=> (
          <a key={it.asin} href={it.url} target="_blank" rel="noopener noreferrer" className="border rounded-2xl p-3 flex gap-3 items-center hover:shadow">
            {it.image && <img src={it.image} alt={it.title ?? it.asin} className="w-16 h-16 object-contain" />}
            <div className="min-w-0">
              <div className="text-sm truncate">{it.title ?? it.asin}</div>
              <div className="text-xs text-gray-600">{typeof it.priceCents==='number' ? `$${(it.priceCents/100).toFixed(2)}` : 'View price'}</div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

