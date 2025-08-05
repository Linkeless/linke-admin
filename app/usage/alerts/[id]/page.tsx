'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Pause, 
  RefreshCw, 
  User, 
  Calendar, 
  AlertTriangle,
  Activity,
  Clock
} from 'lucide-react';
import { Alert, AlertHistory } from '@/lib/usage-types';
import { UsageService } from '@/lib/usage-service';
import { AlertStatusBadge, AlertSeverityBadge } from '../components/alert-status-badge';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';

// 模拟告警详情数据
const mockAlert: Alert = {
  id: 'alert_001',
  subscription_id: 'sub_001',
  alert_type: 'threshold',
  severity: 'high',
  status: 'active',
  title: '带宽使用量告警',
  message: '用户带宽使用量已达到92.5%，超过设定的90%阈值。请及时处理以避免服务中断。',
  threshold_value: 90.0,
  current_value: 92.5,
  created_at: '2024-08-04T10:30:00Z',
  updated_at: '2024-08-04T10:30:00Z',
};

// 模拟告警历史数据
const mockAlertHistory: AlertHistory[] = [
  {
    id: 'history_001',
    alert_id: 'alert_001',
    action: 'created',
    performed_by: 'system',
    performed_at: '2024-08-04T10:30:00Z',
    notes: '系统自动检测到使用量超过阈值，创建告警'
  },
  {
    id: 'history_002',
    alert_id: 'alert_001',
    action: 'updated',
    performed_by: 'system',
    performed_at: '2024-08-04T10:35:00Z',
    notes: '使用量继续上升至92.8%'
  }
];

