import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = {
  title: '로그인',
  description: '암호화된 CSV 저장 데이터를 안전하게 불러오세요.',
  robots: { index: false, follow: false },
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
