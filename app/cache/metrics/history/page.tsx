/**
 * 历史指标详细页面
 * 提供更详细的历史指标分析功能
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { MetricsChart } from '../../components';
import { TimeRangeSelector } from '../components';
import { useMetricsHistory } from '@/hooks/use-cache-metrics';
import { formatPercentage, formatBytes, formatNumber } from '@/lib/cache-service';
import type { TimeRange, MetricsDataPoint } from '@/lib/cache-types';

export default function MetricsHistoryPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    interval: '1h',
  });

  const { history, loading, error, refresh } = useMetricsHistory(timeRange, [timeRange]);

  // 计算统计指标
  const getStats = (data: MetricsDataPoint[]) => {
    if (!data || data.length === 0) return null;

    const hitRates = data.map(d => d.hit_rate);
    const memoryUsages = data.map(d => d.memory_usage);
    const operations = data.map(d => d.operations_per_second);
    const responseTimes = data.map(d => d.response_time);

    return {
      hitRate: {
        avg: hitRates.reduce((a, b) => a + b, 0) / hitRates.length,
        min: Math.min(...hitRates),
        max: Math.max(...hitRates),
      },
      memoryUsage: {
        avg: memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length,
        min: Math.min(...memoryUsages),
        max: Math.max(...memoryUsages),
      },
      operations: {
        avg: operations.reduce((a, b) => a + b, 0) / operations.length,
        min: Math.min(...operations),
        max: Math.max(...operations),
      },
      responseTime: {
        avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
      },
    };
  };

  const stats = history?.data ? getStats(history.data) : null;

  const exportData = () => {
    if (!history?.data) return;

    const csvContent = [
      ['时间', '命中率', '未命中率', '内存使用(MB)', '操作/秒', '响应时间(ms)', '连接数'],
      ...history.data.map(item => [
        new Date(item.timestamp).toLocaleString(),
        (item.hit_rate * 100).toFixed(2),
        (item.miss_rate * 100).toFixed(2),
        (item.memory_usage / (1024 * 1024)).toFixed(2),
        item.operations_per_second.toString(),
        item.response_time.toFixed(2),
        item.connections.toString(),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cache-metrics-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">历史指标分析</h2>
        <div className="flex gap-2">
          <Button onClick={exportData} variant="outline" disabled={!history?.data}>
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </Button>
          <Button onClick={refresh} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <div className="md:col-span-1">
          <TimeRangeSelector
            value={timeRange}
            onChange={setTimeRange}
          />

          {/* 统计摘要 */}
          {stats && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>统计摘要</CardTitle>
                <CardDescription>选定时间范围内的关键指标统计</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">命中率</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">平均:</span>
                      <span>{formatPercentage(stats.hitRate.avg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最低:</span>
                      <span className="text-red-600">{formatPercentage(stats.hitRate.min)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最高:</span>
                      <span className="text-green-600">{formatPercentage(stats.hitRate.max)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">内存使用</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">平均:</span>
                      <span>{formatBytes(stats.memoryUsage.avg)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最低:</span>
                      <span className="text-green-600">{formatBytes(stats.memoryUsage.min)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最高:</span>
                      <span className="text-red-600">{formatBytes(stats.memoryUsage.max)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">操作速率</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">平均:</span>
                      <span>{formatNumber(stats.operations.avg)}/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最低:</span>
                      <span className="text-red-600">{formatNumber(stats.operations.min)}/s</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最高:</span>
                      <span className="text-green-600">{formatNumber(stats.operations.max)}/s</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-sm">响应时间</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">平均:</span>
                      <span>{stats.responseTime.avg.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最快:</span>
                      <span className="text-green-600">{stats.responseTime.min.toFixed(1)}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">最慢:</span>
                      <span className="text-red-600">{stats.responseTime.max.toFixed(1)}ms</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="md:col-span-3">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview">综合图表</TabsTrigger>
              <TabsTrigger value="detailed">详细分析</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <MetricsChart
                data={history?.data || []}
                loading={loading}
                error={error}
                timeRange={timeRange}
              />
            </TabsContent>

            <TabsContent value="detailed" className="space-y-4">
              {/* 性能趋势分析 */}
              {history?.data && history.data.length > 1 && (
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">性能趋势</CardTitle>
                      <CardDescription>关键指标的变化趋势分析</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {(() => {
                        const first = history.data[0];
                        const last = history.data[history.data.length - 1];
                        
                        const trends = [
                          {
                            name: '命中率',
                            current: last.hit_rate,
                            previous: first.hit_rate,
                            format: formatPercentage,
                            inverse: false,
                          },
                          {
                            name: '内存使用',
                            current: last.memory_usage,
                            previous: first.memory_usage,
                            format: formatBytes,
                            inverse: true,
                          },
                          {
                            name: '操作速率',
                            current: last.operations_per_second,
                            previous: first.operations_per_second,
                            format: (v: number) => `${formatNumber(v)}/s`,
                            inverse: false,
                          },
                          {
                            name: '响应时间',
                            current: last.response_time,
                            previous: first.response_time,
                            format: (v: number) => `${v.toFixed(1)}ms`,
                            inverse: true,
                          },
                        ];

                        return trends.map((trend, index) => {
                          const change = trend.current - trend.previous;
                          const changePercent = ((change / trend.previous) * 100);
                          const isImprovement = trend.inverse ? change < 0 : change > 0;
                          
                          return (
                            <div key={index} className="flex items-center justify-between">
                              <span className="text-sm font-medium">{trend.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{trend.format(trend.current)}</span>
                                <Badge
                                  variant={isImprovement ? 'default' : 'secondary'}
                                  className="flex items-center gap-1"
                                >
                                  {isImprovement ? (
                                    <TrendingUp className="h-3 w-3" />
                                  ) : (
                                    <TrendingDown className="h-3 w-3" />
                                  )}
                                  {changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%
                                </Badge>
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">数据概览</CardTitle>
                      <CardDescription>当前数据集的基本信息</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">数据点数量:</span>
                          <span>{history.data.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">时间跨度:</span>
                          <span>{history.timeRange}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">数据间隔:</span>
                          <span>{history.interval}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">开始时间:</span>
                          <span>
                            {new Date(history.data[0].timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">结束时间:</span>
                          <span>
                            {new Date(history.data[history.data.length - 1].timestamp).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}