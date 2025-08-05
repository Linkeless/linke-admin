/**
 * 缓存管理总览页面
 * 展示缓存系统的整体状态和关键指标
 */

import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CacheOverview, CacheOperations } from './components';

export const metadata: Metadata = {
  title: '缓存管理 - 系统概览',
  description: '查看和管理缓存系统的整体状态和性能指标',
};

export default function CachePage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">缓存管理</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">系统概览</TabsTrigger>
          <TabsTrigger value="operations">快速操作</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <CacheOverview />
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <CacheOperations />
        </TabsContent>
      </Tabs>
    </div>
  );
}