'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Plus, AlertTriangle, RefreshCw, Settings, BarChart3 } from 'lucide-react';
import { AlertTable, alertColumns } from './components';
import { useAlertPolling } from '@/hooks/use-alert-polling';
import { UsageService } from '@/lib/usage-service';
import { AlertTableRow, AlertStatistics } from '@/lib/usage-types';
import { cn } from '@/lib/utils';

// 模拟告警数据
const mockAlerts: AlertTableRow[] = [
  {
    id: 'alert_001',
    subscription_id: 'sub_001',
    user_name: '张三',
    alert_type: 'threshold',
    severity: 'high',
    status: 'active',
    title: '带宽使用量告警',
    current_value: 92.5,
    threshold_value: 90.0,
    created_at: '2024-08-04T10:30:00Z',
  },
  {
    id: 'alert_002',
    subscription_id: 'sub_002',
    user_name: '李四',
    alert_type: 'quota_exceeded',
    severity: 'critical',
    status: 'acknowledged',
    title: '存储配额超限',
    current_value: 105.2,
    threshold_value: 100.0,
    created_at: '2024-08-04T09:15:00Z',
    acknowledged_at: '2024-08-04T09:45:00Z',
  },
  {
    id: 'alert_003',
    subscription_id: 'sub_003',
    user_name: '王五',
    alert_type: 'unusual_activity',
    severity: 'medium',
    status: 'resolved',
    title: '异常访问模式检测',
    current_value: 75.0,
    threshold_value: 80.0,
    created_at: '2024-08-04T08:00:00Z',
    acknowledged_at: '2024-08-04T08:30:00Z',
    resolved_at: '2024-08-04T11:00:00Z',
  },
  {
    id: 'alert_004',
    subscription_id: 'sub_004',
    alert_type: 'prediction',
    severity: 'low',
    status: 'suppressed',
    title: '预测使用量告警',
    current_value: 68.0,
    threshold_value: 75.0,
    created_at: '2024-08-04T07:30:00Z',
  },
];

// 统计卡片组件
function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend,
  variant = 'default' 
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ElementType;
  trend?: number;
  variant?: 'default' | 'warning' | 'danger';
}) {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-yellow-200 bg-yellow-50';
      case 'danger':
        return 'border-red-200 bg-red-50';
      default:
        return '';
    }
  };

  return (
    <Card className={getVariantStyles()}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
          {trend !== undefined && (
            <span className={cn(
              "ml-2",
              trend > 0 ? "text-red-600" : trend < 0 ? "text-green-600" : "text-gray-600"
            )}>
              {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'} {Math.abs(trend)}%
            </span>
          )}
        </p>
      </CardContent>
    </Card>
  );
}

