'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertTriangle, TrendingUp, Users, Activity } from 'lucide-react';
import { UsageService } from '@/lib/usage-service';
import { TopUsageItem, AlertStatistics, UsageStatistics } from '@/lib/usage-types';
import { useAlertPolling } from '@/hooks/use-alert-polling';
import { cn } from '@/lib/utils';

// 使用量总览卡片组件
function UsageOverviewCard({ 
  title, 
  value, 
  unit, 
  change, 
  icon: Icon, 
  status = 'normal' 
}: {
  title: string;
  value: string | number;
  unit?: string;
  change?: number;
  icon: React.ElementType;
  status?: 'normal' | 'warning' | 'critical';
}) {
  const getStatusColor = () => {
    switch (status) {
      case 'critical': return 'text-red-500';
      case 'warning': return 'text-yellow-500';
      default: return 'text-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", getStatusColor())} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value} {unit && <span className="text-sm text-muted-foreground">{unit}</span>}
        </div>
        {change !== undefined && (
          <p className={cn(
            "text-xs",
            change >= 0 ? "text-green-600" : "text-red-600"
          )}>
            {change >= 0 ? '+' : ''}{change}% 相比上月
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// 热门用户表格组件
function TopUsersTable({ data }: { data: TopUsageItem[] }) {
  return (
    <div className="space-y-4">
      {data.map((item, index) => (
        <div key={item.subscription_id} className="flex items-center justify-between p-4 border rounded-lg">
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-medium">
              {item.rank}
            </div>
            <div>
              <p className="font-medium">{item.user_name || `用户 ${item.subscription_id.slice(-8)}`}</p>
              <p className="text-sm text-muted-foreground">ID: {item.subscription_id}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-medium">{UsageService.formatBytes(item.total_usage)}</p>
            <p className={cn(
              "text-sm",
              item.change_from_last_period >= 0 ? "text-green-600" : "text-red-600"
            )}>
              {item.change_from_last_period >= 0 ? '+' : ''}{item.change_from_last_period}%
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

// 告警摘要组件
function AlertSummary() {
  const { alerts, activeAlerts, criticalAlerts, loading, error } = useAlertPolling({
    enabled: true,
    pollingInterval: 60000
  });

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            告警摘要
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-32">
          <RefreshCw className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            告警摘要
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">加载告警数据失败: {error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          告警摘要
        </CardTitle>
        <CardDescription>当前系统告警状态</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{criticalAlerts.length}</div>
            <div className="text-sm text-muted-foreground">严重告警</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">{activeAlerts.length}</div>
            <div className="text-sm text-muted-foreground">活跃告警</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{alerts.length}</div>
            <div className="text-sm text-muted-foreground">总告警</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function UsagePage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [topUsers, setTopUsers] = useState<TopUsageItem[]>([]);
  const [overviewData, setOverviewData] = useState({
    totalUsage: 0,
    totalUsers: 0,
    averageUsage: 0,
    growthRate: 0
  });

  // 加载数据
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 并行加载多个数据源
      const [topUsageResponse] = await Promise.all([
        UsageService.getTopUsage({ page: 1, limit: 10 })
      ]);

      if (topUsageResponse.success) {
        setTopUsers(topUsageResponse.data);
        
        // 计算总览数据
        const totalUsage = topUsageResponse.data.reduce((sum, item) => sum + item.total_usage, 0);
        const totalUsers = topUsageResponse.data.length;
        const averageUsage = totalUsers > 0 ? totalUsage / totalUsers : 0;
        const averageGrowth = topUsageResponse.data.reduce((sum, item) => sum + item.change_from_last_period, 0) / totalUsers;

        setOverviewData({
          totalUsage,
          totalUsers,
          averageUsage,
          growthRate: averageGrowth
        });
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '加载数据失败';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = () => {
    loadData();
  };

  if (loading && topUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">使用量监控</h1>
          <p className="text-muted-foreground">监控和分析系统使用量，管理告警和预测趋势</p>
        </div>
        <Button onClick={handleRefresh} disabled={loading}>
          <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
          刷新数据
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 总览卡片 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UsageOverviewCard
          title="总使用量"
          value={UsageService.formatBytes(overviewData.totalUsage)}
          icon={Activity}
          change={overviewData.growthRate}
        />
        <UsageOverviewCard
          title="活跃用户"
          value={overviewData.totalUsers}
          unit="个"
          icon={Users}
          change={5.2}
        />
        <UsageOverviewCard
          title="平均使用量"
          value={UsageService.formatBytes(overviewData.averageUsage)}
          icon={TrendingUp}
          change={-2.1}
        />
        <UsageOverviewCard
          title="增长率"
          value={overviewData.growthRate.toFixed(1)}
          unit="%"
          icon={TrendingUp}
          status={overviewData.growthRate > 0 ? 'normal' : 'warning'}
        />
      </div>

      {/* 主要内容 */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">总览</TabsTrigger>
          <TabsTrigger value="alerts">告警摘要</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* 热门用户 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  使用量排行榜
                </CardTitle>
                <CardDescription>使用量最高的用户列表</CardDescription>
              </CardHeader>
              <CardContent>
                {topUsers.length > 0 ? (
                  <TopUsersTable data={topUsers} />
                ) : (
                  <div className="text-center text-muted-foreground">暂无数据</div>
                )}
              </CardContent>
            </Card>

            {/* 快速操作 */}
            <Card>
              <CardHeader>
                <CardTitle>快速操作</CardTitle>
                <CardDescription>常用的管理操作</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/usage/monitoring">
                    <Activity className="mr-2 h-4 w-4" />
                    实时监控
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/usage/alerts">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    告警管理
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/usage/analytics">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    分析报告
                  </a>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a href="/usage/admin">
                    <Users className="mr-2 h-4 w-4" />
                    管理工具
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <AlertSummary />
        </TabsContent>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>趋势分析</CardTitle>
              <CardDescription>使用量趋势和预测分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground">
                趋势分析功能正在开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}