'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Home, SearchX } from 'lucide-react';

import { SiteFooter } from '@/components/footer/site-footer';
import { Button } from '@/components/ui/button';

const REDIRECT_DELAY_SECONDS = 5;

export default function NotFound() {
  const router = useRouter();
  const [secondsRemaining, setSecondsRemaining] = useState(
    REDIRECT_DELAY_SECONDS,
  );

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setSecondsRemaining((current) => Math.max(0, current - 1));
    }, 1000);
    const redirectTimer = window.setTimeout(() => {
      router.replace('/');
    }, REDIRECT_DELAY_SECONDS * 1000);

    return () => {
      window.clearInterval(countdownTimer);
      window.clearTimeout(redirectTimer);
    };
  }, [router]);

  return (
    <main className='relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[linear-gradient(135deg,oklch(0.955_0.035_285),oklch(0.975_0.025_345)_48%,oklch(0.965_0.03_210))] p-4 sm:p-6 lg:min-h-screen lg:p-8'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_14%_12%,oklch(0.7_0.17_285/0.2),transparent_28%),radial-gradient(circle_at_88%_18%,oklch(0.78_0.14_20/0.18),transparent_30%),radial-gradient(circle_at_72%_88%,oklch(0.76_0.13_210/0.18),transparent_32%)]' />
      <div className='pointer-events-none absolute left-[8%] top-[12%] h-24 w-24 rounded-full border border-white/40 bg-white/10 blur-sm sm:h-36 sm:w-36' />
      <div className='pointer-events-none absolute bottom-[10%] right-[7%] h-32 w-32 rounded-full border border-white/35 bg-white/10 blur-sm sm:h-44 sm:w-44' />

      <section className='liquid-glass-surface relative w-full max-w-[30rem] overflow-hidden !rounded-[2rem] !border-white/40 !bg-white/30 px-5 py-8 text-center shadow-[0_2rem_5rem_oklch(0.46_0.08_285/0.16),inset_0_1px_0_rgb(255_255_255/0.65)] backdrop-blur-2xl sm:px-8 sm:py-10'>
        <div className='absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,oklch(0.68_0.17_285),oklch(0.76_0.14_345),oklch(0.76_0.13_210))]' />

        <div className='relative mx-auto mb-5 w-fit'>
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

        <div className='mx-auto mb-4 flex w-fit items-center gap-2 rounded-full border border-violet-300/35 bg-violet-100/35 px-3 py-1.5 text-sm font-bold text-violet-800 shadow-sm backdrop-blur-md'>
          <SearchX className='h-4 w-4' />
          404
        </div>

        <h1 className='text-2xl font-extrabold tracking-tight sm:text-3xl'>
          페이지를 찾을 수 없습니다
        </h1>
        <p className='mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground sm:text-base'>
          주소가 잘못 입력되었거나 페이지가 이동 또는 삭제되었습니다.
        </p>
        <p className='mt-2 text-xs font-semibold text-violet-700/70 sm:text-sm'>
          {secondsRemaining}초 후 홈으로 자동 이동합니다.
        </p>

        <div className='mx-auto mt-7 max-w-xs'>
          <Button
            type='button'
            className='interactive-lift h-11 w-full cursor-pointer rounded-2xl border border-white/35 bg-[linear-gradient(110deg,oklch(0.61_0.18_250),oklch(0.62_0.17_285))] text-white shadow-lg shadow-blue-500/20 backdrop-blur-md hover:opacity-90'
            onClick={() => router.replace('/')}
          >
            <Home />
            홈으로 이동
          </Button>
        </div>
      </section>

      <div className='mt-6 w-full max-w-[30rem]'>
        <SiteFooter className='w-full' />
      </div>
    </main>
  );
}
