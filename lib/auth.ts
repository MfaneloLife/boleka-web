import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import bcrypt from 'bcryptjs';
import { adminDb } from '@/src/lib/firebase-admin';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Get user from Firebase
          const usersSnapshot = await adminDb.collection('users')
            .where('email', '==', credentials.email)
            .limit(1)
            .get();

          if (usersSnapshot.empty) {
            return null;
          }

          const userDoc = usersSnapshot.docs[0];
          const user = userDoc.data();

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          return {
            id: userDoc.id,
            email: user.email,
            name: user.name,
            image: user.image
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
      }
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      })
    ] : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
      })
    ] : []),
  ],
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id;
      }
      
      // Handle OAuth sign in
      if (account && user && account.provider !== 'credentials') {
        try {
          // Check if user exists in Firebase
          const usersSnapshot = await adminDb.collection('users')
            .where('email', '==', user.email)
            .limit(1)
            .get();

          let userId;
          if (usersSnapshot.empty) {
            // Create new user in Firebase
            const newUserRef = await adminDb.collection('users').add({
              email: user.email,
              name: user.name,
              image: user.image,
              provider: account.provider,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            userId = newUserRef.id;
          } else {
            userId = usersSnapshot.docs[0].id;
          }
          
          token.id = userId;
        } catch (error) {
          console.error('Error handling OAuth user:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    }
  }
};

export default authOptions;
