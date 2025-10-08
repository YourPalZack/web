"use client";
import { useEffect, useState } from 'react';
import { Button } from '@aquabuilder/ui';
import { logEvent } from '../../lib/analytics-client';
import { getLatestRetailerPrice } from '../../lib/price';

export default function AmazonBuyLink({ productType, productId }:{ productType: string; productId: string }){
  const [url, setUrl] = useState<string | null>(null);
  const [label, setLabel] = useState<string>('Buy on Amazon');
  useEffect(()=>{
    (async()=>{
      const r = await getLatestRetailerPrice(productType, productId, 'Amazon');
      if (r?.url) {
        setUrl(r.url);
        if (typeof r.priceCents === 'number') setLabel(`Buy on Amazon • $${(r.priceCents/100).toFixed(2)}`);
      }
    })();
  }, [productType, productId]);
  if (!url) return null;
  return (
    <a href={url} target="_blank" rel="nofollow sponsored noopener noreferrer" onClick={() => {
      try { logEvent('amazon_buy_click', { productType, productId, url }); } catch {}
    }}>
      <Button variant="secondary" size="sm">
        <span className="inline-flex items-center gap-1">
          <img src="https://www.amazon.com/favicon.ico" alt="Amazon" className="w-3 h-3" />
          <span>{label}</span>
        </span>
      </Button>
    </a>
  );
}
