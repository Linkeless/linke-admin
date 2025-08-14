'use client'

import { useCallback, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock, AlertCircle, RefreshCw } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { 
  ALERT_TYPE_CONFIG,
  ALERT_SEVERITY_CONFIG
} from "@/lib/subscription-types"
import { createAlertColumns } from "./components/alert-columns"
import { BulkResolveDialog } from "./components/bulk-resolve-dialog"
import { AlertStatsCard } from "./components/alert-stats-card"
import { useAlerts, useBulkResolveAlerts } from "@/hooks/queries/use-alerts"

export default function SubscriptionAlertsPage() {
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 使用React Query hooks
  const { 
    data: alertsResponse, 
    isLoading: loading, 
    error, 
    refetch 
  } = useAlerts({
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
    enabled: true
  })

  const bulkResolveMutation = useBulkResolveAlerts()

  // 提取数据
  const alerts = alertsResponse?.items || []
  const totalItems = alertsResponse?.total || 0
  const statistics = alertsResponse?.statistics

  const handleBulkResolve = useCallback(async (alertIds: number[], note?: string) => {
    try {
      await bulkResolveMutation.mutateAsync({ alertIds, note })
      setSelectedAlerts([])
    } catch (error) {
      // 错误已通过mutation自动处理和显示
      console.error('批量解决告警失败:', error)
    }
  }, [bulkResolveMutation])

  const handleAlertUpdated = useCallback(() => {
    // React Query会自动重新获取数据
    refetch()
  }, [refetch])

  // 处理分页变化
  const handlePaginationChange = useCallback((updater: any) => {
    const newPagination = typeof updater === 'function' 
      ? updater({ pageIndex: currentPage - 1, pageSize })
      : updater
    const newPage = newPagination.pageIndex + 1
    const newPageSize = newPagination.pageSize
    
    if (newPageSize !== pageSize) {
      setPageSize(newPageSize)
      setCurrentPage(1)
    } else if (newPage !== currentPage) {
      setCurrentPage(newPage)
    }
  }, [currentPage, pageSize])

  // 错误处理
  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订阅告警管理" 
          description="监控订阅相关的告警信息，及时处理系统异常和用户问题"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">加载告警数据失败</p>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  重试
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="订阅告警管理" 
        description="监控订阅相关的告警信息，及时处理系统异常和用户问题"
      >
        <div className="flex gap-2">
          {selectedAlerts.length > 0 && (
            <BulkResolveDialog 
              selectedCount={selectedAlerts.length}
              onResolve={handleBulkResolve}
              alertIds={selectedAlerts}
              loading={bulkResolveMutation.isPending}
            />
          )}
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新数据
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计概览 */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <AlertStatsCard
                title="总告警数"
                value={statistics.total_alerts}
                icon={AlertTriangle}
                color="blue"
                loading={loading}
              />
              <AlertStatsCard
                title="待处理"
                value={statistics.pending_alerts}
                icon={Clock}
                color="yellow"
                loading={loading}
              />
              <AlertStatsCard
                title="已解决"
                value={statistics.resolved_alerts}
                icon={CheckCircle}
                color="green"
                loading={loading}
              />
              <AlertStatsCard
                title="紧急告警"
                value={statistics.critical_alerts}
                icon={AlertCircle}
                color="red"
                loading={loading}
              />
            </div>
          )}

          {/* 告警分布卡片 */}
          {statistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className={loading ? 'animate-pulse' : ''}>
                <CardHeader>
                  <CardTitle>按类型分布</CardTitle>
                  <CardDescription>不同告警类型的分布情况</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.by_type).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {ALERT_TYPE_CONFIG[type as keyof typeof ALERT_TYPE_CONFIG]?.text || type}
                          </Badge>
                        </div>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className={loading ? 'animate-pulse' : ''}>
                <CardHeader>
                  <CardTitle>按严重程度分布</CardTitle>
                  <CardDescription>不同严重程度的告警分布</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(statistics.by_severity).map(([severity, count]) => (
                      <div key={severity} className="flex items-center justify-between">
                        <Badge 
                          variant={ALERT_SEVERITY_CONFIG[severity as keyof typeof ALERT_SEVERITY_CONFIG]?.variant}
                        >
                          {ALERT_SEVERITY_CONFIG[severity as keyof typeof ALERT_SEVERITY_CONFIG]?.text || severity}
                        </Badge>
                        <span className="font-medium">{count}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 告警列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                告警列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 条告警 {selectedAlerts.length > 0 && `(已选择 ${selectedAlerts.length} 条)`}
                {loading && ' (加载中...)'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <p>加载中...</p>
                  </div>
                </div>
              ) : (
                <DataTable 
                  columns={createAlertColumns({ 
                    onAlertUpdated: handleAlertUpdated,
                    onSelectionChange: setSelectedAlerts,
                    selectedAlerts
                  })} 
                  data={alerts}
                  searchKey="title"
                  searchPlaceholder="搜索告警标题..."
                  manualPagination={true}
                  pageCount={Math.ceil(totalItems / pageSize)}
                  totalItems={totalItems}
                  currentPage={currentPage}
                  pageSize={pageSize}
                  initialPagination={{ pageIndex: currentPage - 1, pageSize }}
                  onPaginationChange={handlePaginationChange}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}