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
          console.log('Missing email or password');
          return null;
        }

        try {
          const result = await FirebaseDbService.getUserByEmail(credentials.email);

          if (!result.success || !result.user) {
            console.log('User not found:', credentials.email);
            return null;
          }

          if (!result.user.password) {
            console.log('User has no password (social login user)');
            return null;
          }

          // Check if password is a bcrypt hash
          const isBcryptHash = typeof result.user.password === 'string' && 
                              (result.user.password.startsWith('$2a$') || 
                               result.user.password.startsWith('$2b$') || 
                               result.user.password.startsWith('$2y$'));
          
          if (!isBcryptHash) {
            console.log('Invalid password format for user:', credentials.email);
            return null;
          }

          const isCorrectPassword = await bcrypt.compare(
            credentials.password,
            result.user.password
          );

          if (!isCorrectPassword) {
            console.log('Invalid password for user:', credentials.email);
            return null;
          }

          console.log('Login successful for user:', credentials.email);
          return {
            id: result.user.id,
            email: result.user.email,
            name: result.user.name,
            image: result.user.image,
          };
        } catch (error) {
          console.error('Error in credentials authorization:', error);
          return null;
        }
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
        // Get user from database to include all user data
        const userResult = await FirebaseDbService.getUserByEmail(session.user.email!);
        if (userResult.success && userResult.user) {
          session.user = {
            ...session.user,
            id: userResult.user.id,
            // Add custom properties to session
            // @ts-ignore - extending session user with custom fields
            hasBusinessProfile: userResult.user.hasBusinessProfile
          };
        } else {
          session.user.id = token.sub;
        }
      }
      return session;
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
        // For social logins, get the user from database
        if (account?.provider !== 'credentials' && user.email) {
          const userResult = await FirebaseDbService.getUserByEmail(user.email);
          if (userResult.success && userResult.user) {
            token.id = userResult.user.id;
          }
        }
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      try {
        // For social logins (Google, Facebook)
        if (account && account.provider !== 'credentials' && user.email) {
          // Check if user exists
          const existingUserResult = await FirebaseDbService.getUserByEmail(user.email);

          if (existingUserResult.success && existingUserResult.user) {
            // User exists, check if they have a client profile
            const clientProfileResult = await FirebaseDbService.getClientProfileByUserId(existingUserResult.user.id);
            if (!clientProfileResult.success) {
              await FirebaseDbService.createClientProfile({
                userId: existingUserResult.user.id,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                province: '', // Will be set during profile setup
                city: '', // Will be set during profile setup
                suburb: '', // Optional
                phone: '', // Optional
                preferences: '' // Will be set during profile setup
              });
            }
            // Update user ID for session
            user.id = existingUserResult.user.id;
          } else {
            // New user from social login, create user and client profile
            const newUserResult = await FirebaseDbService.createUser({
              email: user.email,
              name: user.name || '',
              image: user.image || undefined,
              hasBusinessProfile: false
            });
            
            if (newUserResult.success && newUserResult.id) {
              await FirebaseDbService.createClientProfile({
                userId: newUserResult.id,
                firstName: user.name?.split(' ')[0] || '',
                lastName: user.name?.split(' ').slice(1).join(' ') || '',
                province: '', // Will be set during profile setup
                city: '', // Will be set during profile setup
                suburb: '', // Optional
                phone: '', // Optional
                preferences: '' // Will be set during profile setup
              });
              // Update user ID for session
              user.id = newUserResult.id;
            }
          }
        }
        
        // For credential login, the user is already authenticated
        return true;
      } catch (error) {
        console.error('Error in signIn callback:', error);
        // Don't block sign in if this fails, but log the error
        return true;
      }
    }
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
