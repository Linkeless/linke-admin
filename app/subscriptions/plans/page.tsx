'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Package } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { subscriptionService } from "@/lib/subscription-service"
import { SubscriptionPlan } from "@/lib/subscription-types"
import { createPlanColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { useIsMobile } from "@/hooks/use-mobile"
import { 
  CreatePlanDialog,
  EditPlanDialog,
  PlanDetailDialog
} from "@/components/subscriptions/subscription-plans"
import { SubscriptionPlanMobileCard } from "@/components/subscriptions"

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const isMobile = useIsMobile()
  
  const [totalItems, setTotalItems] = useState(0)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      console.log('加载订阅计划列表')
      const response = await subscriptionService.getPlans({
        limit: 100, // 获取更多数据，让客户端分页处理
        offset: 0
      })
      
      if (response.code === 0 && response.data) {
        setPlans(response.data.items || [])
        setTotalItems(response.data.pagination.total || 0)
      }
    } catch (error) {
      console.error('加载订阅计划列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePlanCreated = useCallback(() => {
    // 重新加载计划列表
    loadData()
  }, [loadData])

  const handlePlanUpdated = useCallback(() => {
    // 重新加载计划列表
    loadData()
  }, [loadData])

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
        await subscriptionService.deletePlan(plan.id)
        loadData() // 重新加载数据
      } catch (error) {
        console.error('删除计划失败:', error)
        alert('删除计划失败，请重试')
      }
    }
  }, [loadData])

  useEffect(() => {
    loadData()
  }, [loadData])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="订阅计划管理" 
        description="管理所有订阅计划，包括价格、流量、计费周期等配置"
      >
        <CreatePlanDialog onPlanCreated={handlePlanCreated} />
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
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载中...</p>
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