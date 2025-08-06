'use client'

import { StandardResponse } from './types'

// 服务器组响应接口（基于 swagger.json 中的 model.ServerGroupResponse）
export interface ServerGroupResponse {
  id: number
  name: string
  created_at: string
  updated_at: string
}

// 创建服务器组请求接口
export interface CreateServerGroupRequest {
  name: string
}

// 更新服务器组请求接口
export interface UpdateServerGroupRequest {
  name: string
}

// 服务器组搜索参数
export interface ServerGroupSearchParams {
  page?: number
  limit?: number
}

// 分页信息接口
export interface ServerGroupPagination {
  page: number
  limit: number
  total: number
}

// 服务器组列表数据接口
export interface ServerGroupListData {
  items: ServerGroupResponse[]
  pagination: ServerGroupPagination
}

// 服务器组列表响应
export interface ServerGroupListResponse extends StandardResponse {
  data: ServerGroupListData
}

// 服务器组详情响应
export interface ServerGroupDetailResponse extends StandardResponse {
  data: ServerGroupResponse
}

// 服务器组服务接口
export interface ServerGroupService {
  // 获取服务器组列表
  getServerGroups(params?: ServerGroupSearchParams): Promise<ServerGroupListResponse>
  
  // 获取所有服务器组（不分页）
  getAllServerGroups(): Promise<ServerGroupListResponse>
  
  // 获取单个服务器组详情
  getServerGroup(id: number): Promise<ServerGroupDetailResponse>
  
  // 创建新服务器组
  createServerGroup(data: CreateServerGroupRequest): Promise<ServerGroupDetailResponse>
  
  // 更新服务器组信息
  updateServerGroup(id: number, data: UpdateServerGroupRequest): Promise<ServerGroupDetailResponse>
  
  // 删除服务器组
  deleteServerGroup(id: number): Promise<StandardResponse>
  
  // 新增：获取服务器组内的所有服务器
  getServerGroupServers(id: number): Promise<StandardResponse>
  
  // 新增：获取服务器组统计信息
  getServerGroupStatistics(id: number): Promise<StandardResponse>
}