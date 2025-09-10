import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Setup - Asset Visualizer',
  description: 'Setup your account and preferences',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return <>{children}</>;
}
