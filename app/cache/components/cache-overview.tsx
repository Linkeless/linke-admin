/**
 * 缓存概览组件
 * 展示缓存系统的整体状态和关键指标
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, TrendingUp, RefreshCw } from 'lucide-react';
import { useAllCacheMetrics } from '@/hooks/use-cache-metrics';
import { formatBytes, formatDuration, formatNumber, formatPercentage } from '@/lib/cache-service';
import type { CacheHealth } from '@/lib/cache-types';

interface CacheOverviewProps {
  className?: string;
}

export function CacheOverview({ className }: CacheOverviewProps) {
  const {
    metrics,
    stats,
    performance,
    health,
    loading,
    error,
    lastUpdated,
    healthScore,
    isHealthy,
    refreshAll,
  } = useAllCacheMetrics();

  if (loading) {
    return <CacheOverviewSkeleton />;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            加载失败
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={refreshAll} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            重新加载
          </Button>
        </CardContent>
      </Card>
    );
  }

  const getHealthStatus = (health: CacheHealth | null) => {
    if (!health) return { color: 'secondary', text: '未知' };
    
    switch (health.status) {
      case 'healthy':
        return { color: 'default', text: '健康' };
      case 'warning':
        return { color: 'secondary', text: '警告' };
      case 'critical':
        return { color: 'destructive', text: '严重' };
      default:
        return { color: 'secondary', text: '未知' };
    }
  };

  const healthStatus = getHealthStatus(health);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 系统状态概览 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">系统状态</CardTitle>
            {isHealthy ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{healthScore}/100</div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={healthStatus.color as 'default' | 'destructive' | 'outline' | 'secondary'}>
                {healthStatus.text}
              </Badge>
              {health && (
                <p className="text-xs text-muted-foreground">
                  运行时间: {formatDuration(health.uptime)}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">命中率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatPercentage(metrics.hit_rate) : '--'}
            </div>
            <Progress 
              value={metrics ? metrics.hit_rate * 100 : 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {stats ? `${formatNumber(stats.cache_hits)} / ${formatNumber(stats.total_requests)}` : '--'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">内存使用</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatBytes(metrics.memory_usage) : '--'}
            </div>
            <Progress 
              value={metrics ? metrics.memory_percentage : 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {metrics ? `${metrics.memory_percentage.toFixed(1)}% 已使用` : '--'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">操作速率</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics ? formatNumber(metrics.operations_per_second) : '--'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              ops/sec
            </p>
            <p className="text-xs text-muted-foreground">
              响应时间: {metrics ? `${metrics.avg_response_time.toFixed(1)}ms` : '--'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 详细指标 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>性能指标</CardTitle>
            <CardDescription>系统性能关键指标</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {performance && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">CPU 使用率</span>
                  <span className="text-sm">{performance.cpu_usage.toFixed(1)}%</span>
                </div>
                <Progress value={performance.cpu_usage} />

                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">网络 I/O</span>
                  <span className="text-sm">
                    {formatBytes(performance.network_io.bytes_in + performance.network_io.bytes_out)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">P95 延迟</p>
                    <p className="font-medium">{performance.latency.p95.toFixed(1)}ms</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">P99 延迟</p>
                    <p className="font-medium">{performance.latency.p99.toFixed(1)}ms</p>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>连接信息</CardTitle>
            <CardDescription>客户端连接状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats && metrics && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(stats.connected_clients)}
                    </div>
                    <p className="text-sm text-muted-foreground">活跃连接</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {formatNumber(stats.blocked_clients)}
                    </div>
                    <p className="text-sm text-muted-foreground">阻塞连接</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">总键数</span>
                    <span className="text-sm font-medium">
                      {formatNumber(metrics.total_keys)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">过期键数</span>
                    <span className="text-sm font-medium">
                      {formatNumber(metrics.expired_keys)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">活跃键数</span>
                    <span className="text-sm font-medium">
                      {formatNumber(metrics.active_keys)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 底部状态栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>
                最后更新: {lastUpdated ? lastUpdated.toLocaleTimeString() : '--'}
              </span>
              {health && health.warnings.length > 0 && (
                <Badge variant="secondary">
                  {health.warnings.length} 个警告
                </Badge>
              )}
              {health && health.errors.length > 0 && (
                <Badge variant="destructive">
                  {health.errors.length} 个错误
                </Badge>
              )}
            </div>
            <Button onClick={refreshAll} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CacheOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-2 w-full mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid gap-4 md:grid-cols-2">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}