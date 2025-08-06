'use client'

import { StandardResponse } from './types'

// Shadowsocks服务器响应类型（根据swagger文档）
export interface ShadowsocksServerResponse {
  id: number
  group_id: number
  name: string
  host: string
  port: number        // 根据swagger，这是integer类型
  server_port: number
  cipher: string
  rate: number        // 根据swagger，这是number类型
  show: number        // 显示状态，0/1表示是否显示
  sort: number        // 排序字段
  created_at: number  // 时间戳
  updated_at: number  // 时间戳
  
  // 可选字段
  parent_id?: number    // 父服务器ID
  obfs?: string         // 混淆方式
  obfs_settings?: string // 混淆设置
  route_id?: string     // 路由ID
  tags?: string         // 标签，逗号分隔
  ips?: string          // IP范围
  excludes?: string     // 排除的IP范围
  
  // 关系字段
  server_group?: {      // 关联的服务器组数据
    id: number
    name: string
    created_at: string
    updated_at: string
  }
}

// 创建Shadowsocks服务器请求类型（根据swagger文档）
export interface CreateShadowsocksServerRequest {
  // 必填字段
  name: string          // 服务器名称，最大255字符
  host: string          // 主机地址，最大255字符
  port: number          // 端口，1-65535
  server_port: number   // 服务器端口，1-65535
  cipher: string        // 加密方式，最大255字符
  group_id: number      // 服务器组ID
  rate: number          // 倍率，最小0.1
  
  // 可选字段
  obfs?: string         // 混淆方式，最大11字符
  obfs_settings?: string // 混淆设置，最大255字符
  show?: number         // 显示状态，0或1
  parent_id?: number    // 父服务器ID
  route_id?: string     // 路由ID，最大255字符
  tags?: string         // 标签，最大255字符
  ips?: string          // IP范围，最大255字符
  excludes?: string     // 排除的IP范围
  sort?: number         // 排序值
}

// 更新Shadowsocks服务器请求类型（所有字段都是可选的）
export interface UpdateShadowsocksServerRequest {
  name?: string          // 服务器名称，最大255字符
  host?: string          // 主机地址，最大255字符
  port?: number          // 端口，1-65535
  server_port?: number   // 服务器端口，1-65535
  cipher?: string        // 加密方式，最大255字符
  group_id?: number      // 服务器组ID
  rate?: number          // 倍率，最小0.1
  obfs?: string          // 混淆方式，最大11字符
  obfs_settings?: string // 混淆设置，最大255字符
  show?: number          // 显示状态，0或1
  parent_id?: number     // 父服务器ID
  route_id?: string      // 路由ID，最大255字符
  tags?: string          // 标签，最大255字符
  ips?: string           // IP范围，最大255字符
  excludes?: string      // 排除的IP范围
  sort?: number          // 排序值
}

// Shadowsocks服务器搜索参数（根据swagger文档）
export interface ShadowsocksServerSearchParams {
  page?: number        // 页码，默认1
  limit?: number       // 每页数量，默认10
  group_id?: number    // 按服务器组ID过滤
  show?: number        // 按可见性过滤（0或1）
  // 为了兼容现有代码，保留这些字段
  offset?: number      // 偏移量（将转换为page）
}

// 分页信息
export interface PaginationInfo {
  page: number
  limit: number
  total: number
  total_pages?: number
}

// 分页信息结构
export interface PaginationData {
  page: number
  limit: number
  total: number
}

// Shadowsocks服务器列表数据结构
export interface ShadowsocksServerListData {
  items: ShadowsocksServerResponse[]
  pagination: PaginationData
}

// Shadowsocks服务器列表响应（根据实际API响应格式）
export interface ShadowsocksServerListResponse extends StandardResponse {
  data: ShadowsocksServerListData
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

// 批量更新请求类型
export interface BulkUpdateServersRequest {
  server_ids: number[]
  updates: Partial<UpdateShadowsocksServerRequest>
}

// Shadowsocks服务器服务接口（根据swagger文档）
export interface ShadowsocksServerService {
  // 基础CRUD操作
  getServers(params?: ShadowsocksServerSearchParams): Promise<ShadowsocksServerListResponse>
  getServer(id: number): Promise<ShadowsocksServerDetailResponse>
  createServer(data: CreateShadowsocksServerRequest): Promise<ShadowsocksServerDetailResponse>
  updateServer(id: number, data: UpdateShadowsocksServerRequest): Promise<ShadowsocksServerDetailResponse>
  patchServer(id: number, data: Partial<UpdateShadowsocksServerRequest>): Promise<ShadowsocksServerDetailResponse>
  deleteServer(id: number): Promise<StandardResponse>
  
  // 新增功能
  bulkUpdateServers(data: BulkUpdateServersRequest): Promise<StandardResponse>
  getServersByGroup(groupId: number): Promise<ShadowsocksServerListResponse>
  getServerHealth(id: number): Promise<StandardResponse>
  getServerStatistics(id: number): Promise<StandardResponse>
  getServerStatus(id: number): Promise<StandardResponse>
  updateServerStatus(id: number, status: { enabled?: boolean; maintenance?: boolean }): Promise<StandardResponse>
}