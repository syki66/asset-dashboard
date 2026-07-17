import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Providers from '@/utils/providers/providers';
import { Toaster } from '@/components/ui/sonner';

const pretendard = localFont({
  src: './fonts/PretendardVariable.woff2',
  display: 'swap',
  weight: '45 920',
  variable: '--font-pretendard',
});

export const metadata: Metadata = {
  title: {
    default: 'Asset Dashboard',
    template: '%s | Asset Dashboard',
  },
  description:
    '거래내역 CSV로 자산 구성과 투자 기록을 살펴보는 개인용 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='ko'>
      <body className={`${pretendard.variable} antialiased`}>
        <Providers>{children}</Providers>
        <Toaster expand={true} position='top-center' />
      </body>
    </html>
  );
}
