"use client";
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@aquabuilder/ui';
import { showToast } from '@aquabuilder/ui';

type Option = { id: string; label: string; productType: string };

export default function AdminPricesPage() {
  const [options, setOptions] = useState<Option[]>([]);
  const [productId, setProductId] = useState('');
  const [productType, setProductType] = useState('FILTER');
  const [retailer, setRetailer] = useState('DemoRetailer');
  const [price, setPrice] = useState('');

  useEffect(() => {
    (async () => {
      const data: Option[] = [];
      async function add(type: string, url: string) {
        try {
          const r = await fetch(url, { cache: 'no-store' });
          const txt = await r.text();
          const arr: Array<{ id: string; brand?: string; model?: string; commonName?: string }> = txt ? JSON.parse(txt) : [];
          arr.forEach((x) => data.push({ id: x.id, label: `${x.brand ?? ''} ${x.model ?? x.commonName ?? x.id}`.trim(), productType: type }));
        } catch {}
      }
      await add('FILTER', '/api/parts/filters');
      await add('HEATER', '/api/parts/heaters');
      await add('LIGHT', '/api/parts/lights');
      setOptions(data);
    })();
  }, []);

  async function save() {
    try {
      const cents = Math.round(parseFloat(price) * 100);
      const res = await fetch('/api/admin/prices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productType, productId, retailer, priceCents: cents })
      });
      if (res.ok) showToast('Price saved'); else showToast('Failed to save price');
    } catch { showToast('Failed to save price'); }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin • Prices</h1>
      <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
        <CardHeader><CardTitle>Add/Update Price</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-gray-600">Product Type</div>
            <select className="border rounded-md px-2 py-2 w-full" value={productType} onChange={(e)=>setProductType(e.target.value)}>
              {['FILTER','HEATER','LIGHT'].map((t)=>(<option key={t} value={t}>{t}</option>))}
            </select>
          </div>
          <div>
            <div className="text-gray-600">Product</div>
            <select className="border rounded-md px-2 py-2 w-full" value={productId} onChange={(e)=>setProductId(e.target.value)}>
              <option value="">Select…</option>
              {options.filter((o)=>o.productType===productType).map((o)=>(<option key={o.id} value={o.id}>{o.label} ({o.id})</option>))}
            </select>
          </div>
          <div>
            <div className="text-gray-600">Retailer</div>
            <Input value={retailer} onChange={(e)=>setRetailer(e.target.value)} />
          </div>
          <div>
            <div className="text-gray-600">Price (USD)</div>
            <Input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="e.g., 39.99" inputMode="decimal" />
          </div>
          <div className="sm:col-span-2 flex justify-end pt-2">
            <Button onClick={save} disabled={!productId || !price}>Save Price</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
