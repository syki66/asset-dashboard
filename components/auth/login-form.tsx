'use client';

import Image from 'next/image';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Eye,
  EyeOff,
  Loader2,
  LockKeyhole,
  LogIn,
  Mail,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';
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
import { cn } from '@/lib/utils';

type LoginFormProps = {
  nextPath: string;
};

type AuthMode = 'sign-in' | 'sign-up';
type AuthFieldErrors = {
  email?: string;
  password?: string;
};

const MIN_ACCOUNT_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm({ nextPath }: LoginFormProps) {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) router.replace(nextPath);
  }, [nextPath, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors: AuthFieldErrors = {};

    if (!trimmedEmail) {
      nextErrors.email = '이메일을 입력해 주세요.';
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = '올바른 이메일 형식으로 입력해 주세요.';
    }

    if (!password) {
      nextErrors.password = '비밀번호를 입력해 주세요.';
    } else if (
      mode === 'sign-up' &&
      password.length < MIN_ACCOUNT_PASSWORD_LENGTH
    ) {
      nextErrors.password = `비밀번호는 ${MIN_ACCOUNT_PASSWORD_LENGTH}자 이상 입력해 주세요.`;
    }

    setFieldErrors(nextErrors);

    if (nextErrors.email || nextErrors.password) {
      if (nextErrors.email) {
        emailInputRef.current?.focus();
      } else {
        passwordInputRef.current?.focus();
      }
      return;
    }

    if (!isConfigured) {
      toast.error('Supabase 환경변수가 설정되지 않았습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();

      if (mode === 'sign-in') {
        const { error } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (error) throw error;

        toast.success('로그인했습니다.');
        router.replace(nextPath);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
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
        setShowPassword(false);
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

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword('');
    setShowPassword(false);
    setFieldErrors({});
  };

  return (
    <main className='relative flex min-h-dvh items-start justify-center overflow-x-hidden overflow-y-auto bg-[linear-gradient(135deg,oklch(0.955_0.035_285),oklch(0.975_0.025_345)_48%,oklch(0.965_0.03_210))] p-3 sm:items-center sm:p-5 lg:min-h-screen lg:p-8'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,oklch(0.7_0.17_285/0.2),transparent_28%),radial-gradient(circle_at_88%_18%,oklch(0.78_0.14_20/0.18),transparent_30%),radial-gradient(circle_at_72%_88%,oklch(0.76_0.13_210/0.18),transparent_32%)]' />
      <div className='pointer-events-none absolute left-[8%] top-[12%] h-24 w-24 rounded-full border border-white/40 bg-white/10 blur-sm sm:h-36 sm:w-36' />
      <div className='pointer-events-none absolute bottom-[10%] right-[7%] h-32 w-32 rounded-full border border-white/35 bg-white/10 blur-sm sm:h-44 sm:w-44' />

      <Card className='liquid-glass-surface relative w-full max-w-[28rem] overflow-hidden !rounded-[2rem] !border-white/40 !bg-white/30 shadow-[0_2rem_5rem_oklch(0.46_0.08_285/0.16),inset_0_1px_0_rgb(255_255_255/0.65)] backdrop-blur-2xl'>
        <div className='absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.17_285),oklch(0.76_0.14_345),oklch(0.76_0.13_210))]' />

        <CardHeader className='items-center space-y-3 px-5 pb-4 pt-7 text-center sm:px-7 sm:pt-8'>
          <div className='relative'>
            <div className='absolute inset-1 rounded-[1.35rem] bg-violet-400/25 blur-xl' />
            <Image
              src='/icons/icon-192.png'
              width={72}
              height={72}
              priority
              alt='자산 대시보드'
              className='relative h-[4.5rem] w-[4.5rem] rounded-[1.35rem] border-2 border-white/70 shadow-xl shadow-violet-500/15'
            />
          </div>
          <div>
            <p className='mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-violet-700/65'>
              Pokugi Studio
            </p>
            <CardTitle className='text-2xl font-extrabold tracking-tight sm:text-[1.7rem]'>
              자산 대시보드
            </CardTitle>
            <CardDescription className='mt-2 leading-relaxed'>
              암호화된 투자 데이터를 안전하게 저장하고 불러오세요.
            </CardDescription>
          </div>
        </CardHeader>

        <div className='mx-5 mb-2 grid grid-cols-2 gap-1 rounded-2xl border border-white/35 bg-white/20 p-1 shadow-inner shadow-black/5 sm:mx-7 sm:mb-3'>
          {(['sign-in', 'sign-up'] as const).map((item) => (
            <button
              key={item}
              type='button'
              className={cn(
                'h-10 cursor-pointer rounded-xl text-sm font-bold transition-all duration-200',
                mode === item
                  ? item === 'sign-in'
                    ? 'bg-blue-500/15 text-blue-800 shadow-sm ring-1 ring-blue-300/35 backdrop-blur-md'
                    : 'bg-rose-500/15 text-rose-800 shadow-sm ring-1 ring-rose-300/35 backdrop-blur-md'
                  : 'text-muted-foreground hover:bg-white/20 hover:text-foreground',
              )}
              disabled={isBusy}
              onClick={() => changeMode(item)}
            >
              {item === 'sign-in' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <CardContent className='space-y-4 px-5 pb-1 pt-5 sm:px-7'>
            {!isConfigured && (
              <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-base text-destructive sm:text-sm'>
                Supabase 환경변수를 먼저 설정해 주세요.
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='email'>이메일</Label>
              <div className='group relative'>
                <Mail className='pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-violet-600/55 transition-colors group-focus-within:text-violet-700' />
                <Input
                  ref={emailInputRef}
                  id='email'
                  type='email'
                  autoComplete='email'
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (fieldErrors.email) {
                      setFieldErrors((current) => ({
                        ...current,
                        email: undefined,
                      }));
                    }
                  }}
                  placeholder='name@example.com'
                  aria-required='true'
                  aria-invalid={Boolean(fieldErrors.email)}
                  aria-describedby={
                    fieldErrors.email ? 'email-error' : undefined
                  }
                  disabled={isBusy || !isConfigured}
                  className={cn(
                    'h-12 rounded-2xl !border-white/40 !bg-white/25 pl-10 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_0.35rem_1rem_oklch(0.55_0.07_285/0.07)] backdrop-blur-md placeholder:text-muted-foreground/65 focus-visible:!border-violet-300/65 focus-visible:ring-violet-400/20',
                    fieldErrors.email &&
                      '!border-destructive/55 focus-visible:!border-destructive/70 focus-visible:ring-destructive/15',
                  )}
                />
              </div>
              {fieldErrors.email && (
                <p
                  id='email-error'
                  role='alert'
                  className='px-1 text-xs font-medium text-destructive'
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className='space-y-2'>
              <div className='flex items-center justify-between gap-3'>
                <Label htmlFor='password'>비밀번호</Label>
                {mode === 'sign-in' && (
                  <Link
                    href='/reset-password'
                    className='text-xs font-semibold text-violet-700/70 transition-colors hover:text-violet-800 hover:underline'
                  >
                    비밀번호를 잊으셨나요?
                  </Link>
                )}
              </div>
              <div className='group relative'>
                <LockKeyhole className='pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-violet-600/55 transition-colors group-focus-within:text-violet-700' />
                <Input
                  ref={passwordInputRef}
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={
                    mode === 'sign-in' ? 'current-password' : 'new-password'
                  }
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    if (fieldErrors.password) {
                      setFieldErrors((current) => ({
                        ...current,
                        password: undefined,
                      }));
                    }
                  }}
                  aria-required='true'
                  aria-invalid={Boolean(fieldErrors.password)}
                  aria-describedby={
                    fieldErrors.password ? 'password-error' : undefined
                  }
                  disabled={isBusy || !isConfigured}
                  className={cn(
                    'h-12 rounded-2xl !border-white/40 !bg-white/25 pl-10 pr-12 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_0.35rem_1rem_oklch(0.55_0.07_285/0.07)] backdrop-blur-md focus-visible:!border-violet-300/65 focus-visible:ring-violet-400/20',
                    fieldErrors.password &&
                      '!border-destructive/55 focus-visible:!border-destructive/70 focus-visible:ring-destructive/15',
                  )}
                />
                <button
                  type='button'
                  className='absolute right-1.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/15 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:bg-white/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30'
                  disabled={isBusy || !isConfigured}
                  aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p
                  id='password-error'
                  role='alert'
                  className='px-1 text-xs font-medium text-destructive'
                >
                  {fieldErrors.password}
                </p>
              )}
              {mode === 'sign-up' && !fieldErrors.password && (
                <p className='px-1 text-xs text-muted-foreground'>
                  계정 비밀번호는 {MIN_ACCOUNT_PASSWORD_LENGTH}자 이상 입력해
                  주세요.
                </p>
              )}
            </div>
          </CardContent>

          <CardFooter className='flex flex-col gap-3 px-5 pb-6 pt-5 sm:px-7 sm:pb-7'>
            <Button
              type='submit'
              className={cn(
                'interactive-lift h-12 w-full cursor-pointer rounded-2xl border border-white/35 text-white shadow-lg backdrop-blur-md',
                mode === 'sign-in'
                  ? 'bg-[linear-gradient(110deg,oklch(0.61_0.18_250),oklch(0.62_0.17_285))] shadow-blue-500/20 hover:opacity-90'
                  : 'bg-[linear-gradient(110deg,oklch(0.64_0.18_340),oklch(0.66_0.18_20))] shadow-rose-500/20 hover:opacity-90',
              )}
              disabled={isBusy || !isConfigured}
            >
              {isBusy ? (
                <Loader2 className='animate-spin' />
              ) : mode === 'sign-in' ? (
                <LogIn />
              ) : (
                <UserPlus />
              )}
              {mode === 'sign-in' ? '안전하게 로그인' : '계정 만들기'}
            </Button>
            <div className='flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground'>
              <ShieldCheck className='h-3.5 w-3.5 shrink-0 text-violet-600/65' />
              계정 인증과 CSV 암호화 비밀번호는 별개로 동작합니다.
            </div>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
