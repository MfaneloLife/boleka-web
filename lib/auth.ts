import { NextAuthOptions } from 'next-auth';
import EmailProvider from 'next-auth/providers/email';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import { adminDb } from '@/src/lib/firebase-admin';

export const authOptions: NextAuthOptions = {
  providers: [
    // Only include EmailProvider if all required variables are present
    ...(process.env.EMAIL_SERVER_HOST && 
        process.env.EMAIL_SERVER_PORT && 
        process.env.EMAIL_SERVER_USER && 
        process.env.EMAIL_SERVER_PASSWORD ? [
      EmailProvider({
        server: {
          host: process.env.EMAIL_SERVER_HOST,
          port: Number(process.env.EMAIL_SERVER_PORT),
          auth: {
            user: process.env.EMAIL_SERVER_USER,
            pass: process.env.EMAIL_SERVER_PASSWORD,
          },
        },
        from: process.env.EMAIL_FROM || 'noreply@boleka.com',
        maxAge: 24 * 60 * 60, // 24 hours
        // Custom email content
        sendVerificationRequest: async ({ identifier: email, url, provider }) => {
        const { host } = new URL(url);
        
        const nodemailer = await import('nodemailer');
        
        // Type assertion for email provider server config
        const serverConfig = provider.server as {
          host: string;
          port: number;
          auth: { user: string; pass: string };
        };
        
        const transport = nodemailer.createTransport({
          host: serverConfig.host,
          port: serverConfig.port,
          auth: serverConfig.auth,
          secure: serverConfig.port === 465,
        });

        const result = await transport.sendMail({
          to: email,
          from: provider.from,
          subject: `Sign in to Boleka`,
          text: text({ url, host }),
          html: html({ url, host, email }),
        });

        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email(s) (${failed.join(', ')}) could not be sent`);
        }
      },
    })
    ] : []),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        authorization: {
          params: {
            prompt: "consent",
            access_type: "offline",
            response_type: "code"
          }
        }
      })
    ] : []),
    ...(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET ? [
      FacebookProvider({
        clientId: process.env.FACEBOOK_CLIENT_ID,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
        authorization: {
          params: { scope: 'public_profile,email' }
        },
        profile(profile) {
          // Normalize to ensure email when provided by Facebook
          return {
            id: profile.id,
            name: profile.name,
            email: (profile as any).email ?? null,
            image: (profile as any).picture?.data?.url ?? null,
          } as any;
        }
      })
    ] : []),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/auth/login',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // Allow all email link sign-ins
      if (account?.provider === 'email') {
        return true;
      }
      
      // Allow OAuth providers
      if (account?.provider === 'google' || account?.provider === 'facebook') {
        return true;
      }
      
      return true;
    },
    async jwt({ token, user, account, profile }) {
      // Handle first-time sign in
      if (user && account) {
        try {
          // Check if user exists in Firebase
          const usersSnapshot = await adminDb.collection('users')
            .where('email', '==', user.email)
            .limit(1)
            .get();

          let userId;
          if (usersSnapshot.empty) {
            // Create new user in Firebase
            const newUserData = {
              email: user.email,
              name: user.name || '',
              image: user.image || null,
              provider: account.provider,
              emailVerified: account.provider === 'email' ? new Date() : new Date(),
              createdAt: new Date(),
              updatedAt: new Date(),
              // Initialize user profile
              profileCompleted: false,
              // Rental stats
              totalRentals: 0,
              successfulRentals: 0,
              rating: 0,
              reviewCount: 0,
              // Rewards
              totalPoints: 0,
              availablePoints: 0,
              tier: 'bronze',
            };

            const newUserRef = await adminDb.collection('users').add(newUserData);
            userId = newUserRef.id;
            
            console.log('Created new user:', user.email, 'Provider:', account.provider);
          } else {
            userId = usersSnapshot.docs[0].id;
            
            // Update user with latest info
            await adminDb.collection('users').doc(userId).update({
              name: user.name || usersSnapshot.docs[0].data().name,
              image: user.image || usersSnapshot.docs[0].data().image,
              updatedAt: new Date(),
              lastLogin: new Date(),
            });
          }
          
          token.id = userId;
        } catch (error) {
          console.error('Error handling user in JWT callback:', error);
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      if (session.user && token.id) {
        session.user.id = token.id as string;
        
        // Optionally fetch additional user data from Firebase
        try {
          const userDoc = await adminDb.collection('users').doc(token.id as string).get();
          if (userDoc.exists) {
            const userData = userDoc.data();
            session.user.profileCompleted = userData?.profileCompleted || false;
            session.user.hasBusinessProfile = userData?.hasBusinessProfile || false;
          }
        } catch (error) {
          console.error('Error fetching user data for session:', error);
        }
      }
      return session;
    }
  },
  events: {
    async createUser({ user }) {
      console.log('New user created:', user.email);
    },
    async signIn({ user, account, profile, isNewUser }) {
      console.log('User signed in:', user.email, 'Provider:', account?.provider);
      
      if (isNewUser) {
        console.log('New user signed up:', user.email);
      }
    },
  },
};

// Email template functions
function html({ url, host, email }: { url: string; host: string; email: string }) {
  const escapedEmail = `${email.replace(/\./g, "&#8203;.")}`;
  const escapedHost = `${host.replace(/\./g, "&#8203;.")}`;

  const backgroundColor = "#f9f9f9";
  const textColor = "#444";
  const mainBackgroundColor = "#fff";
  const buttonBackgroundColor = "#346df1";
  const buttonBorderColor = "#346df1";
  const buttonTextColor = "#fff";

  return `
<body style="background: ${backgroundColor};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${mainBackgroundColor}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
        Sign in to <strong>Boleka</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${buttonBackgroundColor}">
              <a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${buttonTextColor}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${buttonBorderColor}; display: inline-block; font-weight: bold;">
                Sign in
              </a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${textColor};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 12px; line-height: 18px; font-family: Helvetica, Arial, sans-serif; color: #888;">
        This link will expire in 24 hours for your security.
      </td>
    </tr>
  </table>
</body>
`;
}

function text({ url, host }: { url: string; host: string }) {
  return `Sign in to Boleka\n\nClick the link below to sign in:\n${url}\n\nThis link will expire in 24 hours for your security.\n\nIf you did not request this email, you can safely ignore it.`;
}

export default authOptions;
