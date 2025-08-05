// 发票页面相关类型定义
export type { 
  Invoice, 
  InvoiceStatus, 
  InvoiceQueryParams,
  InvoiceStatistics,
  CreateInvoiceRequest,
  UpdateInvoiceRequest 
} from '@/lib/invoice-types'

// 发票筛选状态
export interface InvoiceFilters {
  search: string
  status: string
  dateRange: string
}

// 发票表格排序
export interface InvoiceSorting {
  column: string
  direction: 'asc' | 'desc'
}

// 发票分页信息
export interface InvoicePagination {
  page: number
  pageSize: number
  total: number
}