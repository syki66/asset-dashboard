'use client';

import Image from 'next/image';
import Link from 'next/link';
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type RefObject,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LockKeyhole,
  Mail,
  Send,
  ShieldCheck,
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

const MIN_ACCOUNT_PASSWORD_LENGTH = 12;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type RecoveryState = 'checking' | 'ready' | 'invalid';
type ResetFieldErrors = {
  email?: string;
  newPassword?: string;
  passwordConfirmation?: string;
};

export function ResetPasswordForm({
  isRecoveryFlow,
}: {
  isRecoveryFlow: boolean;
}) {
  const router = useRouter();
  const { isConfigured } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ResetFieldErrors>({});
  const emailInputRef = useRef<HTMLInputElement>(null);
  const newPasswordInputRef = useRef<HTMLInputElement>(null);
  const passwordConfirmationInputRef = useRef<HTMLInputElement>(null);
  const [recoveryState, setRecoveryState] = useState<RecoveryState>(
    isRecoveryFlow ? 'checking' : 'invalid',
  );

  useEffect(() => {
    if (!isRecoveryFlow || !isConfigured) return;

    const supabase = getSupabaseBrowserClient();
    let isMounted = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === 'PASSWORD_RECOVERY' || session) {
        setRecoveryState('ready');
      }
    });

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      setRecoveryState(!error && data.session ? 'ready' : 'invalid');
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured, isRecoveryFlow]);

  const requestResetEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldErrors({
        email: !trimmedEmail
          ? '이메일을 입력해 주세요.'
          : '올바른 이메일 형식으로 입력해 주세요.',
      });
      emailInputRef.current?.focus();
      return;
    }

    setFieldErrors({});

    if (!isConfigured) {
      toast.error('Supabase 환경변수가 설정되지 않았습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/reset-password/recovery`;
      const { error } = await supabase.auth.resetPasswordForEmail(
        trimmedEmail,
        { redirectTo },
      );

      if (error) throw error;

      setEmailSent(true);
      toast.success('비밀번호 재설정 메일을 보냈습니다.');
    } catch (error) {
      toast.error('재설정 메일 발송 실패', {
        description:
          error instanceof Error
            ? error.message
            : '잠시 후 다시 시도해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: ResetFieldErrors = {};

    if (!newPassword) {
      nextErrors.newPassword = '새 비밀번호를 입력해 주세요.';
    } else if (newPassword.length < MIN_ACCOUNT_PASSWORD_LENGTH) {
      nextErrors.newPassword = `새 비밀번호는 ${MIN_ACCOUNT_PASSWORD_LENGTH}자 이상 입력해 주세요.`;
    }

    if (!passwordConfirmation) {
      nextErrors.passwordConfirmation = '새 비밀번호를 한 번 더 입력해 주세요.';
    } else if (newPassword !== passwordConfirmation) {
      nextErrors.passwordConfirmation = '새 비밀번호가 서로 일치하지 않습니다.';
    }

    setFieldErrors(nextErrors);

    if (nextErrors.newPassword || nextErrors.passwordConfirmation) {
      if (nextErrors.newPassword) {
        newPasswordInputRef.current?.focus();
      } else {
        passwordConfirmationInputRef.current?.focus();
      }
      return;
    }

    setIsSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast.success('비밀번호를 변경했습니다.');
      router.replace('/admin');
    } catch (error) {
      toast.error('비밀번호 변경 실패', {
        description:
          error instanceof Error
            ? error.message
            : '재설정 링크를 다시 요청해 주세요.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = isSubmitting || !isConfigured;

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
              비밀번호 재설정
            </CardTitle>
            <CardDescription className='mt-2 leading-relaxed'>
              {isRecoveryFlow
                ? '계정에 사용할 새 비밀번호를 입력해 주세요.'
                : '가입한 이메일로 안전한 재설정 링크를 보내드립니다.'}
            </CardDescription>
          </div>
        </CardHeader>

        {!isConfigured ? (
          <CardContent className='px-5 pb-7 sm:px-7'>
            <div className='rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-base text-destructive sm:text-sm'>
              Supabase 환경변수를 먼저 설정해 주세요.
            </div>
          </CardContent>
        ) : isRecoveryFlow && recoveryState === 'checking' ? (
          <CardContent className='flex items-center justify-center gap-2 px-5 pb-8 pt-3 text-sm font-semibold text-muted-foreground sm:px-7'>
            <Loader2 className='h-4 w-4 animate-spin' />
            재설정 링크를 확인하고 있습니다.
          </CardContent>
        ) : isRecoveryFlow && recoveryState === 'invalid' ? (
          <CardContent className='space-y-4 px-5 pb-7 sm:px-7'>
            <div className='rounded-2xl border border-amber-300/35 bg-amber-100/30 p-4 text-sm leading-relaxed text-amber-950/75 backdrop-blur-md'>
              재설정 링크가 만료되었거나 유효하지 않습니다. 새 링크를 요청해
              주세요.
            </div>
            <Button asChild variant='outline' className='interactive-lift h-11 w-full rounded-2xl border-white/40 bg-white/25'>
              <Link href='/reset-password'>재설정 링크 다시 받기</Link>
            </Button>
          </CardContent>
        ) : isRecoveryFlow ? (
          <form onSubmit={updatePassword} noValidate>
            <CardContent className='space-y-4 px-5 pb-1 pt-3 sm:px-7'>
              <PasswordInput
                id='new-password'
                label='새 비밀번호'
                value={newPassword}
                onChange={(value) => {
                  setNewPassword(value);
                  if (fieldErrors.newPassword) {
                    setFieldErrors((current) => ({
                      ...current,
                      newPassword: undefined,
                    }));
                  }
                }}
                error={fieldErrors.newPassword}
                inputRef={newPasswordInputRef}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                disabled={isSubmitting}
              />
              <PasswordInput
                id='password-confirmation'
                label='새 비밀번호 확인'
                value={passwordConfirmation}
                onChange={(value) => {
                  setPasswordConfirmation(value);
                  if (fieldErrors.passwordConfirmation) {
                    setFieldErrors((current) => ({
                      ...current,
                      passwordConfirmation: undefined,
                    }));
                  }
                }}
                error={fieldErrors.passwordConfirmation}
                inputRef={passwordConfirmationInputRef}
                showPassword={showPassword}
                onTogglePassword={() => setShowPassword((current) => !current)}
                disabled={isSubmitting}
              />
              <p className='px-1 text-xs text-muted-foreground'>
                계정 비밀번호는 {MIN_ACCOUNT_PASSWORD_LENGTH}자 이상 입력해 주세요.
              </p>
            </CardContent>
            <CardFooter className='flex flex-col gap-3 px-5 pb-6 pt-5 sm:px-7 sm:pb-7'>
              <Button
                type='submit'
                className='interactive-lift h-12 w-full cursor-pointer rounded-2xl border border-white/35 bg-[linear-gradient(110deg,oklch(0.61_0.18_250),oklch(0.62_0.17_285))] text-white shadow-lg shadow-blue-500/20 backdrop-blur-md hover:opacity-90'
                disabled={isSubmitting}
              >
                {isSubmitting ? <Loader2 className='animate-spin' /> : <KeyRound />}
                새 비밀번호 저장
              </Button>
            </CardFooter>
          </form>
        ) : emailSent ? (
          <CardContent className='space-y-5 px-5 pb-7 pt-2 text-center sm:px-7'>
            <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-300/35 bg-emerald-100/35 text-emerald-700 shadow-sm backdrop-blur-md'>
              <CheckCircle2 className='h-7 w-7' />
            </div>
            <div>
              <p className='font-bold'>이메일을 확인해 주세요.</p>
              <p className='mt-2 text-sm leading-relaxed text-muted-foreground'>
                계정이 존재하면 재설정 링크가 발송됩니다. 메일이 보이지 않으면
                스팸함도 확인해 주세요.
              </p>
            </div>
            <Button
              type='button'
              variant='outline'
              className='interactive-lift h-11 w-full cursor-pointer rounded-2xl !border-white/40 !bg-white/25 !text-foreground hover:!bg-white/40 hover:!text-foreground focus-visible:ring-violet-400/20'
              onClick={() => setEmailSent(false)}
            >
              다른 이메일로 다시 요청
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={requestResetEmail} noValidate>
            <CardContent className='space-y-4 px-5 pb-1 pt-3 sm:px-7'>
              <div className='space-y-2'>
                <Label htmlFor='reset-email'>이메일</Label>
                <div className='group relative'>
                  <Mail className='pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-violet-600/55 transition-colors group-focus-within:text-violet-700' />
                  <Input
                    ref={emailInputRef}
                    id='reset-email'
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
                      fieldErrors.email ? 'reset-email-error' : undefined
                    }
                    disabled={isBusy}
                    className={cn(
                      'h-12 rounded-2xl !border-white/40 !bg-white/25 pl-10 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_0.35rem_1rem_oklch(0.55_0.07_285/0.07)] backdrop-blur-md placeholder:text-muted-foreground/65 focus-visible:!border-violet-300/65 focus-visible:ring-violet-400/20',
                      fieldErrors.email &&
                        '!border-destructive/55 focus-visible:!border-destructive/70 focus-visible:ring-destructive/15',
                    )}
                  />
                </div>
                {fieldErrors.email && (
                  <p
                    id='reset-email-error'
                    role='alert'
                    className='px-1 text-xs font-medium text-destructive'
                  >
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            </CardContent>
            <CardFooter className='flex flex-col gap-3 px-5 pb-6 pt-5 sm:px-7 sm:pb-7'>
              <Button
                type='submit'
                className='interactive-lift h-12 w-full cursor-pointer rounded-2xl border border-white/35 bg-[linear-gradient(110deg,oklch(0.61_0.18_250),oklch(0.62_0.17_285))] text-white shadow-lg shadow-blue-500/20 backdrop-blur-md hover:opacity-90'
                disabled={isBusy}
              >
                {isSubmitting ? <Loader2 className='animate-spin' /> : <Send />}
                재설정 메일 보내기
              </Button>
              <Link
                href='/login?next=%2Fadmin'
                className='inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground'
              >
                <ArrowLeft className='h-3.5 w-3.5' />
                로그인으로 돌아가기
              </Link>
            </CardFooter>
          </form>
        )}

        <div className='flex items-center justify-center gap-1.5 border-t border-white/25 bg-white/10 px-5 py-3 text-center text-xs text-muted-foreground sm:px-7'>
          <ShieldCheck className='h-3.5 w-3.5 shrink-0 text-violet-600/65' />
          CSV 암호화 비밀번호는 변경되지 않습니다.
        </div>
      </Card>
    </main>
  );
}

function PasswordInput({
  id,
  label,
  value,
  onChange,
  error,
  inputRef,
  showPassword,
  onTogglePassword,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  inputRef: RefObject<HTMLInputElement>;
  showPassword: boolean;
  onTogglePassword: () => void;
  disabled: boolean;
}) {
  return (
    <div className='space-y-2'>
      <Label htmlFor={id}>{label}</Label>
      <div className='group relative'>
        <LockKeyhole className='pointer-events-none absolute left-3.5 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-violet-600/55 transition-colors group-focus-within:text-violet-700' />
        <Input
          ref={inputRef}
          id={id}
          type={showPassword ? 'text' : 'password'}
          autoComplete='new-password'
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-required='true'
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={disabled}
          className={cn(
            'h-12 rounded-2xl !border-white/40 !bg-white/25 pl-10 pr-12 shadow-[inset_0_1px_0_rgb(255_255_255/0.45),0_0.35rem_1rem_oklch(0.55_0.07_285/0.07)] backdrop-blur-md focus-visible:!border-violet-300/65 focus-visible:ring-violet-400/20',
            error &&
              '!border-destructive/55 focus-visible:!border-destructive/70 focus-visible:ring-destructive/15',
          )}
        />
        <button
          type='button'
          className='absolute right-1.5 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-xl border border-white/30 bg-white/15 text-muted-foreground shadow-sm backdrop-blur-md transition-all hover:bg-white/30 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400/30'
          disabled={disabled}
          aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
          aria-pressed={showPassword}
          onClick={onTogglePassword}
        >
          {showPassword ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
        </button>
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role='alert'
          className='px-1 text-xs font-medium text-destructive'
        >
          {error}
        </p>
      )}
    </div>
  );
}
