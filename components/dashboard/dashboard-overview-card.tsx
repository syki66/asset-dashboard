import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ContentItem {
  label: string;
  value: React.ReactNode;
  valueClassName?: string;
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
    <Card className={cn('glass-card', className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4" style={{ color: themeColor }} />
      </CardHeader>
      <CardContent className="space-y-3">
        {contentItems.map((item, index) => (
          <div key={index} className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">{item.label}</span>
            <span className={cn('font-semibold', item.valueClassName)}>
              {item.value}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
