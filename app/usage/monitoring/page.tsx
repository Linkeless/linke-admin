'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Activity, Monitor, TrendingUp, RefreshCw } from 'lucide-react';
import { SubscriptionSelector } from '@/app/usage/components';
import { UsageChart, RealtimePanel } from './components';

export default function MonitoringPage() {
  const [selectedSubscription, setSelectedSubscription] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">实时监控</h1>
          <p className="text-muted-foreground">监控订阅的实时使用量和性能指标</p>
        </div>
        <Button onClick={handleRefresh}>
          <RefreshCw className="mr-2 h-4 w-4" />
          刷新数据
        </Button>
      </div>

      {/* 订阅选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            选择监控目标
          </CardTitle>
          <CardDescription>选择要监控的订阅账户</CardDescription>
        </CardHeader>
        <CardContent>
          <SubscriptionSelector
            value={selectedSubscription}
            onValueChange={setSelectedSubscription}
            placeholder="请选择要监控的订阅..."
            className="max-w-md"
          />
        </CardContent>
      </Card>

      {selectedSubscription ? (
        <Tabs defaultValue="realtime" className="space-y-4">
          <TabsList>
            <TabsTrigger value="realtime">
              <Activity className="mr-2 h-4 w-4" />
              实时监控
            </TabsTrigger>
            <TabsTrigger value="trends">
              <TrendingUp className="mr-2 h-4 w-4" />
              趋势分析
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <RealtimePanel 
                key={`realtime-${refreshKey}`}
                subscriptionId={selectedSubscription}
                autoRefresh={true}
                refreshInterval={30000}
              />
              <Card>
                <CardHeader>
                  <CardTitle>快速操作</CardTitle>
                  <CardDescription>常用的监控操作</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={`/usage/monitoring/${selectedSubscription}`}>
                      <Monitor className="mr-2 h-4 w-4" />
                      详细监控页面
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/usage/alerts">
                      <Activity className="mr-2 h-4 w-4" />
                      查看告警
                    </a>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href="/usage/analytics">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      分析报告
                    </a>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="space-y-6">
            <UsageChart 
              key={`chart-${refreshKey}`}
              data={[]}
              showControls={true}
            />
          </TabsContent>
        </Tabs>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <Monitor className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">开始监控</h3>
              <p className="text-muted-foreground">请先选择要监控的订阅账户</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}