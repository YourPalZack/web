import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { CreatePriceSchema, DeletePriceSchema, UpdatePriceSchema } from '../../../../lib/schemas';
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
      try {
        const u = new URL(url);
        // Normalize host and path if possible
        if (!/amazon\./i.test(u.hostname) && /amzn\.to|a\.co/i.test(u.hostname)) {
          // Keep short links; tag must be on final URL after redirect. We append tag param anyway.
        }
        // Remove volatile params that don’t affect offer (preserve tag + seller when present)
        const keep = new Set(['tag', 'smid', 'm', 'psc', 'ref']);
        Array.from(u.searchParams.keys()).forEach((k) => { if (!keep.has(k)) u.searchParams.delete(k); });
        if (tag) u.searchParams.set('tag', tag);
        url = u.toString();
      } catch {
        if (tag && !url.includes('tag=')) url = `${url}${url.includes('?')?'&':'?'}tag=${encodeURIComponent(tag)}`;
      }
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

export async function DELETE(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return jsonError('Unauthorized', undefined, 401);
  const body = await req.json().catch(() => ({}));
  const parsed = DeletePriceSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid payload', parsed.error.format(), 400);
  const { productType, productId, retailer, timestamp } = parsed.data;
  try {
    const ts = new Date(timestamp);
    const res = await prisma.productPrice.deleteMany({ where: { productType, productId, retailer, timestamp: ts } as any });
    return NextResponse.json({ ok: true, deleted: res.count });
  } catch (_e) {
    // Fallback: no-op delete, return ok
    return NextResponse.json({ ok: true, deleted: 0 });
  }
}

export async function PATCH(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return jsonError('Unauthorized', undefined, 401);
  const body = await req.json().catch(() => ({}));
  const parsed = UpdatePriceSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid payload', parsed.error.format(), 400);
  const { productType, productId, retailer, timestamp, newRetailer, url } = parsed.data;
  try {
    const ts = new Date(timestamp);
    let nextUrl = url;
    const nextRetailer = newRetailer ?? retailer;
    if (nextUrl && typeof nextUrl === 'string' && nextRetailer.toLowerCase() === 'amazon') {
      const tag = process.env.AMAZON_PARTNER_TAG || '';
      try {
        const u = new URL(nextUrl);
        const keep = new Set(['tag', 'smid', 'm', 'psc', 'ref']);
        Array.from(u.searchParams.keys()).forEach((k) => { if (!keep.has(k)) u.searchParams.delete(k); });
        if (tag) u.searchParams.set('tag', tag);
        nextUrl = u.toString();
      } catch {
        if (tag && !nextUrl.includes('tag=')) nextUrl = `${nextUrl}${nextUrl.includes('?')?'&':'?'}tag=${encodeURIComponent(tag)}`;
      }
    }
    const data: any = {};
    if (newRetailer) data.retailer = newRetailer;
    if (nextUrl != null) data.url = nextUrl;
    const res = await prisma.productPrice.updateMany({ where: { productType, productId, retailer, timestamp: ts } as any, data });
    return NextResponse.json({ ok: true, updated: res.count });
  } catch (_e) {
    // Fallback: no update performed
    return NextResponse.json({ ok: true, updated: 0 });
  }
}
