'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TicketIcon } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { inviteCodeService } from "@/lib/invite-code-service"
import { InviteCodeResponse } from "@/lib/invite-code-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateInviteCodeDialog, 
  EditInviteCodeDialog,
  BatchCreateDialog
} from "./components"

export default function InviteCodesPage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCodeResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 编辑对话框状态
  const [editingInviteCode, setEditingInviteCode] = useState<InviteCodeResponse | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // 筛选状态
  const [filters, setFilters] = useState({
    status: 'all',
    is_unlimited: 'all',
    search: '',
  })

  const loadData = useCallback(async (page: number = 1, limit: number = 10, currentFilters = filters) => {
    try {
      setLoading(true)
      
      // 将页码转换为offset
      const offset = (page - 1) * limit
      
      // 构建查询参数
      const queryParams: Record<string, unknown> = {
        offset: offset,
        limit: limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      }

      // 添加筛选条件
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && value !== '' && value !== 'all') {
          if (key === 'is_unlimited') {
            queryParams[key] = value === 'true'
          } else {
            queryParams[key] = value
          }
        }
      })
      
      const response = await inviteCodeService.getInviteCodes(queryParams)
      
      console.log('Invite Codes API Response:', response) // 调试信息
      
      if (response.code === 0 && response.data) {
        setInviteCodes(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      } else {
        console.error('API返回错误:', response)
        setInviteCodes([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('加载邀请码列表失败:', error)
      setInviteCodes([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [filters])

  const handleInviteCodeCreated = useCallback(() => {
    // 重新加载邀请码列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleInviteCodeUpdated = useCallback(() => {
    // 重新加载邀请码列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleEdit = useCallback((inviteCode: InviteCodeResponse) => {
    setEditingInviteCode(inviteCode)
    setEditDialogOpen(true)
  }, [])

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false)
    setEditingInviteCode(null)
  }, [])

  const handleFiltersChange = useCallback((newFilters: { status: string; is_unlimited: string }) => {
    setFilters(newFilters)
    setCurrentPage(1) // 重置到第一页
    loadData(1, pageSize, newFilters)
  }, [loadData, pageSize])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="邀请码管理" 
        description="管理用户注册邀请码，控制用户注册权限"
      >
        <BatchCreateDialog onInviteCodesCreated={handleInviteCodeCreated} />
        <CreateInviteCodeDialog onInviteCodeCreated={handleInviteCodeCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计信息卡片区域 - 可以后续添加统计组件 */}
          {/* <InviteCodeStatsCards /> */}

          {/* 筛选器区域 - 可以后续添加筛选组件 */}
          {/* <InviteCodeFilters onFiltersChange={handleFiltersChange} /> */}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TicketIcon className="h-5 w-5" />
                邀请码列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 个邀请码，当前显示第 {currentPage} 页
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
                      onInviteCodeUpdated: handleInviteCodeUpdated,
                      onEdit: handleEdit
                    })} 
                    data={inviteCodes}
                    searchPlaceholder="搜索邀请码或名称..."
                    searchColumn="code"
                    columnNames={{
                      code: '邀请码',
                      name: '名称',
                      status: '状态',
                      used_count: '使用情况',
                      valid_until: '有效期',
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

      {/* 编辑邀请码对话框 */}
      <EditInviteCodeDialog
        inviteCode={editingInviteCode}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        onInviteCodeUpdated={handleInviteCodeUpdated}
      />
    </div>
  )
}