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
  
  const [totalItems, setTotalItems] = useState(0)

  // 编辑对话框状态
  const [editingInviteCode, setEditingInviteCode] = useState<InviteCodeResponse | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 构建查询参数
      const queryParams: Record<string, unknown> = {
        limit: 100, // 获取更多数据，让客户端分页处理
        offset: 0,
        sort_by: 'created_at',
        sort_order: 'desc',
      }
      
      const response = await inviteCodeService.getInviteCodes(queryParams)
      
      console.log('Invite Codes API Response:', response) // 调试信息
      
      if (response.code === 0 && response.data) {
        setInviteCodes(response.data || [])
        setTotalItems(response.total || 0)
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
  }, [])

  const handleInviteCodeCreated = useCallback(() => {
    // 重新加载邀请码列表
    loadData()
  }, [loadData])

  const handleInviteCodeUpdated = useCallback(() => {
    // 重新加载邀请码列表
    loadData()
  }, [loadData])

  const handleEdit = useCallback((inviteCode: InviteCodeResponse) => {
    setEditingInviteCode(inviteCode)
    setEditDialogOpen(true)
  }, [])

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false)
    setEditingInviteCode(null)
  }, [])


  useEffect(() => {
    loadData()
  }, [loadData])

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
                共 {totalItems} 个邀请码
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">加载中...</p>
                </div>
              ) : (
                <>
                  {/* 数据表格 */}
                  <DataTable 
                    columns={createColumns({ 
                      onInviteCodeUpdated: handleInviteCodeUpdated,
                      onEdit: handleEdit
                    })} 
                    data={inviteCodes}
                    searchKey="code"
                    searchPlaceholder="搜索邀请码或名称..."
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