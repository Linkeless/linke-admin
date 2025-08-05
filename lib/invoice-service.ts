import {
  Invoice,
  InvoiceQueryParams,
  InvoiceStatistics,
  InvoiceLanguage,
  InvoiceTemplate,
  InvoiceDownloadHistory,
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  MarkPaidRequest,
  MarkVoidRequest,
  SendInvoiceRequest,
  CustomSendRequest,
  BulkDownloadRequest,
  InvoicesApiResponse,
  InvoiceApiResponse,
  InvoiceStatisticsApiResponse,
  InvoiceLanguagesApiResponse,
  InvoiceTemplatesApiResponse,
  InvoiceDownloadHistoryApiResponse,
  ApiResponse
} from './invoice-types'
import { api } from './api'

class InvoiceService {
  // 使用统一的API客户端

  // 获取发票列表
  async getInvoices(params?: InvoiceQueryParams): Promise<InvoicesApiResponse> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }
    
    const queryString = queryParams.toString()
    const endpoint = `/invoice${queryString ? `?${queryString}` : ''}`
    
    return api.get<InvoicesApiResponse>(endpoint)
  }

  // 获取发票详情
  async getInvoice(id: number): Promise<InvoiceApiResponse> {
    return api.get<InvoiceApiResponse>(`/invoice/${id}`)
  }

  // 按发票编号获取发票
  async getInvoiceByNumber(number: string): Promise<InvoiceApiResponse> {
    return api.get<InvoiceApiResponse>(`/invoice/number/${number}`)
  }

  // 获取用户发票
  async getUserInvoices(params?: InvoiceQueryParams): Promise<InvoicesApiResponse> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }
    
    const queryString = queryParams.toString()
    const endpoint = `/invoice/user${queryString ? `?${queryString}` : ''}`
    
    return api.get<InvoicesApiResponse>(endpoint)
  }

  // 创建发票
  async createInvoice(data: CreateInvoiceRequest): Promise<InvoiceApiResponse> {
    return api.post<InvoiceApiResponse>('/invoice', data)
  }

  // 更新发票
  async updateInvoice(id: number, data: UpdateInvoiceRequest): Promise<InvoiceApiResponse> {
    return api.put<InvoiceApiResponse>(`/invoice/${id}`, data)
  }

  // 删除发票
  async deleteInvoice(id: number): Promise<ApiResponse<null>> {
    return api.delete<ApiResponse<null>>(`/invoice/${id}`)
  }

  // 标记发票为已付款
  async markInvoicePaid(id: number, data?: MarkPaidRequest): Promise<InvoiceApiResponse> {
    return api.post<InvoiceApiResponse>(`/invoice/${id}/mark-paid`, data || {})
  }

  // 标记发票为作废
  async markInvoiceVoid(id: number, data?: MarkVoidRequest): Promise<InvoiceApiResponse> {
    return api.post<InvoiceApiResponse>(`/invoice/${id}/mark-void`, data || {})
  }

  // 发送发票
  async sendInvoice(id: number, data?: SendInvoiceRequest): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(`/invoice/${id}/send`, data || {})
  }

  // 自定义发送发票
  async sendInvoiceCustom(id: number, data: CustomSendRequest): Promise<ApiResponse<null>> {
    return api.post<ApiResponse<null>>(`/invoice/${id}/send-custom`, data)
  }

  // 下载发票
  async downloadInvoice(id: number): Promise<Blob> {
    return api.downloadBlob(`/invoice/${id}/download`)
  }

  // 获取发票PDF
  async getInvoicePdf(id: number): Promise<Blob> {
    return api.downloadBlob(`/invoice/${id}/pdf`)
  }

  // 批量下载发票
  async bulkDownloadInvoices(data: BulkDownloadRequest): Promise<Blob> {
    return api.downloadBlob('/invoice/bulk-download', 'POST', data)
  }

  // 获取发票统计信息
  async getInvoiceStatistics(): Promise<InvoiceStatisticsApiResponse> {
    return api.get<InvoiceStatisticsApiResponse>('/invoice/statistics')
  }

  // 获取发票语言列表
  async getInvoiceLanguages(): Promise<InvoiceLanguagesApiResponse> {
    return api.get<InvoiceLanguagesApiResponse>('/invoice/languages')
  }

  // 获取发票模板列表
  async getInvoiceTemplates(): Promise<InvoiceTemplatesApiResponse> {
    return api.get<InvoiceTemplatesApiResponse>('/invoice/templates')
  }

  // 获取下载历史
  async getDownloadHistory(params?: InvoiceQueryParams): Promise<InvoiceDownloadHistoryApiResponse> {
    const queryParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => queryParams.append(key, v.toString()))
          } else {
            queryParams.append(key, value.toString())
          }
        }
      })
    }
    
    const queryString = queryParams.toString()
    const endpoint = `/invoice/download-history${queryString ? `?${queryString}` : ''}`
    
    return api.get<InvoiceDownloadHistoryApiResponse>(endpoint)
  }

  // 工具方法：下载文件
  downloadFile(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // 工具方法：格式化金额
  formatAmount(amount: number, currency: string): string {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
    }).format(amount)
  }

  // 工具方法：获取状态标签
  getStatusLabel(status: string): string {
    const statusLabels: Record<string, string> = {
      draft: '草稿',
      sent: '已发送',
      viewed: '已查看',
      paid: '已付款',
      overdue: '逾期',
      void: '作废',
      cancelled: '已取消',
    }
    return statusLabels[status] || status
  }

  // 工具方法：获取状态变体
  getStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      draft: 'outline',
      sent: 'secondary',
      viewed: 'secondary',
      paid: 'default',
      overdue: 'destructive',
      void: 'destructive',
      cancelled: 'outline',
    }
    return statusVariants[status] || 'outline'
  }

  // 工具方法：计算逾期天数
  calculateOverdueDays(dueDate: string): number {
    const due = new Date(dueDate)
    const now = new Date()
    const diffTime = now.getTime() - due.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }
}

// 导出单例实例
export const invoiceService = new InvoiceService()
export default invoiceService