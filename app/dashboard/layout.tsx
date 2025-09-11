'use client';

import { RainbowNav, type NavItem } from '@/components/ui/rainbow-nav';
import {
  Home,
  BarChart3,
  Users,
  Settings,
  FileText,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useState } from 'react';

type RootLayoutProps = {
  children: React.ReactNode;
};

const defaultMenuItems: NavItem[] = [
  {
    id: 'dashboard',
    label: '자산 개요',
    icon: Home,
    href: '/dashboard/overview',
  },
  {
    id: 'dividends',
    label: '배당금 정보',
    icon: Users,
    href: '/dashboard/dividends',
  },
  {
    id: 'portfolio',
    label: '포트폴리오 현황',
    icon: BarChart3,
    href: '/dashboard/portfolio',
  },
  {
    id: 'analytics',
    label: '자산 분석',
    icon: FileText,
    href: '/dashboard/analytics',
  },
  {
    id: 'history',
    label: '거래내역',
    icon: Calendar,
    href: '/dashboard/history',
  },
  {
    id: 'benchmark',
    label: '벤치마크 비교',
    icon: MessageSquare,
    href: '/dashboard/benchmark',
  },
  // {
  //   id: 'report',
  //   label: '차트 분석',
  //   icon: Settings,
  //   href: '/dashboard/report',
  // },
  {
    id: 'settings',
    label: '설정',
    icon: Settings,
    href: '/dashboard/settings',
  },
];

export default function RootLayout({ children }: RootLayoutProps) {
  const [internalActiveItem, setInternalActiveItem] = useState('dashboard');

  return (
    <>
      <div className="flex min-h-screen bg-background">
        <div className="w-64 h-screen bg-sidebar border-r border-sidebar-border shadow-lg">
          <div className="p-6 border-b border-sidebar-border">
            <h1 className="text-xl font-bold text-sidebar-foreground">
              자산 대시보드
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              사이드바 설명입니다
            </p>
          </div>
          <RainbowNav
            items={defaultMenuItems}
            activeItem={internalActiveItem}
            onItemClick={setInternalActiveItem}
          />
        </div>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </>
  );
}
