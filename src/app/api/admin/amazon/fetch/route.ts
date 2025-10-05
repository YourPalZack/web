import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { requireAdmin } from '../../../../../lib/auth';
import { extractAsin, getItemViaPaapi } from '../../../../../lib/amazon';

const BodySchema = z.object({
  productType: z.string().min(1),
  productId: z.string().min(1),
  url: z.string().url().optional(),
  asin: z.string().length(10).optional(),
});

export async function POST(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.format() }, { status: 400 });
  const { productType, productId } = parsed.data;
  let asin = parsed.data.asin;
  if (!asin && parsed.data.url) asin = extractAsin(parsed.data.url) ?? undefined;
  if (!asin) return NextResponse.json({ error: 'Missing ASIN or valid URL' }, { status: 400 });
  try {
    const it = await getItemViaPaapi(asin);
    if (typeof it.priceCents !== 'number') return NextResponse.json({ error: 'Price not available' }, { status: 502 });
    const row = await prisma.productPrice.create({ data: {
      productType,
      productId,
      retailer: 'Amazon',
      priceCents: it.priceCents,
      currency: 'USD',
      inStock: it.inStock ?? true,
      url: it.url ?? '',
    } });
    return NextResponse.json(row, { status: 201 });
  } catch (e: unknown) {
    const { fallback } = getPrismaSafe();
    // Return error but keep shape consistent
    const msg = e instanceof Error ? e.message : 'Amazon error';
    // write a synthetic fallback row to keep flows moving in dev without env
    const row = await fallback.productPrice.create({ data: {
      productType,
      productId,
      retailer: 'Amazon',
      priceCents: 9999,
      currency: 'USD',
      inStock: true,
      url: parsed.data.url ?? '',
    } });
    return NextResponse.json({ error: 'Amazon fetch failed', message: msg, fallbackRow: row }, { status: 502 });
  }
}
export const runtime = 'nodejs';
