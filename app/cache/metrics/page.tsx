/**
 * 缓存指标总览页面
 * 展示实时和历史缓存性能指标
 */

'use client';

import { useState } from 'react';
import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { CacheOverview, MetricsChart } from '../components';
import { TimeRangeSelector } from './components';
import { useMetricsHistory, useAllCacheMetrics } from '@/hooks/use-cache-metrics';
import type { TimeRange } from '@/lib/cache-types';

export default function CacheMetricsPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end: new Date().toISOString(),
    interval: '15m',
  });

  const { refreshAll } = useAllCacheMetrics();
  const { history, loading: historyLoading, error: historyError, refresh: refreshHistory } = useMetricsHistory(timeRange, [timeRange]);

  const handleRefreshAll = () => {
    refreshAll();
    refreshHistory();
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">缓存指标</h2>
        <Button onClick={handleRefreshAll} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          刷新数据
        </Button>
      </div>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">实时指标</TabsTrigger>
          <TabsTrigger value="history">历史趋势</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          <CacheOverview />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-4">
            <div className="md:col-span-1">
              <TimeRangeSelector
                value={timeRange}
                onChange={setTimeRange}
              />
            </div>
            <div className="md:col-span-3">
              <MetricsChart
                data={history?.data || []}
                loading={historyLoading}
                error={historyError}
                timeRange={timeRange}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}