/**
 * 缓存管理总览页面
 * 提供缓存操作和键管理功能
 */

import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CacheOperations } from '../components';
import { KeysManagement } from './components';

export const metadata: Metadata = {
  title: '缓存管理 - 操作与键管理',
  description: '执行缓存操作和管理缓存键',
};

export default function CacheManagementPage() {
  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">缓存管理</h2>
      </div>

      <Tabs defaultValue="operations" className="space-y-4">
        <TabsList>
          <TabsTrigger value="operations">缓存操作</TabsTrigger>
          <TabsTrigger value="keys">键管理</TabsTrigger>
        </TabsList>

        <TabsContent value="operations" className="space-y-4">
          <CacheOperations />
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <KeysManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}