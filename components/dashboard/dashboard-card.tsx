import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import React from 'react';
import { InfoTooltip } from './info-tooltip';

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  icon?: React.ElementType;
  valueClassName?: string;
  descClassName?: string;
  themeColor?: string;
  info?: React.ReactNode;
}

export default function DashboardCard({
  title,
  value,
  description,
  icon: Icon,
  valueClassName = '',
  descClassName = '',
  themeColor,
  info,
}: DashboardCardProps) {
  return (
    <Card className="dashboard-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3.5 pb-2.5 sm:p-4 sm:pb-2 lg:h-[52px] lg:p-6 lg:pb-2">
        <div className="flex items-center gap-1">
          <CardTitle className="text-lg font-medium leading-snug lg:text-sm lg:leading-none">{title}</CardTitle>
          {info && <InfoTooltip info={info} className="-ml-1.5 lg:ml-0" />}
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" style={{ color: themeColor }} />}
      </CardHeader>
      <CardContent className="p-3.5 pt-0 sm:p-4 sm:pt-0 lg:p-6 lg:pt-0">
        <div
          className={cn(
            'break-words text-xl font-bold sm:text-2xl lg:break-normal',
            valueClassName,
          )}
          style={{ color: themeColor }}
        >
          {value}
        </div>
        <p className={cn('text-xs text-muted-foreground mt-1', descClassName)}>
          {description}
        </p>
      </CardContent>
    </Card>
  );
}