export default function AlertsPage() {
  const [loading, setLoading] = useState(false);
  const [alertData, setAlertData] = useState<AlertTableRow[]>(mockAlerts);
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null);

  // 使用告警轮询Hook
  const {
    alerts,
    activeAlerts,
    criticalAlerts,
    totalCount,
    newAlertsCount,
    refreshAlerts,
    acknowledgeAlert,
    resolveAlert,
    bulkResolveAlerts,
    markAlertsAsViewed
  } = useAlertPolling({
    enabled: true,
    pollingInterval: 60000, // 1分钟轮询
    onNewAlert: (alert) => {
      console.log('New alert received:', alert);
      // 可以在这里显示通知
    },
    onAlertResolved: (alert) => {
      console.log('Alert resolved:', alert);
    }
  });

  // 加载统计数据
  const loadStatistics = async () => {
    try {
      setLoading(true);
      // 这里应该调用实际的API
      // const response = await UsageService.getAlertStatistics('all');
      
      // 模拟统计数据
      const mockStats: AlertStatistics = {
        subscription_id: 'all',
        period: 'month',
        total_alerts: mockAlerts.length,
        resolved_alerts: mockAlerts.filter(a => a.status === 'resolved').length,
        pending_alerts: mockAlerts.filter(a => a.status === 'active').length,
        suppressed_alerts: mockAlerts.filter(a => a.status === 'suppressed').length,
        average_resolution_time: 45,
        alert_frequency: [
          { alert_type: 'threshold', count: 15, percentage: 50 },
          { alert_type: 'quota_exceeded', count: 9, percentage: 30 },
          { alert_type: 'unusual_activity', count: 4, percentage: 13.3 },
          { alert_type: 'prediction', count: 2, percentage: 6.7 },
        ]
      };
      
      setStatistics(mockStats);
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
    markAlertsAsViewed(); // 标记告警为已查看
  }, []);

  // 处理批量操作
  const handleAcknowledgeSelected = async (alertIds: string[]) => {
    try {
      for (const id of alertIds) {
        await acknowledgeAlert(id, '批量确认操作');
      }
      await refreshAlerts();
    } catch (error) {
      console.error('Failed to acknowledge alerts:', error);
    }
  };

  const handleResolveSelected = async (alertIds: string[]) => {
    try {
      await bulkResolveAlerts(alertIds, '批量解决操作');
      await refreshAlerts();
    } catch (error) {
      console.error('Failed to resolve alerts:', error);
    }
  };

  const handleDeleteSelected = async (alertIds: string[]) => {
    // 确认删除
    if (!confirm(`确定要删除 ${alertIds.length} 个告警吗？此操作不可撤销。`)) {
      return;
    }

    try {
      // 这里应该调用删除API
      console.log('Delete alerts:', alertIds);
      await refreshAlerts();
    } catch (error) {
      console.error('Failed to delete alerts:', error);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([
      refreshAlerts(),
      loadStatistics()
    ]);
  };

  // 使用模拟数据还是实际数据
  const displayAlerts = alerts.length > 0 ? alerts.map(alert => ({
    id: alert.id,
    subscription_id: alert.subscription_id,
    user_name: `用户 ${alert.subscription_id.slice(-8)}`,
    alert_type: alert.alert_type,
    severity: alert.severity,
    status: alert.status,
    title: alert.title,
    current_value: alert.current_value,
    threshold_value: alert.threshold_value,
    created_at: alert.created_at,
    acknowledged_at: alert.acknowledged_at,
    resolved_at: alert.resolved_at,
  })) : alertData;

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">告警管理</h1>
          <p className="text-muted-foreground">
            监控和管理系统告警，及时处理异常情况
            {newAlertsCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {newAlertsCount} 条新告警
              </Badge>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a href="/usage/alerts/configs">
              <Settings className="mr-2 h-4 w-4" />
              告警配置
            </a>
          </Button>
          <Button asChild>
            <a href="/usage/alerts/configs/new">
              <Plus className="mr-2 h-4 w-4" />
              新建告警
            </a>
          </Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="总告警数"
          value={statistics?.total_alerts || totalCount}
          description="本月累计告警"
          icon={AlertTriangle}
          trend={8.2}
        />
        <StatCard
          title="活跃告警"
          value={statistics?.pending_alerts || activeAlerts.length}
          description="需要处理的告警"
          icon={AlertTriangle}
          variant="warning"
          trend={-12.5}
        />
        <StatCard
          title="严重告警"
          value={criticalAlerts.length}
          description="严重级别告警"
          icon={AlertTriangle}
          variant="danger"
          trend={5.3}
        />
        <StatCard
          title="平均处理时间"
          value={`${statistics?.average_resolution_time || 45}分钟`}
          description="告警处理时长"
          icon={BarChart3}
          trend={-8.1}
        />
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="alerts" className="space-y-4">
        <TabsList>
          <TabsTrigger value="alerts">
            告警列表
            {activeAlerts.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeAlerts.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="statistics">统计分析</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          <AlertTable
            data={displayAlerts}
            columns={alertColumns}
            loading={loading}
            onRefresh={handleRefresh}
            onAcknowledgeSelected={handleAcknowledgeSelected}
            onResolveSelected={handleResolveSelected}
            onDeleteSelected={handleDeleteSelected}
          />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>告警类型分布</CardTitle>
                <CardDescription>各类型告警的数量统计</CardDescription>
              </CardHeader>
              <CardContent>
                {statistics?.alert_frequency.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="capitalize">{item.alert_type}</span>
                    <div className="flex items-center gap-2">
                      <span>{item.count} 条</span>
                      <Badge variant="outline">{item.percentage.toFixed(1)}%</Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>处理效率</CardTitle>
                <CardDescription>告警处理效率统计</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>解决率</span>
                    <span className="font-medium">
                      {statistics ? (
                        `${((statistics.resolved_alerts / statistics.total_alerts) * 100).toFixed(1)}%`
                      ) : '0%'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>平均处理时间</span>
                    <span className="font-medium">{statistics?.average_resolution_time || 0} 分钟</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>待处理告警</span>
                    <span className="font-medium">{statistics?.pending_alerts || 0} 条</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}