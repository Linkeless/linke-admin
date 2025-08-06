// 发票相关类型定义

// 发票状态
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'void' | 'cancelled'

// 发票语言
export interface InvoiceLanguage {
  code: string
  name: string
  native_name: string
}

// 发票模板
export interface InvoiceTemplate {
  id: number
  name: string
  description?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// 发票统计信息
export interface InvoiceStatistics {
  total_invoices: number
  draft_invoices: number
  sent_invoices: number
  paid_invoices: number
  overdue_invoices: number
  void_invoices: number
  total_amount: number
  paid_amount: number
  pending_amount: number
  overdue_amount: number
  currency?: string
}

// 发票下载历史
export interface InvoiceDownloadHistory {
  id: number
  invoice_id: number
  user_id: number
  download_type: 'pdf' | 'view' | 'email'
  download_at: string
  ip_address?: string
  user_agent?: string
}

// 发票基本信息
export interface Invoice {
  id: number
  invoice_number: string
  status: InvoiceStatus
  
  // 客户信息
  user_id: number
  user?: {
    id: number
    email: string
    username?: string
    first_name?: string
    last_name?: string
  }
  
  // 发票地址信息
  billing_address?: {
    company?: string
    address_line_1?: string
    address_line_2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  
  // 金额信息
  subtotal: number
  tax_amount: number
  discount_amount: number
  total_amount: number
  paid_amount: number
  currency: string
  
  // 发票项目
  line_items: InvoiceLineItem[]
  
  // 日期信息
  issue_date: string
  due_date: string
  paid_at?: string
  sent_at?: string
  viewed_at?: string
  
  // 发票元数据
  notes?: string
  terms?: string
  footer?: string
  language: string
  template_id?: number
  
  // 关联信息
  order_id?: number
  subscription_id?: number
  
  // 系统时间戳
  created_at: string
  updated_at: string
}

// 发票行项目
export interface InvoiceLineItem {
  id: number
  description: string
  quantity: number
  unit_price: number
  discount_amount: number
  tax_rate: number
  tax_amount: number
  total_amount: number
}

// API响应类型
export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  total_pages: number
}

export type InvoicesApiResponse = ApiResponse<PaginatedResponse<Invoice>>
export type InvoiceApiResponse = ApiResponse<Invoice>
export type InvoiceStatisticsApiResponse = ApiResponse<InvoiceStatistics>
export type InvoiceLanguagesApiResponse = ApiResponse<InvoiceLanguage[]>
export type InvoiceTemplatesApiResponse = ApiResponse<InvoiceTemplate[]>
export type InvoiceDownloadHistoryApiResponse = ApiResponse<PaginatedResponse<InvoiceDownloadHistory>>

// 查询参数
export interface InvoiceQueryParams {
  page?: number
  page_size?: number
  search?: string
  status?: InvoiceStatus | InvoiceStatus[]
  user_id?: number
  order_id?: number
  subscription_id?: number
  date_from?: string
  date_to?: string
  amount_min?: number
  amount_max?: number
  currency?: string
  sort_by?: 'created_at' | 'issue_date' | 'due_date' | 'total_amount' | 'invoice_number'
  sort_order?: 'asc' | 'desc'
}

// 发票操作类型
export interface MarkPaidRequest {
  amount?: number
  payment_date?: string
  payment_method?: string
  notes?: string
}

export interface MarkVoidRequest {
  reason?: string
  notes?: string
}

export interface SendInvoiceRequest {
  to_email?: string
  cc_emails?: string[]
  subject?: string
  message?: string
  attach_pdf?: boolean
}

export interface CustomSendRequest extends SendInvoiceRequest {
  template_id?: number
  language?: string
}

export interface BulkDownloadRequest {
  invoice_ids: number[]
  format?: 'pdf' | 'zip'
}

// 批量操作请求类型
export interface BulkMarkPaidRequest {
  invoice_ids: number[]
  payment_date?: string
  payment_method?: string
  notes?: string
}

export interface BulkVoidRequest {
  invoice_ids: number[]
  reason?: string
  notes?: string
}

export interface BulkResendRequest {
  invoice_ids: number[]
  to_email?: string
  cc_emails?: string[]
  subject?: string
  message?: string
  attach_pdf?: boolean
}

export interface BulkRegeneratePdfRequest {
  invoice_ids: number[]
}

// 批量操作响应类型
export interface BulkOperationResult {
  success_count: number
  failed_count: number
  failed_items: Array<{
    invoice_id: number
    error: string
  }>
}

export type BulkOperationResponse = ApiResponse<BulkOperationResult>

// 创建发票请求
export interface CreateInvoiceRequest {
  user_id: number
  issue_date: string
  due_date: string
  currency: string
  language?: string
  template_id?: number
  
  // 地址信息
  billing_address?: {
    company?: string
    address_line_1?: string
    address_line_2?: string
    city?: string
    state?: string
    postal_code?: string
    country?: string
  }
  
  // 发票项目
  line_items: {
    description: string
    quantity: number
    unit_price: number
    discount_amount?: number
    tax_rate?: number
  }[]
  
  // 附加信息
  notes?: string
  terms?: string
  footer?: string
  
  // 关联信息
  order_id?: number
  subscription_id?: number
}

// 更新发票请求
export interface UpdateInvoiceRequest extends Partial<CreateInvoiceRequest> {
  status?: InvoiceStatus
}

// 发票筛选选项
export interface InvoiceFilterOptions {
  statuses: Array<{ value: InvoiceStatus; label: string }>
  currencies: Array<{ value: string; label: string }>
  languages: Array<{ value: string; label: string }>
  templates: Array<{ value: number; label: string }>
}