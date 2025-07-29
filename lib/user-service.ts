'use client'

import { api } from './api'
import {
  UserResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchParams,
  UserListResponse,
  UserDetailResponse,
  UserSearchResponse,
  UserProviderFilterResponse,
  BatchUserOperationRequest,
  BatchUserOperationResponse,
  UserStatsResponse,
  UserService as IUserService
} from './user-types'
import { StandardResponse } from './types'

export class UserService implements IUserService {
  
  // 获取用户列表（支持分页和基础筛选）
  async getUsers(params?: UserSearchParams): Promise<UserListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      // 使用标准的page/limit参数
      const page = params?.page || 1
      const limit = params?.limit || 10
      
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      if (params?.role) queryParams.append('role', params.role)
      if (params?.status) queryParams.append('status', params.status)
      if (params?.sort_by) queryParams.append('sort_by', params.sort_by)
      if (params?.sort_order) queryParams.append('sort_order', params.sort_order)
      if (params?.date_from) queryParams.append('date_from', params.date_from)
      if (params?.date_to) queryParams.append('date_to', params.date_to)
      
      const url = `/admin/users?${queryParams.toString()}`
      
      console.log('发送用户列表请求:', url)
      const response: UserListResponse = await api.get(url)
      console.log('用户列表响应:', response)
      
