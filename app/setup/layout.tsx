import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '시작하기',
  description:
    '거래내역 CSV를 불러오고 분석 기준을 설정해 나만의 투자 대시보드를 시작하세요.',
  alternates: { canonical: '/setup' },
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return <>{children}</>;
}
