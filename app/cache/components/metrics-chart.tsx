/**
 * 缓存指标图表组件
 * 使用图表展示缓存性能指标的时间序列数据
 */

'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// Badge component available if needed
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { MetricsDataPoint, TimeRange } from '@/lib/cache-types';
import { formatNumber } from '@/lib/cache-service';

interface MetricsChartProps {
  data: MetricsDataPoint[];
  loading?: boolean;
  error?: string | null;
  timeRange?: TimeRange;
  className?: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; color: string; name: string }>;
  label?: string;
}

function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium mb-2">
          {new Date(label || '').toLocaleString()}
        </p>
        {payload.map((entry, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export function MetricsChart({ data, loading, error, timeRange, className }: MetricsChartProps) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    return data.map(point => ({
      timestamp: point.timestamp,
      time: new Date(point.timestamp).toLocaleTimeString(),
      hit_rate: (point.hit_rate * 100).toFixed(1),
      miss_rate: (point.miss_rate * 100).toFixed(1),
      memory_usage_mb: (point.memory_usage / (1024 * 1024)).toFixed(1),
      operations_per_second: point.operations_per_second,
      response_time: point.response_time.toFixed(1),
      connections: point.connections,
    }));
  }, [data]);

  const trends = useMemo(() => {
    if (chartData.length < 2) return null;
    
    const first = chartData[0];
    const last = chartData[chartData.length - 1];
    
    return {
      hit_rate: {
        current: parseFloat(last.hit_rate),
        previous: parseFloat(first.hit_rate),
        change: parseFloat(last.hit_rate) - parseFloat(first.hit_rate),
      },
      memory_usage: {
        current: parseFloat(last.memory_usage_mb),
        previous: parseFloat(first.memory_usage_mb),
        change: parseFloat(last.memory_usage_mb) - parseFloat(first.memory_usage_mb),
      },
      operations_per_second: {
        current: parseInt(last.operations_per_second),
        previous: parseInt(first.operations_per_second),
        change: parseInt(last.operations_per_second) - parseInt(first.operations_per_second),
      },
      response_time: {
        current: parseFloat(last.response_time),
        previous: parseFloat(first.response_time),
        change: parseFloat(last.response_time) - parseFloat(first.response_time),
      },
    };
  }, [chartData]);

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendColor = (change: number, inverse = false) => {
    if (inverse) {
      // 对于响应时间等指标，降低是好的
      if (change > 0) return 'text-red-600';
      if (change < 0) return 'text-green-600';
    } else {
      if (change > 0) return 'text-green-600';
      if (change < 0) return 'text-red-600';
    }
    return 'text-gray-400';
  };

  if (loading) {
    return <MetricsChartSkeleton className={className} />;
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>指标图表</CardTitle>
          <CardDescription className="text-destructive">{error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>指标图表</CardTitle>
          <CardDescription>暂无数据</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 趋势指标 */}
      {trends && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">命中率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{trends.hit_rate.current}%</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(trends.hit_rate.change)}
                  <span className={`text-sm ${getTrendColor(trends.hit_rate.change)}`}>
                    {trends.hit_rate.change > 0 ? '+' : ''}{trends.hit_rate.change.toFixed(1)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">内存使用</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{trends.memory_usage.current}MB</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(trends.memory_usage.change)}
                  <span className={`text-sm ${getTrendColor(trends.memory_usage.change)}`}>
                    {trends.memory_usage.change > 0 ? '+' : ''}{trends.memory_usage.change.toFixed(1)}MB
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">操作速率</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{formatNumber(trends.operations_per_second.current)}</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(trends.operations_per_second.change)}
                  <span className={`text-sm ${getTrendColor(trends.operations_per_second.change)}`}>
                    {trends.operations_per_second.change > 0 ? '+' : ''}{formatNumber(trends.operations_per_second.change)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">响应时间</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{trends.response_time.current}ms</span>
                <div className="flex items-center gap-1">
                  {getTrendIcon(trends.response_time.change)}
                  <span className={`text-sm ${getTrendColor(trends.response_time.change, true)}`}>
                    {trends.response_time.change > 0 ? '+' : ''}{trends.response_time.change.toFixed(1)}ms
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 命中率图表 */}
      <Card>
        <CardHeader>
          <CardTitle>命中率趋势</CardTitle>
          <CardDescription>缓存命中率和未命中率的变化趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  domain={[0, 100]}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="hit_rate"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="命中率 (%)"
                />
                <Area
                  type="monotone"
                  dataKey="miss_rate"
                  stackId="1"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.3}
                  name="未命中率 (%)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 性能指标图表 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>内存使用趋势</CardTitle>
            <CardDescription>内存使用量变化</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="memory_usage_mb"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                    name="内存使用 (MB)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>响应性能</CardTitle>
            <CardDescription>操作速率和响应时间</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 12 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="operations_per_second"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    name="操作速率 (ops/s)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="response_time"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={false}
                    name="响应时间 (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 连接数图表 */}
      <Card>
        <CardHeader>
          <CardTitle>连接数趋势</CardTitle>
          <CardDescription>客户端连接数变化</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 12 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="connections"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                  name="连接数"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricsChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-20" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-4 w-12" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {[...Array(3)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[250px] w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}