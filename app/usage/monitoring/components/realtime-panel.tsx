'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Activity, 
  RefreshCw, 
  Play, 
  Pause, 
  Wifi, 
  WifiOff,
  TrendingUp,
  Clock,
  Zap
} from 'lucide-react';
import { RealtimeUsage, UsageType, UsageStatus } from '@/lib/usage-types';
import { UsageService } from '@/lib/usage-service';
import { useRealtimeUsage } from '@/hooks/use-realtime-usage';
import { cn } from '@/lib/utils';

interface RealtimePanelProps {
  subscriptionId: string;
  className?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

// 实时使用量项组件
function RealtimeUsageItem({ usage }: { usage: RealtimeUsage }) {
  const getStatusColor = (status: UsageStatus) => {
    switch (status) {
      case UsageStatus.CRITICAL:
      case UsageStatus.EXCEEDED:
        return 'text-red-500';
      case UsageStatus.WARNING:
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  const getStatusIcon = (status: UsageStatus) => {
    switch (status) {
      case UsageStatus.CRITICAL:
      case UsageStatus.EXCEEDED:
        return '🔴';
      case UsageStatus.WARNING:
        return '🟡';
      default:
        return '🟢';
    }
  };

  const formatUsageRate = (rate: number, type: UsageType) => {
    switch (type) {
      case UsageType.BANDWIDTH:
      case UsageType.STORAGE:
      case UsageType.TRANSFER:
        return `${UsageService.formatBytes(rate * 60)}/分钟`; // 转换为每分钟
      case UsageType.REQUESTS:
      case UsageType.CONNECTIONS:
        return `${Math.round(rate * 60)}/分钟`;
      case UsageType.CPU_TIME:
        return `${rate.toFixed(2)}s/分钟`;
      case UsageType.MEMORY:
        return `${UsageService.formatBytes(rate * 60)}/分钟`;
      default:
        return `${rate.toFixed(2)}/分钟`;
    }
  };

  const percentage = Math.min((usage.current_usage / 100) * 100, 100); // 假设100为最大值

  return (
    <div className="space-y-3 p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon(usage.status)}</span>
          <div>
            <h4 className="font-medium">{UsageService.getUsageTypeDisplayName(usage.usage_type)}</h4>
            <p className="text-sm text-muted-foreground">
              实时使用率: {formatUsageRate(usage.usage_rate, usage.usage_type)}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={cn("text-lg font-bold", getStatusColor(usage.status))}>
            {UsageService.formatUsage(usage.current_usage, usage.usage_type)}
          </div>
          <Badge variant="outline" className="text-xs">
            {percentage.toFixed(1)}%
          </Badge>
        </div>
      </div>

      <Progress value={percentage} className="h-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>最后活动: {new Date(usage.last_activity).toLocaleTimeString('zh-CN')}</span>
        {usage.estimated_depletion && (
          <span className="text-orange-600">
            预计耗尽: {usage.estimated_depletion}
          </span>
        )}
      </div>
    </div>
  );
}

export default function RealtimePanel({
  subscriptionId,
  className,
  autoRefresh = true,
  refreshInterval = 30000 // 30秒
}: RealtimePanelProps) {
  const [manualRefresh, setManualRefresh] = useState(false);

  const {
    data: realtimeData,
    currentUsage,
    loading,
    error,
    lastUpdated,
    isPolling,
    startPolling,
    stopPolling,
    refreshData,
  } = useRealtimeUsage({
    subscriptionId,
    pollingInterval: refreshInterval,
    enabled: autoRefresh
  });

  // 手动控制轮询
  const handleTogglePolling = () => {
    if (isPolling) {
      stopPolling();
    } else {
      startPolling();
    }
  };

  // 手动刷新
  const handleManualRefresh = async () => {
    setManualRefresh(true);
    try {
      await refreshData();
    } finally {
      setManualRefresh(false);
    }
  };

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <WifiOff className="h-5 w-5" />
            连接失败
          </CardTitle>
          <CardDescription>无法获取实时使用量数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={handleManualRefresh} disabled={manualRefresh}>
              <RefreshCw className={cn("mr-2 h-4 w-4", manualRefresh && "animate-spin")} />
              重试
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const connectionStatus = isPolling ? '已连接' : '已断开';
  const connectionColor = isPolling ? 'text-green-600' : 'text-red-600';

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              {isPolling ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              实时监控面板
            </CardTitle>
            <CardDescription>
              订阅 {subscriptionId} 的实时使用量数据
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className={connectionColor}>
              <Activity className="mr-1 h-3 w-3" />
              {connectionStatus}
            </Badge>
          </div>
        </div>

        {/* 控制面板 */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="auto-refresh"
                checked={isPolling}
                onCheckedChange={handleTogglePolling}
              />
              <Label htmlFor="auto-refresh" className="text-sm">
                自动刷新
              </Label>
            </div>

            {lastUpdated && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                {lastUpdated.toLocaleTimeString('zh-CN')}
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            disabled={loading || manualRefresh}
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", (loading || manualRefresh) && "animate-spin")} />
            刷新
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {loading && !realtimeData ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="space-y-3 p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-200 rounded-full" />
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-20" />
                        <div className="h-3 bg-gray-200 rounded w-32" />
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="h-5 bg-gray-200 rounded w-16" />
                      <div className="h-4 bg-gray-200 rounded w-12" />
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded w-full" />
                  <div className="flex justify-between">
                    <div className="h-3 bg-gray-200 rounded w-24" />
                    <div className="h-3 bg-gray-200 rounded w-20" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : realtimeData && realtimeData.length > 0 ? (
          <div className="space-y-4">
            {realtimeData.map((usage) => (
              <RealtimeUsageItem key={usage.usage_type} usage={usage} />
            ))}

            {/* 汇总信息 */}
            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4" />
                实时统计
              </h4>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-medium text-lg">
                    {realtimeData.filter(u => u.status === UsageStatus.NORMAL).length}
                  </div>
                  <div className="text-muted-foreground">正常</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-lg text-yellow-600">
                    {realtimeData.filter(u => u.status === UsageStatus.WARNING).length}
                  </div>
                  <div className="text-muted-foreground">警告</div>
                </div>
                <div className="text-center">
                  <div className="font-medium text-lg text-red-600">
                    {realtimeData.filter(u => u.status === UsageStatus.CRITICAL || u.status === UsageStatus.EXCEEDED).length}
                  </div>
                  <div className="text-muted-foreground">严重</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Activity className="mx-auto h-12 w-12 mb-4 opacity-50" />
            <p>暂无实时数据</p>
            <p className="text-sm mt-1">请确保订阅ID正确且有活动数据</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}