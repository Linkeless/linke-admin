'use client'

/**
 * 设置查询 Hooks
 * 
 * 基于 React Query 实现的设置数据查询钩子集合
 * 支持系统设置、用户偏好、通知配置等功能
 * 遵循统一的缓存策略和错误处理机制
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { settingsService } from '@/lib/settings-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  SettingCategory,
  SettingAccessLevel,
  Setting,
  SettingGroup,
  SystemSettings,
  AppearanceSettings,
  NotificationSettings,
  SecuritySettings,
  UserPreferences,
  GetSettingsRequest,
  SettingsListResponse,
  SettingsGroupResponse,
  SettingDetailResponse,
  SettingsPreset,
  PresetsListResponse,
  SettingTemplate,
  TemplatesListResponse,
  SettingHistory,
  SettingHistoryResponse
} from '@/lib/settings-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 设置查询参数
 */
export interface UseSettingsParams extends GetSettingsRequest {
  enabled?: boolean
}

/**
 * 设置分组查询参数
 */
export interface UseSettingsGroupsParams {
  category?: SettingCategory
  enabled?: boolean
}

/**
 * 设置详情查询参数
 */
export interface UseSettingParams {
  key: string
  enabled?: boolean
}

/**
 * 设置预设查询参数
 */
export interface UseSettingsPresetsParams {
  category?: SettingCategory
  enabled?: boolean
}

/**
 * 设置历史查询参数
 */
export interface UseSettingHistoryParams {
  key?: string
  page?: number
  limit?: number
  enabled?: boolean
}

// ==================== 基础设置查询 Hooks ====================

/**
 * 获取设置列表
 */
export const useSettings = (params: UseSettingsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'list', queryParams],
    queryFn: () => settingsService.getSettings(queryParams),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: SettingsListResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(setting => ({
              ...setting,
              // 增强设置数据
              displayValue: settingsService.formatSettingDisplayValue(setting),
              categoryDisplayName: settingsService.getCategoryDisplayName(setting.category),
              accessLevelDisplayName: settingsService.getAccessLevelDisplayName(setting.access_level),
              typeDisplayName: settingsService.getTypeDisplayName(setting.type),
              
              // 状态标识
              hasCustomValue: !settingsService.isSettingValueEqual(
                setting.value, 
                setting.default_value, 
                setting.type
              ),
              isEncrypted: setting.is_encrypted,
              isReadonly: setting.is_readonly,
              isRequired: setting.is_required,
              isVisible: setting.is_visible,
              
              // 格式化时间
              formattedCreatedAt: new Date(setting.created_at).toLocaleString(),
              formattedUpdatedAt: new Date(setting.updated_at).toLocaleString(),
              
              // 验证信息
              validationSummary: setting.validation_rules?.map(rule => 
                `${rule.type}${rule.value ? `: ${rule.value}` : ''}`
              ).join(', ') || '无限制'
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取设置分组
 */
export const useSettingsGroups = (params: UseSettingsGroupsParams = {}) => {
  const { category, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'groups', category],
    queryFn: () => settingsService.getSettingsGroups(category),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: SettingsGroupResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(group => ({
              ...group,
              categoryDisplayName: settingsService.getCategoryDisplayName(group.category),
              settingsCount: group.settings?.length || 0,
              
              // 增强设置数据
              enhancedSettings: group.settings?.map(setting => ({
                ...setting,
                displayValue: settingsService.formatSettingDisplayValue(setting),
                categoryDisplayName: settingsService.getCategoryDisplayName(setting.category),
                accessLevelDisplayName: settingsService.getAccessLevelDisplayName(setting.access_level),
                typeDisplayName: settingsService.getTypeDisplayName(setting.type),
                hasCustomValue: !settingsService.isSettingValueEqual(
                  setting.value, 
                  setting.default_value, 
                  setting.type
                )
              })) || [],
              
              // 分组统计
              stats: {
                total: group.settings?.length || 0,
                customized: group.settings?.filter(s => 
                  !settingsService.isSettingValueEqual(s.value, s.default_value, s.type)
                ).length || 0,
                required: group.settings?.filter(s => s.is_required).length || 0,
                encrypted: group.settings?.filter(s => s.is_encrypted).length || 0
              }
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'groups',
          params: { category }
        })
      }
    })
  })
}

