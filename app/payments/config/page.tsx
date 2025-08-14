'use client'

import { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, RefreshCw, AlertCircle } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'

import { PaymentConfigResponse } from '@/lib/payment-types'
import { createColumns } from './columns'
import { DataTable } from '@/components/ui/data-table'
import { CreatePaymentConfigDialog, EditPaymentConfigDialog } from './components'
import { usePaymentConfigs } from '@/hooks/queries/use-payments'
import { errorUtils } from '@/lib/error-handler'

export default function PaymentConfigPage() {
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 编辑对话框状态
  const [editingConfig, setEditingConfig] = useState<PaymentConfigResponse | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // 使用 React Query 获取支付配置数据
  const { 
    data: configsResponse, 
    isLoading, 
    error, 
    refetch,
    isError 
  } = usePaymentConfigs({
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
    enabled: true
  })

  // 从响应中提取数据
  const paymentConfigs = configsResponse?.data || []
  const totalItems = configsResponse?.total || 0

  // 获取用户友好的错误消息
  const errorMessage = error ? errorUtils.formatUserMessage(error) : null

  const handleConfigCreated = useCallback(() => {
    // 重新加载配置列表
    refetch()
  }, [refetch])

  const handleConfigUpdated = useCallback(() => {
    // 重新加载配置列表
    refetch()
  }, [refetch])

  const handleEdit = useCallback((config: PaymentConfigResponse) => {
    setEditingConfig(config)
    setEditDialogOpen(true)
  }, [])

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false)
    setEditingConfig(null)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page)
      setEditingConfig(null) // 清空编辑状态
      setEditDialogOpen(false)
    }
  }, [currentPage])

  const handleRefresh = useCallback(() => {
    refetch()
  }, [refetch])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="支付配置" 
        description="管理系统支付配置和支付方式"
      >
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <CreatePaymentConfigDialog onConfigCreated={handleConfigCreated} />
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 错误提示 */}
          {isError && errorMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {errorMessage}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="ml-2 h-6"
                  onClick={handleRefresh}
                >
                  重试
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                支付配置列表
              </CardTitle>
              <CardDescription>
                {isLoading ? (
                  <Skeleton className="h-4 w-48" />
                ) : (
                  `共 ${totalItems} 个配置，当前显示第 ${currentPage} 页`
                )}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center space-x-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <p className="text-muted-foreground">加载支付配置...</p>
                    </div>
                  </div>
                  {/* 表格骨架 */}
                  <div className="space-y-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                </div>
              ) : paymentConfigs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 space-y-4">
                  <CreditCard className="h-12 w-12 text-muted-foreground" />
                  <div className="text-center space-y-2">
                    <h3 className="text-lg font-medium">暂无支付配置</h3>
                    <p className="text-sm text-muted-foreground">
                      点击右上角"创建配置"按钮添加第一个支付配置
                    </p>
                  </div>
                  <CreatePaymentConfigDialog onConfigCreated={handleConfigCreated} />
                </div>
              ) : (
                <>
                  {/* 数据表格 */}
                  <DataTable 
                    columns={createColumns({ 
                      onConfigUpdated: handleConfigUpdated,
                      onEdit: handleEdit
                    })} 
                    data={paymentConfigs}
                    searchKey="name"
                    searchPlaceholder="搜索配置名称..."
                  />
                  
                  {/* 自定义分页控制 */}
                  {totalItems > pageSize && (
                    <div className="flex items-center justify-between px-2 py-4">
                      <div className="text-sm text-muted-foreground">
                        共 {totalItems} 个配置，当前显示第 {currentPage} 页
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                          disabled={currentPage <= 1 || isLoading}
                        >
                          上一页
                        </Button>
                        <span className="px-3 py-1 text-sm">
                          {currentPage} / {Math.ceil(totalItems / pageSize)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1))}
                          disabled={currentPage >= Math.ceil(totalItems / pageSize) || isLoading}
                        >
                          下一页
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 编辑支付配置对话框 */}
      <EditPaymentConfigDialog
        config={editingConfig}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        onConfigUpdated={handleConfigUpdated}
      />
    </div>
  )
}