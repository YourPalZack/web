import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true, admin: false });
  res.cookies.set('admin', '', { httpOnly: false, sameSite: 'lax', path: '/', maxAge: 0 });
  return res;
}

