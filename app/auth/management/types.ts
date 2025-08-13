// ==================== 认证管理类型定义 ====================
// 基于swagger文档定义的认证管理相关接口

import { StandardResponse, PaginatedResponse } from '@/lib/types'

// ==================== 账户管理类型 ====================

// 账户安全状态响应
export interface AccountSecurityStatus {
  user_id: number
  username: string
  email: string
  security_level: 'low' | 'medium' | 'high' | 'critical'
  is_locked: boolean
  failed_login_attempts: number
  last_login_at?: string
  last_failed_login_at?: string
  password_last_changed_at?: string
  two_factor_enabled: boolean
  active_sessions: number
  suspicious_activities: number
}

// 强制密码重置请求
export interface ForcePasswordResetRequest {
  user_id: number
  reason?: string
  notify_user?: boolean
}

// 账户解锁请求
export interface UnlockAccountRequest {
  user_id: number
  reason?: string
}

// ==================== 安全分析类型 ====================

// 安全统计数据
export interface SecurityStatistics {
  total_users: number
  active_sessions: number
  failed_logins_24h: number
  locked_accounts: number
  security_incidents: number
  avg_security_score: number
  password_resets_24h: number
  new_registrations_24h: number
}

// 安全评分响应
export interface SecurityScoreResponse {
  overall_score: number
  user_behavior_score: number
  authentication_score: number
  system_security_score: number
  recommendations: string[]
  last_updated: string
}

// 安全模式/行为分析
export interface SecurityPattern {
  pattern_type: 'login_time' | 'location' | 'device' | 'behavior'
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  description: string
  affected_users: number
  first_detected: string
  last_seen: string
}

// ==================== 登录监控类型 ====================

// 失败登录记录
export interface FailedLoginAttempt {
  id: number
  user_id?: number
  email: string
  ip_address: string
  user_agent: string
  failure_reason: 'invalid_password' | 'user_not_found' | 'account_locked' | 'too_many_attempts'
  attempted_at: string
  country?: string
  city?: string
  is_suspicious: boolean
}

// 登录尝试记录
export interface LoginAttempt {
  id: number
  user_id?: number
  email: string
  ip_address: string
  user_agent: string
  success: boolean
  attempted_at: string
  country?: string
  city?: string
  device_type: string
  browser: string
}

// ==================== JWT管理类型 ====================

// JWT令牌信息
export interface JwtTokenInfo {
  jti: string // JWT ID
  user_id: number
  email: string
  issued_at: string
  expires_at: string
  is_active: boolean
  device_info?: string
  ip_address?: string
  last_used_at?: string
}

// JWT黑名单项
export interface JwtBlacklistItem {
  jti: string
  user_id: number
  email: string
  revoked_at: string
  revoked_by: number
  reason: string
  expires_at: string
}

// JWT分析数据
export interface JwtAnalytics {
  total_active_tokens: number
  tokens_issued_24h: number
  tokens_revoked_24h: number
  blacklisted_tokens: number
  avg_token_lifetime: number
  top_devices: Array<{
    device_type: string
    count: number
  }>
  hourly_usage: Array<{
    hour: string
    active_tokens: number
  }>
}

// JWT撤销请求
export interface RevokeJwtRequest {
  jti?: string
  user_id?: number
  reason: string
}

// ==================== OAuth管理类型 ====================

// OAuth提供商信息
export interface OAuthProvider {
  id: number
  name: string
  provider_type: 'google' | 'github' | 'telegram'
  client_id: string
  is_enabled: boolean
  total_users: number
  registrations_24h: number
  last_sync_at?: string
  configuration: Record<string, any>
}

// OAuth事件/安全事件
export interface OAuthIncident {
  id: number
  provider: string
  event_type: 'registration' | 'login' | 'token_refresh' | 'error' | 'security_violation'
  user_id?: number
  user_email?: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  description: string
  metadata: Record<string, any>
  occurred_at: string
  resolved_at?: string
}

// ==================== 批量操作类型 ====================

// 批量通知请求
export interface BulkNotificationRequest {
  user_ids: number[]
  message: string
  notification_type: 'security_alert' | 'password_reset' | 'account_warning'
  priority: 'low' | 'medium' | 'high'
}

// 批量密码重置请求
export interface BulkPasswordResetRequest {
  user_ids: number[]
  reason: string
  notify_users: boolean
}

// 批量令牌撤销请求
export interface BulkRevokeTokensRequest {
  user_ids?: number[]
  device_types?: string[]
  reason: string
  older_than_hours?: number
}

// 批量账户解锁请求
export interface BulkUnlockAccountsRequest {
  user_ids: number[]
  reason: string
}

// ==================== 通用响应类型 ====================

export type AccountSecurityStatusResponse = StandardResponse<AccountSecurityStatus>
export type SecurityStatisticsResponse = StandardResponse<SecurityStatistics>
export type SecurityPatternsResponse = StandardResponse<SecurityPattern[]>
export type FailedLoginsResponse = PaginatedResponse<FailedLoginAttempt>
export type LoginAttemptsResponse = PaginatedResponse<LoginAttempt>
export type JwtTokensResponse = PaginatedResponse<JwtTokenInfo>
export type JwtBlacklistResponse = PaginatedResponse<JwtBlacklistItem>
export type JwtAnalyticsResponse = StandardResponse<JwtAnalytics>
export type OAuthProvidersResponse = StandardResponse<OAuthProvider[]>
export type OAuthIncidentsResponse = PaginatedResponse<OAuthIncident>

// ==================== 查询参数类型 ====================

export interface SecurityQueryParams {
  limit?: number
  offset?: number
  start_date?: string
  end_date?: string
  risk_level?: 'low' | 'medium' | 'high' | 'critical'
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

export interface LoginAttemptsQueryParams extends SecurityQueryParams {
  success?: boolean
  ip_address?: string
  user_id?: number
}

export interface JwtQueryParams extends SecurityQueryParams {
  user_id?: number
  is_active?: boolean
  device_type?: string
}

export interface OAuthQueryParams extends SecurityQueryParams {
  provider?: string
  event_type?: string
  severity?: 'info' | 'warning' | 'error' | 'critical'
}