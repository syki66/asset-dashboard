import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './info-tooltip';
import React from 'react';

interface ContentItem {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
  hasDivider?: boolean;
  info?: React.ReactNode;
}

interface DashboardOverviewCardProps {
  title: string;
  icon: React.ElementType;
  contentItems: ContentItem[];
  className?: string;
  themeColor?: string;
}

export function DashboardOverviewCard({
  title,
  icon: Icon,
  contentItems,
  className,
  themeColor,
}: DashboardOverviewCardProps) {
  return (
    <Card className={cn('dashboard-card flex flex-col h-full', className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-3'>
        <CardTitle className='text-lg font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4' style={{ color: themeColor }} />
      </CardHeader>
      <CardContent className='flex-1 flex flex-col space-y-2.5'>
        {contentItems.map((item, index) => (
          <div key={index} className={cn(item.hasDivider && 'mt-auto')}>
            {item.hasDivider && (
              <div className='border-t border-border my-2 pt-1' />
            )}
            <div className='flex justify-between items-center group/item'>
              <div className='flex items-center gap-1'>
                <span className='text-sm text-muted-foreground'>
                  {item.label}
                </span>
                {item.info && <InfoTooltip info={item.info} />}
              </div>
              <span
                className={cn('font-semibold', item.valueClassName)}
                // CSS의 ::after가 같은 텍스트를 복제해 글로우 레이어로 쓰기 위한 값
                data-value={
                  typeof item.value === 'string' ||
                  typeof item.value === 'number'
                    ? item.value
                    : undefined
                }
              >
                {item.value}
              </span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
