"use client";
import { useState } from 'react';
import { signIn, signOut } from 'next-auth/react';
import { Card, CardHeader, CardTitle, CardContent, Input, Button } from '@aquabuilder/ui';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [passcode, setPasscode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError(null);
    try {
      const res = await signIn('credentials', { email, passcode, redirect: true, callbackUrl: '/admin/prices' });
      if (res?.error) setError(res.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="max-w-md mx-auto p-6">
      <Card className="bg-white/80 backdrop-blur shadow-lg shadow-blue-100">
        <CardHeader><CardTitle>Sign In</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={submit} className="grid gap-3">
            <div>
              <div className="text-gray-600 text-sm">Email</div>
              <Input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="text-gray-600 text-sm">Passcode</div>
              <Input type="password" value={passcode} onChange={(e)=>setPasscode(e.target.value)} required />
            </div>
            {error && <div className="text-sm text-red-600">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign In'}</Button>
              <Button type="button" variant="secondary" onClick={()=>signOut({ callbackUrl: '/' })}>Sign Out</Button>
            </div>
            <div className="text-xs text-gray-500">Admin access requires ADMIN_EMAIL and ADMIN_PASSCODE to match.</div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

