import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import connectToDatabase from '@/lib/db';
import User, { UserRole } from '@/models/User';
import { loginSchema } from '@/validators/auth';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    signOut: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: 'Username or Email', type: 'text' },
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const rawIdentifier = credentials?.username || credentials?.email;
        if (!rawIdentifier || !credentials?.password) {
          throw new Error('Username/Email and password are required.');
        }

        // Validate structure with Zod
        const parsed = loginSchema.safeParse({
          username: rawIdentifier,
          password: credentials.password,
        });
        if (!parsed.success) {
          throw new Error(parsed.error.errors[0]?.message || 'Invalid username or password format.');
        }

        await connectToDatabase();

        const cleanInput = rawIdentifier.trim().toLowerCase();

        // Search user by username OR email OR exact name match
        const user = await User.findOne({
          $or: [
            { username: cleanInput },
            { email: cleanInput },
            { name: { $regex: new RegExp(`^${cleanInput}$`, 'i') } },
          ],
        }).select('+passwordHash');

        if (!user) {
          throw new Error('Invalid username or password.');
        }

        if (!user.isActive) {
          throw new Error('Your account has been deactivated. Contact Chairman/Convener.');
        }

        const isValidPassword = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValidPassword) {
          throw new Error('Invalid username or password.');
        }

        return {
          id: user._id.toString(),
          name: user.name,
          username: user.username || user.name.toLowerCase().replace(/\s+/g, ''),
          email: user.email,
          role: user.role as UserRole,
          avatarUrl: user.avatarUrl || '',
          isActive: user.isActive,
        };
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/login`;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.role = user.role;
        token.avatarUrl = user.avatarUrl;
        token.isActive = user.isActive;
      }

      // Handle session updates (e.g. avatar or name update)
      if (trigger === 'update' && session) {
        if (session.name) token.name = session.name;
        if (session.username) token.username = session.username;
        if (session.avatarUrl) token.avatarUrl = session.avatarUrl;
      }

      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id;
        session.user.username = token.username;
        session.user.role = token.role;
        session.user.avatarUrl = token.avatarUrl;
        session.user.isActive = token.isActive;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
