'use client'

import { Button } from "@/components/ui/button"
import { RefreshCw, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { useDashboardData } from "@/hooks/use-dashboard-data"

// 模块化的 Dashboard 组件
import { StatsCardsGrid } from "@/components/dashboard/stats-cards-grid"
import { DataOverviewCard } from "@/components/dashboard/data-overview-card"
import { SystemStatusCard } from "@/components/dashboard/system-status-card"
import { QuickActionsGrid } from "@/components/dashboard/quick-actions-grid"
import { DashboardErrorAlert } from "@/components/dashboard/dashboard-error-alert"

export default function DashboardPage() {
  const { overview, loading, error, actions } = useDashboardData({ period: 'month' })

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="仪表板" 
        description="欢迎使用 Linke 管理后台"
      >
        <Button 
          size="sm" 
          onClick={actions.refreshAll}
          disabled={loading.overview}
        >
          {loading.overview ? (
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
            error={error.overview} 
            onRetry={actions.fetchOverview} 
          />

          {/* 统计卡片区域 */}
          <StatsCardsGrid 
            overview={overview} 
            loading={loading.overview} 
          />
          
          {/* 图表和活动区域 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <DataOverviewCard 
              overview={overview} 
              loading={loading.overview} 
            />
            <SystemStatusCard overview={overview} />
          </div>
          
          {/* 快速操作区域 */}
          <QuickActionsGrid overview={overview} />
        </div>
      </main>
    </div>
  )
}
