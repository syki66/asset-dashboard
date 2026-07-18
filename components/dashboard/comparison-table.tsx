'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { InfoTooltip } from './info-tooltip';

export type ComparisonData = {
  metric: string;
  investment: string;
  benchmarkBest: string;
  benchmarkWorst?: string;
  info?: React.ReactNode;
};

export type ComparisonTableProps = {
  comparisonData: ComparisonData[];
  themeColor?: string;
  title?: string;
  icon?: React.ReactNode;
  addon?: React.ReactNode;
};

export function ComparisonTable({
  comparisonData,
  themeColor = 'var(--overview-theme)',
  title = '벤치마크 비교',
  icon,
  addon,
}: ComparisonTableProps) {
  // Derive the hover background color variable from the theme color variable
  const hoverBgVar = themeColor.replace('-theme)', '-hover-bg)');

  return (
    <Card className='dashboard-card'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg font-medium'>
          {icon}
          {title}
        </CardTitle>
        {addon}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='w-1/4'>지표</TableHead>
              <TableHead
                style={{ color: themeColor }}
                className='w-1/4 text-right'
              >
                내 포트폴리오
              </TableHead>
              <TableHead className='w-1/4 text-right'>
                벤치마크 (최상)
              </TableHead>
              <TableHead className='w-1/4 text-right'>
                벤치마크 (최악)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            style={{ '--row-hover-bg': hoverBgVar } as React.CSSProperties}
          >
            {comparisonData.map((data) => (
              <TableRow
                key={data.metric}
                className='transition-colors hover:bg-[var(--row-hover-bg)]'
              >
                <TableCell>
                  <div className='flex items-center gap-1'>
                    <span>{data.metric}</span>
                    {data.info && <InfoTooltip info={data.info} />}
                  </div>
                </TableCell>
                <TableCell style={{ color: themeColor }} className='text-right'>
                  {data.investment}
                </TableCell>
                <TableCell className='text-right'>
                  {data.benchmarkBest}
                </TableCell>
                <TableCell className='text-right'>
                  {data.benchmarkWorst || '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
