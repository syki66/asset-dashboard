import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리자 설정',
  description: '암호화된 CSV 데이터를 안전하게 저장하고 불러옵니다.',
  alternates: { canonical: '/admin' },
  manifest: '/admin/manifest.webmanifest',
  applicationName: '자산 대시보드 Admin',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '자산 대시보드 Admin',
  },
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
