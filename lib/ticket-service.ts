import {
  TicketResponse,
  CreateTicketRequest,
  CreateTicketMessageRequest,
  UpdateTicketRequest,
  UpdateTicketMessageRequest,
  AssignTicketRequest,
  ResolveTicketRequest,
  EscalateTicketRequest,
  TicketQueryParams,
  TicketSearchParams,
  TicketStatsResponse,
  TicketStatistics,
  TicketMessageResponse,
  TicketMessageQueryParams,
  BatchTicketRequest,
  BulkTicketActionRequest,
  TicketsApiResponse,
  TicketMessagesApiResponse,
  ApiResponse
} from './ticket-types'
import { getToken } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

class TicketService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 添加认证 token
    const token = getToken()
    if (token) {
      defaultHeaders.Authorization = `Bearer ${token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('API request failed:', error)
      throw error
    }
  }

  // 获取工单列表
  async getTickets(params?: TicketQueryParams): Promise<TicketsApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/tickets${queryString ? `?${queryString}` : ''}`
    
    return this.request<TicketsApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 获取工单统计 (保留向后兼容)
  async getTicketStats(): Promise<ApiResponse<TicketStatsResponse>> {
    return this.request<ApiResponse<TicketStatsResponse>>('/admin/tickets/statistics', {
      method: 'GET',
    })
  }

  /**
   * 高级工单搜索
   * @param params 搜索参数
   * @returns 搜索结果
   */
  async searchTickets(params: TicketSearchParams): Promise<TicketsApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/tickets/search${queryString ? `?${queryString}` : ''}`
    
    return this.request<TicketsApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  /**
   * 获取详细的工单统计数据
   * @returns 完整的工单统计信息
   */
  async getTicketStatistics(): Promise<ApiResponse<TicketStatistics>> {
    return this.request<ApiResponse<TicketStatistics>>('/admin/tickets/statistics', {
      method: 'GET',
    })
  }

  // 根据ID获取工单详情
  async getTicketById(id: number): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/${id}`, {
      method: 'GET',
    })
  }

  // 根据工单号获取工单详情
  async getTicketByNumber(ticketNumber: string): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/number/${ticketNumber}`, {
      method: 'GET',
    })
  }

  /**
   * 创建工单 (管理员代用户创建)
   * @param data 创建工单的数据
   * @returns 创建的工单信息
   */
  async createTicket(data: CreateTicketRequest): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>('/admin/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新工单
  async updateTicket(id: number, data: UpdateTicketRequest): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除工单
  async deleteTicket(id: number): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/admin/tickets/${id}`, {
      method: 'DELETE',
    })
  }

  // 分配工单
  async assignTicket(id: number, data: AssignTicketRequest): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/${id}/assign`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 解决工单
  async resolveTicket(id: number, data: ResolveTicketRequest): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 关闭工单
  async closeTicket(id: number): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/${id}/close`, {
      method: 'POST',
    })
  }

  /**
   * 重新打开已关闭的工单
   * @param id 工单ID
   * @returns 重新打开的工单信息
   */
  async reopenTicket(id: number): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/${id}/reopen`, {
      method: 'POST',
    })
  }

  /**
   * 升级工单到更高优先级或分配给其他代理
   * @param id 工单ID
   * @param data 升级请求数据
   * @returns 升级后的工单信息
   */
  async escalateTicket(id: number, data: EscalateTicketRequest): Promise<ApiResponse<TicketResponse>> {
    return this.request<ApiResponse<TicketResponse>>(`/admin/tickets/${id}/escalate`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 获取工单消息
  async getTicketMessages(ticketId: number, params?: TicketMessageQueryParams): Promise<TicketMessagesApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/tickets/${ticketId}/messages${queryString ? `?${queryString}` : ''}`
    
    return this.request<TicketMessagesApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 创建工单消息
  async createTicketMessage(ticketId: number, data: CreateTicketMessageRequest): Promise<ApiResponse<TicketMessageResponse>> {
    return this.request<ApiResponse<TicketMessageResponse>>(`/admin/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 批量分配工单给指定代理
   * @param data 批量分配数据
   * @returns 操作结果
   */
  async bulkAssignTickets(data: BulkTicketActionRequest): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/tickets/bulk/assign', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 批量关闭工单
   * @param data 批量操作数据
   * @returns 操作结果
   */
  async bulkCloseTickets(data: BulkTicketActionRequest): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/tickets/bulk/close', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  /**
   * 批量更新工单状态或优先级
   * @param data 批量更新数据
   * @returns 操作结果
   */
  async bulkUpdateTicketStatus(data: BulkTicketActionRequest): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/tickets/bulk/status', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 批量操作工单 (保留向后兼容，建议使用具体的bulk方法)
  async batchUpdateTickets(data: BatchTicketRequest): Promise<ApiResponse<void>> {
    // 根据操作类型路由到相应的bulk接口
    const bulkData: BulkTicketActionRequest = {
      action: data.operation as any,
      ticket_ids: data.ticket_ids,
      assigned_to_id: data.assigned_to_id,
      notes: data.notes,
    }

    switch (data.operation) {
      case 'assign':
        return this.bulkAssignTickets(bulkData)
      case 'close':
        return this.bulkCloseTickets(bulkData)
      default:
        return this.bulkUpdateTicketStatus(bulkData)
    }
  }

  // 格式化工单号显示
  formatTicketNumber(ticketNumber?: string | null): string {
    if (!ticketNumber) {
      return 'N/A'
    }
    return ticketNumber.toUpperCase()
  }

  // 格式化日期时间
  formatDateTime(dateString: string): string {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 计算工单状态
  getTicketStatus(ticket: TicketResponse): 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed' {
    return ticket.status
  }

  // 获取工单类别选项
  getTicketCategories(): { value: string; label: string }[] {
    return [
      { value: 'general', label: '常规问题' },
      { value: 'technical', label: '技术支持' },
      { value: 'billing', label: '账单问题' },
      { value: 'account', label: '账户问题' },
      { value: 'feature', label: '功能请求' },
      { value: 'bug', label: '错误报告' },
      { value: 'subscription', label: '订阅问题' },
      { value: 'payment', label: '支付问题' },
    ]
  }

  // 获取工单优先级选项
  getTicketPriorities(): { value: string; label: string; color: string }[] {
    return [
      { value: 'low', label: '较低', color: 'bg-gray-100 text-gray-800 border-gray-200' },
      { value: 'normal', label: '普通', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      { value: 'high', label: '较高', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      { value: 'urgent', label: '紧急', color: 'bg-orange-100 text-orange-800 border-orange-200' },
      { value: 'critical', label: '严重', color: 'bg-red-100 text-red-800 border-red-200' },
    ]
  }

  // 获取工单状态选项
  getTicketStatuses(): { value: string; label: string; color: string }[] {
    return [
      { value: 'open', label: '待处理', color: 'bg-red-100 text-red-800 border-red-200' },
      { value: 'in_progress', label: '处理中', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      { value: 'pending', label: '等待中', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      { value: 'resolved', label: '已解决', color: 'bg-green-100 text-green-800 border-green-200' },
      { value: 'closed', label: '已关闭', color: 'bg-gray-100 text-gray-600 border-gray-200' },
    ]
  }

  // 获取优先级显示信息
  getPriorityInfo(priority: string): { label: string; color: string } {
    const priorities = this.getTicketPriorities()
    return priorities.find(p => p.value === priority) || { label: priority, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  }

  // 获取状态显示信息
  getStatusInfo(status: string): { label: string; color: string } {
    const statuses = this.getTicketStatuses()
    return statuses.find(s => s.value === status) || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  }

  // 获取类别显示信息
  getCategoryInfo(category: string): { label: string } {
    const categories = this.getTicketCategories()
    return categories.find(c => c.value === category) || { label: category }
  }

  // 获取消息类型选项
  getMessageTypes(): { value: string; label: string }[] {
    return [
      { value: 'user', label: '用户消息' },
      { value: 'admin', label: '管理员回复' },
      { value: 'system', label: '系统消息' },
    ]
  }

  // 格式化相对时间
  formatRelativeTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) {
      return '刚刚'
    } else if (diffMins < 60) {
      return `${diffMins}分钟前`
    } else if (diffHours < 24) {
      return `${diffHours}小时前`
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else {
      return this.formatDateTime(dateString)
    }
  }

  // 计算响应时间
  calculateResponseTime(createdAt: string, firstResponseAt?: string): string {
    if (!firstResponseAt) {
      return '未响应'
    }
    
    const created = new Date(createdAt)
    const responded = new Date(firstResponseAt)
    const diffMs = responded.getTime() - created.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffHours > 0) {
      return `${diffHours}小时${diffMins}分钟`
    } else {
      return `${diffMins}分钟`
    }
  }
}

// 导出单例实例
export const ticketService = new TicketService()

// 导出类型以供其他文件使用
export type { TicketService }