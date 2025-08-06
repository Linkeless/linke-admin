'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { Plus, Search, Filter, TicketCheck, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { ticketService } from "@/lib/ticket-service"
import { TicketResponse, TicketQueryParams, TicketStatsResponse } from "@/lib/ticket-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { EditTicketDialog, CreateTicketDialog } from "@/components/support/tickets"
import { TicketMessagesDialog } from "@/components/support/tickets/ticket-messages-dialog"

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<TicketStatsResponse | null>(null)
  // Use toast from sonner directly
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  // 搜索和筛选状态
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // 对话框状态
  const [editingTicket, setEditingTicket] = useState<TicketResponse | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [viewingTicket, setViewingTicket] = useState<TicketResponse | null>(null)
  const [messagesDialogOpen, setMessagesDialogOpen] = useState(false)

  const buildQueryParams = useCallback((page: number, limit: number): TicketQueryParams => {
    const params: TicketQueryParams = {
      offset: (page - 1) * limit,
      limit: limit,
      sort_by: 'created_at',
      sort_order: 'desc',
    }

    if (searchQuery.trim()) {
      params.search = searchQuery.trim()
    }

    if (statusFilter !== 'all') {
      params.status = statusFilter as any
    }

    if (priorityFilter !== 'all') {
      params.priority = priorityFilter as any
    }

    if (categoryFilter !== 'all') {
      params.category = categoryFilter as any
    }

    return params
  }, [searchQuery, statusFilter, priorityFilter, categoryFilter])

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      const params = buildQueryParams(page, limit)
      const response = await ticketService.getTickets(params)
      
      if (response.code === 0 && response.data) {
        setTickets(response.data || [])
        setTotalItems(response.total || 0)
        setCurrentPage(page)
      } else {
        console.error('API返回错误:', response)
        setTickets([])
        setTotalItems(0)
        toast.error("加载失败", {
          description: response.message || "无法加载工单列表",
        })
      }
    } catch (error) {
      console.error('加载工单列表失败:', error)
      setTickets([])
      setTotalItems(0)
      toast.error("网络错误", {
        description: "无法连接到服务器，请检查网络连接",
      })
    } finally {
      setLoading(false)
    }
  }, [buildQueryParams])

  const loadStats = useCallback(async () => {
    try {
      const response = await ticketService.getTicketStats()
      if (response.code === 0 && response.data) {
        setStats(response.data)
      }
    } catch (error) {
      console.error('加载统计数据失败:', error)
    }
  }, [])

  const handleTicketUpdated = useCallback(() => {
    // 重新加载工单列表和统计数据
    loadData(currentPage, pageSize)
    loadStats()
    toast.success("操作成功", {
      description: "工单已更新",
    })
  }, [loadData, loadStats, currentPage, pageSize])

  const handleSearch = useCallback(() => {
    setCurrentPage(1)
    loadData(1, pageSize)
  }, [loadData, pageSize])

  const handleResetFilters = useCallback(() => {
    setSearchQuery("")
    setStatusFilter("all")
    setPriorityFilter("all")
    setCategoryFilter("all")
    setCurrentPage(1)
    loadData(1, pageSize)
  }, [loadData, pageSize])

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
    loadStats()
  }, [loadData, loadStats, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="工单管理" 
        description="管理系统工单和客户支持请求"
      >
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          创建工单
        </Button>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计卡片 */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">总工单</CardTitle>
                  <TicketCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_tickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">待处理</CardTitle>
                  <AlertCircle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.open_tickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">处理中</CardTitle>
                  <Clock className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-600">{stats.in_progress_tickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已解决</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.resolved_tickets}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">已关闭</CardTitle>
                  <XCircle className="h-4 w-4 text-gray-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-600">{stats.closed_tickets}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* 搜索和筛选 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                搜索和筛选
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="搜索工单标题、描述或工单号..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSearch()
                          }
                        }}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <Button onClick={handleSearch} variant="default" className="gap-2">
                    <Search className="h-4 w-4" />
                    搜索
                  </Button>
                </div>
                
                <div className="flex gap-4 flex-wrap">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="状态" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部状态</SelectItem>
                      {ticketService.getTicketStatuses().map((status) => (
                        <SelectItem key={status.value} value={status.value}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-xs ${status.color}`}>
                              {status.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="优先级" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部优先级</SelectItem>
                      {ticketService.getTicketPriorities().map((priority) => (
                        <SelectItem key={priority.value} value={priority.value}>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`text-xs ${priority.color}`}>
                              {priority.label}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="类别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部类别</SelectItem>
                      {ticketService.getTicketCategories().map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button 
                    onClick={handleResetFilters} 
                    variant="outline"
                    className="gap-2"
                  >
                    <XCircle className="h-4 w-4" />
                    重置
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 工单列表 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TicketCheck className="h-5 w-5" />
                工单列表
              </CardTitle>
              <CardDescription>
                {searchQuery || statusFilter !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' 
                  ? `筛选结果：${totalItems} 个工单` 
                  : `共 ${totalItems} 个工单`
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground ml-3">加载中...</p>
                </div>
              ) : (
                <DataTable 
                  columns={createColumns({ 
                    onTicketUpdated: handleTicketUpdated,
                    onEdit: handleEdit,
                    onViewMessages: handleViewMessages
                  })} 
                  data={tickets}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* 创建工单对话框 */}
      <CreateTicketDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onTicketCreated={handleTicketUpdated}
      />

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