import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';

const CreateAlert = z.object({
  userId: z.string(),
  productType: z.string(),
  productId: z.string(),
  targetCents: z.number().int().positive(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateAlert.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  let alert;
  try {
    alert = await prisma.priceAlert.create({ data: { ...parsed.data, active: true } });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    alert = await fallback.priceAlert.create({ data: { ...parsed.data, active: true } });
  }
  return NextResponse.json(alert, { status: 201 });
}
