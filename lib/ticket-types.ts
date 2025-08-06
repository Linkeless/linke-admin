// 工单响应类型 (基于 model.TicketResponse)
export interface TicketResponse {
  id: number
  ticket_no: string // API 使用 ticket_no 而不是 ticket_number
  title: string
  description: string
  category: 'general' | 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'subscription' | 'payment'
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  status: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  
  // 用户信息
  user_id: number
  user?: {
    id: number
    email: string
    username?: string
  }
  
  // 分配信息
  assigned_to_id?: number
  assigned_to?: {
    id: number
    email: string
    username?: string
  }
  assigned_at?: string
  
  // 解决信息
  resolved_by_id?: number
  resolved_by?: {
    id: number
    email: string
    username?: string
  }
  resolved_at?: string
  resolution?: string
  
  // 响应时间
  first_response_at?: string
  last_response_at?: string
  
  // 关闭信息
  closed_at?: string
  
  // 标签和元数据
  tags?: string
  metadata?: string
  
  // 消息
  messages?: TicketMessageResponse[]
  
  // 时间戳
  created_at: string
  updated_at: string
}

// 工单消息响应类型 (基于 model.TicketMessageResponse)
export interface TicketMessageResponse {
  id: number
  user_id: number
  user?: {
    id: number
    email: string
    username?: string
  }
  content: string
  message_type: 'user' | 'admin' | 'system'
  is_internal: boolean
  attachments?: string
  metadata?: string // API 中包含 metadata 字段
  created_at: string
  updated_at: string
}

// 创建工单消息请求类型 (基于 service.CreateTicketMessageRequest)
export interface CreateTicketMessageRequest {
  content: string // 必填字段
  message_type?: 'user' | 'admin' | 'system'
  is_internal?: boolean
  attachments?: string
  metadata?: string
}

// 更新工单请求类型 (基于 service.UpdateTicketRequest)
export interface UpdateTicketRequest {
  title?: string // API 中包含 title 字段
  category?: 'general' | 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'subscription' | 'payment'
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  description?: string
  tags?: string
  metadata?: string
}

// 分配工单请求类型 (基于 service.AssignTicketRequest)
export interface AssignTicketRequest {
  assigned_to_id: number
}

// 解决工单请求类型 (基于 service.ResolveTicketRequest)
export interface ResolveTicketRequest {
  resolution: string // 必填字段，10-5000 字符
}

// 工单查询参数
export interface TicketQueryParams {
  user_id?: number
  assigned_to_id?: number
  status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  category?: 'general' | 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'subscription' | 'payment'
  message_type?: 'user' | 'admin' | 'system' // 用于消息过滤
  search?: string
  start_date?: string
  end_date?: string
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 工单统计响应类型
export interface TicketStatsResponse {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  pending_tickets: number
  resolved_tickets: number
  closed_tickets: number
  avg_response_time: number
  avg_resolution_time: number
  tickets_by_priority: {
    low: number
    normal: number
    high: number
    urgent: number
    critical: number
  }
  tickets_by_category: {
    general: number
    technical: number
    billing: number
    account: number
    feature: number
    bug: number
    subscription: number
    payment: number
  }
}

// 工单消息查询参数
export interface TicketMessageQueryParams {
  message_type?: 'user' | 'admin' | 'system'
  limit?: number
  offset?: number
  include_internal?: boolean
}

// 创建工单请求类型 (基于 handlers.AdminCreateTicketRequest)
export interface CreateTicketRequest {
  user_id: number
  title: string
  description: string
  category: 'general' | 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'subscription' | 'payment'
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  assigned_to_id?: number
  tags?: string
  metadata?: string
}

// 升级工单请求类型 (基于 handlers.EscalateTicketRequest)
export interface EscalateTicketRequest {
  escalated_to_id: number
  escalation_reason: string // 10-1000 字符
  priority?: 'high' | 'urgent' | 'critical'
  notes?: string
}

// 批量工单操作请求类型 (基于 handlers.BulkTicketActionRequest)
export interface BulkTicketActionRequest {
  action: 'assign' | 'close' | 'reopen' | 'update_priority' | 'update_status'
  ticket_ids: number[]
  assigned_to_id?: number
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  notes?: string
}

// 更新工单消息请求类型
export interface UpdateTicketMessageRequest {
  content?: string
  is_internal?: boolean
  attachments?: string
  metadata?: string
}

// 工单搜索参数类型
export interface TicketSearchParams {
  query?: string
  user_id?: number
  assigned_to_id?: number
  status?: 'open' | 'in_progress' | 'pending' | 'resolved' | 'closed'
  priority?: 'low' | 'normal' | 'high' | 'urgent' | 'critical'
  category?: 'general' | 'technical' | 'billing' | 'account' | 'feature' | 'bug' | 'subscription' | 'payment'
  created_after?: string
  created_before?: string
  assigned_after?: string
  assigned_before?: string
  resolved_after?: string
  resolved_before?: string
  tags?: string
  sort_by?: 'created_at' | 'updated_at' | 'priority' | 'status' | 'assigned_at'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 工单统计数据类型
export interface TicketStatistics {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  pending_tickets: number
  resolved_tickets: number
  closed_tickets: number
  unassigned_tickets: number
  overdue_tickets: number
  avg_response_time_hours: number
  avg_resolution_time_hours: number
  tickets_created_today: number
  tickets_resolved_today: number
  tickets_by_priority: {
    low: number
    normal: number
    high: number
    urgent: number
    critical: number
  }
  tickets_by_category: {
    general: number
    technical: number
    billing: number
    account: number
    feature: number
    bug: number
    subscription: number
    payment: number
  }
  tickets_by_status: {
    open: number
    in_progress: number
    pending: number
    resolved: number
    closed: number
  }
}

// 批量操作请求 (保留向后兼容)
export interface BatchTicketRequest {
  admin_confirmed: boolean
  operation: 'assign' | 'close' | 'resolve' | 'delete' | 'export'
  ticket_ids: number[]
  assigned_to_id?: number
  reason?: string
  notes?: string
}

// 工单列表API响应
export interface TicketsApiResponse {
  code: number
  message: string
  data: TicketResponse[]
  total: number
  limit: number
  offset: number
}

// 工单消息列表API响应  
export interface TicketMessagesApiResponse {
  code: number
  message: string
  data: TicketMessageResponse[]
  total: number
  limit: number
  offset: number
}

// API 响应基础类型
export interface ApiResponse<T = unknown> {
  code: number
  message: string
  data: T
}

// 工单表格行类型
export type TicketTableRow = TicketResponse & {
  isSelected?: boolean
}

// 工单筛选状态
export interface TicketFilters {
  status: string
  priority: string
  category: string
  assigned_to_id: string
  search: string
  start_date: string
  end_date: string
}

// 工单状态枚举
export enum TicketStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  CLOSED = 'closed'
}

// 工单优先级枚举
export enum TicketPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

// 工单类别枚举
export enum TicketCategory {
  GENERAL = 'general',
  TECHNICAL = 'technical',
  BILLING = 'billing',
  ACCOUNT = 'account',
  FEATURE = 'feature',
  BUG = 'bug',
  SUBSCRIPTION = 'subscription',
  PAYMENT = 'payment'
}

// 消息类型枚举
export enum MessageType {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system'
}