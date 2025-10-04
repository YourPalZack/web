import { NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import type { BuildType, Prisma } from '@prisma/client';

const CreateBuild = z.object({ name: z.string().min(2), buildType: z.string(), components: z.record(z.string(), z.unknown()) });

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = CreateBuild.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
  let build;
  try {
    build = await prisma.userBuild.create({
      data: { name: parsed.data.name, buildType: parsed.data.buildType as BuildType, components: parsed.data.components as unknown as Prisma.InputJsonValue, userId: 'anon' },
    });
  } catch (_e) {
    const { fallback } = getPrismaSafe();
    build = await fallback.userBuild.create({ data: { name: parsed.data.name, buildType: parsed.data.buildType, components: parsed.data.components, userId: 'anon' } });
  }
  return NextResponse.json(build, { status: 201 });
}
