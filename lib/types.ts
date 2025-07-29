// ==================== 通用响应格式 ====================

export interface StandardResponse<T = unknown> {
  code: number
  message: string
  data?: T
}

export interface PaginatedResponse<T = unknown> {
  code: number
  message: string
  data: T[]
  total: number
  limit: number
  offset: number
}

export interface StandardListResponse<T = unknown> {
  code: number
  message: string
  data: {
    items: T[]
    pagination: {
      total: number
      page: number
      limit: number
    }
  }
}

// ==================== 认证相关接口 ====================

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  token: TokenResponse
  user: UserResponse
}

// 兼容性别名
export type LoginResponse = AuthResponse

export interface RegisterRequest {
  email: string
  password: string
  invite_code?: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  expires_at: string
}

export interface RefreshTokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
  expires_in: number
  expires_at: string
}

export interface UserResponse {
  id: number
  email: string
  username: string
  name: string
  avatar: string
  role: 'user' | 'admin' | 'system'
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  provider: 'local' | 'google' | 'github' | 'telegram'
  google_id: string
  github_id: string
  telegram_id: string
  provider_data: string
  invite_code_id: number
  invite_code_used: string
  created_at: string
  updated_at: string
  deleted_at: string
}

// ==================== OAuth相关接口 ====================

export interface AuthorizeURLRequest {
  provider: string
  redirect_uri?: string
  scopes?: string[]
}

export interface AuthorizeURLResponse {
  auth_url: string
  state: string
}

export interface TokenExchangeRequest {
  code: string
  provider: string
  state?: string
}

// 兼容性别名
export type OAuthTokenRequest = TokenExchangeRequest

export interface OAuthProvider {
  name: string
  label: string
  icon: React.ReactNode
  variant: 'outline' | 'default'
  className?: string
}

// ==================== 错误响应格式 ====================

export interface ErrorResponse {
  code: number
  message: string
  details?: unknown
}

// ==================== 表单状态 ====================

export interface FormState {
  loading: boolean
  error: string | null
  success: boolean
}

// ==================== 认证状态 ====================

export interface AuthState {
  user: UserResponse | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
}

// ==================== API错误类型 ====================

export class ApiError extends Error {
  public code: number
  public details?: unknown

  constructor(message: string, code: number, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
  }
}

// ==================== 常用类型工具 ====================

export type ApiResponse<T> = StandardResponse<T>
export type ApiListResponse<T> = PaginatedResponse<T>
export type ApiStandardListResponse<T> = StandardListResponse<T>

// 提取数据类型的工具类型
export type ExtractData<T> = T extends StandardResponse<infer U> ? U : never

// ==================== 管理端接口（简化版本） ====================

// 用户管理
export interface CreateUserRequest {
  email: string
  username: string
  name: string
  password: string
  role?: string
  status?: string
  avatar?: string
}

export interface UpdateUserRequest {
  email?: string
  username?: string
  name?: string
  avatar?: string
  role?: string
  status?: string
}

export interface UserStatsResponse {
  total_users: number
  active_users: number
  new_users_today: number
  new_users_this_week: number
  new_users_this_month: number
  users_by_role: Record<string, number>
  users_by_provider: Record<string, number>
  users_by_status: Record<string, number>
}

export interface BatchOperationResult {
  success_count: number
  failed_count: number
  total_count: number
  failed_ids: number[]
  errors: string[]
}