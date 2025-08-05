/**
 * 实时监控详细页面
 * 专注于实时性能监控的详细视图
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Settings, Download, RefreshCw, Maximize2 } from 'lucide-react';
import { RealtimePanel } from '../components';
import { useMonitoringDashboard } from '@/hooks/use-cache-monitoring';

export default function RealtimeMonitoringPage() {
  const [refreshInterval, setRefreshInterval] = useState('5000');
  const [fullscreen, setFullscreen] = useState(false);
  
  const { 
    monitoring, 
    alerts, 
    alertStats, 
    triggeredAlerts,
    refreshAll 
  } = useMonitoringDashboard();

  const intervals = [
    { value: '1000', label: '1秒' },
    { value: '5000', label: '5秒' },
    { value: '10000', label: '10秒' },
    { value: '30000', label: '30秒' },
    { value: '60000', label: '1分钟' },
  ];

  const exportMonitoringData = () => {
    if (!monitoring.history || monitoring.history.length === 0) return;

    const csvContent = [
      ['时间', '命中率(%)', '内存使用(MB)', '操作/秒', '连接数', '响应时间(ms)'],
      ...monitoring.history.map(item => [
        new Date(item.timestamp).toLocaleString(),
        (item.metrics.hit_rate * 100).toFixed(2),
        (item.metrics.memory_usage / (1024 * 1024)).toFixed(2),
        item.metrics.operations_per_second.toString(),
        item.metrics.connections.toString(),
        item.metrics.response_time.toFixed(2),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `realtime-monitoring-${new Date().toISOString().slice(0, 16)}.csv`;
    link.click();
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">实时监控</h2>
        <div className="flex items-center gap-2">
          <Select value={refreshInterval} onValueChange={setRefreshInterval}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervals.map((interval) => (
                <SelectItem key={interval.value} value={interval.value}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button onClick={exportMonitoringData} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            导出
          </Button>
          
          <Button onClick={toggleFullscreen} variant="outline" size="sm">
            <Maximize2 className="h-4 w-4 mr-2" />
            全屏
          </Button>
          
          <Button onClick={refreshAll} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
        </div>
      </div>

      {/* 告警状态栏 */}
      {(triggeredAlerts.length > 0 || alertStats.enabled > 0) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">
                    活跃告警: {alertStats.enabled}
                  </Badge>
                  {triggeredAlerts.length > 0 && (
                    <Badge variant="destructive">
                      触发告警: {triggeredAlerts.length}
                    </Badge>
                  )}
                </div>
                {triggeredAlerts.length > 0 && (
                  <div className="text-sm text-muted-foreground">
                    最新: {triggeredAlerts[0]?.name}
                  </div>
                )}
              </div>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-2" />
                管理告警
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 监控配置 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">监控配置</CardTitle>
          <CardDescription>调整实时监控的显示和刷新设置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">刷新间隔</label>
              <Select value={refreshInterval} onValueChange={setRefreshInterval}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {intervals.map((interval) => (
                    <SelectItem key={interval.value} value={interval.value}>
                      {interval.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">历史数据点</label>
              <Select defaultValue="100">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50个点</SelectItem>
                  <SelectItem value="100">100个点</SelectItem>
                  <SelectItem value="200">200个点</SelectItem>
                  <SelectItem value="500">500个点</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">图表类型</label>
              <Select defaultValue="line">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">线形图</SelectItem>
                  <SelectItem value="area">面积图</SelectItem>
                  <SelectItem value="bar">柱状图</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* 实时监控面板 */}
      <RealtimePanel />

      {/* 监控统计 */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">监控统计</CardTitle>
          <CardDescription>当前监控会话的统计信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {monitoring.history.length}
              </div>
              <p className="text-muted-foreground">数据点数</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {monitoring.isConnected ? '在线' : '离线'}
              </div>
              <p className="text-muted-foreground">连接状态</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {parseInt(refreshInterval) / 1000}s
              </div>
              <p className="text-muted-foreground">刷新间隔</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {monitoring.data ? new Date(monitoring.data.timestamp).toLocaleTimeString() : '--:--:--'}
              </div>
              <p className="text-muted-foreground">最后更新</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}