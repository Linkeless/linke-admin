'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  RefreshCw, 
  Calendar,
  Users,
  Activity,
  PieChart
} from 'lucide-react';
import { TimePeriod, TopUsageItem, ExportFormat } from '@/lib/usage-types';
import { UsageService } from '@/lib/usage-service';

// 模拟分析数据
const mockTrendData = [
  { period: '2024-07', value: 82.5, change: 5.2 },
  { period: '2024-08', value: 87.1, change: 5.6 },
  { period: '2024-09', value: 91.8, change: 5.4 },
  { period: '2024-10', value: 89.2, change: -2.8 },
];

const mockTopUsers: TopUsageItem[] = [
  {
    subscription_id: 'sub_001',
    user_name: '张三科技',
    total_usage: 1024 * 1024 * 1024 * 15.5, // 15.5GB
    usage_percentage: 92.3,
    rank: 1,
    change_from_last_period: 8.5
  },
  {
    subscription_id: 'sub_002',
    user_name: '李四工作室',
    total_usage: 1024 * 1024 * 1024 * 12.8, // 12.8GB
    usage_percentage: 85.1,
    rank: 2,
    change_from_last_period: -2.1
  },
  {
    subscription_id: 'sub_003',
    user_name: '王五公司',
    total_usage: 1024 * 1024 * 1024 * 10.2, // 10.2GB
    usage_percentage: 78.9,
    rank: 3,  
    change_from_last_period: 15.3
  }
];

// 趋势分析卡片
function TrendAnalysisCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          使用量趋势分析
        </CardTitle>
        <CardDescription>过去4个月的使用量趋势</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockTrendData.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <div className="font-medium">{item.period}</div>
                  <div className="text-sm text-muted-foreground">
                    平均使用率: {item.value}%
                  </div>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={item.change >= 0 ? "default" : "secondary"}>
                  {item.change >= 0 ? '+' : ''}{item.change}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 热门用户卡片
function TopUsersCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          使用量排行榜
        </CardTitle>
        <CardDescription>使用量最高的用户</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockTopUsers.map((user) => (
            <div key={user.subscription_id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {user.rank}
                </div>
                <div>
                  <div className="font-medium">{user.user_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {UsageService.formatBytes(user.total_usage)}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-medium">{user.usage_percentage}%</div>
                <div className={`text-sm ${
                  user.change_from_last_period >= 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {user.change_from_last_period >= 0 ? '+' : ''}{user.change_from_last_period}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// 统计摘要卡片
function StatsSummaryCard() {
  const stats = {
    totalUsers: 156,
    activeUsers: 134,
    totalUsage: 1024 * 1024 * 1024 * 1024 * 2.5, // 2.5TB
    avgUsage: 1024 * 1024 * 1024 * 8.2, // 8.2GB
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总用户数</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalUsers}</div>
          <p className="text-xs text-muted-foreground">
            +12% 相比上月
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeUsers}</div>
          <p className="text-xs text-muted-foreground">
            活跃率 {((stats.activeUsers / stats.totalUsers) * 100).toFixed(1)}%
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">总使用量</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{UsageService.formatBytes(stats.totalUsage)}</div>
          <p className="text-xs text-muted-foreground">
            +8.5% 相比上月
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">平均使用量</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{UsageService.formatBytes(stats.avgUsage)}</div>
          <p className="text-xs text-muted-foreground">
            每用户平均
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(TimePeriod.MONTH);
  const [exportFormat, setExportFormat] = useState<ExportFormat>(ExportFormat.CSV);

  const handleExport = async () => {
    try {
      setLoading(true);
      
      const exportRequest = {
        subscription_ids: [], // 空数组表示所有订阅
        usage_types: [], // 空数组表示所有类型
        date_range: {
          start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_date: new Date().toISOString()
        },
        format: exportFormat,
        include_predictions: true,
        include_alerts: true
      };

      const response = await UsageService.exportUsageData(exportRequest);
      
      if (response.success) {
        // 这里应该处理文件下载
        console.log('Export started:', response.data);
        alert('导出任务已开始，完成后将通过邮件发送下载链接');
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('导出失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    // 刷新数据逻辑
    console.log('Refreshing analytics data...');
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">分析报告</h1>
          <p className="text-muted-foreground">使用量数据分析和趋势报告</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" />
            刷新数据
          </Button>
          <Button asChild>
            <a href="/usage/analytics/export">
              <Download className="mr-2 h-4 w-4" />
              数据导出
            </a>
          </Button>
        </div>
      </div>

      {/* 统计摘要 */}
      <StatsSummaryCard />

      {/* 主要内容 */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="ranking">用户排行</TabsTrigger>
          <TabsTrigger value="distribution">分布分析</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as TimePeriod)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TimePeriod.WEEK}>7天</SelectItem>
                  <SelectItem value={TimePeriod.MONTH}>30天</SelectItem>
                  <SelectItem value={TimePeriod.QUARTER}>90天</SelectItem>
                  <SelectItem value={TimePeriod.YEAR}>1年</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TrendAnalysisCard />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          <TopUsersCard />
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>使用量分布分析</CardTitle>
              <CardDescription>用户使用量的分布情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <PieChart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>分布分析图表正在开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 快速导出 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            快速导出
          </CardTitle>
          <CardDescription>快速导出当前分析数据</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Select value={exportFormat} onValueChange={(value) => setExportFormat(value as ExportFormat)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExportFormat.CSV}>CSV</SelectItem>
                <SelectItem value={ExportFormat.XLSX}>Excel</SelectItem>
                <SelectItem value={ExportFormat.JSON}>JSON</SelectItem>
                <SelectItem value={ExportFormat.PDF}>PDF</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleExport} disabled={loading}>
              <Download className="mr-2 h-4 w-4" />
              {loading ? '导出中...' : '立即导出'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}