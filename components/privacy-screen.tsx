'use client';

import Image from 'next/image';
import { Fingerprint, Loader2, LockKeyhole } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import {
  authenticateDevice,
  DEVICE_AUTH_CHANGE_EVENT,
  DEVICE_AUTH_PROMPT_ATTRIBUTE,
  getDeviceAuthErrorMessage,
  hasDeviceAuthCredential,
} from '@/lib/device-auth';

const PRIVACY_ATTRIBUTE = 'data-privacy-locked';

export function PrivacyScreen() {
  const pathname = usePathname();
  const unlockButtonRef = useRef<HTMLButtonElement>(null);
  const [isDeviceAuthEnabled, setIsDeviceAuthEnabled] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authenticationError, setAuthenticationError] = useState('');

  useEffect(() => {
    if (pathname.startsWith('/setup') || pathname.startsWith('/login')) {
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

    try {
      await authenticateDevice();
      document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
    } catch (error) {
      setAuthenticationError(getDeviceAuthErrorMessage(error));
    } finally {
      setIsAuthenticating(false);
    }
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
          <p className='privacy-screen__error' role='alert'>
            {authenticationError}
          </p>
        )}
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
      </div>
    </div>
  );
}
