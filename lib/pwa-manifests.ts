import type { MetadataRoute } from 'next';

const icons: MetadataRoute.Manifest['icons'] = [
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
];

const commonManifest = {
  scope: '/',
  display: 'standalone',
  orientation: 'any',
  background_color: '#fbf9ff',
  theme_color: '#f4efff',
  lang: 'ko-KR',
  categories: ['finance', 'productivity', 'utilities'],
  icons,
} satisfies Partial<MetadataRoute.Manifest>;

export const mainManifest: MetadataRoute.Manifest = {
  ...commonManifest,
  id: '/',
  name: '자산 대시보드',
  short_name: '자산 대시보드',
  description:
    '거래내역 CSV로 수익률, 배당, 리스크와 포트폴리오를 분석하는 개인 투자 대시보드',
  start_url: '/setup',
};

export const adminManifest: MetadataRoute.Manifest = {
  ...commonManifest,
  id: '/admin',
  name: '자산 대시보드 Admin',
  short_name: '자산 Admin',
  description: '암호화된 CSV 데이터를 안전하게 저장하고 불러오는 관리자 앱',
  start_url: '/admin',
};
