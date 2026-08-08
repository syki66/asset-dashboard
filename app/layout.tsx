import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '@/utils/providers/providers';
import { Toaster } from '@/components/ui/sonner';
import { PwaRegister } from '@/components/pwa-register';
import { PrivacyScreen } from '@/components/privacy-screen';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://asset.pokugi.com';

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Pokugi Studio',
  url: 'https://pokugi.com',
  email: 'mailto:66syki@gmail.com',
  logo: `${siteUrl}/icons/icon-512.png`,
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: '66syki@gmail.com',
    availableLanguage: ['ko'],
  },
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: '자산 대시보드 | 내 투자 자산 분석',
    template: '%s | 자산 대시보드',
  },
  description:
    '신한투자증권 거래내역 CSV로 수익률, 배당, 리스크, 포트폴리오와 거래 기록을 한눈에 분석하는 개인 투자 대시보드입니다.',
  applicationName: '자산 대시보드',
  keywords: [
    '자산관리',
    '투자 대시보드',
    '포트폴리오 분석',
    '주식 수익률',
    '배당 분석',
    '투자 리스크',
    '신한투자증권 CSV',
  ],
  authors: [
    { name: 'Pokugi Studio', url: 'https://asset.pokugi.com' },
  ],
  creator: 'Pokugi Studio',
  publisher: 'Pokugi Studio',
  category: 'finance',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: '/',
    siteName: '자산 대시보드',
    title: '자산 대시보드 | 내 투자 자산 분석',
    description:
      '거래내역 CSV 한 번으로 수익률부터 배당, 리스크, 포트폴리오까지 한눈에 분석하세요.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: '자산 대시보드 — 나만의 투자 기록을 한눈에',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '자산 대시보드 | 내 투자 자산 분석',
    description:
      '거래내역 CSV로 수익률, 배당, 리스크와 포트폴리오를 한눈에 분석하세요.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icons/icon-32.png', type: 'image/png', sizes: '32x32' },
      { url: '/icons/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '자산 대시보드',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f4efff',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <head>
        <script
          id='organization-json-ld'
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd).replace(
              /</g,
              '\\u003c',
            ),
          }}
        />
      </head>
      <body className={`${pretendard.variable} antialiased`}>
        <PrivacyScreen />
        <Providers>{children}</Providers>
        <Toaster expand={true} position='top-center' />
        <PwaRegister />
      </body>
    </html>
  );
}
