'use client'

import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { useDashboardOverview } from "@/hooks/queries/use-dashboard"

// 模块化的 Dashboard 组件
import { StatsCardsGrid } from "@/components/dashboard/stats-cards-grid"
import { DataOverviewCard } from "@/components/dashboard/data-overview-card"
import { SystemStatusCard } from "@/components/dashboard/system-status-card"
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid"
import { DashboardErrorAlert } from "@/components/dashboard/dashboard-error-alert"

export default function DashboardPage() {
  // 使用React Query hooks进行仪表板数据管理
  const { 
    data: overview, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useDashboardOverview({ 
    period: 'month',
    autoRefresh: false, // 禁用自动刷新，由用户手动控制
    refreshInterval: 300000 // 5分钟默认间隔
  })

  // 手动刷新数据
  const handleRefresh = () => {
    refetch()
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="仪表板" 
        description="欢迎使用 Linke 管理后台"
      >
        <Button 
          size="sm" 
          onClick={handleRefresh}
          disabled={isLoading || isRefetching}
        >
          {isLoading || isRefetching ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          刷新数据
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-8">
          {/* 错误提示 */}
          <DashboardErrorAlert 
            error={error ? (error as Error).message || '获取数据失败' : null} 
            onRetry={refetch}
            isRetrying={isRefetching}
          />

          {/* 统计卡片区域 */}
          <StatsCardsGrid 
            overview={overview || null} 
            loading={isLoading}
            onRefresh={handleRefresh}
            isRefetching={isRefetching}
            lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
          />
          
          {/* 图表和活动区域 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <DataOverviewCard 
              overview={overview || null} 
              loading={isLoading}
              onRefresh={handleRefresh}
              isRefetching={isRefetching}
              lastUpdated={dataUpdatedAt ? new Date(dataUpdatedAt) : null}
            />
            <SystemStatusCard 
              overview={overview || null}
              onRefresh={handleRefresh}
              isRefetching={isRefetching}
            />
          </div>
          
          {/* 快速操作区域 */}
          <QuickActionsGrid 
            overview={overview || null}
            onRefresh={handleRefresh}
            isRefetching={isRefetching}
          />
        </div>
      </main>
    </div>
  )
}
