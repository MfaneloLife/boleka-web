# Boleka - Peer-to-Peer Sharing Platform

Boleka is a modern web application that allows users to share items within their community. Users can create both client and business profiles, making it easy to either list items for sharing or request items from others.

## Key Features

- **Dual Profiles**: Users can switch between client and business profiles
- **Item Listings**: Add items with details, photos, pricing, and location
- **Search & Discovery**: Find items available for sharing in your area
- **Request Management**: Send and manage requests for items
- **Secure Payments**: Choose between online payments or cash
- **Messaging**: Built-in chat between item owners and requesters

## Tech Stack

- **Frontend**: Next.js with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Storage**: Firebase Storage (for images)
- **Messaging**: Firebase Firestore for real-time messaging

## Getting Started

### Prerequisites

- Node.js 18.0 or higher
- PostgreSQL database

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Set up environment variables by copying `.env.example` to `.env` and filling in the values
4. Initialize the database:
   ```
   npx prisma migrate dev
   ```
5. Start the development server:
   ```
   npm run dev
   ```

## Project Structure

- `/app`: Next.js App Router pages and API routes
- `/src/components`: Reusable components
- `/prisma`: Database schema and migrations
- `/public`: Static assets
- `/lib`: Utility functions, including Firebase configuration

## Firebase Setup

### Setting up Firebase for Real-time Messaging and Image Storage

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Add a Web App to your project
3. Enable services:
   - Firebase Authentication
   - Firestore Database
   - Storage

4. Set up Firestore Database rules:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /messages/{document=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /conversations/{document=**} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
     }
   }
   ```
   
5. Set up Storage rules:
   ```
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /message-images/{imageId} {
         allow read: if request.auth != null;
         allow write: if request.auth != null;
       }
       match /item-images/{imageId} {
         allow read;
         allow write: if request.auth != null;
       }
     }
   }
   ```

6. Add Firebase configuration directly to `lib/firebase.ts`:
   ```javascript
   // Your web app's Firebase configuration
   const firebaseConfig = {
     apiKey: "your-api-key",
     authDomain: "your-project-id.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project-id.appspot.com",
     messagingSenderId: "your-messaging-sender-id",
     appId: "your-app-id",
     measurementId: "your-measurement-id"
   };
   ```

## Development Workflow

1. Create a new branch for your feature
2. Make your changes
3. Run tests: `npm test`
4. Submit a pull request

## Deployment

### Deploying to Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Configure the following environment variables in Vercel:
   - `DATABASE_PROVIDER`: Set to `sqlite` for Vercel deployment
   - `DATABASE_URL`: Set to `file:./prisma/prod.db`
   - `NEXTAUTH_URL`: Your production URL (e.g., `https://your-app.vercel.app`)
   - `NEXT_PUBLIC_APP_URL`: Same as `NEXTAUTH_URL`
   - Set any other required environment variables (authentication providers, etc.)
4. Deploy the project

### Platform Fee System

The application includes a 5% platform fee on all payments processed through the system:

- Businesses are charged a 5% fee on each transaction
- The fee is automatically calculated during payment processing
- Businesses can view their earnings, fees paid, and net amounts in their dashboard
- Platform fees are clearly explained in the business onboarding process

## License

[MIT](LICENSE)
