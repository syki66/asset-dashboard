'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, LockKeyhole, LogIn, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth/auth-provider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      router.replace(nextPath);
    }
  }, [nextPath, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isConfigured) {
      toast.error('Supabase 환경변수가 설정되지 않았습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast.success('로그인했습니다.');
        router.replace(nextPath);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.session) {
        toast.success('계정을 만들고 로그인했습니다.');
        router.replace(nextPath);
      } else {
        toast.success('확인 메일을 보냈습니다.', {
          description: '이메일 인증 후 로그인해 주세요.',
        });
        setMode('sign-in');
        setPassword('');
      }
    } catch (error) {
      toast.error(mode === 'sign-in' ? '로그인 실패' : '회원가입 실패', {
        description:
          error instanceof Error
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isAuthLoading || isSubmitting || Boolean(user);

  return (
    <main className='relative flex min-h-screen items-center justify-center overflow-hidden bg-[linear-gradient(135deg,oklch(0.94_0.05_250),oklch(0.96_0.04_160)_42%,oklch(0.96_0.04_82))] p-6'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_14%,oklch(0.62_0.24_255/0.22),transparent_28%),radial-gradient(circle_at_84%_18%,oklch(0.66_0.22_155/0.2),transparent_30%),radial-gradient(circle_at_70%_88%,oklch(0.78_0.16_82/0.18),transparent_32%)]' />
      <Card className='liquid-glass-surface relative w-full max-w-md overflow-hidden rounded-2xl shadow-2xl shadow-black/10'>
        <div className='absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.62_0.24_255),oklch(0.66_0.22_155),oklch(0.78_0.16_82))]' />
        <CardHeader className='space-y-3 px-7 pt-8'>
          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <LockKeyhole className='h-6 w-6' />
          </div>
          <div>
            <CardTitle className='text-2xl font-bold'>
              {mode === 'sign-in' ? '로그인' : '계정 만들기'}
            </CardTitle>
            <CardDescription className='mt-2 leading-relaxed'>
              계정별 암호화 CSV는 본인만 저장하고 불러올 수 있습니다.
            </CardDescription>
          </div>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='space-y-4 px-7 py-2'>
            {!isConfigured && (
              <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive'>
                Supabase 환경변수를 먼저 설정해 주세요.
              </div>
            )}
            <div className='space-y-2'>
              <Label htmlFor='email'>이메일</Label>
              <Input
                id='email'
                type='email'
                autoComplete='email'
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder='name@example.com'
                required
                disabled={isBusy || !isConfigured}
                className='h-11 rounded-xl bg-white/20'
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='password'>비밀번호</Label>
              <Input
                id='password'
                type='password'
                autoComplete={
                  mode === 'sign-in' ? 'current-password' : 'new-password'
                }
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={6}
                required
                disabled={isBusy || !isConfigured}
                className='h-11 rounded-xl bg-white/20'
              />
            </div>
          </CardContent>
          <CardFooter className='flex flex-col gap-3 px-7 pb-7 pt-6'>
            <Button
              type='submit'
              className='h-11 w-full cursor-pointer rounded-xl'
              disabled={isBusy || !isConfigured}
            >
              {isBusy ? (
                <Loader2 className='animate-spin' />
              ) : mode === 'sign-in' ? (
                <LogIn />
              ) : (
                <UserPlus />
              )}
              {mode === 'sign-in' ? '로그인' : '회원가입'}
            </Button>
            <Button
              type='button'
              variant='ghost'
              className='w-full cursor-pointer rounded-xl'
              disabled={isBusy}
              onClick={() => {
                setMode((current) =>
                  current === 'sign-in' ? 'sign-up' : 'sign-in',
                );
                setPassword('');
              }}
            >
              {mode === 'sign-in'
                ? '계정이 없나요? 회원가입'
                : '이미 계정이 있나요? 로그인'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
