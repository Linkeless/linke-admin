/**
 * 实时监控面板组件
 * 显示缓存系统的实时性能数据和状态
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Activity, 
  Pause, 
  Play, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Database,
  Users,
  Zap
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { useRealtimeMonitoring } from '@/hooks/use-cache-monitoring';
import { formatBytes, formatNumber, formatPercentage } from '@/lib/cache-service';

interface RealtimePanelProps {
  className?: string;
}

export function RealtimePanel({ className }: RealtimePanelProps) {
  const { 
    data, 
    loading, 
    error, 
    isConnected, 
    history, 
    startMonitoring, 
    stopMonitoring,
    performanceTrend 
  } = useRealtimeMonitoring(5000);

  const [isPaused, setIsPaused] = useState(false);

  const handleToggleMonitoring = () => {
    if (isPaused) {
      startMonitoring();
      setIsPaused(false);
    } else {
      stopMonitoring();
      setIsPaused(true);
    }
  };

  const getConnectionStatus = () => {
    if (loading) return { text: '连接中...', color: 'secondary' };
    if (!isConnected) return { text: '已断开', color: 'destructive' };
    if (isPaused) return { text: '已暂停', color: 'secondary' };
    return { text: '已连接', color: 'default' };
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗️';
      case 'down': return '↘️';
      default: return '➡️';
    }
  };

  const status = getConnectionStatus();
  const chartData = history.slice(-20).map((item, index) => ({
    index,
    hit_rate: item.metrics.hit_rate * 100,
    memory_usage: (item.metrics.memory_usage / (1024 * 1024)), // MB
    operations: item.metrics.operations_per_second,
    response_time: item.metrics.response_time,
  }));

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 连接状态和控制 */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>实时监控</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status.color as any}>{status.text}</Badge>
              <Button
                onClick={handleToggleMonitoring}
                variant="outline"
                size="sm"
              >
                {isPaused ? (
                  <Play className="h-4 w-4 mr-2" />
                ) : (
                  <Pause className="h-4 w-4 mr-2" />
                )}
                {isPaused ? '开始' : '暂停'}
              </Button>
            </div>
          </div>
          <CardDescription>
            实时缓存性能监控 - 每5秒更新
            {data && (
              <span className="ml-2 text-muted-foreground">
                最后更新: {new Date(data.timestamp).toLocaleTimeString()}
              </span>
            )}
          </CardDescription>
        </CardHeader>
      </Card>

      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              <span>连接错误: {error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {data && (
        <>
          {/* 关键指标卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">命中率</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatPercentage(data.metrics.hit_rate)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {performanceTrend && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {getTrendIcon(performanceTrend.hit_rate.trend)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        相比前期: {formatPercentage(performanceTrend.hit_rate.previous)}
                      </span>
                    </>
                  )}
                </div>
                <Progress value={data.metrics.hit_rate * 100} className="mt-2" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">内存使用</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(data.metrics.memory_usage)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {performanceTrend && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {getTrendIcon(performanceTrend.memory_usage.trend)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        相比前期: {formatBytes(performanceTrend.memory_usage.previous)}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">操作速率</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.metrics.operations_per_second)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">ops/sec</p>
                <div className="flex items-center gap-1">
                  {performanceTrend && (
                    <>
                      <span className="text-xs text-muted-foreground">
                        {getTrendIcon(performanceTrend.operations_per_second.trend)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        相比前期: {formatNumber(performanceTrend.operations_per_second.previous)}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">连接数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatNumber(data.metrics.connections)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  <span className="text-xs text-muted-foreground">
                    响应时间: {data.metrics.response_time.toFixed(1)}ms
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 实时图表 */}
          {chartData.length > 1 && (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">命中率趋势</CardTitle>
                  <CardDescription>最近20个数据点</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="index" hide />
                        <YAxis domain={[0, 100]} hide />
                        <Line
                          type="monotone"
                          dataKey="hit_rate"
                          stroke="#10b981"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">内存使用趋势</CardTitle>
                  <CardDescription>最近20个数据点 (MB)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="index" hide />
                        <YAxis hide />
                        <Line
                          type="monotone"
                          dataKey="memory_usage"
                          stroke="#3b82f6"
                          strokeWidth={2}
                          dot={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 热门键和慢查询 */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">热门缓存键</CardTitle>
                <CardDescription>访问频率最高的缓存键</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {data.top_keys.map((key, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {key.key}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>命中: {formatNumber(key.hits)}</span>
                            <span>内存: {formatBytes(key.memory_usage)}</span>
                            <span>TTL: {key.ttl > 0 ? `${key.ttl}s` : '永久'}</span>
                          </div>
                        </div>
                        <Badge variant="secondary">#{index + 1}</Badge>
                      </div>
                    ))}
                    {data.top_keys.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        暂无数据
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">慢查询记录</CardTitle>
                <CardDescription>响应时间较长的操作</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="space-y-3">
                    {data.slow_queries.map((query, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {query.command}
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {query.duration.toFixed(1)}ms
                            </span>
                            <span>客户端: {query.client}</span>
                            <span>
                              {new Date(query.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>
                        <Badge variant={query.duration > 100 ? 'destructive' : 'secondary'}>
                          {query.duration > 100 ? '慢' : '一般'}
                        </Badge>
                      </div>
                    ))}
                    {data.slow_queries.length === 0 && (
                      <p className="text-center text-muted-foreground py-4">
                        暂无慢查询
                      </p>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {!data && !loading && !error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>等待监控数据...</p>
              <p className="text-sm mt-2">请确保缓存服务正在运行并且网络连接正常</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}