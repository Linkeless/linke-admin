// ==================== 用户管理类型定义 ====================
// 基于swagger文档定义的用户管理相关接口

import { StandardResponse, StandardListResponse } from './types'

// 用户响应数据结构 - 基于swagger model.UserResponse
export interface UserResponse {
  id: number
  email: string
  name?: string
  username?: string
  avatar?: string
  role: 'user' | 'admin' | 'system'
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  
  // OAuth Provider IDs
  google_id?: string
  github_id?: string
  telegram_id?: string
  
  // Authentication Fields
  provider?: string
  provider_data?: string
  
  // Invite fields
  invite_code_id?: number
  invite_code_used?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  last_login_at?: string
  deleted_at?: string
}

// 创建用户请求 - 基于swagger model.CreateUserRequest
export interface CreateUserRequest {
  email: string
  name?: string
  username?: string
  password?: string
  role?: 'user' | 'admin'
  status?: 'active' | 'inactive' | 'banned'
}

// 更新用户请求
export interface UpdateUserRequest {
  name?: string
  username?: string
  email?: string
  role?: 'user' | 'admin' | 'system'
  status?: 'active' | 'inactive' | 'suspended' | 'banned'
}

// 用户搜索参数
export interface UserSearchParams {
  q?: string // 搜索关键词
  page?: number
  limit?: number
  provider?: 'google' | 'github' | 'telegram' | 'local'
  role?: 'user' | 'admin' | 'system'
  status?: 'active' | 'inactive' | 'suspended' | 'banned'
  subscription_tier?: string
  email_verified?: boolean
  sort_by?: 'created_at' | 'updated_at' | 'last_login_at' | 'email' | 'name'
  sort_order?: 'asc' | 'desc'
  date_from?: string // YYYY-MM-DD
  date_to?: string // YYYY-MM-DD
}

// 分页信息 - 基于swagger PaginationResponse
export interface PaginationResponse {
  page: number // 当前页码
  limit: number // 每页项目数
  total: number // 总项目数
  total_pages?: number // 总页数（计算得出）
}

// 列表数据信息
export interface ListDataInfo {
  items: UserResponse[]
  pagination: PaginationResponse
}

// 用户列表响应 - 严格按照swagger定义
export interface UserListResponse extends StandardResponse {
  data: ListDataInfo
}

// 用户详情响应
export interface UserDetailResponse extends StandardResponse {
  data: UserResponse
}

// 搜索响应数据结构
export interface SearchResponseData {
  items: UserResponse[]
  pagination: PaginationResponse
  query: string
}

// 搜索响应 - 基于swagger response.SearchResponse
export interface UserSearchResponse extends StandardResponse {
  data: SearchResponseData
}

// 按提供商筛选响应 - 基于swagger response.ProviderFilterResponse
export interface UserProviderFilterResponse extends StandardResponse {
  data: {
    users: UserResponse[]
    provider: string
    total: number
    page: number
    limit: number
    total_pages: number
    provider_stats: {
      total_users: number
      active_users: number
      verified_users: number
    }
  }
}

// 批量操作请求 - 根据swagger文档格式
export interface BatchUserOperationRequest {
  [key: string]: number[]
}

// 批量操作响应
export interface BatchUserOperationResponse extends StandardResponse {
  data: {
    success_count: number
    failed_count: number
    failed_ids: number[]
    errors: string[]
  }
}

// 用户统计响应 - 基于已有的UserStatsResponse
export interface UserStatsResponse {
  total_users: number
  active_users: number
  new_users_today: number
  new_users_this_week: number
  new_users_this_month: number
  users_by_role: {
    [key: string]: number
  }
  users_by_provider: {
    [key: string]: number
  }
  users_by_status: {
    [key: string]: number
  }
}

// 用户服务接口定义
export interface UserService {
  // 用户列表操作
  getUsers(params?: UserSearchParams): Promise<UserListResponse>
  getDeletedUsers(params?: { page?: number; limit?: number }): Promise<UserListResponse>
  searchUsers(params: UserSearchParams): Promise<UserSearchResponse>
  getUsersByProvider(params: { provider: string; page?: number; limit?: number }): Promise<UserProviderFilterResponse>
  
