import { NextResponse } from 'next/server';
// zod schema imported from shared lib
import { prisma } from '@aquabuilder/db';
import { getPrismaSafe } from '@aquabuilder/db/safeClient';
import { CreateBuildSchema } from '../../../lib/schemas';
import type { BuildType, Prisma } from '@prisma/client';

const CreateBuild = CreateBuildSchema;

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
