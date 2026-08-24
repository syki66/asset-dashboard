'use client';

import { useEffect, useState, type ReactNode } from 'react';

import { shouldShowPokugiBrand } from '@/lib/pokugi-brand';

export function PokugiBrandOnly({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(shouldShowPokugiBrand(window.location.host));
  }, []);

  return isVisible ? children : null;
}
