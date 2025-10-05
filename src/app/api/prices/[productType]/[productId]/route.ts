import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { z } from 'zod';
import { jsonError } from '../../../../../lib/api';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ productType: string; productId: string }> }) {
  const { productType, productId } = await ctx.params;
  const Params = z.object({ productType: z.string().min(1), productId: z.string().min(1) });
  const parsed = Params.safeParse({ productType, productId });
  if (!parsed.success) return jsonError('Invalid params', parsed.error.format(), 400);
  let rows: unknown[] = [];
  try {
    rows = await prisma.productPrice.findMany({
      where: { productType, productId },
      orderBy: { timestamp: 'asc' },
      take: 500,
    });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    rows = await fallback.productPrice.findMany();
  }
  return NextResponse.json(rows);
}
