import { NextResponse } from 'next/server';

export function jsonError(message: string, issues?: unknown, status = 400) {
  return NextResponse.json({ error: { message, issues } }, { status });
}

