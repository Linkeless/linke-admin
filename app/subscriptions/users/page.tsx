'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { subscriptionService } from "@/lib/subscription-service"
import { UserSubscription } from "@/lib/subscription-types"
import { createUserSubscriptionColumns } from "./columns"
import { DataTable } from "./data-table"
import { 
  CreateUserSubscriptionDialog
} from "@/components/subscriptions/user-subscriptions"

export default function UserSubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
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
      
      console.log('加载用户订阅列表，page:', page, 'offset:', offset, 'limit:', limit)
      const response = await subscriptionService.getUserSubscriptions({
        offset: offset,
        limit: limit
      })
      
      if (response.code === 0 && response.data) {
        // 后端直接返回数组格式
        setSubscriptions(response.data || [])
        // 分页信息在根级别
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('加载用户订阅列表失败:', error)
      // 可以添加错误提示
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSubscriptionCreated = useCallback(() => {
    // 重新加载订阅列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleSubscriptionUpdated = useCallback(() => {
    // 重新加载订阅列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="用户订阅管理" 
        description="管理用户订阅，包括创建、续费、取消等操作"
      >
        <CreateUserSubscriptionDialog onSubscriptionCreated={handleSubscriptionCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  用户订阅列表
                </CardTitle>
                <CardDescription>
                  共 {totalItems} 个订阅
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
                      columns={createUserSubscriptionColumns({ 
                        onSubscriptionUpdated: handleSubscriptionUpdated
                      })} 
                      data={subscriptions}
                      pageCount={Math.ceil(totalItems / pageSize)}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={(page) => loadData(page, pageSize)}
                      onPageSizeChange={(newPageSize) => {
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