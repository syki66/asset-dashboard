'use client';

import Image from 'next/image';
import { Fingerprint, Loader2, LockKeyhole, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  authenticateDevice,
  DEVICE_AUTH_CHANGE_EVENT,
  DEVICE_AUTH_PROMPT_ATTRIBUTE,
  getDeviceAuthErrorMessage,
  hasDeviceAuthCredential,
  removeDeviceAuth,
} from '@/lib/device-auth';

const PRIVACY_ATTRIBUTE = 'data-privacy-locked';

export function PrivacyScreen() {
  const pathname = usePathname();
  const unlockButtonRef = useRef<HTMLButtonElement>(null);
  const [isDeviceAuthEnabled, setIsDeviceAuthEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authenticationError, setAuthenticationError] = useState('');
  const [isResetConfirming, setIsResetConfirming] = useState(false);

  useEffect(() => {
    if (
      pathname.startsWith('/setup') ||
      pathname.startsWith('/admin') ||
      pathname.startsWith('/reset-password') ||
      pathname.startsWith('/login')
    ) {
      document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
      return;
    }

    const lock = () => {
      if (
        document.documentElement.hasAttribute(
          DEVICE_AUTH_PROMPT_ATTRIBUTE,
        )
      ) {
        return;
      }

      setAuthenticationError('');
      setIsResetConfirming(false);
      document.documentElement.setAttribute(PRIVACY_ATTRIBUTE, 'true');
    };

    const syncDeviceAuth = () => {
      setIsDeviceAuthEnabled(hasDeviceAuthCredential());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        lock();
        return;
      }

      if (document.documentElement.hasAttribute(PRIVACY_ATTRIBUTE)) {
        requestAnimationFrame(() => unlockButtonRef.current?.focus());
      }
    };

    syncDeviceAuth();
    if (document.visibilityState === 'hidden') lock();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('freeze', lock);
    window.addEventListener('blur', lock);
    window.addEventListener('pagehide', lock);
    window.addEventListener(DEVICE_AUTH_CHANGE_EVENT, syncDeviceAuth);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('freeze', lock);
      window.removeEventListener('blur', lock);
      window.removeEventListener('pagehide', lock);
      window.removeEventListener(DEVICE_AUTH_CHANGE_EVENT, syncDeviceAuth);
      document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
    };
  }, [pathname]);

  const unlock = async () => {
    if (!isDeviceAuthEnabled) {
      document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
      return;
    }

    setIsAuthenticating(true);
    setAuthenticationError('');
    setIsResetConfirming(false);

    try {
      await authenticateDevice();
      document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
    } catch (error) {
      setAuthenticationError(getDeviceAuthErrorMessage(error));
    } finally {
      setIsAuthenticating(false);
    }
  };

  const resetDeviceRegistration = () => {
    removeDeviceAuth();
    setIsDeviceAuthEnabled(false);
    setAuthenticationError('');
    setIsResetConfirming(false);
    document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
    toast.info('기기 인증 등록을 초기화했습니다.', {
      description: '대시보드 설정에서 생체인증을 다시 등록해 주세요.',
    });
  };

  return (
    <div
      className='privacy-screen'
      role='dialog'
      aria-modal='true'
      aria-labelledby='privacy-screen-title'
      aria-describedby='privacy-screen-description'
    >
      <div className='privacy-screen__card'>
        <Image
          className='privacy-screen__icon'
          src='/icons/icon-192.png'
          width={88}
          height={88}
          priority
          alt=''
        />
        <div className='privacy-screen__badge' aria-hidden='true'>
          <LockKeyhole size={16} strokeWidth={2.25} />
          보호 중
        </div>
        <h2 id='privacy-screen-title'>자산 정보를 가렸습니다</h2>
        <p id='privacy-screen-description'>
          {isDeviceAuthEnabled
            ? '등록한 기기의 생체인증을 완료하면 자산 정보를 다시 볼 수 있습니다.'
            : '다른 사람이 화면을 볼 수 없도록 안전하게 보호하고 있습니다.'}
        </p>
        {authenticationError && (
          <>
            <p className='privacy-screen__error' role='alert'>
              {authenticationError}
            </p>
            {isDeviceAuthEnabled && !isResetConfirming && (
              <button
                className='privacy-screen__reset-button'
                type='button'
                disabled={isAuthenticating}
                onClick={() => setIsResetConfirming(true)}
              >
                <RotateCcw size={16} />
                기기 인증 재설정
              </button>
            )}
          </>
        )}
        {isResetConfirming && (
          <div className='privacy-screen__reset-confirmation' role='alert'>
            <p>
              이 브라우저의 기존 등록 정보를 지우고 화면을 엽니다. 이후 설정에서
              생체인증을 다시 등록해야 합니다.
            </p>
            <div>
              <button type='button' onClick={() => setIsResetConfirming(false)}>
                취소
              </button>
              <button type='button' onClick={resetDeviceRegistration}>
                초기화하고 열기
              </button>
            </div>
          </div>
        )}
        {!isResetConfirming && (
          <button
            ref={unlockButtonRef}
            className='privacy-screen__button'
            type='button'
            disabled={isAuthenticating}
            onClick={() => void unlock()}
          >
            {isAuthenticating ? (
              <Loader2 className='animate-spin' size={19} />
            ) : isDeviceAuthEnabled ? (
              <Fingerprint size={19} />
            ) : null}
            {isAuthenticating
              ? '인증 확인 중'
              : isDeviceAuthEnabled
                ? '생체인증으로 열기'
                : '화면 다시 보기'}
          </button>
        )}
      </div>
    </div>
  );
}
