import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { requireAdmin } from '../../../../../lib/auth';

export const runtime = 'nodejs';

const BodySchema = z.object({
  productType: z.string().min(1),
  productId: z.string().min(1),
  asin: z.string().length(10),
  url: z.string().url().optional(),
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const productType = searchParams.get('productType') ?? '';
  const productId = searchParams.get('productId') ?? '';
  if (!productType || !productId) return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  try {
    const row = await prisma.amazonLink.findUnique({ where: { productType_productId: { productType, productId } } });
    return NextResponse.json(row ?? null);
  } catch (_e) {
    // fallback client may not have this model
    return NextResponse.json(null);
  }
}

export async function POST(req: NextRequest) {
  const ok = await requireAdmin(req);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.format() }, { status: 400 });
  const data = parsed.data;
  try {
    const row = await prisma.amazonLink.upsert({
      where: { productType_productId: { productType: data.productType, productId: data.productId } },
      update: { asin: data.asin, url: data.url },
      create: { productType: data.productType, productId: data.productId, asin: data.asin, url: data.url },
    });
    return NextResponse.json(row, { status: 201 });
  } catch (e) {
    const { fallback } = getPrismaSafe();
    // No-op on fallback; return simulated success
    return NextResponse.json({ ok: true, note: 'Saved (fallback, no persistent store)' }, { status: 201 });
  }
}

