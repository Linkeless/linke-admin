'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { UsageService } from '@/lib/usage-service';
import { UsageData, UsageStatus, UsageType } from '@/lib/usage-types';
import { cn } from '@/lib/utils';

interface UsageOverviewProps {
  data: UsageData[];
  loading?: boolean;
  className?: string;
}

function UsageStatusIcon({ status }: { status: UsageStatus }) {
  switch (status) {
    case UsageStatus.CRITICAL:
    case UsageStatus.EXCEEDED:
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    case UsageStatus.WARNING:
      return <TrendingUp className="h-4 w-4 text-yellow-500" />;
    default:
      return <Minus className="h-4 w-4 text-green-500" />;
  }
}

function UsageStatusBadge({ status, percentage }: { status: UsageStatus; percentage: number }) {
  const getVariant = () => {
    switch (status) {
      case UsageStatus.CRITICAL:
      case UsageStatus.EXCEEDED:
        return 'destructive';
      case UsageStatus.WARNING:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()} className="text-xs">
      {percentage.toFixed(1)}%
    </Badge>
  );
}

function UsageItem({ usage }: { usage: UsageData }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center space-x-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <p className="font-medium">{UsageService.getUsageTypeDisplayName(usage.usage_type)}</p>
            <UsageStatusIcon status={usage.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {UsageService.formatUsage(usage.current_usage, usage.usage_type)} / {UsageService.formatUsage(usage.limit_quota, usage.usage_type)}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="w-24">
          <Progress 
            value={usage.percentage} 
            className={cn(
              "h-2",
              usage.percentage >= 90 && "bg-red-100",
              usage.percentage >= 75 && usage.percentage < 90 && "bg-yellow-100"
            )}
          />
        </div>
        <UsageStatusBadge status={usage.status} percentage={usage.percentage} />
      </div>
    </div>
  );
}

export default function UsageOverview({ data, loading = false, className }: UsageOverviewProps) {
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            使用量概览
          </CardTitle>
          <CardDescription>当前订阅的使用量状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-full" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-32" />
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="w-24 h-2 bg-gray-200 rounded" />
                  <div className="h-6 w-12 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            使用量概览
          </CardTitle>
          <CardDescription>当前订阅的使用量状态</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            暂无使用量数据
          </div>
        </CardContent>
      </Card>
    );
  }

  // 统计信息
  const totalItems = data.length;
  const criticalItems = data.filter(item => item.status === UsageStatus.CRITICAL || item.status === UsageStatus.EXCEEDED).length;
  const warningItems = data.filter(item => item.status === UsageStatus.WARNING).length;
  const normalItems = totalItems - criticalItems - warningItems;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          使用量概览
        </CardTitle>
        <CardDescription>
          共 {totalItems} 项使用量监控
          {criticalItems > 0 && (
            <span className="ml-2 text-red-500">· {criticalItems} 项需要关注</span>
          )}
          {warningItems > 0 && (
            <span className="ml-2 text-yellow-500">· {warningItems} 项警告</span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data
            .sort((a, b) => b.percentage - a.percentage) // 按使用率降序排列
            .map((usage) => (
              <UsageItem key={`${usage.subscription_id}-${usage.usage_type}`} usage={usage} />
            ))
          }
        </div>
        
        {/* 统计摘要 */}
        {totalItems > 0 && (
          <div className="mt-6 pt-4 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">状态分布:</span>
              <div className="flex items-center gap-4">
                {normalItems > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    正常 {normalItems}
                  </span>
                )}
                {warningItems > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-yellow-500" />
                    警告 {warningItems}
                  </span>
                )}
                {criticalItems > 0 && (
                  <span className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    严重 {criticalItems}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}