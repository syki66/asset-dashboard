import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { InfoTooltip } from './info-tooltip';
import React from 'react';

interface ContentItem {
  label: React.ReactNode;
  value: React.ReactNode;
  valueClassName?: string;
  className?: string;
  hasDivider?: boolean;
  dividerClassName?: string;
  info?: React.ReactNode;
}

interface DashboardOverviewCardProps {
  title: string;
  icon: React.ElementType;
  contentItems: ContentItem[];
  className?: string;
  titleClassName?: string;
  contentClassName?: string;
  itemClassName?: string;
  itemLabelClassName?: string;
  itemValueClassName?: string;
  themeColor?: string;
  mobileItemLayout?: 'stacked' | 'horizontal';
}

export function DashboardOverviewCard({
  title,
  icon: Icon,
  contentItems,
  className,
  titleClassName,
  contentClassName,
  itemClassName,
  itemLabelClassName,
  itemValueClassName,
  themeColor,
  mobileItemLayout = 'stacked',
}: DashboardOverviewCardProps) {
  return (
    <Card className={cn('dashboard-card flex flex-col h-full', className)}>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 p-3.5 pb-2.5 sm:p-4 sm:pb-2 lg:h-16 lg:p-6 lg:pb-3'>
        <CardTitle
          className={cn(
            'text-lg font-medium leading-snug sm:leading-none',
            titleClassName,
          )}
        >
          {title}
        </CardTitle>
        <Icon className='h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4' style={{ color: themeColor }} />
      </CardHeader>
      <CardContent
        className={cn(
          'flex flex-1 flex-col space-y-2.5 p-3.5 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pt-0',
          contentClassName,
        )}
      >
        {contentItems.map((item, index) => (
          <div
            key={index}
            className={cn(item.hasDivider && 'mt-auto', item.className)}
          >
            {item.hasDivider && (
              <div
                className={cn(
                  'border-t border-border my-2 pt-1',
                  item.dividerClassName,
                )}
              />
            )}
            <div
              className={cn(
                'group/item flex sm:flex-row sm:items-center sm:justify-between sm:gap-3 lg:gap-0',
                mobileItemLayout === 'horizontal'
                  ? 'flex-row items-center justify-between gap-3'
                  : 'flex-col items-start gap-0.5',
                itemClassName,
              )}
            >
              <div className='flex min-w-0 items-center gap-1 lg:min-w-[auto]'>
                <span
                  className={cn(
                    'text-base text-muted-foreground lg:text-sm',
                    itemLabelClassName,
                  )}
                >
                  {item.label}
                </span>
                {item.info && (
                  <InfoTooltip
                    info={item.info}
                    className='-ml-1.5 lg:ml-0'
                  />
                )}
              </div>
              <span
                className={cn(
                  'min-w-0 break-words text-base font-semibold leading-tight tabular-nums sm:w-auto sm:text-right lg:min-w-[auto] lg:break-normal lg:text-left lg:leading-6 lg:normal-nums',
                  mobileItemLayout === 'horizontal'
                    ? 'w-auto text-right'
                    : 'w-full text-left',
                  itemValueClassName,
                  item.valueClassName,
                )}
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
