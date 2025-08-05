/**
 * 缓存操作组件
 * 提供缓存清理、刷新、预热等操作功能
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
// Progress component available if needed
import { AlertTriangle, Trash2, RefreshCw, Flame, Settings, CheckCircle, XCircle } from 'lucide-react';
import { useCacheOperations, useCacheMaintenance } from '@/hooks/use-cache-operations';
import { formatNumber, formatDuration } from '@/lib/cache-service';
import type { CacheOperation } from '@/lib/cache-types';

interface CacheOperationsProps {
  className?: string;
  onOperationComplete?: () => void;
}

export function CacheOperations({ className, onOperationComplete }: CacheOperationsProps) {
  const operations = useCacheOperations();
  const maintenance = useCacheMaintenance();
  
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [maintenanceDialogOpen, setMaintenanceDialogOpen] = useState(false);
  const [operationType, setOperationType] = useState<CacheOperation | null>(null);
  const [operationTarget, setOperationTarget] = useState<'all' | 'expired' | 'pattern'>('all');
  const [pattern, setPattern] = useState('');
  const [database, setDatabase] = useState<number | undefined>(undefined);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);

  const handleOperation = async (operation: CacheOperation) => {
    setOperationType(operation);
    setConfirmDialogOpen(true);
  };

  const executeOperation = async () => {
    if (!operationType) return;

    const options = {
      target: operationTarget,
      pattern: operationTarget === 'pattern' ? pattern : undefined,
      database,
    };

    const result = await operations.executeOperation(operationType, options);
    
    if (result.success) {
      onOperationComplete?.();
    }
    
    setConfirmDialogOpen(false);
    setOperationType(null);
    setPattern('');
    setDatabase(undefined);
  };

  const executeMaintenance = async () => {
    if (selectedTasks.length === 0) return;

    const result = await maintenance.performMaintenance({
      tasks: selectedTasks as string[],
    });

    if (result.success) {
      onOperationComplete?.();
    }

    setMaintenanceDialogOpen(false);
    setSelectedTasks([]);
  };

  const getOperationIcon = (operation: CacheOperation) => {
    switch (operation) {
      case CacheOperation.CLEAR:
        return <Trash2 className="h-4 w-4" />;
      case CacheOperation.REFRESH:
        return <RefreshCw className="h-4 w-4" />;
      case CacheOperation.WARMUP:
        return <Flame className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  const getOperationColor = (operation: CacheOperation) => {
    switch (operation) {
      case CacheOperation.CLEAR:
        return 'destructive';
      case CacheOperation.REFRESH:
        return 'default';
      case CacheOperation.WARMUP:
        return 'secondary';
      default:
        return 'default';
    }
  };

  const loading = operations.loading || maintenance.loading;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用的缓存管理操作</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              onClick={() => handleOperation(CacheOperation.CLEAR)}
              variant="destructive"
              className="h-20 flex-col gap-2"
              disabled={loading}
            >
              <Trash2 className="h-6 w-6" />
              清理缓存
            </Button>
            
            <Button
              onClick={() => handleOperation(CacheOperation.REFRESH)}
              variant="outline"
              className="h-20 flex-col gap-2"
              disabled={loading}
            >
              <RefreshCw className="h-6 w-6" />
              刷新缓存
            </Button>
            
            <Button
              onClick={() => handleOperation(CacheOperation.WARMUP)}
              variant="secondary"
              className="h-20 flex-col gap-2"
              disabled={loading}
            >
              <Flame className="h-6 w-6" />
              预热缓存
            </Button>
          </div>

          <Separator />

          {/* 维护操作 */}
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-medium">系统维护</h4>
              <p className="text-sm text-muted-foreground">
                执行系统维护任务以优化性能
              </p>
            </div>
            <Dialog open={maintenanceDialogOpen} onOpenChange={setMaintenanceDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" disabled={loading}>
                  <Settings className="h-4 w-4 mr-2" />
                  系统维护
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>系统维护</DialogTitle>
                  <DialogDescription>
                    选择要执行的维护任务
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-3">
                    {[
                      { id: 'cleanup_expired', label: '清理过期键', description: '删除所有过期的缓存键' },
                      { id: 'defragment', label: '内存碎片整理', description: '整理内存碎片以提高效率' },
                      { id: 'optimize_memory', label: '内存优化', description: '优化内存使用' },
                      { id: 'rebuild_index', label: '重建索引', description: '重建内部索引结构' },
                    ].map((task) => (
                      <div key={task.id} className="flex items-start space-x-3">
                        <Checkbox
                          id={task.id}
                          checked={selectedTasks.includes(task.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTasks(prev => [...prev, task.id]);
                            } else {
                              setSelectedTasks(prev => prev.filter(t => t !== task.id));
                            }
                          }}
                        />
                        <div className="space-y-1">
                          <Label htmlFor={task.id} className="font-medium">
                            {task.label}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {task.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setMaintenanceDialogOpen(false)}
                  >
                    取消
                  </Button>
                  <Button
                    onClick={executeMaintenance}
                    disabled={selectedTasks.length === 0 || maintenance.loading}
                  >
                    {maintenance.loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
                    执行维护
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* 操作历史 */}
      {(operations.lastOperation || maintenance.lastResult) && (
        <Card>
          <CardHeader>
            <CardTitle>最近操作</CardTitle>
            <CardDescription>最近执行的缓存操作记录</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {operations.lastOperation && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getOperationIcon(operations.lastOperation.operation)}
                  <div>
                    <div className="font-medium">
                      {operations.lastOperation.operation === 'clear' && '清理缓存'}
                      {operations.lastOperation.operation === 'refresh' && '刷新缓存'}
                      {operations.lastOperation.operation === 'warmup' && '预热缓存'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {operations.lastOperation.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={operations.lastOperation.result.success ? 'default' : 'destructive'}>
                    {operations.lastOperation.result.success ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : (
                      <XCircle className="h-3 w-3 mr-1" />
                    )}
                    {operations.lastOperation.result.success ? '成功' : '失败'}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    影响键数: {formatNumber(operations.lastOperation.result.affected_keys)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    耗时: {operations.lastOperation.result.duration}ms
                  </div>
                </div>
              </div>
            )}

            {maintenance.lastResult && (
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Settings className="h-4 w-4" />
                  <div>
                    <div className="font-medium">系统维护</div>
                    <div className="text-sm text-muted-foreground">
                      {maintenance.lastResult.timestamp.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="default">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    完成
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">
                    完成任务: {maintenance.lastResult.result.tasks_completed.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    耗时: {formatDuration(maintenance.lastResult.result.duration / 1000)}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 确认对话框 */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              确认操作
            </DialogTitle>
            <DialogDescription>
              您即将执行 
              {operationType === 'clear' && '清理缓存'}
              {operationType === 'refresh' && '刷新缓存'}
              {operationType === 'warmup' && '预热缓存'}
              操作，请确认操作参数。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="target">操作范围</Label>
              <Select
                value={operationTarget}
                onValueChange={(value: string) => setOperationTarget(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">所有键</SelectItem>
                  <SelectItem value="expired">仅过期键</SelectItem>
                  <SelectItem value="pattern">匹配模式</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {operationTarget === 'pattern' && (
              <div className="space-y-2">
                <Label htmlFor="pattern">匹配模式</Label>
                <Input
                  id="pattern"
                  placeholder="例如: user:* 或 cache:session:*"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="database">数据库 (可选)</Label>
              <Input
                id="database"
                type="number"
                placeholder="留空表示所有数据库"
                value={database || ''}
                onChange={(e) => setDatabase(e.target.value ? parseInt(e.target.value) : undefined)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              取消
            </Button>
            <Button
              variant={getOperationColor(operationType!) as 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'}
              onClick={executeOperation}
              disabled={operations.loading || (operationTarget === 'pattern' && !pattern)}
            >
              {operations.loading && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
              确认执行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 错误提示 */}
      {(operations.error || maintenance.error) && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <XCircle className="h-5 w-5" />
              操作失败
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{operations.error || maintenance.error}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}