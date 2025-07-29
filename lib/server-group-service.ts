'use client'

import { api } from './api'
import {
  ServerGroupResponse,
  CreateServerGroupRequest,
  UpdateServerGroupRequest,
  ServerGroupSearchParams,
  ServerGroupListResponse,
  ServerGroupDetailResponse,
  ServerGroupService as IServerGroupService,
} from './server-group-types'
import { StandardResponse } from './types'

export class ServerGroupService implements IServerGroupService {
  
  // 获取服务器组列表（分页）
  async getServerGroups(params?: ServerGroupSearchParams): Promise<ServerGroupListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      // 根据实际 API，使用 page 和 limit 参数
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      
      const url = `/admin/server-groups?${queryParams.toString()}`
      
      console.log('发送服务器组列表请求:', url)
      const response: ServerGroupListResponse = await api.get(url)
      console.log('服务器组列表响应:', response)
      
      return response
    } catch (error) {
      console.error('获取服务器组列表失败:', error)
      throw error
    }
  }

  // 获取所有服务器组（不分页）
  async getAllServerGroups(): Promise<ServerGroupListResponse> {
    try {
      const url = `/admin/server-groups/all`
      
      console.log('发送所有服务器组请求:', url)
      const response: ServerGroupListResponse = await api.get(url)
      console.log('所有服务器组响应:', response)
      
      return response
    } catch (error) {
      console.error('获取所有服务器组失败:', error)
      throw error
    }
  }

  // 获取单个服务器组详情
  async getServerGroup(id: number): Promise<ServerGroupDetailResponse> {
    const response: ServerGroupDetailResponse = await api.get(`/admin/server-groups/${id}`)
    return response
  }

  // 创建新服务器组
  async createServerGroup(data: CreateServerGroupRequest): Promise<ServerGroupDetailResponse> {
    const response: ServerGroupDetailResponse = await api.post('/admin/server-groups', data)
    return response
  }

  // 更新服务器组信息
  async updateServerGroup(id: number, data: UpdateServerGroupRequest): Promise<ServerGroupDetailResponse> {
    const response: ServerGroupDetailResponse = await api.put(`/admin/server-groups/${id}`, data)
    return response
  }

  // 删除服务器组
  async deleteServerGroup(id: number): Promise<StandardResponse> {
    const response: StandardResponse = await api.delete(`/admin/server-groups/${id}`)
    return response
  }

  // 辅助方法：格式化服务器组显示名称
  formatServerGroupDisplayName(serverGroup: ServerGroupResponse): string {
    return serverGroup.name
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

  // 辅助方法：验证服务器组配置
  validateServerGroupConfig(data: CreateServerGroupRequest | UpdateServerGroupRequest): string[] {
    const errors: string[] = []
    
    if (!data.name || data.name.trim().length === 0) {
      errors.push('服务器组名称不能为空')
    }
    
    if (data.name && (data.name.length < 1 || data.name.length > 100)) {
      errors.push('服务器组名称长度必须在1-100字符之间')
    }
    
    return errors
  }

  // 辅助方法：检查服务器组是否可以编辑
  canEditServerGroup(_serverGroup: ServerGroupResponse, currentUserRole: string): boolean {
    // 管理员可以编辑所有服务器组
    if (currentUserRole === 'admin') return true
    
    return false
  }

  // 辅助方法：检查服务器组是否可以删除
  canDeleteServerGroup(_serverGroup: ServerGroupResponse, currentUserRole: string): boolean {
    // 管理员可以删除服务器组
    if (currentUserRole === 'admin') return true
    
    return false
  }
}

// 导出单例实例
export const serverGroupService = new ServerGroupService()