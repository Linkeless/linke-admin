/**
 * 告警管理组件
 * 提供缓存监控告警的创建、编辑、删除等管理功能
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
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { DataTable } from '@/components/ui/data-table';
import { AlertTriangle, Plus, Edit2, Trash2, Bell, BellOff, CheckCircle, XCircle } from 'lucide-react';
import { useCacheAlerts, useAlertStats } from '@/hooks/use-cache-monitoring';
import type { CacheAlert, CreateAlertRequest } from '@/lib/cache-types';
import { ColumnDef } from '@tanstack/react-table';

interface AlertManagementProps {
  className?: string;
}

export function AlertManagement({ className }: AlertManagementProps) {
  const { 
    alerts, 
    loading, 
    error, 
    total,
    page,
    pageSize,
    activeAlerts,
    recentTriggeredAlerts,
    createAlert, 
    deleteAlert, 
    toggleAlert,
    refreshAlerts,
    changePage,
    changePageSize
  } = useCacheAlerts();

  const alertStats = useAlertStats();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<CacheAlert | null>(null);
  
  // 创建告警表单状态
  const [alertForm, setAlertForm] = useState<CreateAlertRequest>({
    name: '',
    type: 'memory',
    threshold: 0,
    comparison: 'gt',
    description: '',
    notification_channels: [],
  });

  const resetForm = () => {
    setAlertForm({
      name: '',
      type: 'memory',
      threshold: 0,
      comparison: 'gt',
      description: '',
      notification_channels: [],
    });
  };

  const handleCreateAlert = async () => {
    const result = await createAlert(alertForm);
    if (result.success) {
      setCreateDialogOpen(false);
      resetForm();
    }
  };

  const handleDeleteAlert = async () => {
    if (!selectedAlert) return;
    
    const result = await deleteAlert(selectedAlert.id);
    if (result.success) {
      setDeleteDialogOpen(false);
      setSelectedAlert(null);
    }
  };

  const handleToggleAlert = async (alert: CacheAlert) => {
    await toggleAlert(alert.id, !alert.enabled);
  };

  const alertTypes = [
    { value: 'memory', label: '内存使用', unit: '%' },
    { value: 'performance', label: '性能', unit: 'ms' },
    { value: 'health', label: '健康状态', unit: '分' },
    { value: 'connections', label: '连接数', unit: '个' },
    { value: 'latency', label: '延迟', unit: 'ms' },
  ];

  const comparisons = [
    { value: 'gt', label: '大于 (>)' },
    { value: 'gte', label: '大于等于 (≥)' },
    { value: 'lt', label: '小于 (<)' },
    { value: 'lte', label: '小于等于 (≤)' },
    { value: 'eq', label: '等于 (=)' },
  ];

  const notificationChannels = [
    { value: 'email', label: '邮件通知' },
    { value: 'webhook', label: 'Webhook' },
    { value: 'sms', label: '短信通知' },
  ];

  const columns: ColumnDef<CacheAlert>[] = [
    {
      accessorKey: 'name',
      header: '告警名称',
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.name}</div>
          {row.original.description && (
            <div className="text-sm text-muted-foreground">
              {row.original.description}
            </div>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const type = alertTypes.find(t => t.value === row.original.type);
        return <Badge variant="outline">{type?.label}</Badge>;
      },
    },
    {
      accessorKey: 'threshold',
      header: '阈值',
      cell: ({ row }) => {
        const type = alertTypes.find(t => t.value === row.original.type);
        const comparison = comparisons.find(c => c.value === row.original.comparison);
        return (
          <span>
            {comparison?.label} {row.original.threshold}{type?.unit}
          </span>
        );
      },
    },
    {
      accessorKey: 'enabled',
      header: '状态',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Switch
            checked={row.original.enabled}
            onCheckedChange={() => handleToggleAlert(row.original)}
          />
          <Badge variant={row.original.enabled ? 'default' : 'secondary'}>
            {row.original.enabled ? '启用' : '禁用'}
          </Badge>
        </div>
      ),
    },
    {
      accessorKey: 'last_triggered',
      header: '最后触发',
      cell: ({ row }) => {
        if (!row.original.last_triggered) {
          return <span className="text-muted-foreground">从未触发</span>;
        }
        return (
          <div>
            <div>{new Date(row.original.last_triggered).toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              触发次数: {row.original.trigger_count}
            </div>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAlert(row.original);
              setEditDialogOpen(true);
            }}
          >
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedAlert(row.original);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 告警统计 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总告警数</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
            <p className="text-xs text-muted-foreground">
              启用: {alertStats.enabled} | 禁用: {alertStats.disabled}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃告警</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alertStats.enabled}</div>
            <p className="text-xs text-muted-foreground">
              正在监控的告警数量
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">最近触发</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {alertStats.recentTriggerCount}
            </div>
            <p className="text-xs text-muted-foreground">
              24小时内触发的告警
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">历史触发</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.triggered}</div>
            <p className="text-xs text-muted-foreground">
              曾经触发过的告警总数
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 最近触发的告警 */}
      {recentTriggeredAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>最近触发的告警</CardTitle>
            <CardDescription>最近5个触发的告警记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {recentTriggeredAlerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-orange-600" />
                    <div>
                      <div className="font-medium">{alert.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {alert.last_triggered && new Date(alert.last_triggered).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="destructive">已触发</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 告警列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>告警配置</CardTitle>
              <CardDescription>管理缓存监控告警规则</CardDescription>
            </div>
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  创建告警
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>创建告警规则</DialogTitle>
                  <DialogDescription>
                    配置新的缓存监控告警规则
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">告警名称</Label>
                    <Input
                      id="name"
                      placeholder="输入告警名称"
                      value={alertForm.name}
                      onChange={(e) => setAlertForm({ ...alertForm, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="type">告警类型</Label>
                    <Select
                      value={alertForm.type}
                      onValueChange={(value: any) => setAlertForm({ ...alertForm, type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {alertTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="comparison">比较操作</Label>
                      <Select
                        value={alertForm.comparison}
                        onValueChange={(value: any) => setAlertForm({ ...alertForm, comparison: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {comparisons.map((comp) => (
                            <SelectItem key={comp.value} value={comp.value}>
                              {comp.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="threshold">阈值</Label>
                      <Input
                        id="threshold"
                        type="number"
                        placeholder="输入阈值"
                        value={alertForm.threshold}
                        onChange={(e) => setAlertForm({ ...alertForm, threshold: parseFloat(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">描述 (可选)</Label>
                    <Textarea
                      id="description"
                      placeholder="输入告警描述"
                      value={alertForm.description}
                      onChange={(e) => setAlertForm({ ...alertForm, description: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>通知方式</Label>
                    <div className="space-y-2">
                      {notificationChannels.map((channel) => (
                        <div key={channel.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={channel.value}
                            checked={alertForm.notification_channels.includes(channel.value as any)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setAlertForm({
                                  ...alertForm,
                                  notification_channels: [...alertForm.notification_channels, channel.value as any]
                                });
                              } else {
                                setAlertForm({
                                  ...alertForm,
                                  notification_channels: alertForm.notification_channels.filter(c => c !== channel.value)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={channel.value}>{channel.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleCreateAlert}
                    disabled={!alertForm.name || alertForm.threshold === 0}
                  >
                    创建告警
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={alerts}
            loading={loading}
            pagination={{
              page,
              pageSize,
              total,
              onPageChange: changePage,
              onPageSizeChange: changePageSize,
            }}
          />
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除告警规则 &ldquo;{selectedAlert?.name}&rdquo; 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDeleteAlert}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}