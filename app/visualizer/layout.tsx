import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Asset Visualizer',
  description: 'Visualize your assets',
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return <>{children}</>;
}
