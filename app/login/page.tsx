import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: 'Login - Asset Dashboard',
  description: 'Sign in to access encrypted CSV storage',
};

const getSafeNextPath = (value?: string | string[]) => {
  const nextPath = Array.isArray(value) ? value[0] : value;

  if (!nextPath?.startsWith('/') || nextPath.startsWith('//')) {
    return '/setup';
  }

  return nextPath;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) {
  const { next } = await searchParams;

  return <LoginForm nextPath={getSafeNextPath(next)} />;
}
