'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trash2, 
  RefreshCw, 
  RotateCcw, 
  AlertTriangle,
  Database,
  RotateCcw as Sync,
  Shield
} from 'lucide-react';
import { UsageService } from '@/lib/usage-service';
import { CleanupRequest, SyncRequest, UsageType } from '@/lib/usage-types';
import { SubscriptionSelector } from '@/app/usage/components';

export default function AdminPage() {
  const [loading, setLoading] = useState<string | null>(null);
  
  // 数据清理状态
  const [cleanupDays, setCleanupDays] = useState(90);
  const [cleanupDryRun, setCleanupDryRun] = useState(true);
  const [cleanupTypes, setCleanupTypes] = useState<UsageType[]>([]);

  // 同步状态
  const [syncSubscription, setSyncSubscription] = useState('');
  const [syncForce, setSyncForce] = useState(false);
  const [syncTypes, setSyncTypes] = useState<UsageType[]>([]);

  // 重置状态
  const [resetSubscription, setResetSubscription] = useState('');

  // 数据清理
  const handleCleanup = async () => {
    try {
      setLoading('cleanup');
      
      const request: CleanupRequest = {
        older_than_days: cleanupDays,
        usage_types: cleanupTypes.length > 0 ? cleanupTypes : undefined,
        dry_run: cleanupDryRun
      };

      const response = await UsageService.adminCleanup(request);
      
      if (response.success) {
        const result = response.data;
        alert(
          `${cleanupDryRun ? '预计' : '实际'}清理结果:\n` +
          `删除记录: ${result.deleted_records} 条\n` +
          `释放空间: ${UsageService.formatBytes(result.freed_space)}\n` +
          `影响订阅: ${result.affected_subscriptions.length} 个\n` +
          `执行时间: ${result.execution_time} 秒`
        );
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      alert('清理操作失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  // 同步数据
  const handleSync = async () => {
    if (!syncSubscription) {
      alert('请选择要同步的订阅');
      return;
    }

    try {
      setLoading('sync');
      
      const request: SyncRequest = {
        subscription_id: syncSubscription,
        force_sync: syncForce,
        sync_types: syncTypes.length > 0 ? syncTypes : Object.values(UsageType)
      };

      const response = await UsageService.syncSubscriptionUsage(syncSubscription, request);
      
      if (response.success) {
        const result = response.data;
        alert(
          `同步完成:\n` +
          `状态: ${result.status}\n` +
          `同步记录: ${result.synced_records} 条\n` +
          `耗时: ${result.sync_duration} 秒\n` +
          `最后同步: ${new Date(result.last_sync).toLocaleString('zh-CN')}`
        );
      }
    } catch (error) {
      console.error('Sync failed:', error);
      alert('同步操作失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  // 重置使用量
  const handleReset = async () => {
    if (!resetSubscription) {
      alert('请选择要重置的订阅');
      return;
    }

    if (!confirm('确定要重置此订阅的使用量吗？此操作不可撤销！')) {
      return;
    }

    try {
      setLoading('reset');
      
      const response = await UsageService.resetSubscriptionUsage(resetSubscription);
      
      if (response.success) {
        alert('使用量重置成功');
        setResetSubscription('');
      }
    } catch (error) {
      console.error('Reset failed:', error);
      alert('重置操作失败，请稍后重试');
    } finally {
      setLoading(null);
    }
  };

  const usageTypeOptions = [
    { value: UsageType.BANDWIDTH, label: '带宽' },
    { value: UsageType.STORAGE, label: '存储' },
    { value: UsageType.REQUESTS, label: '请求数' },
    { value: UsageType.CPU_TIME, label: 'CPU时间' },
    { value: UsageType.MEMORY, label: '内存' },
    { value: UsageType.CONNECTIONS, label: '连接数' },
    { value: UsageType.TRANSFER, label: '传输量' },
  ];

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">管理工具</h1>
          <p className="text-muted-foreground">系统管理和维护操作工具</p>
        </div>
        <Badge variant="secondary" className="text-red-600">
          <Shield className="mr-1 h-3 w-3" />
          管理员专用
        </Badge>
      </div>

      {/* 警告提示 */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          请谨慎使用管理工具。某些操作可能会影响系统数据，建议在操作前先进行备份。
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="cleanup" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cleanup">
            <Trash2 className="mr-2 h-4 w-4" />
            数据清理
          </TabsTrigger>
          <TabsTrigger value="sync">
            <Sync className="mr-2 h-4 w-4" />
            数据同步
          </TabsTrigger>
          <TabsTrigger value="reset">
            <RotateCcw className="mr-2 h-4 w-4" />
            使用量重置
          </TabsTrigger>
        </TabsList>

        {/* 数据清理 */}
        <TabsContent value="cleanup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5" />
                数据清理工具
              </CardTitle>
              <CardDescription>
                清理过期的使用量历史数据，释放存储空间
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cleanup-days">保留天数</Label>
                  <Input
                    id="cleanup-days"
                    type="number"
                    min="1"
                    max="365"
                    value={cleanupDays}
                    onChange={(e) => setCleanupDays(parseInt(e.target.value) || 90)}
                  />
                  <p className="text-sm text-muted-foreground">
                    删除超过指定天数的历史数据
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>使用量类型（可选）</Label>
                  <Select
                    value={cleanupTypes.length > 0 ? cleanupTypes[0] : ''}
                    onValueChange={(value) => {
                      if (value) {
                        setCleanupTypes([value as UsageType]);
                      } else {
                        setCleanupTypes([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择要清理的类型（空为全部）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部类型</SelectItem>
                      {usageTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="dry-run"
                  checked={cleanupDryRun}
                  onCheckedChange={setCleanupDryRun}
                />
                <Label htmlFor="dry-run">
                  预览模式（不实际删除数据）
                </Label>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  onClick={handleCleanup}
                  disabled={loading === 'cleanup'}
                  variant={cleanupDryRun ? 'outline' : 'destructive'}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  {loading === 'cleanup' ? '清理中...' : cleanupDryRun ? '预览清理' : '开始清理'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  将清理 {cleanupDays} 天前的数据
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据同步 */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sync className="h-5 w-5" />
                数据同步工具
              </CardTitle>
              <CardDescription>
                同步订阅的使用量数据，确保数据一致性
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>目标订阅</Label>
                  <SubscriptionSelector
                    value={syncSubscription}
                    onValueChange={setSyncSubscription}
                    placeholder="选择要同步的订阅..."
                  />
                </div>

                <div className="space-y-2">
                  <Label>同步类型（可选）</Label>
                  <Select
                    value={syncTypes.length > 0 ? syncTypes[0] : ''}
                    onValueChange={(value) => {
                      if (value) {
                        setSyncTypes([value as UsageType]);
                      } else {
                        setSyncTypes([]);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="选择要同步的类型（空为全部）" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部类型</SelectItem>
                      {usageTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="force-sync"
                    checked={syncForce}
                    onCheckedChange={setSyncForce}
                  />
                  <Label htmlFor="force-sync">
                    强制同步（覆盖现有数据）
                  </Label>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  onClick={handleSync}
                  disabled={loading === 'sync' || !syncSubscription}
                >
                  <Sync className="mr-2 h-4 w-4" />
                  {loading === 'sync' ? '同步中...' : '开始同步'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {syncSubscription ? `将同步订阅 ${syncSubscription}` : '请先选择订阅'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 使用量重置 */}
        <TabsContent value="reset" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RotateCcw className="h-5 w-5" />
                使用量重置工具
              </CardTitle>
              <CardDescription>
                重置订阅的使用量计数，通常用于计费周期重置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  重置操作不可撤销，请确保您了解此操作的影响。
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label>目标订阅</Label>
                <SubscriptionSelector
                  value={resetSubscription}
                  onValueChange={setResetSubscription}
                  placeholder="选择要重置的订阅..."
                />
              </div>

              <div className="flex items-center gap-4 pt-4 border-t">
                <Button
                  onClick={handleReset}
                  disabled={loading === 'reset' || !resetSubscription}
                  variant="destructive"
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  {loading === 'reset' ? '重置中...' : '重置使用量'}
                </Button>
                <p className="text-sm text-muted-foreground">
                  {resetSubscription ? `将重置订阅 ${resetSubscription} 的使用量` : '请先选择订阅'}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 系统信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            系统信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">1,234</div>
              <div className="text-sm text-muted-foreground">总订阅数</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">856MB</div>
              <div className="text-sm text-muted-foreground">数据库大小</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold">99.9%</div>
              <div className="text-sm text-muted-foreground">系统可用性</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}