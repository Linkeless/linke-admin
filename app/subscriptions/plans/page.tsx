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
import { DataTable } from "./data-table"
import { 
  CreatePlanDialog
} from "@/components/subscriptions/subscription-plans"

export default function SubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      // 将页码转换为offset
      const offset = (page - 1) * limit
      
      console.log('加载订阅计划列表，page:', page, 'offset:', offset, 'limit:', limit)
      const response = await subscriptionService.getPlans({
        offset: offset,
        limit: limit
      })
      
      if (response.code === 0 && response.data) {
        setPlans(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('加载订阅计划列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handlePlanCreated = useCallback(() => {
    // 重新加载计划列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handlePlanUpdated = useCallback(() => {
    // 重新加载计划列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

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
                  {/* 数据表格（支持服务端分页） */}
                  <DataTable 
                    columns={createPlanColumns({ 
                      onPlanUpdated: handlePlanUpdated
                    })} 
                    data={plans}
                    pageCount={Math.ceil(totalItems / pageSize)}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    totalItems={totalItems}
                    onPageChange={(page: number) => loadData(page, pageSize)}
                    onPageSizeChange={(newPageSize: number) => {
                      setPageSize(newPageSize)
                      setCurrentPage(1)
                      loadData(1, newPageSize)
                    }}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}