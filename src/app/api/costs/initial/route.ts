import { NextResponse } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { InitialCostSchema } from '../../../../lib/schemas';
import { jsonError } from '../../../../lib/api';
// computeInitialCost is available in core but this route uses async DB lookups directly.

type ProductType = 'FILTER'|'HEATER'|'LIGHT'|'SUBSTRATE'|'EQUIPMENT';

async function latestPriceCentsDB(productType: ProductType, productId: string): Promise<number | undefined> {
  try {
    const row = await prisma.productPrice.findFirst({
      where: { productType, productId },
      orderBy: { timestamp: 'desc' },
    });
    return row?.priceCents ?? undefined;
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    const rows = await fallback.productPrice.findMany();
    const filtered = rows.filter((r: any) => r.productType === productType && r.productId === productId);
    if (!filtered.length) return undefined;
    return filtered[filtered.length - 1]?.priceCents;
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = InitialCostSchema.safeParse(body);
  if (!parsed.success) return jsonError('Invalid payload', parsed.error.format(), 400);
  const { equipment } = parsed.data;

  // Compute sum using latest price lookups
  let sum = 0;
  async function addIf(type: ProductType, id?: string) {
    if (!id) return;
    const c = await latestPriceCentsDB(type, id);
    if (typeof c === 'number') sum += c;
  }
  await addIf('FILTER', equipment.filter);
  await addIf('HEATER', equipment.heater);
  await addIf('LIGHT', equipment.light);
  await addIf('SUBSTRATE', equipment.substrate);
  for (const id of equipment.extras ?? []) await addIf('EQUIPMENT', id);

  return NextResponse.json({ priceCents: sum, items: {
    filter: equipment.filter ? await latestPriceCentsDB('FILTER', equipment.filter) : undefined,
    heater: equipment.heater ? await latestPriceCentsDB('HEATER', equipment.heater) : undefined,
    light: equipment.light ? await latestPriceCentsDB('LIGHT', equipment.light) : undefined,
    substrate: equipment.substrate ? await latestPriceCentsDB('SUBSTRATE', equipment.substrate) : undefined,
    extras: await Promise.all((equipment.extras ?? []).map(id => latestPriceCentsDB('EQUIPMENT', id))),
  }});
}
