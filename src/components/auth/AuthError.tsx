"use client";

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthError() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      // Display appropriate error message based on the error code
      let errorMessage = 'An error occurred during authentication';
      
      switch (error) {
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
          errorMessage = 'There was a problem with the OAuth provider';
          break;
        case 'EmailCreateAccount':
          errorMessage = 'There was a problem creating an account with this email';
          break;
        case 'Callback':
          errorMessage = 'There was a problem during the authentication callback';
          break;
        case 'AccessDenied':
          errorMessage = 'Access was denied to your account';
          break;
        case 'Default':
        default:
          errorMessage = 'An unknown error occurred during authentication';
          break;
      }
      
      alert(errorMessage);
    }
  }, [error]);

  // This component doesn't render anything visible
  return null;
}
