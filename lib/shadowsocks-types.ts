'use client'

import { StandardResponse } from './types'

// Shadowsocks服务器响应类型（根据完整API文档）
export interface ShadowsocksServerResponse {
  id: number
  group_id: number
  name: string
  host: string
  port: string  // API返回string类型
  server_port: number
  cipher: string
  rate: string  // 倍率/速率字段，string类型，最大11字符
  show: number  // 显示状态，0/1表示是否显示
  sort: number  // 排序字段
  created_at: number
  updated_at: number
  // 关系字段
  parent_id?: number  // 父服务器ID
  server_group?: {    // 关联的服务器组数据
    id: number
    name: string
    created_at: string
    updated_at: string
  }
  // 可选字段
  obfs?: string         // 混淆方式，最大11字符
  obfs_settings?: string // 混淆设置，最大255字符  
  route_id?: string     // 路由ID，最大255字符
  tags?: string         // 标签，逗号分隔，最大255字符
  ips?: string          // IP范围，最大255字符
  excludes?: string     // 排除的IP范围
}

// 创建Shadowsocks服务器请求类型（根据完整API文档）
export interface CreateShadowsocksServerRequest {
  // 必填字段
  name: string          // 服务器名称，最大255字符
  host: string          // 主机地址，最大255字符
  port: string          // 端口，string类型，最大11字符
  server_port: number   // 内部服务器端口，1-65535
  cipher: string        // 加密方式，最大255字符
  group_id: number      // 服务器组ID
  rate: string          // 倍率字段，string类型，最大11字符
  
  // 可选字段
  obfs?: string         // 混淆方式，最大11字符
  obfs_settings?: string // 混淆设置，最大255字符
  sort?: number         // 排序值
  show?: number         // 显示状态，0或1
  parent_id?: number    // 父服务器ID
  route_id?: string     // 路由ID，最大255字符
  tags?: string         // 标签，最大255字符
  ips?: string          // IP范围，最大255字符
  excludes?: string     // 排除的IP范围
}

// 更新Shadowsocks服务器请求类型（根据完整API文档，所有字段都是可选的）
export interface UpdateShadowsocksServerRequest {
  name?: string          // 服务器名称，最大255字符
  host?: string          // 主机地址，最大255字符
  port?: string          // 端口，string类型，最大11字符
  server_port?: number   // 内部服务器端口，1-65535
  cipher?: string        // 加密方式，最大255字符
  group_id?: number      // 服务器组ID
  rate?: string          // 倍率字段，string类型，最大11字符
  obfs?: string          // 混淆方式，最大11字符
  obfs_settings?: string // 混淆设置，最大255字符
  sort?: number          // 排序值
  show?: number          // 显示状态，0或1
  parent_id?: number     // 父服务器ID
  route_id?: string      // 路由ID，最大255字符
  tags?: string          // 标签，最大255字符
  ips?: string           // IP范围，最大255字符
  excludes?: string      // 排除的IP范围
}

// Shadowsocks服务器搜索参数（严格按照后端API）
export interface ShadowsocksServerSearchParams {
  group_id?: string    // Group ID filter
  status?: string      // Status filter
  is_show?: boolean    // Show filter
  is_online?: boolean  // Online filter
  limit?: number       // Limit
  offset?: number      // Offset（后端使用offset而不是page）
}

// 分页信息
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages?: number
}

// Shadowsocks服务器列表响应（根据实际API响应）
export interface ShadowsocksServerListResponse extends StandardResponse {
  data: ShadowsocksServerResponse[]  // 直接返回数组
  total: number  // 分页信息在根级别
  limit: number
  offset: number
}

// Shadowsocks服务器详情响应
export interface ShadowsocksServerDetailResponse extends StandardResponse {
  data: ShadowsocksServerResponse
}

// 注意：后端API中没有批量操作、统计、服务器组管理等接口
// 这些类型定义已移除

// 注意：后端模型中没有status字段，移除状态选项

// 加密方式选项
export const CIPHER_OPTIONS = [
  { value: 'aes-256-gcm', label: 'AES-256-GCM' },
  { value: 'aes-128-gcm', label: 'AES-128-GCM' },
  { value: 'chacha20-ietf-poly1305', label: 'ChaCha20-IETF-Poly1305' },
  { value: 'aes-256-cfb', label: 'AES-256-CFB' },
  { value: 'aes-128-cfb', label: 'AES-128-CFB' },
  { value: 'chacha20-ietf', label: 'ChaCha20-IETF' }
] as const

// 混淆方式选项
export const OBFS_OPTIONS = [
  { value: 'none', label: '无混淆' },
  { value: 'tls', label: 'TLS' },
  { value: 'http', label: 'HTTP' },
  { value: 'plain', label: 'Plain' }
] as const

// 工具函数：转换show字段
export const convertShowToBoolean = (show: number): boolean => show === 1
export const convertBooleanToShow = (isShow: boolean): number => isShow ? 1 : 0

// Shadowsocks服务器服务接口（严格按照后端API）
export interface ShadowsocksServerService {
  // 获取服务器列表
  getServers(params?: ShadowsocksServerSearchParams): Promise<ShadowsocksServerListResponse>
  
  // 获取单个服务器详情
  getServer(id: number): Promise<ShadowsocksServerDetailResponse>
  
  // 创建新服务器
  createServer(data: CreateShadowsocksServerRequest): Promise<ShadowsocksServerDetailResponse>
  
  // 更新服务器信息（PUT方法完全更新）
  updateServer(id: number, data: UpdateShadowsocksServerRequest): Promise<ShadowsocksServerDetailResponse>
  
  // 部分更新服务器信息（PATCH方法）
  patchServer(id: number, data: Partial<UpdateShadowsocksServerRequest>): Promise<ShadowsocksServerDetailResponse>
  
  // 删除服务器
  deleteServer(id: number): Promise<StandardResponse>
  
  // 注意：后端API中没有批量操作、搜索、统计等接口
}