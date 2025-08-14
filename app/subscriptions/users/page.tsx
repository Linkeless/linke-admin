'use client'

import { useCallback, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHeader } from "@/components/layout/page-header"

import { createUserSubscriptionColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateUserSubscriptionDialog
} from "@/components/subscriptions/user-subscriptions"
import { useUserSubscriptions } from "@/hooks/queries/use-subscription"

export default function UserSubscriptionsPage() {
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 使用React Query hooks with pagination
  const { 
    data: subscriptionsResponse, 
    isLoading: loading, 
    error,
    refetch 
  } = useUserSubscriptions({
    offset: (currentPage - 1) * pageSize,
    limit: pageSize,
    enabled: true
  })

  // 提取数据
  const subscriptions = subscriptionsResponse?.data?.items || []
  const totalItems = subscriptionsResponse?.data?.pagination?.total || 0

  const handleSubscriptionCreated = useCallback(() => {
    // React Query会自动重新获取数据
    refetch()
  }, [refetch])

  const handleSubscriptionUpdated = useCallback(() => {
    // React Query会自动重新获取数据
    refetch()
  }, [refetch])

  // 处理分页变化
  const handlePaginationChange = useCallback((updater: (prev: { pageIndex: number; pageSize: number }) => { pageIndex: number; pageSize: number } | { pageIndex: number; pageSize: number }) => {
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
          title="用户订阅管理" 
          description="管理用户订阅，包括创建、续费、取消等操作"
        />
        <main className="flex-1 p-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <p className="text-destructive mb-4">加载用户订阅失败</p>
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
        title="用户订阅管理" 
        description="管理用户订阅，包括创建、续费、取消等操作"
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
          <CreateUserSubscriptionDialog onSubscriptionCreated={handleSubscriptionCreated} />
        </div>
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
                  {/* 数据表格（支持服务端分页） */}
                  <DataTable 
                    columns={createUserSubscriptionColumns({ 
                      onSubscriptionUpdated: handleSubscriptionUpdated
                    })} 
                    data={subscriptions}
                    searchPlaceholder="搜索用户信息..."
                    searchColumn="user"
                    columnNames={{
                      user: '用户信息',
                      subscription_plan: '订阅计划',
                      status: '状态',
                      current_period_start: '当前周期',
                      auto_renew: '自动续费',
                      days_left: '剩余天数',
                      is_in_trial: '试用状态',
                      created_at: '创建时间',
                    }}
                    manualPagination={true}
                    pageCount={Math.ceil(totalItems / pageSize)}
                    totalItems={totalItems}
                    currentPage={currentPage}
                    pageSize={pageSize}
                    initialPagination={{ pageIndex: currentPage - 1, pageSize }}
                    onPaginationChange={handlePaginationChange}
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