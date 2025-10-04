import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ productType: string; productId: string }> }) {
  const { productType, productId } = await ctx.params;
  let rows: unknown[] = [];
  try {
    rows = await prisma.productPrice.findMany({
      where: { productType, productId },
      orderBy: { timestamp: 'asc' },
      take: 500,
    });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    rows = await fallback.productPrice.findMany({});
  }
  return NextResponse.json(rows);
}
