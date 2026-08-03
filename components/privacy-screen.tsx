'use client';

import Image from 'next/image';
import { LockKeyhole } from 'lucide-react';
import { useEffect, useRef } from 'react';

const PRIVACY_ATTRIBUTE = 'data-privacy-locked';

export function PrivacyScreen() {
  const unlockButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const lock = () => {
      document.documentElement.setAttribute(PRIVACY_ATTRIBUTE, 'true');
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

    if (document.visibilityState === 'hidden') lock();

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('freeze', lock);
    window.addEventListener('blur', lock);
    window.addEventListener('pagehide', lock);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('freeze', lock);
      window.removeEventListener('blur', lock);
      window.removeEventListener('pagehide', lock);
      document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
    };
  }, []);

  const unlock = () => {
    document.documentElement.removeAttribute(PRIVACY_ATTRIBUTE);
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
          다른 사람이 화면을 볼 수 없도록 안전하게 보호하고 있습니다.
        </p>
        <button
          ref={unlockButtonRef}
          className='privacy-screen__button'
          type='button'
          onClick={unlock}
        >
          화면 다시 보기
        </button>
      </div>
    </div>
  );
}
