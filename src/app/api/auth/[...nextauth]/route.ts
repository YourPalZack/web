import NextAuth, { type NextAuthOptions } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';

const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
const adminPasscode = process.env.ADMIN_PASSCODE || 'admin';

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  providers: [
    Credentials({
      name: 'Dev Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        passcode: { label: 'Passcode', type: 'password' },
      },
      async authorize(credentials) {
        const email = String(credentials?.email || '').toLowerCase();
        const pass = String(credentials?.passcode || '');
        // Dev-friendly: allow any email; admin if matches env and passcode
        const isAdmin = email === adminEmail.toLowerCase() && pass === adminPasscode;
        if (email) {
          return { id: email, email, name: email.split('@')[0], isAdmin } as any;
        }
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.isAdmin = (user as any).isAdmin === true;
      return token as any;
    },
    async session({ session, token }) {
      if (session?.user) (session.user as any).isAdmin = (token as any)?.isAdmin === true;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };

