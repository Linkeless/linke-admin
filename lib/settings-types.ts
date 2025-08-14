/**
 * 设置模块类型定义
 * 
 * 包含系统设置、用户偏好、通知设置等相关类型
 */

import { StandardResponse } from './types'

// ==================== 基础类型 ====================

/**
 * 设置类别
 */
export enum SettingCategory {
  SYSTEM = 'system',        // 系统设置
  APPEARANCE = 'appearance', // 外观设置
  NOTIFICATION = 'notification', // 通知设置
  SECURITY = 'security',    // 安全设置
  INTEGRATION = 'integration', // 集成设置
  BILLING = 'billing',      // 账单设置
  BACKUP = 'backup'         // 备份设置
}

/**
 * 设置数据类型
 */
export enum SettingType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  JSON = 'json',
  ARRAY = 'array',
  FILE = 'file'
}

/**
 * 设置访问级别
 */
export enum SettingAccessLevel {
  PUBLIC = 'public',        // 公开设置
  USER = 'user',           // 用户级设置
  ADMIN = 'admin',         // 管理员设置
  SYSTEM = 'system'        // 系统级设置
}

// ==================== 设置项类型 ====================

/**
 * 设置项基础接口
 */
export interface BaseSetting {
  id: string
  key: string
  name: string
  description?: string
  category: SettingCategory
  type: SettingType
  access_level: SettingAccessLevel
  is_required: boolean
  is_encrypted: boolean
  created_at: string
  updated_at: string
}

/**
 * 设置项详细信息
 */
export interface Setting extends BaseSetting {
  value: any
  default_value?: any
  validation_rules?: ValidationRule[]
  options?: SettingOption[]
  group?: string
  sort_order?: number
  is_visible: boolean
  is_readonly: boolean
  depends_on?: string[]
}

/**
 * 设置验证规则
 */
export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'enum'
  value?: any
  message?: string
}

/**
 * 设置选项（用于下拉选择等）
 */
export interface SettingOption {
  value: any
  label: string
  description?: string
  disabled?: boolean
}

/**
 * 设置分组
 */
export interface SettingGroup {
  id: string
  name: string
  description?: string
  category: SettingCategory
  sort_order: number
  settings: Setting[]
}

// ==================== 系统设置类型 ====================

/**
 * 系统配置
 */
export interface SystemSettings {
  // 基础配置
  site_name: string
  site_description: string
  site_url: string
  admin_email: string
  timezone: string
  locale: string
  
  // 功能开关
  registration_enabled: boolean
  email_verification_required: boolean
  two_factor_enabled: boolean
  maintenance_mode: boolean
  debug_mode: boolean
  
  // 限制配置
  max_users: number
  max_file_size: number
  session_timeout: number
  rate_limit_requests: number
  rate_limit_window: number
  
  // 邮件配置
  mail_driver: string
  mail_host: string
  mail_port: number
  mail_username: string
  mail_password?: string
  mail_encryption: string
  mail_from_address: string
  mail_from_name: string
  
  // 存储配置
  storage_driver: string
  storage_path: string
  max_storage_size: number
  
  // 缓存配置
  cache_driver: string
  cache_ttl: number
  cache_prefix: string
  
  // 安全配置
  password_min_length: number
  password_require_numbers: boolean
  password_require_symbols: boolean
  password_require_mixed_case: boolean
  failed_login_attempts: number
  lockout_duration: number
}

/**
 * 外观设置
 */
export interface AppearanceSettings {
  // 主题配置
  theme: 'light' | 'dark' | 'auto'
  primary_color: string
  accent_color: string
  font_family: string
  font_size: 'small' | 'medium' | 'large'
  
  // 布局配置
  sidebar_collapsed: boolean
  sidebar_position: 'left' | 'right'
  header_fixed: boolean
  footer_visible: boolean
  breadcrumb_visible: boolean
  
  // 品牌配置
  logo_url?: string
  favicon_url?: string
  brand_name?: string
  brand_description?: string
  
  // 自定义样式
  custom_css?: string
  custom_js?: string
}

/**
 * 通知设置
 */
export interface NotificationSettings {
  // 邮件通知
  email_notifications_enabled: boolean
  email_new_user_registration: boolean
  email_password_reset: boolean
  email_payment_received: boolean
  email_subscription_expired: boolean
  email_system_alerts: boolean
  
  // 浏览器通知
  browser_notifications_enabled: boolean
  browser_new_messages: boolean
  browser_system_alerts: boolean
  
  // 短信通知
  sms_notifications_enabled: boolean
  sms_phone_number?: string
  sms_important_alerts: boolean
  
  // Webhook通知
  webhook_notifications_enabled: boolean
  webhook_url?: string
  webhook_secret?: string
  webhook_events: string[]
  
  // 通知频率
  notification_frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
  quiet_hours_enabled: boolean
  quiet_hours_start?: string
  quiet_hours_end?: string
}

/**
 * 安全设置
 */
export interface SecuritySettings {
  // 认证设置
  require_email_verification: boolean
  allow_social_login: boolean
  social_providers: string[]
  
  // 密码策略
  password_policy: {
    min_length: number
    require_uppercase: boolean
    require_lowercase: boolean
    require_numbers: boolean
    require_symbols: boolean
    prevent_reuse: number
    expiry_days?: number
  }
  
  // 访问控制
  ip_whitelist_enabled: boolean
  ip_whitelist: string[]
  ip_blacklist: string[]
  
  // 会话管理
  session_lifetime: number
  concurrent_sessions_limit: number
  auto_logout_enabled: boolean
  auto_logout_time: number
  
  // 审计日志
  audit_log_enabled: boolean
  audit_log_retention_days: number
  audit_log_events: string[]
  
  // 安全头
  security_headers_enabled: boolean
  csrf_protection_enabled: boolean
  xss_protection_enabled: boolean
}

// ==================== 用户偏好类型 ====================

/**
 * 用户偏好设置
 */
export interface UserPreferences {
  // 界面偏好
  theme: 'light' | 'dark' | 'auto'
  language: string
  timezone: string
  date_format: string
  time_format: '12h' | '24h'
  
  // 显示偏好
  items_per_page: number
  default_dashboard: string
  sidebar_collapsed: boolean
  show_tooltips: boolean
  
  // 通知偏好
  email_notifications: boolean
  browser_notifications: boolean
  notification_sound: boolean
  
  // 隐私偏好
  profile_visibility: 'public' | 'private' | 'friends'
  activity_tracking: boolean
  analytics_tracking: boolean
}

// ==================== 请求和响应类型 ====================

/**
 * 获取设置请求参数
 */
export interface GetSettingsRequest {
  category?: SettingCategory
  group?: string
  access_level?: SettingAccessLevel
  search?: string
  include_encrypted?: boolean
}

/**
 * 设置列表响应
 */
export interface SettingsListResponse extends StandardResponse<Setting[]> {}

/**
 * 设置分组响应
 */
export interface SettingsGroupResponse extends StandardResponse<SettingGroup[]> {}

/**
 * 单个设置响应
 */
export interface SettingDetailResponse extends StandardResponse<Setting> {}

/**
 * 更新设置请求
 */
export interface UpdateSettingRequest {
  value: any
  validate?: boolean
}

/**
 * 批量更新设置请求
 */
export interface BatchUpdateSettingsRequest {
  settings: Record<string, any>
  validate?: boolean
}

/**
 * 设置更新响应
 */
export interface UpdateSettingResponse extends StandardResponse<Setting> {}

/**
 * 批量更新响应
 */
export interface BatchUpdateResponse extends StandardResponse<{
  updated: string[]
  failed: { key: string; error: string }[]
  total: number
}> {}

/**
 * 重置设置请求
 */
export interface ResetSettingsRequest {
  keys?: string[]
  category?: SettingCategory
  confirm: boolean
}

/**
 * 设置导入请求
 */
export interface ImportSettingsRequest {
  settings: Record<string, any>
  overwrite?: boolean
  validate?: boolean
}

/**
 * 设置导出响应
 */
export interface ExportSettingsResponse extends StandardResponse<{
  settings: Record<string, any>
  exported_at: string
  version: string
}> {}

/**
 * 设置验证响应
 */
export interface ValidateSettingResponse extends StandardResponse<{
  valid: boolean
  errors: string[]
  warnings: string[]
}> {}

// ==================== 配置预设类型 ====================

/**
 * 设置预设
 */
export interface SettingsPreset {
  id: string
  name: string
  description?: string
  category: SettingCategory
  settings: Record<string, any>
  is_default: boolean
  created_at: string
  created_by?: string
}

/**
 * 预设列表响应
 */
export interface PresetsListResponse extends StandardResponse<SettingsPreset[]> {}

/**
 * 应用预设请求
 */
export interface ApplyPresetRequest {
  preset_id: string
  overwrite?: boolean
  backup_current?: boolean
}

// ==================== 设置模板类型 ====================

/**
 * 设置模板
 */
export interface SettingTemplate {
  key: string
  name: string
  description?: string
  category: SettingCategory
  type: SettingType
  default_value: any
  validation_rules?: ValidationRule[]
  options?: SettingOption[]
  is_required: boolean
  access_level: SettingAccessLevel
}

/**
 * 模板列表响应
 */
export interface TemplatesListResponse extends StandardResponse<SettingTemplate[]> {}

// ==================== 设置历史类型 ====================

/**
 * 设置变更历史
 */
export interface SettingHistory {
  id: string
  setting_key: string
  old_value: any
  new_value: any
  changed_by: string
  changed_at: string
  ip_address?: string
  user_agent?: string
  reason?: string
}

/**
 * 历史记录响应
 */
export interface SettingHistoryResponse extends StandardResponse<{
  history: SettingHistory[]
  pagination: {
    total: number
    page: number
    limit: number
    total_pages: number
  }
}> {}

// ==================== 导出类型 ====================

export type {
  BaseSetting,
  Setting,
  SettingGroup,
  ValidationRule,
  SettingOption,
  SystemSettings,
  AppearanceSettings,
  NotificationSettings,
  SecuritySettings,
  UserPreferences,
  GetSettingsRequest,
  SettingsListResponse,
  SettingsGroupResponse,
  SettingDetailResponse,
  UpdateSettingRequest,
  BatchUpdateSettingsRequest,
  UpdateSettingResponse,
  BatchUpdateResponse,
  ResetSettingsRequest,
  ImportSettingsRequest,
  ExportSettingsResponse,
  ValidateSettingResponse,
  SettingsPreset,
  PresetsListResponse,
  ApplyPresetRequest,
  SettingTemplate,
  TemplatesListResponse,
  SettingHistory,
  SettingHistoryResponse
}