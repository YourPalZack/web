import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';

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

function getModel(category: Category) {
  switch (category) {
    case 'tanks':
      return prisma.tank;
    case 'filters':
      return prisma.filter;
    case 'heaters':
      return prisma.heater;
    case 'lights':
      return prisma.light;
    case 'substrate':
      return prisma.substrate;
    case 'fish':
      return prisma.fish;
    case 'invertebrates':
      return prisma.invertebrate;
    case 'plants':
      return prisma.plant;
    case 'corals':
      return prisma.coral;
    case 'equipment':
      return prisma.equipment;
  }
}

export async function GET(_req: NextRequest, ctx: { params: Promise<{ category: string }> }) {
  const { category } = await ctx.params;
  if (!categories.includes(category as Category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
  }
  let items: unknown[] = [];
  try {
    switch (category as Category) {
      case 'tanks':
        items = await prisma.tank.findMany({ take: 50 });
        break;
      case 'filters':
        items = await prisma.filter.findMany({ take: 50 });
        break;
      case 'heaters':
        items = await prisma.heater.findMany({ take: 50 });
        break;
      case 'lights':
        items = await prisma.light.findMany({ take: 50 });
        break;
      case 'substrate':
        items = await prisma.substrate.findMany({ take: 50 });
        break;
      case 'fish':
        items = await prisma.fish.findMany({ take: 50 });
        break;
      case 'invertebrates':
        items = await prisma.invertebrate.findMany({ take: 50 });
        break;
      case 'plants':
        items = await prisma.plant.findMany({ take: 50 });
        break;
      case 'corals':
        items = await prisma.coral.findMany({ take: 50 });
        break;
      case 'equipment':
        items = await prisma.equipment.findMany({ take: 50 });
        break;
    }
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    if (category === 'fish') {
      items = await fallback.fish.findMany({});
    } else {
      items = [];
    }
  }
  return NextResponse.json(items);
}
