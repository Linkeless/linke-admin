import {
  CouponResponse,
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponQueryParams,
  CouponStatsResponse,
  CouponUsageResponse,
  CouponUsageQueryParams,
  BatchCouponRequest,
  CouponsApiResponse,
  CouponUsagesApiResponse,
  ApiResponse
} from './coupon-types'
import { getToken } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

class CouponService {
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

  // 获取优惠码列表
  async getCoupons(params?: CouponQueryParams): Promise<CouponsApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/coupons${queryString ? `?${queryString}` : ''}`
    
    return this.request<CouponsApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 创建优惠码
  async createCoupon(data: CreateCouponRequest): Promise<ApiResponse<CouponResponse>> {
    return this.request<ApiResponse<CouponResponse>>('/admin/coupons', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新优惠码
  async updateCoupon(id: number, data: UpdateCouponRequest): Promise<ApiResponse<CouponResponse>> {
    return this.request<ApiResponse<CouponResponse>>(`/admin/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除优惠码
  async deleteCoupon(id: number): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/admin/coupons/${id}`, {
      method: 'DELETE',
    })
  }

  // 获取单个优惠码详情
  async getCouponById(id: number): Promise<ApiResponse<CouponResponse>> {
    return this.request<ApiResponse<CouponResponse>>(`/admin/coupons/${id}`, {
      method: 'GET',
    })
  }

  // 根据优惠码获取详情
  async getCouponByCode(code: string): Promise<ApiResponse<CouponResponse>> {
    return this.request<ApiResponse<CouponResponse>>(`/admin/coupons/code/${code}`, {
      method: 'GET',
    })
  }

  // 获取优惠码使用记录
  async getCouponUsages(couponId: number, params?: CouponUsageQueryParams): Promise<CouponUsagesApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/coupons/${couponId}/usages${queryString ? `?${queryString}` : ''}`
    
    return this.request<CouponUsagesApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 批量操作优惠码 (如果后端支持)
  async batchUpdateCoupons(data: BatchCouponRequest): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('/admin/coupons/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 切换优惠码状态
  async toggleCouponStatus(id: number, status: 'active' | 'inactive'): Promise<ApiResponse<CouponResponse>> {
    return this.updateCoupon(id, { status })
  }

  // 生成优惠码
  async generateCouponCode(prefix?: string): Promise<string> {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix || 'COUPON'}${timestamp}${random}`
  }

  // 验证优惠码格式
  validateCouponCode(code: string): boolean {
    // 优惠码只能包含字母、数字和横线，长度在3-50之间
    const regex = /^[A-Z0-9-]{3,50}$/
    return regex.test(code)
  }

  // 格式化折扣值显示
  formatDiscountValue(type: string, value: number, currency?: string): string {
    switch (type) {
      case 'percentage':
        return `${value}%`
      case 'fixed_amount':
        return `${currency || '¥'}${value}`
      default:
        return String(value)
    }
  }

  // 格式化使用次数显示
  formatUsageCount(usedCount: number, maxUses: number): string {
    if (maxUses === 0) {
      return `${usedCount}/无限制`
    }
    return `${usedCount}/${maxUses}`
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

  // 计算优惠码状态
  getCouponStatus(coupon: CouponResponse): 'active' | 'inactive' | 'expired' {
    if (coupon.status === 'inactive') {
      return 'inactive'
    }
    
    // 检查是否已过期
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return 'expired'
    }
    
    // 检查是否还未开始
    if (coupon.valid_from && new Date(coupon.valid_from) > new Date()) {
      return 'inactive'
    }
    
    return coupon.status
  }

  // 获取优惠码类型选项
  getCouponTypes(): { value: string; label: string }[] {
    return [
      { value: 'percentage', label: '百分比折扣' },
      { value: 'fixed_amount', label: '固定金额' },
    ]
  }

  // 获取优惠码状态选项
  getCouponStatuses(): { value: string; label: string; color: string }[] {
    return [
      { value: 'active', label: '有效', color: 'green' },
      { value: 'inactive', label: '未激活', color: 'gray' },
      { value: 'expired', label: '已过期', color: 'red' },
    ]
  }

  // 获取状态显示信息
  getStatusInfo(status: string): { label: string; color: string } {
    const statusMap = {
      'active': { label: '有效', color: 'bg-green-100 text-green-800 border-green-200' },
      'inactive': { label: '未激活', color: 'bg-gray-100 text-gray-600 border-gray-200' },
      'expired': { label: '已过期', color: 'bg-red-100 text-red-800 border-red-200' },
    }
    return statusMap[status as keyof typeof statusMap] || { label: status, color: 'bg-gray-100 text-gray-600 border-gray-200' }
  }

  // 获取类型显示信息
  getTypeInfo(type: string): { label: string; color: string } {
    const typeMap = {
      'percentage': { label: '百分比', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      'fixed_amount': { label: '固定金额', color: 'bg-green-100 text-green-800 border-green-200' },
    }
    return typeMap[type as keyof typeof typeMap] || { label: type, color: 'bg-gray-100 text-gray-800 border-gray-200' }
  }
}

// 导出单例实例
export const couponService = new CouponService()

// 导出类型以供其他文件使用
export type { CouponService }