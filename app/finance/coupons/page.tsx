'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Ticket } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { couponService } from "@/lib/coupon-service"
import { CouponResponse } from "@/lib/coupon-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { CreateCouponDialog } from "@/components/finance/coupons/create-coupon-dialog"
import { EditCouponDialog } from "@/components/finance/coupons/edit-coupon-dialog"

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<CouponResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 编辑对话框状态
  const [editingCoupon, setEditingCoupon] = useState<CouponResponse | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      // 将页码转换为offset
      const offset = (page - 1) * limit
      
      const response = await couponService.getCoupons({
        offset: offset,
        limit: limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      
      console.log('Coupons API Response:', response) // 调试信息
      
      if (response.code === 0 && response.data) {
        setCoupons(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      } else {
        console.error('API返回错误:', response)
        setCoupons([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('加载优惠码列表失败:', error)
      setCoupons([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCouponCreated = useCallback(() => {
    // 重新加载优惠码列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleCouponUpdated = useCallback(() => {
    // 重新加载优惠码列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleEdit = useCallback((coupon: CouponResponse) => {
    setEditingCoupon(coupon)
    setEditDialogOpen(true)
  }, [])

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false)
    setEditingCoupon(null)
  }, [])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="优惠码管理" 
        description="管理系统优惠码和折扣活动"
      >
        <CreateCouponDialog onCouponCreated={handleCouponCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ticket className="h-5 w-5" />
                优惠码列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 个优惠码
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
                      onCouponUpdated: handleCouponUpdated,
                      onEdit: handleEdit
                    })} 
                    data={coupons}
                    searchPlaceholder="搜索优惠码..."
                    searchColumn="code"
                    columnNames={{
                      code: '优惠码',
                      type: '类型',
                      value: '优惠值',
                      status: '状态',
                      usage_count: '使用次数',
                      max_uses: '最大使用次数',
                      min_order_amount: '最低订单金额',
                      valid_from: '生效时间',
                      valid_until: '失效时间',
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

      {/* 编辑优惠码对话框 */}
      <EditCouponDialog
        coupon={editingCoupon}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        onCouponUpdated={handleCouponUpdated}
      />
    </div>
  )
}