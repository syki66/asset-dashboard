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
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-1">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {info && <InfoTooltip info={info} />}
        </div>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" style={{ color: themeColor }} />}
      </CardHeader>
      <CardContent>
        <div
          className={cn('text-2xl font-bold', valueClassName)}
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
