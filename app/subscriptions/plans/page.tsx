'use client'

import { useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Package, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"

import { createPlanColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  CreatePlanDialog,
  EditPlanDialog,
  PlanDetailDialog
} from "@/components/subscriptions/subscription-plans"
import { SubscriptionPlanMobileCard } from "@/components/subscriptions"
import { useSubscriptionPlans } from "@/hooks/queries/use-subscription"
import { useDeleteSubscriptionPlan } from "@/hooks/mutations/use-subscription-mutations"
import { SubscriptionPlan } from "@/lib/subscription-types"
import { toast } from "sonner"

export default function SubscriptionPlansPage() {
  const isMobile = useIsMobile()
  
  // 使用React Query hooks
  const { 
    data: plansResponse, 
    isLoading: loading, 
    error, 
    refetch 
  } = useSubscriptionPlans({
    limit: 100, // 获取更多数据，让客户端分页处理
    offset: 0,
    enabled: true
  })

  const deletePlanMutation = useDeleteSubscriptionPlan()

  // 提取数据
  const plans = plansResponse?.data?.items || []
  const totalItems = plansResponse?.data?.pagination?.total || 0

  const handlePlanCreated = useCallback(() => {
    // React Query会自动重新获取数据
    refetch()
  }, [refetch])

  const handlePlanUpdated = useCallback(() => {
    // React Query会自动重新获取数据
    refetch()
  }, [refetch])

  // 移动端操作处理
  const handleViewPlan = useCallback((plan: SubscriptionPlan) => {
    // 实现查看计划详情逻辑
    console.log('View plan:', plan)
  }, [])

  const handleEditPlan = useCallback((plan: SubscriptionPlan) => {
    // 实现编辑计划逻辑
    console.log('Edit plan:', plan)
  }, [])

  const handleDeletePlan = useCallback(async (plan: SubscriptionPlan) => {
    if (confirm('确定要删除这个订阅计划吗？此操作不可撤销。')) {
      try {
        await deletePlanMutation.mutateAsync(plan.id)
      } catch (error) {
        // 错误已通过mutation自动处理和显示
        console.error('删除计划失败:', error)
      }
    }
  }, [deletePlanMutation])

  // 错误处理
  if (error) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订阅计划管理" 
          description="管理所有订阅计划，包括价格、流量、计费周期等配置"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">加载订阅计划失败</p>
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
        title="订阅计划管理" 
        description="管理所有订阅计划，包括价格、流量、计费周期等配置"
      >
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <CreatePlanDialog onPlanCreated={handlePlanCreated} />
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                订阅计划列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 个计划
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
                <>
                  {/* 响应式数据显示 */}
                  {isMobile ? (
                    /* 移动端卡片视图 */
                    <div className="space-y-4">
                      {plans.map((plan) => (
                        <SubscriptionPlanMobileCard
                          key={plan.id}
                          plan={plan}
                          onView={handleViewPlan}
                          onEdit={handleEditPlan}
                          onDelete={handleDeletePlan}
                        />
                      ))}
                      {plans.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                          暂无订阅计划数据
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 桌面端表格视图 */
                    <DataTable 
                      columns={createPlanColumns({ 
                        onPlanUpdated: handlePlanUpdated
                      })} 
                      data={plans}
                      searchKey="name"
                      searchPlaceholder="搜索计划名称..."
                    />
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}