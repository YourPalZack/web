export async function getLatestPriceCents(productType: string, productId: string): Promise<number | undefined> {
  try {
    const res = await fetch(`/api/prices/${productType}/${productId}`, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const rows = (await res.json()) as { priceCents: number }[];
    if (!rows.length) return undefined;
    return rows[rows.length - 1].priceCents;
  } catch {
    return undefined;
  }
}

export async function getLatestRetailerPrice(productType: string, productId: string, retailer: string): Promise<{ priceCents?: number; url?: string } | undefined> {
  try {
    const res = await fetch(`/api/prices/${productType}/${productId}`, { cache: 'no-store' });
    if (!res.ok) return undefined;
    const rows = (await res.json()) as Array<{ priceCents: number; retailer: string; url?: string }>;
    const filtered = rows.filter((r) => r.retailer?.toLowerCase() === retailer.toLowerCase());
    if (!filtered.length) return undefined;
    const last = filtered[filtered.length - 1];
    return { priceCents: last.priceCents, url: last.url };
  } catch {
    return undefined;
  }
}
