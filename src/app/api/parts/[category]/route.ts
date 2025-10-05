import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { z } from 'zod';
import { jsonError } from '../../../../lib/api';

const categories = [
  'tanks',
  'filters',
  'heaters',
  'lights',
  'substrate',
  'fish',
  'invertebrates',
  'plants',
  'corals',
  'equipment',
] as const;

type Category = (typeof categories)[number];

export async function GET(req: NextRequest, ctx: { params: Promise<{ category: string }> }) {
  const { category } = await ctx.params;
  if (!categories.includes(category as Category)) {
    return jsonError('Invalid category', undefined, 400);
  }
  const { searchParams } = new URL(req.url);
  const QuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(50).default(50),
    type: z.string().optional(),
    wattMin: z.coerce.number().int().nonnegative().optional(),
    wattMax: z.coerce.number().int().nonnegative().optional(),
    minTankGal: z.coerce.number().int().nonnegative().optional(),
    q: z.string().optional(),
    count: z.coerce.number().int().optional(),
    lightNeeds: z.enum(['LOW','MEDIUM','HIGH']).optional(),
    difficulty: z.enum(['BEGINNER','INTERMEDIATE','ADVANCED']).optional(),
    co2: z.union([z.literal('1'), z.literal('0'), z.literal('true'), z.literal('false')]).optional(),
    category: z.string().optional(),
  });
  const parsed = QuerySchema.safeParse({
    page: searchParams.get('page') ?? undefined,
    pageSize: searchParams.get('pageSize') ?? undefined,
    type: searchParams.get('type') ?? undefined,
    wattMin: searchParams.get('wattMin') ?? undefined,
    wattMax: searchParams.get('wattMax') ?? undefined,
    minTankGal: searchParams.get('minTankGal') ?? undefined,
    q: searchParams.get('q') ?? undefined,
    count: searchParams.get('count') ?? undefined,
    lightNeeds: searchParams.get('lightNeeds') ?? undefined,
    difficulty: searchParams.get('difficulty') ?? undefined,
    co2: searchParams.get('co2') ?? undefined,
    category: searchParams.get('category') ?? undefined,
  });
  if (!parsed.success) return jsonError('Invalid query params', parsed.error.format(), 400);
  const { page, pageSize, type, wattMin, wattMax, minTankGal, q, count, lightNeeds, difficulty, co2, category: equipCategory } = parsed.data;
  const skip = (page - 1) * pageSize;
  let total = 0;
  let items: unknown[] = [];
  try {
    switch (category as Category) {
      case 'tanks':
        if (count != null) total = await prisma.tank.count();
        items = await prisma.tank.findMany({ take: pageSize, skip });
        break;
      case 'filters':
        if (count != null) total = await prisma.filter.count({ where: {
          ...(type ? { type: type as 'CANISTER'|'HOB'|'SPONGE'|'INTERNAL'|'WET_DRY'|'SUMP' } : {}),
          ...(q ? { OR: [ { brand: { contains: q, mode: 'insensitive' } as any }, { model: { contains: q, mode: 'insensitive' } as any } ] } : {}),
        } as any });
        items = await prisma.filter.findMany({
          where: {
            ...(type ? { type: type as 'CANISTER'|'HOB'|'SPONGE'|'INTERNAL'|'WET_DRY'|'SUMP' } : {}),
            ...(q ? { OR: [
              { brand: { contains: q, mode: 'insensitive' } as any },
              { model: { contains: q, mode: 'insensitive' } as any },
            ] } : {}),
          } as any,
          take: pageSize,
          skip,
        });
        break;
      case 'heaters':
        if (count != null) total = await prisma.heater.count({ where: {
          ...(wattMin || wattMax ? { wattage: { gte: wattMin ?? undefined, lte: wattMax ?? undefined } } : {}),
          ...(q ? { OR: [ { brand: { contains: q, mode: 'insensitive' } as any }, { model: { contains: q, mode: 'insensitive' } as any } ] } : {}),
        } as any });
        items = await prisma.heater.findMany({
          where: {
            ...(wattMin || wattMax ? { wattage: { gte: wattMin ?? undefined, lte: wattMax ?? undefined } } : {}),
            ...(q ? { OR: [ { brand: { contains: q, mode: 'insensitive' } as any }, { model: { contains: q, mode: 'insensitive' } as any } ] } : {}),
          } as any,
          take: pageSize,
          skip,
        });
        break;
      case 'lights':
        if (count != null) total = await prisma.light.count({ where: {
          ...(type ? { intensity: type as 'LOW'|'MEDIUM'|'HIGH' } : {}),
          ...(q ? { OR: [ { brand: { contains: q, mode: 'insensitive' } as any }, { model: { contains: q, mode: 'insensitive' } as any } ] } : {}),
        } as any });
        items = await prisma.light.findMany({
          where: {
            ...(type ? { intensity: type as 'LOW'|'MEDIUM'|'HIGH' } : {}),
            ...(q ? { OR: [
              { brand: { contains: q, mode: 'insensitive' } as any },
              { model: { contains: q, mode: 'insensitive' } as any },
            ] } : {}),
          } as any,
          take: pageSize,
          skip,
        });
        break;
      case 'substrate':
        if (count != null) total = await prisma.substrate.count({ where: q ? {
          OR: [
            { type: { contains: q, mode: 'insensitive' } as any },
            { color: { contains: q, mode: 'insensitive' } as any },
          ],
        } : undefined } as any);
        items = await prisma.substrate.findMany({
          where: q ? {
            OR: [ { type: { contains: q, mode: 'insensitive' } as any }, { color: { contains: q, mode: 'insensitive' } as any } ],
          } : undefined,
          take: pageSize, skip,
        } as any);
        break;
      case 'fish':
        if (count != null) total = await prisma.fish.count({ where: {
          ...(minTankGal ? { minTankGal: { gte: minTankGal } } : {}),
          ...(q ? { OR: [ { commonName: { contains: q, mode: 'insensitive' } as any }, { scientificName: { contains: q, mode: 'insensitive' } as any } ] } : {}),
        } as any });
        items = await prisma.fish.findMany({
          where: {
            ...(minTankGal ? { minTankGal: { gte: minTankGal } } : {}),
            ...(q ? { OR: [
              { commonName: { contains: q, mode: 'insensitive' } as any },
              { scientificName: { contains: q, mode: 'insensitive' } as any },
            ] } : {}),
          } as any,
          take: pageSize,
          skip,
        });
        break;
      case 'invertebrates':
        if (count != null) total = await prisma.invertebrate.count({ where: q ? { commonName: { contains: q, mode: 'insensitive' } as any } : undefined } as any);
        items = await prisma.invertebrate.findMany({ where: q ? { commonName: { contains: q, mode: 'insensitive' } as any } : undefined, take: pageSize, skip } as any);
        break;
      case 'plants':
        if (count != null) total = await prisma.plant.count({ where: {
          ...(q ? { commonName: { contains: q, mode: 'insensitive' } as any } : {}),
          ...(lightNeeds ? { lightNeeds: lightNeeds as 'LOW'|'MEDIUM'|'HIGH' } : {}),
          ...(difficulty ? { difficulty: difficulty as 'BEGINNER'|'INTERMEDIATE'|'ADVANCED' } : {}),
          ...(co2 ? { co2Required: (co2 === '1' || co2 === 'true') } : {}),
        } as any });
        items = await prisma.plant.findMany({ where: {
          ...(q ? { commonName: { contains: q, mode: 'insensitive' } as any } : {}),
          ...(lightNeeds ? { lightNeeds: lightNeeds as 'LOW'|'MEDIUM'|'HIGH' } : {}),
          ...(difficulty ? { difficulty: difficulty as 'BEGINNER'|'INTERMEDIATE'|'ADVANCED' } : {}),
          ...(co2 ? { co2Required: (co2 === '1' || co2 === 'true') } : {}),
        } as any, take: pageSize, skip } as any);
        break;
      case 'corals':
        if (count != null) total = await prisma.coral.count({ where: q ? { commonName: { contains: q, mode: 'insensitive' } as any } : undefined } as any);
        items = await prisma.coral.findMany({ where: q ? { commonName: { contains: q, mode: 'insensitive' } as any } : undefined, take: pageSize, skip } as any);
        break;
      case 'equipment':
        if (count != null) total = await prisma.equipment.count({ where: {
          ...(equipCategory ? { category: equipCategory } : {}),
          ...(q ? {
            OR: [
              { category: { contains: q, mode: 'insensitive' } as any },
              { brand: { contains: q, mode: 'insensitive' } as any },
              { model: { contains: q, mode: 'insensitive' } as any },
            ],
          } : {}),
        } as any });
        items = await prisma.equipment.findMany({
          where: {
            ...(equipCategory ? { category: equipCategory } : {}),
            ...(q ? { OR: [ { category: { contains: q, mode: 'insensitive' } as any }, { brand: { contains: q, mode: 'insensitive' } as any }, { model: { contains: q, mode: 'insensitive' } as any } ] } : {}),
          } as any,
          take: pageSize, skip,
        } as any);
        break;
    }
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    const map: Record<string, { findMany: () => Promise<unknown[]> }> = {
      fish: fallback.fish,
      filters: fallback.filter,
      heaters: fallback.heater,
      lights: fallback.light,
      tanks: fallback.tank,
      substrate: fallback.substrate,
      equipment: fallback.equipment,
      plants: fallback.plant,
      invertebrates: fallback.invertebrate,
      corals: fallback.coral,
    };
    const model: { findMany: () => Promise<unknown[]> } | undefined = map[category as keyof typeof map];
    let arr = model ? await model.findMany() : [];
    // Apply simple fallback filters in memory
    if (category === 'filters' && type) arr = (arr as Array<{ type?: string }>).filter((x) => x.type === type);
    if (category === 'lights' && type) arr = (arr as Array<{ intensity?: string }>).filter((x) => x.intensity === type);
    if (category === 'heaters' && (wattMin || wattMax)) arr = (arr as Array<{ wattage?: number }>).filter((x) => (
      (wattMin ? (x.wattage ?? 0) >= wattMin : true) && (wattMax ? (x.wattage ?? 0) <= wattMax : true)
    ));
    if (category === 'fish' && minTankGal) arr = (arr as Array<{ minTankGal?:number }>).filter((x) => (x.minTankGal ?? 0) >= minTankGal);
    if (q) {
      const ql = q.toLowerCase();
      if (category === 'filters' || category === 'lights') {
        arr = (arr as Array<{ brand?: string; model?: string }>).filter((x) => (`${x.brand ?? ''} ${x.model ?? ''}`).toLowerCase().includes(ql));
      }
      if (category === 'fish') {
        arr = (arr as Array<{ commonName?: string; scientificName?: string }>).
          filter((x) => (`${x.commonName ?? ''} ${x.scientificName ?? ''}`).toLowerCase().includes(ql));
      }
      if (category === 'heaters') {
        arr = (arr as Array<{ brand?: string; model?: string }>).filter((x) => (`${x.brand ?? ''} ${x.model ?? ''}`).toLowerCase().includes(ql));
      }
      if (category === 'substrate') {
        arr = (arr as Array<{ type?: string; color?: string }>).filter((x) => (`${x.type ?? ''} ${x.color ?? ''}`).toLowerCase().includes(ql));
      }
      if (category === 'plants' || category === 'invertebrates' || category === 'corals') {
        arr = (arr as Array<{ commonName?: string }>).filter((x) => (`${x.commonName ?? ''}`).toLowerCase().includes(ql));
      }
      if (category === 'equipment') {
        arr = (arr as Array<{ category?: string; brand?: string; model?: string }>).
          filter((x) => (`${x.category ?? ''} ${x.brand ?? ''} ${x.model ?? ''}`).toLowerCase().includes(ql));
      }
    }
    if (category === 'plants') {
      if (lightNeeds) arr = (arr as Array<{ lightNeeds?: string }>).filter((x) => x.lightNeeds === lightNeeds);
      if (difficulty) arr = (arr as Array<{ difficulty?: string }>).filter((x) => x.difficulty === difficulty);
      if (co2) arr = (arr as Array<{ co2Required?: boolean }>).filter((x) => Boolean(x.co2Required) === (co2 === '1' || co2 === 'true'));
    }
    if (category === 'equipment' && equipCategory) {
      arr = (arr as Array<{ category?: string }>).filter((x) => x.category === equipCategory);
    }
    if (count != null) total = arr.length;
    items = arr.slice(skip, skip + pageSize);
  }
  if (count != null) {
    const res = NextResponse.json({ items, total });
    res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
    return res;
  }
  const res = NextResponse.json(items);
  res.headers.set('Cache-Control', 's-maxage=300, stale-while-revalidate=120');
  return res;
}
