import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { z } from 'zod';
import { requireAdmin } from '../../../../lib/auth';
import { UpdateBuildSchema } from '../../../../lib/schemas';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  let build;
  try {
    build = await prisma.userBuild.findUnique({ where: { id } });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    build = await fallback.userBuild.findUnique?.({ where: { id } });
  }
  if (!build) return NextResponse.json({ error: { message: 'Not found' } }, { status: 404 });
  const res = NextResponse.json(build);
  res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
  return res;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const ok = await requireAdmin(req as any);
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const parsed = UpdateBuildSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid payload', issues: parsed.error.format() }, { status: 400 });
  try {
    const updated = await prisma.userBuild.update({ where: { id }, data: parsed.data as any });
    return NextResponse.json(updated);
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    const current = await fallback.userBuild.findUnique?.({ where: { id } });
    const updated = { ...(current ?? {}), ...parsed.data } as any;
    return NextResponse.json(updated);
  }
}
