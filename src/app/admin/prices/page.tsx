"use client";
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@aquabuilder/ui';
import { showToast } from '@aquabuilder/ui';
import { signOut } from 'next-auth/react';

type Option = { id: string; label: string; productType: string };

export default function AdminPricesPage() {
  const [options, setOptions] = useState<Option[]>([]);
  const [productId, setProductId] = useState('');
  const [productType, setProductType] = useState('FILTER');
  const [retailer, setRetailer] = useState('Amazon');
  const [price, setPrice] = useState('');
  const [url, setUrl] = useState('');
  const [asin, setAsin] = useState('');
  const [rows, setRows] = useState<Array<{ retailer: string; priceCents: number; timestamp: string }>>([]);
  const [admin, setAdmin] = useState<boolean>(false);

  useEffect(() => {
    (async () => {
      try{
        const r = await fetch('/api/auth/status', { cache: 'no-store' });
        const s = await r.json();
        setAdmin(!!s?.admin);
      } catch {}
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

  useEffect(() => {
    (async () => {
      if (!productId) { setAsin(''); return; }
      try {
        const u = new URL('/api/admin/amazon/link', window.location.origin);
        u.searchParams.set('productType', productType);
        u.searchParams.set('productId', productId);
        const r = await fetch(u.toString().replace(window.location.origin, ''), { cache: 'no-store' });
        if (r.ok) {
          const data = await r.json();
          if (data && data.asin) setAsin(data.asin);
          if (data && data.url && !url) setUrl(data.url);
        }
      } catch {}
    })();
  }, [productType, productId]);

  async function save() {
    try {
      const cents = Math.round(parseFloat(price) * 100);
      const res = await fetch('/api/admin/prices', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productType, productId, retailer, priceCents: cents, url })
      });
      if (res.ok) {
        showToast('Price saved');
        // refresh list
        if (productId) {
          const r = await fetch(`/api/prices/${productType}/${productId}`, { cache: 'no-store' });
          const txt = await r.text();
          const arr = txt ? JSON.parse(txt) : [];
          setRows(arr);
        }
      } else showToast('Failed to save price');
    } catch { showToast('Failed to save price'); }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Admin • Prices</h1>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${admin ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>{admin ? 'Admin ON' : 'Admin OFF'}</span>
          <a href="/signin"><Button variant="secondary">Sign In</Button></a>
          <Button variant="secondary" onClick={async()=>{ try{ await signOut({ callbackUrl: '/' }); setAdmin(false); showToast('Signed out'); }catch{} }}>Sign Out</Button>
        </div>
      </div>
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
            <div className="text-gray-600">Product URL (optional)</div>
            <Input value={url} onChange={(e)=>setUrl(e.target.value)} placeholder="https://www.amazon.com/dp/..." />
          </div>
          <div>
            <div className="text-gray-600">Amazon ASIN</div>
            <Input value={asin} onChange={(e)=>setAsin(e.target.value.toUpperCase())} placeholder="10-char ASIN" maxLength={10} />
          </div>
          <div>
            <div className="text-gray-600">Price (USD)</div>
            <Input value={price} onChange={(e)=>setPrice(e.target.value)} placeholder="e.g., 39.99" inputMode="decimal" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={async()=>{
              try{
                if (!productId || !asin) return;
                const r = await fetch('/api/admin/amazon/link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productType, productId, asin, url }) });
                if (r.ok) showToast('Amazon link saved'); else showToast('Failed to save ASIN');
              } catch { showToast('Failed to save ASIN'); }
            }}>Save Amazon Link</Button>
            <Button variant="secondary" onClick={async()=>{
              try {
                if (!productId || !url) return;
                const res = await fetch('/api/admin/amazon/fetch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productType, productId, url }) });
                const txt = await res.text();
                const data = txt ? JSON.parse(txt) : {};
                if (res.ok || data?.fallbackRow) {
                  showToast('Fetched from Amazon');
                  const r = await fetch(`/api/prices/${productType}/${productId}`, { cache: 'no-store' });
                  const t = await r.text();
                  setRows(t ? JSON.parse(t) : []);
                } else {
                  showToast('Amazon fetch failed');
                }
              } catch { showToast('Amazon fetch failed'); }
            }}>Fetch Latest from Amazon</Button>
            <Button onClick={save} disabled={!productId || !price}>Save Price</Button>
          </div>
        </CardContent>
      </Card>
      <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
        <CardHeader><CardTitle>Current Prices</CardTitle></CardHeader>
        <CardContent>
          {!productId ? (
            <div className="text-sm text-gray-600">Select a product to view prices.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600">
                    <th className="py-2 pr-4">Retailer</th>
                    <th className="py-2 pr-4">Price</th>
                    <th className="py-2">Timestamp</th>
                    <th className="py-2">Link</th>
                    <th className="py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-t">
                      <td className="py-2 pr-4">{row.retailer}</td>
                      <td className="py-2 pr-4">
                        <input defaultValue={(row.priceCents/100).toFixed(2)} className="border rounded px-2 py-1 w-24" onBlur={async (e)=>{
                          const val = parseFloat(e.currentTarget.value);
                          if (!isNaN(val)) {
                            const cents = Math.round(val * 100);
                            await fetch('/api/admin/prices', { method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ productType, productId, retailer: row.retailer, priceCents: cents }) });
                          }
                        }} />
                      </td>
                      <td className="py-2">{new Date(row.timestamp).toLocaleString()}</td>
                      <td className="py-2">{row.retailer === 'Amazon' && (row as any).url ? (<a href={(row as any).url} target="_blank" className="text-blue-600 underline">Buy</a>) : null}</td>
                      <td className="py-2"><Button variant="secondary" onClick={async ()=>{
                        const r = await fetch(`/api/prices/${productType}/${productId}`, { cache: 'no-store' });
                        const txt = await r.text();
                        const arr = txt ? JSON.parse(txt) : [];
                        setRows(arr);
                      }}>Refresh</Button></td>
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr><td className="py-2" colSpan={3}><span className="text-gray-600">No prices found.</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
