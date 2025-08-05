'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
      
      if (response.code === 0 && response.data) {
        // 实际API返回的是 {code, message, data: [...], total, limit, offset}
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
              ) : (
                <>
                  {/* 数据表格（支持服务端分页） */}
                  <DataTable 
                    columns={createColumns({ 
                      onConfigUpdated: handleConfigUpdated,
                      onEdit: handleEdit
                    })} 
                    data={paymentConfigs}
                    searchPlaceholder="搜索配置名称..."
                    searchColumn="name"
                    columnNames={{
                      name: '名称',
                      gateway: '支付网关',
                      method: '支付方式',
                      environment: '环境',
                      is_enabled: '状态',
                      created_at: '创建时间',
                    }}
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