import {
  InviteCodeResponse,
  CreateInviteCodeRequest,
  UpdateInviteCodeRequest,
  InviteCodeQueryParams,
  InviteCodeStatsResponse,
  InviteCodeUsageResponse,
  InviteCodeUsageQueryParams,
  BatchInviteCodeRequest,
  InviteCodesApiResponse,
  InviteCodeUsagesApiResponse,
  ApiResponse
} from './invite-code-types'
import { getToken } from './api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'

class InviteCodeService {
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

  // 获取邀请码列表
  async getInviteCodes(params?: InviteCodeQueryParams): Promise<InviteCodesApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/invite-codes${queryString ? `?${queryString}` : ''}`
    
    return this.request<InviteCodesApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 创建邀请码
  async createInviteCode(data: CreateInviteCodeRequest): Promise<ApiResponse<InviteCodeResponse>> {
    return this.request<ApiResponse<InviteCodeResponse>>('/admin/invite-codes', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 更新邀请码
  async updateInviteCode(id: number, data: UpdateInviteCodeRequest): Promise<ApiResponse<InviteCodeResponse>> {
    return this.request<ApiResponse<InviteCodeResponse>>(`/admin/invite-codes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // 删除邀请码
  async deleteInviteCode(id: number): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>(`/admin/invite-codes/${id}`, {
      method: 'DELETE',
    })
  }

  // 获取单个邀请码详情
  async getInviteCode(id: number): Promise<ApiResponse<InviteCodeResponse>> {
    return this.request<ApiResponse<InviteCodeResponse>>(`/admin/invite-codes/${id}`, {
      method: 'GET',
    })
  }

  // 切换邀请码状态
  async toggleInviteCodeStatus(id: number, status: 'active' | 'inactive'): Promise<ApiResponse<InviteCodeResponse>> {
    return this.request<ApiResponse<InviteCodeResponse>>(`/admin/invite-codes/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    })
  }

  // 批量生成邀请码
  async batchCreateInviteCodes(data: BatchInviteCodeRequest): Promise<ApiResponse<InviteCodeResponse[]>> {
    return this.request<ApiResponse<InviteCodeResponse[]>>('/admin/invite-codes/batch', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 获取邀请码统计信息
  async getInviteCodeStats(): Promise<ApiResponse<InviteCodeStatsResponse>> {
    return this.request<ApiResponse<InviteCodeStatsResponse>>('/admin/invite-codes/stats', {
      method: 'GET',
    })
  }

  // 获取邀请码使用记录
  async getInviteCodeUsages(params?: InviteCodeUsageQueryParams): Promise<InviteCodeUsagesApiResponse> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const endpoint = `/admin/invite-codes/usages${queryString ? `?${queryString}` : ''}`
    
    return this.request<InviteCodeUsagesApiResponse>(endpoint, {
      method: 'GET',
    })
  }

  // 重置邀请码使用次数
  async resetInviteCodeUsage(id: number): Promise<ApiResponse<InviteCodeResponse>> {
    return this.request<ApiResponse<InviteCodeResponse>>(`/admin/invite-codes/${id}/reset`, {
      method: 'POST',
    })
  }

  // 延长邀请码有效期
  async extendInviteCodeValidity(id: number, validUntil: string): Promise<ApiResponse<InviteCodeResponse>> {
    return this.request<ApiResponse<InviteCodeResponse>>(`/admin/invite-codes/${id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ valid_until: validUntil }),
    })
  }
}

export const inviteCodeService = new InviteCodeService()
export default inviteCodeService