  // 单个用户操作
  getUser(id: number): Promise<UserDetailResponse>
  createUser(data: CreateUserRequest): Promise<UserDetailResponse>
  updateUser(id: number, data: UpdateUserRequest): Promise<UserDetailResponse>
  deleteUser(id: number): Promise<StandardResponse>
  restoreUser(id: number): Promise<StandardResponse>
  
  // 批量操作
  batchDeleteUsers(data: BatchUserOperationRequest): Promise<BatchUserOperationResponse>
  batchRestoreUsers(data: BatchUserOperationRequest): Promise<BatchUserOperationResponse>
  
  // 统计数据
  getUserStats(): Promise<StandardResponse<UserStatsResponse>>
}

// 表格列定义
export interface UserTableColumn {
  id: string
  label: string
  sortable: boolean
  width?: string
  align?: 'left' | 'center' | 'right'
}

// 用户表格行数据
export interface UserTableRow extends UserResponse {
  selected?: boolean
}

// 用户筛选器状态
export interface UserFilters {
  search: string
  provider: string | null
  role: string | null
  status: string | null
  emailVerified: boolean | null
  dateRange: {
    from: string | null
    to: string | null
  }
}

// OAuth提供商信息
export interface OAuthProvider {
  name: 'google' | 'github' | 'telegram' | 'local'
  label: string
  icon: string
  color: string
}

// 用户角色定义
export interface UserRole {
  value: 'user' | 'admin' | 'system'
  label: string
  description: string
  permissions: string[]
}

// 用户状态定义
export interface UserStatus {
  value: 'active' | 'inactive' | 'suspended' | 'banned'
  label: string
  description: string
  color: string
}

// 表单验证规则
export interface UserFormValidation {
  email: {
    required: boolean
    maxLength: number
    pattern: RegExp
  }
  name: {
    maxLength: number
  }  
  username: {
    maxLength: number
    pattern: RegExp
  }
  password: {
    minLength: number
    maxLength: number
    required: boolean
  }
  bio: {
    maxLength: number
  }
  website: {
    pattern: RegExp
  }
}

// 导出默认配置
export const DEFAULT_USER_FILTERS: UserFilters = {
  search: '',
  provider: null,
  role: null,
  status: null,
  emailVerified: null,
  dateRange: {
    from: null,
    to: null
  }
}

export const OAUTH_PROVIDERS: OAuthProvider[] = [
  { name: 'google', label: 'Google', icon: 'IconBrandGoogle', color: '#4285f4' },
  { name: 'github', label: 'GitHub', icon: 'IconBrandGithub', color: '#24292e' },
  { name: 'telegram', label: 'Telegram', icon: 'IconBrandTelegram', color: '#0088cc' },
  { name: 'local', label: '本地账号', icon: 'IconUser', color: '#6b7280' }
]

export const USER_ROLES: UserRole[] = [
  {
    value: 'user',
    label: '普通用户',
    description: '标准用户权限',
    permissions: ['read:profile', 'update:profile']
  },
  {
    value: 'admin',
    label: '管理员',
    description: '系统管理员权限',
    permissions: ['read:all', 'write:all', 'delete:all', 'admin:users']
  },
  {
    value: 'system',
    label: '系统用户',
    description: '系统内部用户',
    permissions: ['system:internal']
  }
]

export const USER_STATUSES: UserStatus[] = [
  {
    value: 'active',
    label: '活跃',
    description: '用户账号正常',
    color: '#10b981'
  },
  {
    value: 'inactive', 
    label: '未激活',
    description: '用户尚未激活账号',
    color: '#f59e0b'
  },
  {
    value: 'suspended',
    label: '暂停',
    description: '账号被临时暂停',
    color: '#f97316'
  },
  {
    value: 'banned',
    label: '封禁',
    description: '账号被永久封禁',
    color: '#ef4444'
  }
]

export const USER_FORM_VALIDATION: UserFormValidation = {
  email: {
    required: true,
    maxLength: 255,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  name: {
    maxLength: 255
  },
  username: {
    maxLength: 50,
    pattern: /^[a-zA-Z0-9_-]+$/
  },
  password: {
    minLength: 6,
    maxLength: 255,
    required: true
  },
  bio: {
    maxLength: 500
  },
  website: {
    pattern: /^https?:\/\/.+/
  }
}