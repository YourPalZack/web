"use client";
import { useState } from 'react';
import { Input, Button } from '@aquabuilder/ui';
import { showToast } from '@aquabuilder/ui';
import { logEvent } from '../../../../lib/analytics-client';

export default function PriceAlert({ productType, productId }:{ productType: string; productId: string }){
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  async function create(){
    const n = parseFloat(price);
    if (isNaN(n) || n <= 0) { showToast('Enter a valid price'); return; }
    setLoading(true);
    try{
      const res = await fetch('/api/alerts', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ userId: 'anon', productType, productId, targetCents: Math.round(n*100) }) });
      if (res.ok) { showToast('Alert created'); try{ logEvent('price_alert_created', { productType, productId, target: n }); }catch{} }
      else showToast('Failed to create alert');
    }catch{ showToast('Failed to create alert'); }
    finally{ setLoading(false); }
  }
  return (
    <div className="border rounded p-2 text-sm flex items-center gap-2">
      <span className="text-gray-600">Alert me if price ≤</span>
      <div className="flex items-center gap-1">
        <span>$</span>
        <Input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="39.99" inputMode="decimal" className="w-24" />
      </div>
      <Button size="sm" onClick={create} disabled={loading}>Create Alert</Button>
    </div>
  );
}

