import { NextResponse } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { CreateAlertSchema } from '../../../lib/schemas';
import { jsonError } from '../../../lib/api';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid payload', parsed.error.format(), 400);
  let alert;
  try {
    alert = await prisma.priceAlert.create({ data: { ...parsed.data, active: true } });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    alert = await fallback.priceAlert.create({ data: { ...parsed.data, active: true } });
  }
  return NextResponse.json(alert, { status: 201 });
}
