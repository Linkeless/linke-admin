'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'

import { paymentService } from '@/lib/payment-service'
import { PaymentConfigResponse } from '@/lib/payment-types'
import { createColumns } from './columns'
import { DataTable } from '@/components/ui/data-table'
import { CreatePaymentConfigDialog, EditPaymentConfigDialog } from './components'

export default function PaymentConfigPage() {
  const [paymentConfigs, setPaymentConfigs] = useState<PaymentConfigResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 编辑对话框状态
  const [editingConfig, setEditingConfig] = useState<PaymentConfigResponse | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      // 将页码转换为offset
      const offset = (page - 1) * limit
      
      const response = await paymentService.getPaymentConfigs({
        offset: offset,
        limit: limit
      })
      
      console.log('Payment Config API Response:', response) // 调试信息
      
      if (response.code === 0) {
        // 实际API返回的是 {code, message, data: [...], total, limit, offset}
        // data 可能为 null（空数据情况），需要正确处理
        setPaymentConfigs(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      } else {
        console.error('API返回错误:', response)
        setPaymentConfigs([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('加载支付配置列表失败:', error)
      setPaymentConfigs([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleConfigCreated = useCallback(() => {
    // 重新加载配置列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleConfigUpdated = useCallback(() => {
    // 重新加载配置列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleEdit = useCallback((config: PaymentConfigResponse) => {
    setEditingConfig(config)
    setEditDialogOpen(true)
  }, [])

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false)
    setEditingConfig(null)
  }, [])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="支付配置" 
        description="管理系统支付配置和支付方式"
      >
        <CreatePaymentConfigDialog onConfigCreated={handleConfigCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                支付配置列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 个配置，当前显示第 {currentPage} 页
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载中...</p>
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
                          onClick={() => loadData(Math.max(1, currentPage - 1), pageSize)}
                          disabled={currentPage <= 1}
                        >
                          上一页
                        </Button>
                        <span className="px-3 py-1 text-sm">
                          {currentPage} / {Math.ceil(totalItems / pageSize)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadData(Math.min(Math.ceil(totalItems / pageSize), currentPage + 1), pageSize)}
                          disabled={currentPage >= Math.ceil(totalItems / pageSize)}
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