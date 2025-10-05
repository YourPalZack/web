import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { CreatePriceSchema } from '../../../../lib/schemas';
import { jsonError } from '../../../../lib/api';
import { requireAdmin } from '../../../../lib/auth';

export async function POST(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return jsonError('Unauthorized', undefined, 401);
  const body = await req.json().catch(() => ({}));
  const parsed = CreatePriceSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid payload', parsed.error.format(), 400);
  const data = parsed.data;
  try {
    let url = data.url ?? '';
    if (data.retailer.toLowerCase() === 'amazon' && url) {
      const tag = process.env.AMAZON_PARTNER_TAG || '';
      try { const u = new URL(url); if (!u.searchParams.get('tag') && tag) { u.searchParams.set('tag', tag); url = u.toString(); } } catch { if (tag && !url.includes('tag=')) url = `${url}${url.includes('?')?'&':'?'}tag=${encodeURIComponent(tag)}`; }
    }
    const row = await prisma.productPrice.create({ data: {
      productType: data.productType,
      productId: data.productId,
      retailer: data.retailer,
      priceCents: data.priceCents,
      currency: data.currency ?? 'USD',
      url,
      inStock: data.inStock ?? true,
    } });
    return NextResponse.json(row, { status: 201 });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    const row = await fallback.productPrice.create({ data: {
      productType: data.productType,
      productId: data.productId,
      retailer: data.retailer,
      priceCents: data.priceCents,
      currency: data.currency ?? 'USD',
      url: data.url ?? '',
      inStock: data.inStock ?? true,
    } });
    return NextResponse.json(row, { status: 201 });
  }
}
