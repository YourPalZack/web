import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true, admin: true });
  res.cookies.set('admin', '1', { httpOnly: false, sameSite: 'lax', path: '/' });
  return res;
}

