'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { shouldShowPokugiBrand } from '@/lib/pokugi-brand';

export function PokugiBrandOnly({
  children,
  fallback = null,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  const [isVisible, setIsVisible] = useState<boolean | null>(null);

  useEffect(() => {
    setIsVisible(shouldShowPokugiBrand(window.location.host));
  }, []);

  if (isVisible === null) return null;

  return isVisible ? children : fallback;
}
