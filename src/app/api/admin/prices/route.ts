import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { CreatePriceSchema } from '../../../../lib/schemas';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const parsed = CreatePriceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  const data = parsed.data;
  try {
    const row = await prisma.productPrice.create({ data: {
      productType: data.productType,
      productId: data.productId,
      retailer: data.retailer,
      priceCents: data.priceCents,
      currency: data.currency ?? 'USD',
      url: data.url ?? '',
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
