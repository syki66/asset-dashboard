import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: '자산 대시보드',
    short_name: '자산 대시보드',
    description:
      '거래내역 CSV로 수익률, 배당, 리스크와 포트폴리오를 분석하는 개인 투자 대시보드',
    start_url: '/setup',
    scope: '/',
    display: 'standalone',
    orientation: 'any',
    background_color: '#fbf9ff',
    theme_color: '#f4efff',
    lang: 'ko-KR',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-maskable-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
