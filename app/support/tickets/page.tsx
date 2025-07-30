'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TicketCheck } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { ticketService } from "@/lib/ticket-service"
import { TicketResponse } from "@/lib/ticket-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { EditTicketDialog } from "@/components/support/tickets/edit-ticket-dialog"
import { TicketMessagesDialog } from "@/components/support/tickets/ticket-messages-dialog"

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 编辑对话框状态
  const [editingTicket, setEditingTicket] = useState<TicketResponse | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  // 消息对话框状态
  const [viewingTicket, setViewingTicket] = useState<TicketResponse | null>(null)
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      // 将页码转换为offset
      const offset = (page - 1) * limit
      
      const response = await ticketService.getTickets({
        offset: offset,
        limit: limit,
        sort_by: 'created_at',
        sort_order: 'desc',
      })
      
      console.log('Tickets API Response:', response) // 调试信息
      
      if (response.code === 0 && response.data) {
        setTickets(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      } else {
        console.error('API返回错误:', response)
        setTickets([])
        setTotalItems(0)
      }
    } catch (error) {
      console.error('加载工单列表失败:', error)
      setTickets([])
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleTicketUpdated = useCallback(() => {
    // 重新加载工单列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleEdit = useCallback((ticket: TicketResponse) => {
    setEditingTicket(ticket)
    setEditDialogOpen(true)
  }, [])

  const handleEditDialogClose = useCallback(() => {
    setEditDialogOpen(false)
    setEditingTicket(null)
  }, [])

  const handleViewMessages = useCallback((ticket: TicketResponse) => {
    setViewingTicket(ticket)
    setMessagesDialogOpen(true)
  }, [])

  const handleMessagesDialogClose = useCallback(() => {
    setMessagesDialogOpen(false)
    setViewingTicket(null)
  }, [])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="工单管理" 
        description="管理系统工单和客户支持请求"
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TicketCheck className="h-5 w-5" />
                工单列表
              </CardTitle>
              <CardDescription>
                共 {totalItems} 个工单
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
                      onTicketUpdated: handleTicketUpdated,
                      onEdit: handleEdit,
                      onViewMessages: handleViewMessages
                    })} 
                    data={tickets}
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

      {/* 编辑工单对话框 */}
      <EditTicketDialog
        ticket={editingTicket}
        open={editDialogOpen}
        onOpenChange={handleEditDialogClose}
        onTicketUpdated={handleTicketUpdated}
      />

      {/* 工单消息对话框 */}
      <TicketMessagesDialog
        ticket={viewingTicket}
        open={messagesDialogOpen}
        onOpenChange={handleMessagesDialogClose}
        onMessageAdded={handleTicketUpdated}
      />
    </div>
  )
}