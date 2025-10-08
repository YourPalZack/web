"use client";
import { useEffect, useState } from 'react';

type Row = { retailer: string; priceCents: number; timestamp: string };

export default function RetailerBadge({ productType, productId }:{ productType: string; productId: string }){
  const [row, setRow] = useState<Row | null>(null);
  useEffect(()=>{
    (async()=>{
      try {
        const res = await fetch(`/api/prices/${productType}/${productId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const arr = (await res.json()) as Row[];
        if (Array.isArray(arr) && arr.length) setRow(arr[arr.length - 1]);
      } catch {}
    })();
  }, [productType, productId]);
  if (!row) return null;
  return (
    <div className="text-[11px] text-gray-600 inline-flex items-center gap-1" title={new Date(row.timestamp).toLocaleString()}>
      <img src={retailerFavicon(row.retailer)} alt={row.retailer} className="w-3 h-3" />
      <span>Latest: ${ (row.priceCents/100).toFixed(2) } via {row.retailer}</span>
    </div>
  );
}

function retailerFavicon(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('amazon')) return 'https://www.amazon.com/favicon.ico';
  if (lower.includes('chewy')) return 'https://www.chewy.com/favicon.ico';
  if (lower.includes('petco')) return 'https://www.petco.com/favicon.ico';
  if (lower.includes('bulk reef') || lower.includes('brs') || lower.includes('bulkreefsupply')) return 'https://www.bulkreefsupply.com/favicon.ico';
  return '/globe.svg';
}