/**
 * 获取单个设置详情
 */
export const useSetting = (params: UseSettingParams) => {
  const { key, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'detail', key],
    queryFn: () => settingsService.getSetting(key),
    ...createQueryOptions(DataType.CONFIG, {
      enabled: enabled && !!key,
      select: (data: SettingDetailResponse) => {
        if (data.code === 0 && data.data) {
          const setting = data.data
          return {
            ...data,
            data: {
              ...setting,
              // 增强设置详情数据
              displayValue: settingsService.formatSettingDisplayValue(setting),
              categoryDisplayName: settingsService.getCategoryDisplayName(setting.category),
              accessLevelDisplayName: settingsService.getAccessLevelDisplayName(setting.access_level),
              typeDisplayName: settingsService.getTypeDisplayName(setting.type),
              
              // 状态分析
              hasCustomValue: !settingsService.isSettingValueEqual(
                setting.value, 
                setting.default_value, 
                setting.type
              ),
              defaultDisplayValue: settingsService.formatSettingDisplayValue({
                ...setting,
                value: setting.default_value
              }),
              
              // 验证结果
              validationResult: settingsService.validateSettingValue(setting, setting.value),
              
              // 依赖信息
              dependsOnSettings: setting.depends_on || [],
              hasDependencies: (setting.depends_on || []).length > 0,
              
              // 选项信息
              hasOptions: (setting.options || []).length > 0,
              optionsCount: (setting.options || []).length,
              
              // 格式化时间
              formattedCreatedAt: new Date(setting.created_at).toLocaleString(),
              formattedUpdatedAt: new Date(setting.updated_at).toLocaleString()
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'detail',
          params: { key }
        })
      }
    })
  })
}

// ==================== 分类设置查询 Hooks ====================

/**
 * 获取系统设置
 */
export const useSystemSettings = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'system'],
    queryFn: () => settingsService.getSystemSettings(),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: StandardResponse<SystemSettings>) => {
        if (data.code === 0 && data.data) {
          const settings = data.data
          return {
            ...data,
            data: {
              ...settings,
              // 增强系统设置数据
              formattedMaxFileSize: this.formatFileSize(settings.max_file_size),
              formattedSessionTimeout: this.formatDuration(settings.session_timeout),
              formattedLockoutDuration: this.formatDuration(settings.lockout_duration),
              
              // 状态指示
              isMaintenanceMode: settings.maintenance_mode,
              isDebugMode: settings.debug_mode,
              isRegistrationOpen: settings.registration_enabled,
              
              // 安全评分
              securityScore: this.calculateSecurityScore(settings),
              
              // 配置完整性检查
              mailConfigured: !!(settings.mail_host && settings.mail_port),
              rateLimitConfigured: settings.rate_limit_requests > 0,
              
              // 格式化配置信息
              mailDisplayName: `${settings.mail_driver}://${settings.mail_host}:${settings.mail_port}`,
              storageDisplayName: `${settings.storage_driver} (${settings.storage_path})`,
              cacheDisplayName: `${settings.cache_driver} (TTL: ${settings.cache_ttl}s)`
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'system'
        })
      }
    })
  })
}

/**
 * 获取外观设置
 */
export const useAppearanceSettings = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'appearance'],
    queryFn: () => settingsService.getAppearanceSettings(),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: StandardResponse<AppearanceSettings>) => {
        if (data.code === 0 && data.data) {
          const settings = data.data
          return {
            ...data,
            data: {
              ...settings,
              // 增强外观设置数据
              themeDisplayName: this.getThemeDisplayName(settings.theme),
              fontSizeDisplayName: this.getFontSizeDisplayName(settings.font_size),
              sidebarPositionDisplayName: settings.sidebar_position === 'left' ? '左侧' : '右侧',
              
              // 主题预览
              themePreview: {
                primaryColor: settings.primary_color,
                accentColor: settings.accent_color,
                fontFamily: settings.font_family,
                isDark: settings.theme === 'dark',
                isAuto: settings.theme === 'auto'
              },
              
              // 布局配置状态
              layoutConfig: {
                sidebarCollapsed: settings.sidebar_collapsed,
                headerFixed: settings.header_fixed,
                footerVisible: settings.footer_visible,
                breadcrumbVisible: settings.breadcrumb_visible
              },
              
              // 品牌信息
              brandConfig: {
                hasLogo: !!settings.logo_url,
                hasFavicon: !!settings.favicon_url,
                hasCustomName: !!settings.brand_name,
                hasCustomDescription: !!settings.brand_description
              },
              
              // 自定义样式信息
              customizationInfo: {
                hasCustomCSS: !!settings.custom_css,
                hasCustomJS: !!settings.custom_js,
                customCSSLength: settings.custom_css?.length || 0,
                customJSLength: settings.custom_js?.length || 0
              }
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'appearance'
        })
      }
    })
  })
}

/**
 * 获取通知设置
 */
export const useNotificationSettings = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'notifications'],
    queryFn: () => settingsService.getNotificationSettings(),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: StandardResponse<NotificationSettings>) => {
        if (data.code === 0 && data.data) {
          const settings = data.data
          return {
            ...data,
            data: {
              ...settings,
              // 增强通知设置数据
              frequencyDisplayName: this.getNotificationFrequencyDisplayName(settings.notification_frequency),
              
              // 通知渠道统计
              channelStats: {
                email: settings.email_notifications_enabled,
                browser: settings.browser_notifications_enabled,
                sms: settings.sms_notifications_enabled,
                webhook: settings.webhook_notifications_enabled,
                enabledCount: [
                  settings.email_notifications_enabled,
                  settings.browser_notifications_enabled,
                  settings.sms_notifications_enabled,
                  settings.webhook_notifications_enabled
                ].filter(Boolean).length
              },
              
              // 邮件通知配置
              emailConfig: {
                enabled: settings.email_notifications_enabled,
                eventCount: [
                  settings.email_new_user_registration,
                  settings.email_password_reset,
                  settings.email_payment_received,
                  settings.email_subscription_expired,
                  settings.email_system_alerts
                ].filter(Boolean).length
              },
              
              // 浏览器通知配置
              browserConfig: {
                enabled: settings.browser_notifications_enabled,
                eventCount: [
                  settings.browser_new_messages,
                  settings.browser_system_alerts
                ].filter(Boolean).length
              },
              
              // SMS配置
              smsConfig: {
                enabled: settings.sms_notifications_enabled,
                hasPhoneNumber: !!settings.sms_phone_number,
                formattedPhoneNumber: settings.sms_phone_number || '未设置'
              },
              
              // Webhook配置
              webhookConfig: {
                enabled: settings.webhook_notifications_enabled,
                hasUrl: !!settings.webhook_url,
                hasSecret: !!settings.webhook_secret,
                eventCount: settings.webhook_events?.length || 0,
                eventsDisplay: settings.webhook_events?.join(', ') || '无事件'
              },
              
              // 安静时间配置
              quietHoursConfig: {
                enabled: settings.quiet_hours_enabled,
                hasTimeRange: !!(settings.quiet_hours_start && settings.quiet_hours_end),
                timeRange: settings.quiet_hours_start && settings.quiet_hours_end
                  ? `${settings.quiet_hours_start} - ${settings.quiet_hours_end}`
                  : '未设置'
              }
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'notifications'
        })
      }
    })
  })
}

/**
 * 获取安全设置
 */
export const useSecuritySettings = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'security'],
    queryFn: () => settingsService.getSecuritySettings(),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: StandardResponse<SecuritySettings>) => {
        if (data.code === 0 && data.data) {
          const settings = data.data
          return {
            ...data,
            data: {
              ...settings,
              // 增强安全设置数据
              passwordPolicyScore: this.calculatePasswordPolicyScore(settings.password_policy),
              passwordPolicyText: this.formatPasswordPolicy(settings.password_policy),
              
              // 认证配置
              authConfig: {
                emailVerificationRequired: settings.require_email_verification,
                socialLoginEnabled: settings.allow_social_login,
                socialProviderCount: settings.social_providers?.length || 0,
                socialProvidersDisplay: settings.social_providers?.join(', ') || '无'
              },
              
              // IP控制配置
              ipControlConfig: {
                whitelistEnabled: settings.ip_whitelist_enabled,
                whitelistCount: settings.ip_whitelist?.length || 0,
                blacklistCount: settings.ip_blacklist?.length || 0,
                hasIpRestrictions: settings.ip_whitelist_enabled && (settings.ip_whitelist?.length || 0) > 0
              },
              
              // 会话管理配置
              sessionConfig: {
                lifetime: this.formatDuration(settings.session_lifetime),
                concurrentLimit: settings.concurrent_sessions_limit,
                autoLogoutEnabled: settings.auto_logout_enabled,
                autoLogoutTime: settings.auto_logout_enabled 
                  ? this.formatDuration(settings.auto_logout_time)
                  : '未启用'
              },
              
              // 审计日志配置
              auditConfig: {
                enabled: settings.audit_log_enabled,
                retentionDays: settings.audit_log_retention_days,
                eventCount: settings.audit_log_events?.length || 0,
                eventsDisplay: settings.audit_log_events?.join(', ') || '无事件'
              },
              
              // 安全功能状态
              securityFeatures: {
                headers: settings.security_headers_enabled,
                csrf: settings.csrf_protection_enabled,
                xss: settings.xss_protection_enabled,
                enabledCount: [
                  settings.security_headers_enabled,
                  settings.csrf_protection_enabled,
                  settings.xss_protection_enabled
                ].filter(Boolean).length
              },
              
              // 整体安全评分
              overallSecurityScore: this.calculateOverallSecurityScore(settings)
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'security'
        })
      }
    })
  })
}

/**
 * 获取用户偏好设置
 */
export const useUserPreferences = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'preferences'],
    queryFn: () => settingsService.getUserPreferences(),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: StandardResponse<UserPreferences>) => {
        if (data.code === 0 && data.data) {
          const preferences = data.data
          return {
            ...data,
            data: {
              ...preferences,
              // 增强用户偏好数据
              themeDisplayName: this.getThemeDisplayName(preferences.theme),
              languageDisplayName: this.getLanguageDisplayName(preferences.language),
              timezoneDisplayName: preferences.timezone,
              timeFormatDisplayName: preferences.time_format === '12h' ? '12小时制' : '24小时制',
              
              // 界面配置摘要
              interfaceConfig: {
                theme: preferences.theme,
                language: preferences.language,
                timezone: preferences.timezone,
                sidebarCollapsed: preferences.sidebar_collapsed,
                showTooltips: preferences.show_tooltips
              },
              
              // 显示配置摘要
              displayConfig: {
                itemsPerPage: preferences.items_per_page,
                defaultDashboard: preferences.default_dashboard,
                dateFormat: preferences.date_format,
                timeFormat: preferences.time_format
              },
              
              // 通知配置摘要
              notificationConfig: {
                email: preferences.email_notifications,
                browser: preferences.browser_notifications,
                sound: preferences.notification_sound,
                enabledCount: [
                  preferences.email_notifications,
                  preferences.browser_notifications,
                  preferences.notification_sound
                ].filter(Boolean).length
              },
              
              // 隐私配置摘要
              privacyConfig: {
                profileVisibility: preferences.profile_visibility,
                activityTracking: preferences.activity_tracking,
                analyticsTracking: preferences.analytics_tracking,
                privacyScore: this.calculatePrivacyScore(preferences)
              },
              
              // 配置完整性
              completeness: this.calculatePreferencesCompleteness(preferences)
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'preferences'
        })
      }
    })
  })
}

// ==================== 设置管理查询 Hooks ====================

/**
 * 获取设置预设列表
 */
export const useSettingsPresets = (params: UseSettingsPresetsParams = {}) => {
  const { category, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'presets', category],
    queryFn: () => settingsService.getSettingsPresets(category),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: PresetsListResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(preset => ({
              ...preset,
              // 增强预设数据
              categoryDisplayName: settingsService.getCategoryDisplayName(preset.category),
              settingsCount: Object.keys(preset.settings).length,
              formattedCreatedAt: new Date(preset.created_at).toLocaleDateString(),
              createdByDisplay: preset.created_by || '系统',
              
              // 预设摘要
              settingsSummary: Object.keys(preset.settings).slice(0, 3).join(', ') +
                (Object.keys(preset.settings).length > 3 ? ` 等${Object.keys(preset.settings).length}项` : ''),
              
              // 状态指示
              isSystemPreset: !preset.created_by,
              canDelete: !!preset.created_by // 只有用户创建的预设可以删除
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'presets',
          params: { category }
        })
      }
    })
  })
}

/**
 * 获取设置模板
 */
export const useSettingTemplates = (params: { category?: SettingCategory; enabled?: boolean } = {}) => {
  const { category, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'templates', category],
    queryFn: () => settingsService.getSettingTemplates(category),
    ...createQueryOptions(DataType.CONFIG, {
      enabled,
      select: (data: TemplatesListResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(template => ({
              ...template,
              // 增强模板数据
              categoryDisplayName: settingsService.getCategoryDisplayName(template.category),
              typeDisplayName: settingsService.getTypeDisplayName(template.type),
              accessLevelDisplayName: settingsService.getAccessLevelDisplayName(template.access_level),
              
              // 验证规则摘要
              validationSummary: template.validation_rules?.map(rule => 
                `${rule.type}${rule.value ? `: ${rule.value}` : ''}`
              ).join(', ') || '无限制',
              
              // 选项信息
              optionsCount: template.options?.length || 0,
              hasOptions: (template.options || []).length > 0,
              
              // 状态标识
              isRequired: template.is_required,
              hasValidation: (template.validation_rules || []).length > 0,
              
              // 默认值显示
              defaultValueDisplay: settingsService.formatSettingDisplayValue({
                ...template,
                value: template.default_value
              } as Setting)
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'templates',
          params: { category }
        })
      }
    })
  })
}

/**
 * 获取设置变更历史
 */
