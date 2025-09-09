# Setting up Google OAuth for Boleka Web

## Steps to configure Google OAuth:

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Select your project "bolekaweb" or create a new one

2. **Enable Google+ API:**
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it

3. **Create OAuth 2.0 Credentials:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Boleka Web App"

4. **Configure Authorized redirect URIs:**
   For development:
   - http://localhost:3000/api/auth/callback/google
   
   For production:
   - https://boleka-web-git-main-mfanelolifes-projects.vercel.app/api/auth/callback/google

5. **Copy credentials to .env.local:**
   - GOOGLE_CLIENT_ID="your-google-client-id"
   - GOOGLE_CLIENT_SECRET="your-google-client-secret"

## Facebook OAuth Setup:

1. **Go to Facebook Developers:**
   - Visit: https://developers.facebook.com/
   - Create a new app or use existing

2. **Add Facebook Login product:**
   - In your app dashboard, add "Facebook Login"

3. **Configure OAuth redirect URIs:**
   For development:
   - http://localhost:3000/api/auth/callback/facebook
   
   For production:
   - https://boleka-web-git-main-mfanelolifes-projects.vercel.app/api/auth/callback/facebook

4. **Copy credentials to .env.local:**
   - FACEBOOK_CLIENT_ID="your-facebook-app-id"
   - FACEBOOK_CLIENT_SECRET="your-facebook-app-secret"

## Important Notes:
- Make sure to add both development and production URLs
- Test locally first before deploying
- Keep credentials secure and never commit them to git
