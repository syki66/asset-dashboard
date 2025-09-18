import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string;
  description: string;
  icon?: React.ReactNode;
  valueClassName?: string;
  descClassName?: string;
  theme?: {
    iconClassName: string;
  };
}

export default function DashboardCard({
  title,
  value,
  description,
  icon,
  valueClassName = '',
  descClassName = '',
  theme,
}: DashboardCardProps) {
  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex h-full">
        <div className="flex-grow p-6">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className={cn('text-2xl font-bold', valueClassName)}>
              {value}
            </div>
            <p className={cn('text-xs text-muted-foreground mt-1', descClassName)}>
              {description}
            </p>
          </CardContent>
        </div>
        {icon && theme && (
          <div
            className={cn(
              'flex items-center justify-center w-1/3',
            )}
          >
            {React.cloneElement(icon as React.ReactElement, {
              className: cn('h-8 w-8', theme.iconClassName),
            })}
          </div>
        )}
      </div>
    </Card>
  );
}
