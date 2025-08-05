/**
 * 告警管理详细页面
 * 专注于告警规则管理的详细视图
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Search, Filter, Download, RefreshCw, Bell, BellOff } from 'lucide-react';
import { AlertManagement } from '../components';
import { useCacheAlerts, useAlertStats } from '@/hooks/use-cache-monitoring';

export default function AlertsManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const { alerts, refreshAlerts } = useCacheAlerts();
  const alertStats = useAlertStats();

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (alert.description && alert.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || alert.type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'enabled' && alert.enabled) ||
                         (filterStatus === 'disabled' && !alert.enabled) ||
                         (filterStatus === 'triggered' && alert.last_triggered);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const exportAlerts = () => {
    const csvContent = [
      ['名称', '类型', '阈值', '比较', '状态', '创建时间', '最后触发', '触发次数', '描述'],
      ...alerts.map(alert => [
        alert.name,
        alert.type,
        alert.threshold.toString(),
        alert.comparison,
        alert.enabled ? '启用' : '禁用',
        alert.created_at,
        alert.last_triggered || '从未触发',
        alert.trigger_count.toString(),
        alert.description || '',
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cache-alerts-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const alertTypes = [
    { value: 'all', label: '全部类型' },
    { value: 'memory', label: '内存使用' },
    { value: 'performance', label: '性能' },
    { value: 'health', label: '健康状态' },
    { value: 'connections', label: '连接数' },
    { value: 'latency', label: '延迟' },
  ];

  const statusOptions = [
    { value: 'all', label: '全部状态' },
    { value: 'enabled', label: '已启用' },
    { value: 'disabled', label: '已禁用' },
    { value: 'triggered', label: '已触发' },
  ];

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">告警管理</h2>
        <div className="flex items-center gap-2">
          <Button onClick={exportAlerts} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出告警
          </Button>
          <Button onClick={refreshAlerts} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 告警概览统计 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总告警数</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertStats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已启用</CardTitle>
            <Bell className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{alertStats.enabled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已禁用</CardTitle>
            <BellOff className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{alertStats.disabled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已触发</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{alertStats.triggered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">24h触发</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{alertStats.recentTriggerCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* 告警类型分布 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">告警类型分布</CardTitle>
          <CardDescription>各类型告警的数量分布</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            {Object.entries(alertStats.byType).map(([type, count]) => {
              const typeInfo = alertTypes.find(t => t.value === type);
              return (
                <div key={type} className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{count}</div>
                  <p className="text-sm text-muted-foreground">
                    {typeInfo?.label || type}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">搜索和筛选</CardTitle>
          <CardDescription>查找和筛选告警规则</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索告警名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px]">
                <Filter className="h-4 w-4 mr-2" />
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
            
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {(searchTerm || filterType !== 'all' || filterStatus !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                找到 {filteredAlerts.length} 个告警规则
              </span>
              {searchTerm && (
                <Badge variant="secondary">搜索: {searchTerm}</Badge>
              )}
              {filterType !== 'all' && (
                <Badge variant="secondary">
                  类型: {alertTypes.find(t => t.value === filterType)?.label}
                </Badge>
              )}
              {filterStatus !== 'all' && (
                <Badge variant="secondary">
                  状态: {statusOptions.find(s => s.value === filterStatus)?.label}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
              >
                清除筛选
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 告警管理主体 */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">告警列表</TabsTrigger>
          <TabsTrigger value="history">触发历史</TabsTrigger>
          <TabsTrigger value="settings">通知设置</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <AlertManagement />
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>告警触发历史</CardTitle>
              <CardDescription>最近触发的告警记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts
                  .filter(alert => alert.last_triggered)
                  .sort((a, b) => new Date(b.last_triggered!).getTime() - new Date(a.last_triggered!).getTime())
                  .slice(0, 10)
                  .map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div>
                          <div className="font-medium">{alert.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(alert.last_triggered!).toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="destructive">已触发</Badge>
                        <div className="text-sm text-muted-foreground mt-1">
                          触发次数: {alert.trigger_count}
                        </div>
                      </div>
                    </div>
                  ))}
                
                {alerts.filter(alert => alert.last_triggered).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    暂无告警触发记录
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>通知设置</CardTitle>
              <CardDescription>配置告警通知的全局设置</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <h4 className="font-medium">邮件通知</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm">SMTP服务器</label>
                      <Input placeholder="smtp.example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">端口</label>
                      <Input placeholder="587" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">用户名</label>
                      <Input placeholder="alerts@example.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">密码</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Webhook通知</h4>
                  <div className="space-y-2">
                    <label className="text-sm">Webhook URL</label>
                    <Input placeholder="https://your-webhook-url.com/alerts" />
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">短信通知</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm">服务提供商</label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="选择服务商" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aliyun">阿里云</SelectItem>
                          <SelectItem value="tencent">腾讯云</SelectItem>
                          <SelectItem value="twilio">Twilio</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm">API密钥</label>
                      <Input type="password" placeholder="••••••••" />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button>保存设置</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}