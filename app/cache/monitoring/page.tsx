/**
 * 缓存监控总览页面
 * 提供实时监控和告警管理功能
 */

import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RealtimePanel, AlertManagement } from './components';

export const metadata: Metadata = {
  title: '缓存监控 - 实时监控与告警',
  description: '实时监控缓存系统性能并管理告警规则',
};

export default function CacheMonitoringPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">缓存监控</h2>
      </div>

      <Tabs defaultValue="realtime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="realtime">实时监控</TabsTrigger>
          <TabsTrigger value="alerts">告警管理</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-4">
          <RealtimePanel />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}