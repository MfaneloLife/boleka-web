import bcrypt from 'bcrypt';
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { FirebaseDbService } from '@/src/lib/firebase-db';

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

        const result = await FirebaseDbService.getUserByEmail(credentials.email);

        if (!result.success || !result.user || !result.user.password) {
          throw new Error('Invalid credentials');
        }

        // Ensure stored password is a bcrypt hash
        const isBcryptHash = typeof result.user.password === 'string' && result.user.password.startsWith('$2');
        if (!isBcryptHash) {
          // Likely a social/Firebase user without a local password
          throw new Error('Invalid credentials');
        }

        let isCorrectPassword = false;
        try {
          isCorrectPassword = await bcrypt.compare(
            credentials.password,
            result.user.password
          );
        } catch {
          isCorrectPassword = false;
        }

        if (!isCorrectPassword) {
          throw new Error('Invalid credentials');
        }

        return {
          id: result.user.id,
          email: result.user.email,
          name: result.user.name,
          image: result.user.image,
        };
      }
    })
);

export const authOptions: AuthOptions = {
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
          const existingUserResult = await FirebaseDbService.getUserByEmail(user.email);

          // If user exists but doesn't have a client profile, create one
          if (existingUserResult.success && existingUserResult.user) {
            const clientProfileResult = await FirebaseDbService.getClientProfileByUserId(existingUserResult.user.id);
            if (!clientProfileResult.success) {
              await FirebaseDbService.createClientProfile({
                userId: existingUserResult.user.id,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || ''
              });
            }
          }
          
          // If new user from social login, create user and client profile
          if (!existingUserResult.success && user.email && user.name) {
            const newUserResult = await FirebaseDbService.createUser({
              email: user.email,
              name: user.name,
              image: user.image || undefined,
              hasBusinessProfile: false
            });
            
            if (newUserResult.success && newUserResult.id) {
              await FirebaseDbService.createClientProfile({
                userId: newUserResult.id,
                firstName: user.name.split(' ')[0] || '',
                lastName: user.name.split(' ').slice(1).join(' ') || ''
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
