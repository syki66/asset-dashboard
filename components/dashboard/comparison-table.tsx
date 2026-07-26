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
      <CardHeader className='flex flex-row items-center justify-between space-y-0 p-3.5 pb-2.5 sm:p-4 sm:pb-2 lg:p-6 lg:pb-3'>
        <CardTitle className='flex items-center gap-2 text-lg font-medium'>
          {icon}
          {title}
        </CardTitle>
        {addon}
      </CardHeader>
      <CardContent className='px-3.5 pb-4 sm:px-4'>
        <Table className='min-w-[42rem] whitespace-nowrap lg:min-w-[auto] lg:whitespace-normal'>
          <TableHeader>
            <TableRow className='hover:bg-transparent'>
              <TableHead className='w-1/4 lg:w-[28%]'>지표</TableHead>
              <TableHead
                style={{ color: themeColor }}
                className='w-1/4 text-right lg:w-[24%]'
              >
                내 포트폴리오
              </TableHead>
              <TableHead className='w-1/4 text-right lg:w-[24%]'>
                벤치마크 (최상)
              </TableHead>
              <TableHead className='w-1/4 text-right lg:w-[24%]'>
                벤치마크 (최악)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody
            className='[&_td]:py-2 lg:[&_td]:py-3'
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
                    {data.info && (
                      <InfoTooltip
                        info={data.info}
                        className='-ml-1.5 lg:ml-0'
                      />
                    )}
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
