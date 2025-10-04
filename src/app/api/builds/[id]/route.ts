import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let build;
  try {
    build = await prisma.userBuild.findUnique({ where: { id } });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    build = await fallback.userBuild.findUnique?.({ where: { id } });
  }
  if (!build) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(build);
}
