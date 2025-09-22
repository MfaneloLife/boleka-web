"use client";

import React, { useState } from 'react';
import { Button } from '@/src/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/context/AuthContext';
import { useForm } from 'react-hook-form';

interface LoginFormProps {
  callbackUrl?: string;
}

interface LoginFormData {
  name?: string;
  email: string;
  password: string;
}

export default function FirebaseLoginForm({ callbackUrl = '/dashboard/client' }: LoginFormProps) {
  const router = useRouter();
  const { signIn, signUp, signInWithGoogle, signInWithFacebook, error } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  
  // Allow toggling email/password via env flag. Default: disabled.
  const emailEnabled = (process.env.NEXT_PUBLIC_EMAIL_AUTH_ENABLED || '').toLowerCase() === 'true';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>();

  const handleSocialLogin = async (provider: 'google' | 'facebook') => {
    try {
      setIsLoading(true);
      setLocalError(null);
      
      let user;
      if (provider === 'google') {
        user = await signInWithGoogle();
      } else {
        user = await signInWithFacebook();
      }
      
      // Since we now auto-create client profiles in AuthContext,
      // we can directly redirect to client dashboard
      router.push(callbackUrl);
      
    } catch (error: any) {
      console.error('Social login error:', error);
      setLocalError(error.message || 'Social login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const displayError = localError || error;

  return (
    <div className="w-full max-w-md space-y-8 mt-8">
      {displayError && (
        <div className="p-3 text-sm text-white bg-red-500 rounded">
          {displayError}
        </div>
      )}

      {!emailEnabled && (
        <div className="text-center text-sm text-gray-600">
          Email/Password sign-in is disabled. Please continue with a social provider below.
        </div>
      )}

      {emailEnabled && (
        <form
          onSubmit={handleSubmit(async (data: LoginFormData) => {
            try {
              setIsLoading(true);
              setLocalError(null);

              if (isSignUpMode) {
                await signUp(data.email, data.password, data.name || '');
              } else {
                await signIn(data.email, data.password);
              }
              router.push(callbackUrl);
            } catch (err: any) {
              console.error(isSignUpMode ? 'Registration error:' : 'Login error:', err);
              setLocalError(err.message || (isSignUpMode ? 'Registration failed' : 'Login failed'));
            } finally {
              setIsLoading(false);
            }
          })}
          className="space-y-4"
        >
          <div className="text-center">
            <button
              type="button"
              onClick={() => setIsSignUpMode(!isSignUpMode)}
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
            >
              {isSignUpMode ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
            </button>
          </div>

          {isSignUpMode && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                {...register('name', { required: isSignUpMode ? 'Name is required' : false })}
                type="text"
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Full name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              {...register('email', {
                required: 'Email is required',
                pattern: { value: /^\S+@\S+$/i, message: 'Please enter a valid email address' },
              })}
              type="email"
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
              type="password"
              className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              placeholder="Password"
            />
            {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
          </div>

          <div>
            <Button
              type="submit"
              disabled={isLoading}
              isLoading={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (isSignUpMode ? 'Creating Account...' : 'Signing in...') : (isSignUpMode ? 'Create Account' : 'Sign in')}
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Button
          type="button"
          onClick={() => handleSocialLogin('google')}
          disabled={isLoading}
          variant="outline"
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          <span className="ml-2">Continue with Google</span>
        </Button>

        <Button
          type="button"
          onClick={() => handleSocialLogin('facebook')}
          disabled={isLoading}
          variant="outline"
          className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="ml-2">Continue with Facebook</span>
        </Button>
      </div>

      {emailEnabled && (
        <div className="text-xs text-gray-500 text-center">
          Or continue with a social provider below.
        </div>
      )}
    </div>
  );
}