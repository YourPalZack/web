import { NextResponse } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { CreateAlertSchema } from '../../../lib/schemas';
import { jsonError } from '../../../lib/api';
import { logEvent } from '../../../lib/analytics';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = CreateAlertSchema.safeParse(body);
  if (!parsed.success) {
    try { await logEvent('price_alert_failed', { reason: 'validation', issues: parsed.error.format?.() }); } catch {}
    return jsonError('Invalid payload', parsed.error.format(), 400);
  }
  let alert;
  try {
    alert = await prisma.priceAlert.create({ data: { ...parsed.data, active: true } });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    alert = await fallback.priceAlert.create({ data: { ...parsed.data, active: true } });
  }
  try { await logEvent('price_alert_created', { productType: parsed.data.productType, productId: parsed.data.productId, targetCents: parsed.data.targetCents }); } catch {}
  return NextResponse.json(alert, { status: 201 });
}