// 信息项组件
function InfoItem({ 
  icon: Icon, 
  label, 
  value, 
  className 
}: { 
  icon: React.ElementType;
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div className="flex-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}

// 历史记录项组件
function HistoryItem({ history }: { history: AlertHistory }) {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'created':
        return 'bg-blue-100 text-blue-800';
      case 'acknowledged':
        return 'bg-orange-100 text-orange-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'suppressed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case 'created': return '创建';
      case 'acknowledged': return '确认';
      case 'resolved': return '解决';
      case 'suppressed': return '抑制';
      case 'updated': return '更新';
      default: return action;
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
        <Activity className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <Badge className={getActionColor(history.action)}>
            {getActionText(history.action)}
          </Badge>
          <span className="text-sm text-muted-foreground">
            by {history.performed_by}
          </span>
          <span className="text-sm text-muted-foreground">
            {format(new Date(history.performed_at), 'MM-dd HH:mm', { locale: zhCN })}
          </span>
        </div>
        {history.notes && (
          <p className="text-sm">{history.notes}</p>
        )}
      </div>
    </div>
  );
}

export default function AlertDetailPage() {
  const params = useParams();
  const router = useRouter();
  const alertId = params.id as string;

  const [alert, setAlert] = useState<Alert | null>(null);
  const [history, setHistory] = useState<AlertHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState('');

  // 加载告警详情
  const loadAlertDetail = async () => {
    try {
      setLoading(true);
      
      // 在实际应用中，这里应该调用API
      // const [alertResponse, historyResponse] = await Promise.all([
      //   UsageService.getAlert(alertId),
      //   UsageService.getAlertHistory(alertId)
      // ]);
      
      // 使用模拟数据
      await new Promise(resolve => setTimeout(resolve, 500));
      setAlert(mockAlert);
      setHistory(mockAlertHistory);
      
    } catch (error) {
      console.error('Failed to load alert detail:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (alertId) {
      loadAlertDetail();
    }
  }, [alertId]);

  // 处理告警操作
  const handleAlertAction = async (action: 'acknowledge' | 'resolve' | 'suppress') => {
    if (!alert) return;

    try {
      setActionLoading(action);

      switch (action) {
        case 'acknowledge':
          await UsageService.acknowledgeAlert(alert.id, notes);
          break;
        case 'resolve':
          await UsageService.resolveAlert(alert.id, notes);
          break;
        case 'suppress':
          // 抑制24小时
          const suppressUntil = new Date();
          suppressUntil.setHours(suppressUntil.getHours() + 24);
          await UsageService.suppressAlert(alert.id, suppressUntil.toISOString(), notes);
          break;
      }

      // 重新加载数据
      await loadAlertDetail();
      setNotes('');
      
    } catch (error) {
      console.error(`Failed to ${action} alert:`, error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!alert) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">告警不存在</h3>
        <p className="text-muted-foreground">找不到指定的告警记录</p>
        <Button className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{alert.title}</h1>
          <p className="text-muted-foreground">告警详情 · {alert.id}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 主要信息 */}
        <div className="lg:col-span-2 space-y-6">
          {/* 告警基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                告警信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <AlertSeverityBadge severity={alert.severity as any} />
                <AlertStatusBadge status={alert.status as any} />
                <Badge variant="outline">{alert.alert_type}</Badge>
              </div>
              
              <div className="p-4 bg-muted/50 rounded-lg">
                <p className="text-sm leading-relaxed">{alert.message}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InfoItem
                  icon={User}
                  label="目标订阅"
                  value={alert.subscription_id}
                />
                <InfoItem
                  icon={Activity}
                  label="当前值 / 阈值"
                  value={`${alert.current_value}% / ${alert.threshold_value}%`}
                />
                <InfoItem
                  icon={Calendar}
                  label="创建时间"
                  value={format(new Date(alert.created_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                />
                <InfoItem
                  icon={Clock}
                  label="最后更新"
                  value={format(new Date(alert.updated_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                />
              </div>

              {alert.acknowledged_at && (
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <p className="text-sm text-orange-800">
                    <strong>已确认:</strong> {format(new Date(alert.acknowledged_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    {alert.acknowledged_by && ` (by ${alert.acknowledged_by})`}
                  </p>
                </div>
              )}

              {alert.resolved_at && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">
                    <strong>已解决:</strong> {format(new Date(alert.resolved_at), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                    {alert.resolved_by && ` (by ${alert.resolved_by})`}
                  </p>
                </div>
              )}

              {alert.suppressed_until && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <p className="text-sm text-gray-800">
                    <strong>已抑制至:</strong> {format(new Date(alert.suppressed_until), 'yyyy-MM-dd HH:mm:ss', { locale: zhCN })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 操作历史 */}
          <Card>
            <CardHeader>
              <CardTitle>操作历史</CardTitle>
              <CardDescription>告警的所有操作记录</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {history.map((item) => (
                  <HistoryItem key={item.id} history={item} />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 操作面板 */}
        <div className="space-y-6">
          {/* 快速操作 */}
          {alert.status !== 'resolved' && (
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>对此告警执行操作</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">操作备注</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="添加操作备注（可选）..."
                    rows={3}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  {alert.status === 'active' && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleAlertAction('acknowledge')}
                      disabled={actionLoading === 'acknowledge'}
                    >
                      <Check className="mr-2 h-4 w-4" />
                      {actionLoading === 'acknowledge' ? '确认中...' : '确认告警'}
                    </Button>
                  )}

                  <Button
                    className="w-full"
                    onClick={() => handleAlertAction('resolve')}
                    disabled={actionLoading === 'resolve'}
                  >
                    <X className="mr-2 h-4 w-4" />
                    {actionLoading === 'resolve' ? '解决中...' : '解决告警'}
                  </Button>

                  {alert.status === 'active' && (
                    <Button
                      className="w-full"
                      variant="outline"
                      onClick={() => handleAlertAction('suppress')}
                      disabled={actionLoading === 'suppress'}
                    >
                      <Pause className="mr-2 h-4 w-4" />
                      {actionLoading === 'suppress' ? '抑制中...' : '抑制24小时'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 相关链接 */}
          <Card>
            <CardHeader>
              <CardTitle>相关操作</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`/usage/monitoring/${alert.subscription_id}`}>
                  <Activity className="mr-2 h-4 w-4" />
                  查看使用量监控
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href="/usage/alerts/configs">
                  <AlertTriangle className="mr-2 h-4 w-4" />
                  管理告警配置
                </a>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <a href={`/subscriptions/users/${alert.subscription_id}`}>
                  <User className="mr-2 h-4 w-4" />
                  查看订阅详情
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}