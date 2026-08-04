'use client';

import { Fingerprint, Loader2, RotateCcw, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  authenticateDevice,
  getDeviceAuthErrorMessage,
  hasDeviceAuthCredential,
  isDeviceAuthSupported,
  registerDeviceAuth,
  removeDeviceAuth,
} from '@/lib/device-auth';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function DeviceAuthSettings() {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    setIsEnabled(hasDeviceAuthCredential());
    void isDeviceAuthSupported().then(setIsSupported);
  }, []);

  const enableDeviceAuth = async () => {
    setIsBusy(true);
    try {
      await registerDeviceAuth();
      setIsEnabled(true);
      toast.success('생체인증 잠금을 활성화했습니다.', {
        description: '백그라운드에서 돌아올 때 기기 인증이 필요합니다.',
      });
    } catch (error) {
      toast.error('생체인증을 설정하지 못했습니다.', {
        description: getDeviceAuthErrorMessage(error),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const disableDeviceAuth = async () => {
    setIsBusy(true);
    try {
      await authenticateDevice();
      removeDeviceAuth();
      setIsEnabled(false);
      toast.success('생체인증 잠금을 해제했습니다.');
    } catch (error) {
      toast.error('생체인증 잠금을 해제하지 못했습니다.', {
        description: getDeviceAuthErrorMessage(error),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const resetDeviceAuth = async () => {
    setIsBusy(true);

    // 기기에서 패스키가 먼저 삭제된 경우 기존 Credential ID로는 인증할 수
    // 없으므로 브라우저의 로컬 등록을 제거하고 새 자격 증명을 생성합니다.
    removeDeviceAuth();
    setIsEnabled(false);

    try {
      await registerDeviceAuth();
      setIsEnabled(true);
      toast.success('생체인증 잠금을 다시 등록했습니다.', {
        description: '새로 생성한 기기 인증 정보로 화면 잠금을 해제합니다.',
      });
    } catch (error) {
      toast.error('기존 등록은 초기화했지만 재등록을 완료하지 못했습니다.', {
        description: getDeviceAuthErrorMessage(error),
      });
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <Card className='dashboard-card mb-4 overflow-hidden lg:mb-6'>
      <CardHeader className='border-b border-white/5 p-3.5 pb-4 sm:p-4 lg:p-6 lg:pb-4'>
        <CardTitle className='flex items-center gap-2 text-xl font-bold text-foreground sm:text-2xl lg:text-lg'>
          <ShieldCheck
            className='h-5 w-5'
            style={{ color: 'var(--settings-theme)' }}
          />
          프라이버시 잠금
        </CardTitle>
        <CardDescription className='mt-1 leading-relaxed'>
          앱이 백그라운드에서 돌아올 때 Face ID, Touch ID, Windows Hello
          또는 기기 PIN으로 본인을 확인합니다.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-col gap-3 p-3.5 sm:flex-row sm:items-center sm:justify-between sm:p-4 lg:p-6'>
        <div className='flex min-w-0 items-center gap-3'>
          <div className='rounded-xl border border-white/15 bg-white/10 p-2.5 text-[color:var(--settings-theme)]'>
            <Fingerprint className='h-5 w-5' />
          </div>
          <div>
            <p className='font-semibold text-foreground'>
              생체인증으로 화면 잠금 해제
            </p>
            <p className='mt-0.5 text-sm text-muted-foreground'>
              {isSupported === null
                ? '기기 지원 여부를 확인하고 있습니다.'
                : !isSupported
                  ? 'HTTPS와 생체인증을 지원하는 브라우저가 필요합니다.'
                  : isEnabled
                    ? '이 브라우저에서 활성화되어 있습니다.'
                    : '이 브라우저에는 아직 등록되지 않았습니다.'}
            </p>
          </div>
        </div>
        <div className='flex w-full flex-col gap-2 sm:w-auto sm:flex-row'>
          {isEnabled && (
            <Button
              type='button'
              variant='outline'
              className='interactive-lift w-full cursor-pointer sm:w-auto'
              disabled={isBusy || isSupported !== true}
              onClick={() => void resetDeviceAuth()}
            >
              {isBusy ? <Loader2 className='animate-spin' /> : <RotateCcw />}
              재설정
            </Button>
          )}
          <Button
            type='button'
            variant={isEnabled ? 'outline' : 'default'}
            className='interactive-lift w-full cursor-pointer sm:w-auto'
            disabled={isBusy || isSupported !== true}
            onClick={() => {
              void (isEnabled ? disableDeviceAuth() : enableDeviceAuth());
            }}
          >
            {isBusy ? <Loader2 className='animate-spin' /> : <Fingerprint />}
            {isBusy ? '확인 중' : isEnabled ? '사용 해제' : '사용 설정'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