      // 验证响应格式并计算总页数
      if (response.code === 0 && response.data && response.data.items) {
        // 计算总页数
        const totalPages = Math.ceil(response.data.pagination.total / response.data.pagination.limit)
        
        // 添加总页数到分页信息中
        response.data.pagination.total_pages = totalPages
        
        return response
      } else {
        throw new Error(`API响应格式错误: ${response.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('获取用户列表失败:', error)
      throw error
    }
  }

  // 获取已删除用户列表
  async getDeletedUsers(params?: { page?: number; limit?: number }): Promise<UserListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      
      const queryString = queryParams.toString()
      const url = queryString ? `/admin/users/deleted?${queryString}` : '/admin/users/deleted'
      
      console.log('发送已删除用户列表请求:', url)
      const response: UserListResponse = await api.get(url)
      console.log('已删除用户列表响应:', response)
      
      if (response.code === 0 && response.data && response.data.items) {
        return response
      } else {
        throw new Error(`API响应格式错误: ${response.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('获取已删除用户列表失败:', error)
      throw error
    }
  }

  // 搜索用户（按姓名、邮箱、用户名）
  async searchUsers(params: UserSearchParams): Promise<UserSearchResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      if (params.q) queryParams.append('q', params.q)
      
      // 使用标准的page/limit参数
      const page = params.page || 1
      const limit = params.limit || 10
      
      queryParams.append('page', page.toString())
      queryParams.append('limit', limit.toString())
      
      if (params.role) queryParams.append('role', params.role)
      if (params.status) queryParams.append('status', params.status)
      if (params.provider) queryParams.append('provider', params.provider)
      if (params.date_from) queryParams.append('date_from', params.date_from)
      if (params.date_to) queryParams.append('date_to', params.date_to)
      if (params.email_verified !== undefined) {
        queryParams.append('email_verified', params.email_verified.toString())
      }
      
      const url = `/admin/users/search?${queryParams.toString()}`
      console.log('发送搜索请求:', url)
      const response: UserSearchResponse = await api.get(url)
      console.log('搜索响应:', response)
      
      // 验证响应格式并计算总页数
      if (response.code === 0 && response.data && response.data.items) {
        // 计算总页数
        const totalPages = Math.ceil(response.data.pagination.total / response.data.pagination.limit)
        
        // 添加总页数到分页信息中
        response.data.pagination.total_pages = totalPages
        
        return response
      } else {
        throw new Error(`搜索API响应格式错误: ${response.message || '未知错误'}`)
      }
    } catch (error) {
      console.error('搜索用户失败:', error)
      throw error
    }
  }

  // 按OAuth提供商筛选用户
  async getUsersByProvider(params: { 
    provider: string
    page?: number
    limit?: number 
  }): Promise<UserProviderFilterResponse> {
    const queryParams = new URLSearchParams()
    
    queryParams.append('provider', params.provider)
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    
    const response: UserProviderFilterResponse = await api.get(`/admin/users/provider?${queryParams.toString()}`)
    return response
  }

  // 获取单个用户详情
  async getUser(id: number): Promise<UserDetailResponse> {
    const response: UserDetailResponse = await api.get(`/admin/users/${id}`)
    return response
  }

  // 创建新用户
  async createUser(data: CreateUserRequest): Promise<UserDetailResponse> {
    const response: UserDetailResponse = await api.post('/admin/users', data)
    return response
  }

  // 更新用户信息
  async updateUser(id: number, data: UpdateUserRequest): Promise<UserDetailResponse> {
    const response: UserDetailResponse = await api.put(`/admin/users/${id}`, data)
    return response
  }

  // 软删除用户
  async deleteUser(id: number): Promise<StandardResponse> {
    const response: StandardResponse = await api.delete(`/admin/users/${id}`)
    return response
  }

  // 恢复已删除用户
  async restoreUser(id: number): Promise<StandardResponse> {
    const response: StandardResponse = await api.post(`/admin/users/${id}/restore`)
    return response
  }

  // 更新用户角色（使用专用的PUT端点）
  async updateUserRole(id: number, role: string): Promise<StandardResponse> {
    console.log('发送角色更新请求:', id, role)
    const response: StandardResponse = await api.put(`/admin/users/${id}/role`, { role })
    console.log('角色更新响应:', response)
    return response
  }

  // 更新用户状态（使用专用的PUT端点）
  async updateUserStatus(id: number, status: string): Promise<StandardResponse> {
    console.log('发送状态更新请求:', id, status)
    const response: StandardResponse = await api.put(`/admin/users/${id}/status`, { status })
    console.log('状态更新响应:', response)
    return response
  }

  // 重置用户密码（仅适用于本地账号）
  async resetUserPassword(id: number, newPassword: string): Promise<StandardResponse> {
    const response: StandardResponse = await api.post(`/admin/users/${id}/reset-password`, { 
      new_password: newPassword 
    })
    return response
  }

  // 批量删除用户
  async batchDeleteUsers(userIds: number[]): Promise<BatchUserOperationResponse> {
    const data: BatchUserOperationRequest = { ids: userIds }
    const response: BatchUserOperationResponse = await api.post('/admin/users/batch/delete', data)
    return response
  }

  // 批量恢复用户
  async batchRestoreUsers(userIds: number[]): Promise<BatchUserOperationResponse> {
    const data: BatchUserOperationRequest = { ids: userIds }
    const response: BatchUserOperationResponse = await api.post('/admin/users/batch/restore', data)
    return response
  }

  // 获取用户统计数据
  async getUserStats(): Promise<StandardResponse<UserStatsResponse>> {
    const response: StandardResponse<UserStatsResponse> = await api.get('/admin/users/stats')
    return response
  }

  // 辅助方法：格式化用户显示名称
  formatUserDisplayName(user: UserResponse): string {
    if (user.name) return user.name
    if (user.username) return user.username
    return user.email.split('@')[0]
  }

  // 辅助方法：获取用户头像URL
  getUserAvatarUrl(user: UserResponse): string {
    if (user.avatar) return user.avatar
    
    // 根据OAuth提供商生成默认头像
    if (user.google_id) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.formatUserDisplayName(user))}&background=4285f4&color=fff`
    }
    if (user.github_id) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.formatUserDisplayName(user))}&background=24292e&color=fff`
    }
    if (user.tg_user_id) {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.formatUserDisplayName(user))}&background=0088cc&color=fff`
    }
    
    // 默认头像
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(this.formatUserDisplayName(user))}&background=6b7280&color=fff`
  }

  // 辅助方法：获取用户OAuth提供商
  getUserProviders(user: UserResponse): string[] {
    const providers: string[] = []
    
    if (user.google_id) providers.push('google')
    if (user.github_id) providers.push('github')
    if (user.telegram_id) providers.push('telegram')
    if (user.provider && !providers.length) providers.push(user.provider)
    if (!providers.length) providers.push('local')
    
    return providers
  }

  // 辅助方法：检查用户是否可以编辑
  canEditUser(user: UserResponse, currentUserRole: string): boolean {
    // 系统用户不能编辑
    if (user.role === 'system') return false
    
    // 管理员可以编辑所有非系统用户
    if (currentUserRole === 'admin') return true
    
    return false
  }

  // 辅助方法：检查用户是否可以删除
  canDeleteUser(user: UserResponse, currentUserRole: string): boolean {
    // 系统用户不能删除
    if (user.role === 'system') return false
    
    // 管理员可以删除非系统用户
    if (currentUserRole === 'admin') return true
    
    return false
  }

  // 辅助方法：格式化时间显示
  formatDateTime(dateString: string): string {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) {
      return '1天前'
    } else if (diffDays < 7) {
      return `${diffDays}天前`
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7)
      return `${weeks}周前`
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30)
      return `${months}个月前`
    } else {
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    }
  }

  // 辅助方法：验证邮箱格式
  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 辅助方法：验证用户名格式
  validateUsername(username: string): boolean {
    const usernameRegex = /^[a-zA-Z0-9_-]+$/
    return usernameRegex.test(username) && username.length <= 50
  }

  // 辅助方法：获取用户状态Badge配置
  getUserStatusBadgeConfig(status: string) {
    const statusConfig = {
      active: { 
        variant: "default" as const, 
        label: "活跃", 
        className: "bg-green-600 text-white border-green-600",
        dotColor: "bg-green-200"
      },
      inactive: { 
        variant: "secondary" as const, 
        label: "未激活", 
        className: "text-yellow-700 bg-yellow-100 border-yellow-200",
        dotColor: "bg-yellow-500"
      },
      suspended: { 
        variant: "destructive" as const, 
        label: "暂停", 
        className: "bg-orange-600 text-white",
        dotColor: "bg-orange-200"
      },
      banned: { 
        variant: "destructive" as const, 
        label: "封禁", 
        className: "bg-red-600 text-white",
        dotColor: "bg-red-200"
      }
    }
    
    return statusConfig[status as keyof typeof statusConfig] || {
      variant: "outline" as const,
      label: status,
      className: "",
      dotColor: "bg-gray-400"
    }
  }

  // 辅助方法：获取用户角色Badge配置
  getUserRoleBadgeConfig(role: string) {
    const roleConfig = {
      user: { 
        variant: "outline" as const, 
        label: "用户", 
        className: "text-blue-700 border-blue-200 bg-blue-50" 
      },
      admin: { 
        variant: "default" as const, 
        label: "管理员", 
        className: "bg-purple-600 text-white" 
      },
      system: { 
        variant: "secondary" as const, 
        label: "系统", 
        className: "text-gray-700 bg-gray-100" 
      }
    }
    
    return roleConfig[role as keyof typeof roleConfig] || {
      variant: "outline" as const,
      label: role,
      className: ""
    }
  }

  // 辅助方法：获取OAuth提供商Badge配置
  getProviderBadgeConfig(provider: string) {
    const providerConfig = {
      google: { 
        label: "Google", 
        className: "text-blue-600 bg-blue-50 border-blue-200",
        iconType: "brand-google"
      },
      github: { 
        label: "GitHub", 
        className: "text-slate-700 bg-slate-50 border-slate-200",
        iconType: "brand-github"
      },
      telegram: { 
        label: "Telegram", 
        className: "text-sky-600 bg-sky-50 border-sky-200",
        iconType: "brand-telegram"
      },
      local: { 
        label: "本地账号", 
        className: "text-emerald-600 bg-emerald-50 border-emerald-200",
        iconType: "user"
      }
    }
    
    return providerConfig[provider as keyof typeof providerConfig] || {
      label: provider,
      className: "text-gray-600 bg-gray-50 border-gray-200",
      iconType: "link"
    }
  }

  // 辅助方法：生成用户状态颜色（向后兼容）
  getUserStatusColor(status: string): string {
    const config = this.getUserStatusBadgeConfig(status)
    const colorMap = {
      "bg-green-600": '#10b981',
      "bg-yellow-100": '#f59e0b', 
      "bg-orange-600": '#f97316',
      "bg-red-600": '#ef4444'
    }
    return colorMap[config.className.split(' ')[0] as keyof typeof colorMap] || '#6b7280'
  }

  // 辅助方法：生成用户角色颜色（向后兼容）
  getUserRoleColor(role: string): string {
    const config = this.getUserRoleBadgeConfig(role)
    const colorMap = {
      "text-blue-700": '#2563eb',
      "bg-purple-600": '#8b5cf6',
      "text-gray-700": '#374151'
    }
    return colorMap[config.className.split(' ')[0] as keyof typeof colorMap] || '#6b7280'
  }
}

// 导出单例实例
export const userService = new UserService()