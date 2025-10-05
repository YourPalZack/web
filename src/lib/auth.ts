import type { NextRequest } from 'next/server';
import { getServerSession as getNextAuthSession } from 'next-auth';
import { authOptions } from '../app/api/auth/[...nextauth]/route';

export type Session = { user?: { id: string; name?: string; isAdmin?: boolean } };

export async function getServerSession(_req?: NextRequest): Promise<Session | null> {
  try {
    const s = await getNextAuthSession(authOptions);
    return s as any;
  } catch {
    // dev fallback to keep flows moving without NextAuth fully configured
    if (process.env.NODE_ENV !== 'production') {
      return { user: { id: 'dev', name: 'Dev User', isAdmin: true } };
    }
    return null;
  }
}

export async function requireAdmin(req: NextRequest): Promise<boolean> {
  if (process.env.NODE_ENV !== 'production') return true;
  const session = await getServerSession(req);
  return !!session?.user?.isAdmin;
}
