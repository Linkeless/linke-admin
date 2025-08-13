'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AlertTriangle, CheckCircle, Clock, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { 
  SubscriptionAlert, 
  AlertStatistics,
  ALERT_TYPE_CONFIG,
  ALERT_SEVERITY_CONFIG
} from "@/lib/subscription-types"
import { createAlertColumns } from "./components/alert-columns"
import { BulkResolveDialog } from "./components/bulk-resolve-dialog"
import { AlertStatsCard } from "./components/alert-stats-card"

export default function SubscriptionAlertsPage() {
  const [alerts, setAlerts] = useState<SubscriptionAlert[]>([])
  const [statistics, setStatistics] = useState<AlertStatistics | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedAlerts, setSelectedAlerts] = useState<number[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 模拟数据加载
  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟告警数据
      const mockAlerts: SubscriptionAlert[] = [
        {
          id: 1,
          user_id: 1001,
          subscription_id: 2001,
          alert_type: 'renewal_failed',
          severity: 'high',
          title: '用户订阅续费失败',
          message: '用户 john@example.com 的订阅续费失败，信用卡被拒绝',
          status: 'pending',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T10:30:00Z',
          user: {
            id: 1001,
            email: 'john@example.com',
            username: 'john_doe',
            name: 'John Doe'
          },
          subscription: {
            id: 2001,
            uuid: 'sub_1234567890',
            status: 'past_due',
            subscription_plan: {
              name: '专业版月付'
            }
          }
        },
        {
          id: 2,
          user_id: 1002,
          subscription_id: 2002,
          alert_type: 'expiration_warning',
          severity: 'medium',
          title: '订阅即将过期',
          message: '用户 jane@example.com 的订阅将在3天后过期',
          status: 'pending',
          created_at: '2024-01-14T15:20:00Z',
          updated_at: '2024-01-14T15:20:00Z',
          user: {
            id: 1002,
            email: 'jane@example.com',
            username: 'jane_smith',
            name: 'Jane Smith'
          },
          subscription: {
            id: 2002,
            uuid: 'sub_2345678901',
            status: 'active',
            subscription_plan: {
              name: '基础版年付'
            }
          }
        },
        {
          id: 3,
          user_id: 1003,
          subscription_id: 2003,
          alert_type: 'traffic_limit',
          severity: 'critical',
          title: '流量使用超限',
          message: '用户 bob@example.com 已使用95%的月度流量配额',
          status: 'resolved',
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T12:45:00Z',
          resolved_at: '2024-01-13T12:45:00Z',
          user: {
            id: 1003,
            email: 'bob@example.com',
            username: 'bob_wilson',
            name: 'Bob Wilson'
          },
          subscription: {
            id: 2003,
            uuid: 'sub_3456789012',
            status: 'active',
            subscription_plan: {
              name: '企业版月付'
            }
          }
        }
      ]

      // 模拟统计数据
      const mockStatistics: AlertStatistics = {
        total_alerts: 45,
        pending_alerts: 12,
        resolved_alerts: 30,
        critical_alerts: 3,
        high_priority_alerts: 8,
        by_type: {
          renewal_failed: 15,
          payment_failed: 8,
          expiration_warning: 12,
          traffic_limit: 7,
          usage_limit: 2,
          system_error: 1
        },
        by_severity: {
          low: 18,
          medium: 15,
          high: 9,
          critical: 3
        },
        recent_trend: [
          { date: '2024-01-10', count: 5 },
          { date: '2024-01-11', count: 8 },
          { date: '2024-01-12', count: 6 },
          { date: '2024-01-13', count: 10 },
          { date: '2024-01-14', count: 7 },
          { date: '2024-01-15', count: 9 }
        ]
      }

      setAlerts(mockAlerts)
      setStatistics(mockStatistics)
      setTotalItems(mockAlerts.length)
      setCurrentPage(page)
    } catch (error) {
      console.error('加载告警数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleBulkResolve = useCallback(async (alertIds: number[], note?: string) => {
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新本地状态
      setAlerts(prev => prev.map(alert => 
        alertIds.includes(alert.id) 
          ? { ...alert, status: 'resolved' as const, resolved_at: new Date().toISOString() }
          : alert
      ))
      
      setSelectedAlerts([])
      console.log('批量解决告警:', alertIds, note)
    } catch (error) {
      console.error('批量解决告警失败:', error)
    }
  }, [])

  const handleAlertUpdated = useCallback(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

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
            />
          )}
          <Button variant="outline" onClick={() => loadData(currentPage, pageSize)}>
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
              />
              <AlertStatsCard
                title="待处理"
                value={statistics.pending_alerts}
                icon={Clock}
                color="yellow"
              />
              <AlertStatsCard
                title="已解决"
                value={statistics.resolved_alerts}
                icon={CheckCircle}
                color="green"
              />
              <AlertStatsCard
                title="紧急告警"
                value={statistics.critical_alerts}
                icon={AlertCircle}
                color="red"
              />
            </div>
          )}

          {/* 告警分布卡片 */}
          {statistics && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
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

              <Card>
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载中...</p>
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
                  onPaginationChange={(updater) => {
                    const newPagination = typeof updater === 'function' 
                      ? updater({ pageIndex: currentPage - 1, pageSize })
                      : updater
                    const newPage = newPagination.pageIndex + 1
                    const newPageSize = newPagination.pageSize
                    
                    if (newPageSize !== pageSize) {
                      setPageSize(newPageSize)
                      setCurrentPage(1)
                      loadData(1, newPageSize)
                    } else if (newPage !== currentPage) {
                      loadData(newPage, pageSize)
                    }
                  }}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}