export const useSettingHistory = (params: UseSettingHistoryParams = {}) => {
  const { key, page = 1, limit = 20, enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.cache.all, 'settings', 'history', key, { page, limit }],
    queryFn: () => settingsService.getSettingHistory(key, page, limit),
    ...createQueryOptions(DataType.LIST, {
      enabled,
      select: (data: SettingHistoryResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              history: data.data.history.map(record => ({
                ...record,
                // 增强历史记录数据
                formattedChangedAt: new Date(record.changed_at).toLocaleString(),
                
                // 值变更摘要
                changeSummary: this.formatValueChange(record.old_value, record.new_value),
                changeType: this.getChangeType(record.old_value, record.new_value),
                
                // 用户信息
                changedByDisplay: record.changed_by || '系统',
                
                // 设备信息
                deviceInfo: record.user_agent ? this.parseUserAgent(record.user_agent) : null,
                locationInfo: record.ip_address || '未知',
                
                // 变更原因
                reasonDisplay: record.reason || '常规更新',
                hasReason: !!record.reason
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'settings',
          operation: 'history',
          params: { key, page, limit }
        })
      }
    })
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取指定类别的设置
 */
export const useSettingsByCategory = (category: SettingCategory, enabled?: boolean) => {
  return useSettings({ category, enabled })
}

/**
 * 获取需要注意的设置（有警告或错误的设置）
 */
export const useSettingsWithIssues = (enabled?: boolean) => {
  const settings = useSettings({ enabled })
  
  return {
    ...settings,
    data: settings.data ? {
      ...settings.data,
      data: settings.data.data.filter(setting => {
        const validation = settingsService.validateSettingValue(setting, setting.value)
        return !validation.valid || setting.is_required && !setting.value
      })
    } : undefined
  }
}

/**
 * 获取自定义值的设置
 */
export const useCustomizedSettings = (enabled?: boolean) => {
  const settings = useSettings({ enabled })
  
  return {
    ...settings,
    data: settings.data ? {
      ...settings.data,
      data: settings.data.data.filter(setting => 
        !settingsService.isSettingValueEqual(setting.value, setting.default_value, setting.type)
      )
    } : undefined
  }
}

/**
 * 获取必填但未设置的设置项
 */
export const useRequiredUnsetSettings = (enabled?: boolean) => {
  const settings = useSettings({ enabled })
  
  return {
    ...settings,
    data: settings.data ? {
      ...settings.data,
      data: settings.data.data.filter(setting => 
        setting.is_required && (setting.value === null || setting.value === undefined || setting.value === '')
      )
    } : undefined
  }
}

// ==================== 工具函数 ====================

/**
 * 设置查询相关的工具函数
 */
export const settingsQueryUtils = {
  /**
   * 格式化文件大小
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  },

  /**
   * 格式化持续时间
   */
  formatDuration: (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
    return `${Math.floor(seconds / 86400)}天`
  },

  /**
   * 计算安全评分
   */
  calculateSecurityScore: (settings: SystemSettings): number => {
    let score = 0
    if (!settings.debug_mode) score += 20
    if (settings.two_factor_enabled) score += 20
    if (settings.password_min_length >= 8) score += 20
    if (settings.failed_login_attempts <= 5) score += 20
    if (settings.session_timeout <= 3600) score += 20
    return score
  },

  /**
   * 获取主题显示名称
   */
  getThemeDisplayName: (theme: string): string => {
    const names = {
      light: '浅色主题',
      dark: '深色主题',
      auto: '跟随系统'
    }
    return names[theme as keyof typeof names] || theme
  },

  /**
   * 获取字体大小显示名称
   */
  getFontSizeDisplayName: (size: string): string => {
    const names = {
      small: '小',
      medium: '中',
      large: '大'
    }
    return names[size as keyof typeof names] || size
  },

  /**
   * 获取通知频率显示名称
   */
  getNotificationFrequencyDisplayName: (frequency: string): string => {
    const names = {
      immediate: '立即',
      hourly: '每小时',
      daily: '每天',
      weekly: '每周'
    }
    return names[frequency as keyof typeof names] || frequency
  },

  /**
   * 计算密码策略评分
   */
  calculatePasswordPolicyScore: (policy: any): number => {
    let score = 0
    if (policy.min_length >= 8) score += 25
    if (policy.require_uppercase) score += 15
    if (policy.require_lowercase) score += 15
    if (policy.require_numbers) score += 15
    if (policy.require_symbols) score += 15
    if (policy.prevent_reuse > 0) score += 10
    if (policy.expiry_days && policy.expiry_days <= 90) score += 5
    return score
  },

  /**
   * 格式化密码策略
   */
  formatPasswordPolicy: (policy: any): string => {
    const requirements = []
    requirements.push(`最少${policy.min_length}个字符`)
    if (policy.require_uppercase) requirements.push('包含大写字母')
    if (policy.require_lowercase) requirements.push('包含小写字母')
    if (policy.require_numbers) requirements.push('包含数字')
    if (policy.require_symbols) requirements.push('包含特殊符号')
    return requirements.join('、')
  },

  /**
   * 计算整体安全评分
   */
  calculateOverallSecurityScore: (settings: SecuritySettings): number => {
    let score = 0
    
    // 认证安全 (30分)
    if (settings.require_email_verification) score += 10
    if (settings.password_policy.min_length >= 8) score += 10
    if (settings.password_policy.require_uppercase && 
        settings.password_policy.require_numbers) score += 10
    
    // 访问控制 (30分)
    if (settings.ip_whitelist_enabled) score += 15
    if (settings.concurrent_sessions_limit <= 3) score += 15
    
    // 审计和监控 (20分)
    if (settings.audit_log_enabled) score += 20
    
    // 安全功能 (20分)
    if (settings.security_headers_enabled) score += 7
    if (settings.csrf_protection_enabled) score += 7
    if (settings.xss_protection_enabled) score += 6
    
    return score
  },

  /**
   * 获取语言显示名称
   */
  getLanguageDisplayName: (language: string): string => {
    const names = {
      'zh-CN': '简体中文',
      'zh-TW': '繁体中文',
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'ja-JP': '日本語',
      'ko-KR': '한국어'
    }
    return names[language as keyof typeof names] || language
  },

  /**
   * 计算隐私评分
   */
  calculatePrivacyScore: (preferences: UserPreferences): number => {
    let score = 100
    if (preferences.activity_tracking) score -= 20
    if (preferences.analytics_tracking) score -= 20
    if (preferences.profile_visibility === 'public') score -= 10
    return Math.max(0, score)
  },

  /**
   * 计算偏好设置完整度
   */
  calculatePreferencesCompleteness: (preferences: UserPreferences): number => {
    const fields = [
      'theme', 'language', 'timezone', 'date_format', 'time_format',
      'items_per_page', 'default_dashboard'
    ]
    const completed = fields.filter(field => 
      preferences[field as keyof UserPreferences] !== null && 
      preferences[field as keyof UserPreferences] !== undefined &&
      preferences[field as keyof UserPreferences] !== ''
    ).length
    return Math.round((completed / fields.length) * 100)
  },

  /**
   * 格式化值变更
   */
  formatValueChange: (oldValue: any, newValue: any): string => {
    const formatValue = (value: any) => {
      if (value === null || value === undefined) return '空'
      if (typeof value === 'boolean') return value ? '是' : '否'
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }
    
    return `${formatValue(oldValue)} → ${formatValue(newValue)}`
  },

  /**
   * 获取变更类型
   */
  getChangeType: (oldValue: any, newValue: any): string => {
    if (oldValue === null || oldValue === undefined) return 'create'
    if (newValue === null || newValue === undefined) return 'delete'
    return 'update'
  },

  /**
   * 解析用户代理
   */
  parseUserAgent: (userAgent: string) => {
    // 简单的用户代理解析
    return {
      browser: userAgent.includes('Chrome') ? 'Chrome' : 
               userAgent.includes('Firefox') ? 'Firefox' : 
               userAgent.includes('Safari') ? 'Safari' : 'Unknown',
      os: userAgent.includes('Windows') ? 'Windows' :
          userAgent.includes('Mac') ? 'macOS' :
          userAgent.includes('Linux') ? 'Linux' : 'Unknown'
    }
  }
}

// 将工具函数方法绑定到全局作用域
const self = settingsQueryUtils

// ==================== 默认导出 ====================

export default {
  // 基础查询
  useSettings,
  useSettingsGroups,
  useSetting,
  
  // 分类设置
  useSystemSettings,
  useAppearanceSettings,
  useNotificationSettings,
  useSecuritySettings,
  useUserPreferences,
  
  // 管理功能
  useSettingsPresets,
  useSettingTemplates,
  useSettingHistory,
  
  // 条件查询
  useSettingsByCategory,
  useSettingsWithIssues,
  useCustomizedSettings,
  useRequiredUnsetSettings,
  
  // 工具函数
  settingsQueryUtils
}