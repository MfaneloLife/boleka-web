import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt from 'bcrypt';
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { prisma } from '@/lib/prisma';

const providers: AuthOptions['providers'] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET) {
  providers.push(
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    })
  );
}

providers.push(
  CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email
          }
        });

        if (!user || !user?.password) {
          throw new Error('Invalid credentials');
        }

        // Ensure stored password is a bcrypt hash
        const isBcryptHash = typeof user.password === 'string' && user.password.startsWith('$2');
        if (!isBcryptHash) {
          // Likely a social/Firebase user without a local password
          throw new Error('Invalid credentials');
        }

        let isCorrectPassword = false;
        try {
          isCorrectPassword = await bcrypt.compare(
            credentials.password,
            user.password
          );
        } catch {
          isCorrectPassword = false;
        }

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return user;
      }
    })
);

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers,
  pages: {
    signIn: '/auth/login',
  },
  debug: process.env.NODE_ENV === 'development',
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user = {
          ...session.user,
          id: token.sub
        };
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async signIn({ user, account }) {
      // For social logins, ensure user has a client profile
      if (account && account.provider !== 'credentials' && user.email) {
        try {
          // Check if user exists
          const existingUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: { clientProfile: true }
          });

          // If user exists but doesn't have a client profile, create one
          if (existingUser && !existingUser.clientProfile) {
            await prisma.clientProfile.create({
              data: {
                user: { connect: { id: existingUser.id } }
              }
            });
          }
          
          // If new user from social login, ensure they have a client profile
          if (!existingUser && user.id) {
            // The adapter should create the user, but we ensure the client profile exists
            const dbUser = await prisma.user.findUnique({
              where: { id: user.id },
              include: { clientProfile: true }
            });
            
            if (dbUser && !dbUser.clientProfile) {
              await prisma.clientProfile.create({
                data: {
                  user: { connect: { id: dbUser.id } }
                }
              });
            }
          }
        } catch (error) {
          console.error('Error in signIn callback:', error);
          // Don't block sign in if this fails
        }
      }
      return true;
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
