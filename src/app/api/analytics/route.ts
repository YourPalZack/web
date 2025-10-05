import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body?.name === 'string' ? body.name : '';
  const props = (body && typeof body.props === 'object' && body.props != null) ? body.props : {};
  if (!name) {
    return NextResponse.json({ error: { message: 'Invalid payload' } }, { status: 400 });
  }
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug('[analytics:server]', name, props);
  }
  return NextResponse.json({ ok: true });
}
