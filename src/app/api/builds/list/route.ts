import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import type { BuildType } from '@prisma/client';
import { BuildsListQuerySchema, PaginationQuerySchema } from '../../../../lib/schemas';
import { jsonError } from '../../../../lib/api';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const base = BuildsListQuerySchema.extend({ count: PaginationQuerySchema.shape.page.optional() }).safeParse({
    type: searchParams.get('type') ?? undefined,
    limit: searchParams.get('limit') ?? undefined,
    count: searchParams.get('count') ?? undefined,
  });
  if (!base.success) return jsonError('Invalid query params', base.error.format(), 400);
  const countParam = searchParams.get('count');
  const countRequested = countParam != null;
  const pageParsed = PaginationQuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
  });
  const { type, limit } = base.data;
  const { page, pageSize } = pageParsed.success ? pageParsed.data : { page: 1, pageSize: limit ?? 12 };
  const skip = (page - 1) * pageSize;
  try {
    const where = { isPublic: true, buildType: type ? (type as BuildType) : undefined } as any;
    const [total, rows] = await Promise.all([
      countRequested ? prisma.userBuild.count({ where }) : Promise.resolve(0),
      prisma.userBuild.findMany({ where, orderBy: { createdAt: 'desc' }, take: pageSize ?? limit, skip: countRequested ? skip : 0 }),
    ]);
    if (countRequested) return NextResponse.json({ items: rows, total });
    return NextResponse.json(rows);
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    const rows: Array<{ id:string; name:string; buildType:string }> = await fallback.userBuild.findMany({ take: pageSize ?? limit, skip: countRequested ? skip : 0 });
    if (countRequested) return NextResponse.json({ items: rows, total: rows.length });
    return NextResponse.json(rows);
  }
}
