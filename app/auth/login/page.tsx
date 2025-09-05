import LoginForm from '@/src/components/auth/LoginForm';
import AuthError from '@/src/components/auth/AuthError';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Login | Boleka',
  description: 'Login to your Boleka account',
};

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <AuthError />
      <LoginForm />
    </div>
  );
}
