// 邀请码响应类型 (基于用户注册API中的invite_code相关字段)
export interface InviteCodeResponse {
  id: number
  code: string
  name: string
  description?: string
  
  // 使用统计
  max_uses: number
  used_count: number
  remaining_uses: number
  
  // 状态
  status: 'active' | 'inactive' | 'expired'
  is_unlimited: boolean
  
  // 有效期
  valid_from?: string
  valid_until?: string
  
  // 创建者信息
  created_by?: number
  created_by_name?: string
  
  // 时间戳
  created_at: string
  updated_at: string
}

// 创建邀请码请求类型
export interface CreateInviteCodeRequest {
  code: string
  name: string
  description?: string
  
  // 使用限制
  max_uses?: number
  is_unlimited?: boolean
  
  // 有效期
  valid_from?: string
  valid_until?: string
}

// 更新邀请码请求类型
export interface UpdateInviteCodeRequest {
  name?: string
  description?: string
  status?: 'active' | 'inactive' | 'expired'
  
  // 使用限制
  max_uses?: number
  is_unlimited?: boolean
  
  // 有效期
  valid_from?: string
  valid_until?: string
}

// 邀请码查询参数
export interface InviteCodeQueryParams {
  status?: 'active' | 'inactive' | 'expired'
  is_unlimited?: boolean
  search?: string
  sort_by?: 'created_at' | 'code' | 'name' | 'used_count' | 'valid_from' | 'valid_until'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 邀请码统计响应
export interface InviteCodeStatsResponse {
  total_codes: number
  active_codes: number
  expired_codes: number
  inactive_codes: number
  total_uses: number
  total_registrations: number
}

// 邀请码使用记录响应
export interface InviteCodeUsageResponse {
  id: number
  invite_code_id: number
  invite_code: string
  user_id: number
  user_email: string
  used_at: string
}

// 邀请码使用记录查询参数
export interface InviteCodeUsageQueryParams {
  invite_code_id?: number
  user_id?: number
  start_date?: string
  end_date?: string
  sort_by?: 'used_at' | 'user_email'
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

// 批量生成邀请码请求
export interface BatchInviteCodeRequest {
  name_prefix: string
  count: number
  max_uses?: number
  is_unlimited?: boolean
  valid_from?: string
  valid_until?: string
  description?: string
}

// API响应类型
export interface InviteCodesApiResponse {
  code: number
  message: string
  data: InviteCodeResponse[]
  total: number
  limit: number
  offset: number
}

export interface InviteCodeUsagesApiResponse {
  code: number
  message: string
  data: InviteCodeUsageResponse[]
  total: number
  limit: number
  offset: number
}

export interface ApiResponse<T> {
  code: number
  message: string
  data?: T
}