'use client'

import { api } from './api'
import {
  ShadowsocksServerResponse,
  CreateShadowsocksServerRequest,
  UpdateShadowsocksServerRequest,
  ShadowsocksServerSearchParams,
  ShadowsocksServerListResponse,
  ShadowsocksServerDetailResponse,
  BulkUpdateServersRequest,
  ShadowsocksServerService as IShadowsocksServerService,
  CIPHER_OPTIONS,
  OBFS_OPTIONS,
  convertShowToBoolean
} from './shadowsocks-types'
import { StandardResponse } from './types'

export class ShadowsocksServerService implements IShadowsocksServerService {
  
  // 获取服务器列表（严格按照后端API）
  async getServers(params?: ShadowsocksServerSearchParams): Promise<ShadowsocksServerListResponse> {
    try {
      const queryParams = new URLSearchParams()
      
      // 根据swagger文档API参数
      if (params?.page) queryParams.append('page', params.page.toString())
      if (params?.limit) queryParams.append('limit', params.limit.toString())
      if (params?.group_id) queryParams.append('group_id', params.group_id.toString())
      if (params?.show !== undefined) queryParams.append('show', params.show.toString())
      
      // 兼容旧的offset参数，转换为page
      if (params?.offset && !params?.page) {
        const page = Math.floor(params.offset / (params.limit || 10)) + 1
        queryParams.append('page', page.toString())
      }
      
      const url = `/admin/servers?${queryParams.toString()}`
      
      console.log('发送服务器列表请求:', url)
      const response: ShadowsocksServerListResponse = await api.get(url)
      console.log('服务器列表响应:', response)
      
      return response
    } catch (error) {
      console.error('获取服务器列表失败:', error)
      throw error
    }
  }


  // 获取单个服务器详情
  async getServer(id: number): Promise<ShadowsocksServerDetailResponse> {
    const response: ShadowsocksServerDetailResponse = await api.get(`/admin/servers/${id}`)
    return response
  }

  // 创建新服务器
  async createServer(data: CreateShadowsocksServerRequest): Promise<ShadowsocksServerDetailResponse> {
    const response: ShadowsocksServerDetailResponse = await api.post('/admin/servers', data)
    return response
  }

  // 更新服务器信息（使用PUT方法完全更新）
  async updateServer(id: number, data: UpdateShadowsocksServerRequest): Promise<ShadowsocksServerDetailResponse> {
    const response: ShadowsocksServerDetailResponse = await api.put(`/admin/servers/${id}`, data)
    return response
  }

  // 部分更新服务器信息（使用PATCH方法）
  async patchServer(id: number, data: Partial<UpdateShadowsocksServerRequest>): Promise<ShadowsocksServerDetailResponse> {
    const response: ShadowsocksServerDetailResponse = await api.patch(`/admin/servers/${id}`, data)
    return response
  }

  // 删除服务器
  async deleteServer(id: number): Promise<StandardResponse> {
    const response: StandardResponse = await api.delete(`/admin/servers/${id}`)
    return response
  }

  // 批量更新服务器
  async bulkUpdateServers(data: BulkUpdateServersRequest): Promise<StandardResponse> {
    const response: StandardResponse = await api.post('/admin/servers/bulk/update', data)
    return response
  }

  // 获取指定服务器组的服务器
  async getServersByGroup(groupId: number): Promise<ShadowsocksServerListResponse> {
    const response: ShadowsocksServerListResponse = await api.get(`/admin/servers/group/${groupId}`)
    return response
  }

  // 获取服务器健康状态
  async getServerHealth(id: number): Promise<StandardResponse> {
    const response: StandardResponse = await api.get(`/admin/servers/${id}/health`)
    return response
  }

  // 获取服务器统计信息
  async getServerStatistics(id: number): Promise<StandardResponse> {
    const response: StandardResponse = await api.get(`/admin/servers/${id}/statistics`)
    return response
  }

  // 获取/设置服务器状态
  async getServerStatus(id: number): Promise<StandardResponse> {
    const response: StandardResponse = await api.get(`/admin/servers/${id}/status`)
    return response
  }

  async updateServerStatus(id: number, status: { enabled?: boolean; maintenance?: boolean }): Promise<StandardResponse> {
    const response: StandardResponse = await api.put(`/admin/servers/${id}/status`, status)
    return response
  }

  // 辅助方法：格式化服务器显示名称
  formatServerDisplayName(server: ShadowsocksServerResponse): string {
    return server.name || server.host
  }

  // 注意：后端模型中没有status字段，移除状态相关方法

  // 辅助方法：获取加密方式显示名称
  getCipherDisplayName(cipher: string): string {
    const option = CIPHER_OPTIONS.find(opt => opt.value === cipher)
    return option?.label || cipher
  }

  // 辅助方法：获取混淆方式显示名称
  getObfsDisplayName(obfs?: string): string {
    // 如果obfs为空或undefined，显示为无混淆
    if (!obfs) return '无混淆'
    
    const option = OBFS_OPTIONS.find(opt => opt.value === obfs)
    return option?.label || obfs
  }

  // 辅助方法：格式化服务器地址
  formatServerAddress(server: ShadowsocksServerResponse): string {
    return `${server.host}:${server.server_port}`
  }

  // 辅助方法：格式化倍率显示（后端返回number）
  formatRateMultiplier(rate: number): string {
    if (typeof rate !== 'number' || isNaN(rate)) return '1.0x'
    return `${rate}x`
  }

  // 辅助方法：格式化速率限制（向后兼容）
  formatRateLimit(rate: number): string {
    return this.formatRateMultiplier(rate)
  }

  // 辅助方法：验证服务器配置
  validateServerConfig(data: CreateShadowsocksServerRequest | UpdateShadowsocksServerRequest): string[] {
    const errors: string[] = []
    
    if ('name' in data && data.name && (data.name.length < 1 || data.name.length > 255)) {
      errors.push('服务器名称长度必须在1-255字符之间')
    }
    
    if ('host' in data && data.host && (data.host.length < 1 || data.host.length > 255)) {
      errors.push('主机地址长度必须在1-255字符之间')
    }
    
    if ('server_port' in data && data.server_port && (data.server_port < 1 || data.server_port > 65535)) {
      errors.push('端口号必须在1-65535之间')
    }
    
    if ('port' in data && data.port && (data.port < 1 || data.port > 65535)) {
      errors.push('端口号必须在1-65535之间')
    }
    
    if ('rate' in data && data.rate && data.rate < 0.1) {
      errors.push('倍率不能小于0.1')
    }
    
    return errors
  }

  // 辅助方法：获取服务器显示状态
  getServerShowStatus(server: ShadowsocksServerResponse): boolean {
    return convertShowToBoolean(server.show)
  }

  // 辅助方法：检查服务器是否可以编辑
  canEditServer(_server: ShadowsocksServerResponse, currentUserRole: string): boolean {
    // 管理员可以编辑所有服务器
    if (currentUserRole === 'admin') return true
    
    return false
  }

  // 辅助方法：检查服务器是否可以删除
  canDeleteServer(_server: ShadowsocksServerResponse, currentUserRole: string): boolean {
    // 管理员可以删除服务器
    if (currentUserRole === 'admin') return true
    
    return false
  }

  // 辅助方法：格式化时间显示
  formatDateTime(timestamp: number): string {
    const date = new Date(timestamp * 1000) // 假设时间戳是秒
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

  // 注意：后端模型中没有status字段，移除状态相关方法

  // 注意：移除了导出配置方法，如需要可以重新添加
}

// 导出单例实例
export const shadowsocksServerService = new ShadowsocksServerService()