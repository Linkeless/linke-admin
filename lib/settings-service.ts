/**
 * 设置管理API服务层
 * 实现所有设置相关接口的调用和数据处理
 */

import { api } from './api'
import {
  SettingCategory,
  SettingType,
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
  SettingHistoryResponse,
  ValidationRule
} from './settings-types'
import { StandardResponse } from './types'

/**
 * 设置管理服务
 */
export class SettingsService {
  private static readonly BASE_PATH = '/admin/settings'

  // ===========================================
  // 设置读取相关API (8个)
  // ===========================================

  /**
   * 获取设置列表
   */
  static async getSettings(params?: GetSettingsRequest): Promise<SettingsListResponse> {
    return api.get(`${this.BASE_PATH}`, params)
  }

  /**
   * 获取分组设置
   */
  static async getSettingsGroups(category?: SettingCategory): Promise<SettingsGroupResponse> {
    const params = category ? { category } : undefined
    return api.get(`${this.BASE_PATH}/groups`, params)
  }

  /**
   * 获取单个设置详情
   */
  static async getSetting(key: string): Promise<SettingDetailResponse> {
    return api.get(`${this.BASE_PATH}/${encodeURIComponent(key)}`)
  }

  /**
   * 获取系统设置
   */
  static async getSystemSettings(): Promise<StandardResponse<SystemSettings>> {
    return api.get(`${this.BASE_PATH}/system`)
  }

  /**
   * 获取外观设置
   */
  static async getAppearanceSettings(): Promise<StandardResponse<AppearanceSettings>> {
    return api.get(`${this.BASE_PATH}/appearance`)
  }

  /**
   * 获取通知设置
   */
  static async getNotificationSettings(): Promise<StandardResponse<NotificationSettings>> {
    return api.get(`${this.BASE_PATH}/notifications`)
  }

  /**
   * 获取安全设置
   */
  static async getSecuritySettings(): Promise<StandardResponse<SecuritySettings>> {
    return api.get(`${this.BASE_PATH}/security`)
  }

  /**
   * 获取用户偏好设置
   */
  static async getUserPreferences(): Promise<StandardResponse<UserPreferences>> {
    return api.get(`${this.BASE_PATH}/preferences`)
  }

  // ===========================================
  // 设置更新相关API (6个)
  // ===========================================

  /**
   * 更新单个设置
   */
  static async updateSetting(
    key: string, 
    request: UpdateSettingRequest
  ): Promise<UpdateSettingResponse> {
    return api.put(`${this.BASE_PATH}/${encodeURIComponent(key)}`, request)
  }

  /**
   * 批量更新设置
   */
  static async batchUpdateSettings(request: BatchUpdateSettingsRequest): Promise<BatchUpdateResponse> {
    return api.put(`${this.BASE_PATH}/batch`, request)
  }

  /**
   * 更新系统设置
   */
  static async updateSystemSettings(settings: Partial<SystemSettings>): Promise<StandardResponse<SystemSettings>> {
    return api.put(`${this.BASE_PATH}/system`, settings)
  }

  /**
   * 更新外观设置
   */
  static async updateAppearanceSettings(settings: Partial<AppearanceSettings>): Promise<StandardResponse<AppearanceSettings>> {
    return api.put(`${this.BASE_PATH}/appearance`, settings)
  }

  /**
   * 更新通知设置
   */
  static async updateNotificationSettings(settings: Partial<NotificationSettings>): Promise<StandardResponse<NotificationSettings>> {
    return api.put(`${this.BASE_PATH}/notifications`, settings)
  }

  /**
   * 更新用户偏好设置
   */
  static async updateUserPreferences(preferences: Partial<UserPreferences>): Promise<StandardResponse<UserPreferences>> {
    return api.put(`${this.BASE_PATH}/preferences`, preferences)
  }

  // ===========================================
  // 设置管理相关API (7个)
  // ===========================================

  /**
   * 重置设置到默认值
   */
  static async resetSettings(request: ResetSettingsRequest): Promise<StandardResponse<{ reset_count: number }>> {
    return api.post(`${this.BASE_PATH}/reset`, request)
  }

  /**
   * 验证设置值
   */
  static async validateSetting(key: string, value: any): Promise<ValidateSettingResponse> {
    return api.post(`${this.BASE_PATH}/validate`, { key, value })
  }

  /**
   * 导入设置
   */
  static async importSettings(request: ImportSettingsRequest): Promise<BatchUpdateResponse> {
    return api.post(`${this.BASE_PATH}/import`, request)
  }

  /**
   * 导出设置
   */
  static async exportSettings(category?: SettingCategory): Promise<ExportSettingsResponse> {
    const params = category ? { category } : undefined
    return api.get(`${this.BASE_PATH}/export`, params)
  }

  /**
   * 获取设置模板
   */
  static async getSettingTemplates(category?: SettingCategory): Promise<TemplatesListResponse> {
    const params = category ? { category } : undefined
    return api.get(`${this.BASE_PATH}/templates`, params)
  }

  /**
   * 获取设置变更历史
   */
  static async getSettingHistory(
    key?: string, 
    page: number = 1, 
    limit: number = 20
  ): Promise<SettingHistoryResponse> {
    const params = { page, limit, ...(key && { key }) }
    return api.get(`${this.BASE_PATH}/history`, params)
  }

  /**
   * 清除设置缓存
   */
  static async clearSettingsCache(): Promise<StandardResponse<{ success: boolean; message: string }>> {
    return api.delete(`${this.BASE_PATH}/cache`)
  }

  // ===========================================
  // 预设管理相关API (5个)
  // ===========================================

  /**
   * 获取设置预设列表
   */
  static async getSettingsPresets(category?: SettingCategory): Promise<PresetsListResponse> {
    const params = category ? { category } : undefined
    return api.get(`${this.BASE_PATH}/presets`, params)
  }

  /**
   * 创建设置预设
   */
  static async createSettingsPreset(preset: Omit<SettingsPreset, 'id' | 'created_at'>): Promise<StandardResponse<SettingsPreset>> {
    return api.post(`${this.BASE_PATH}/presets`, preset)
  }

  /**
   * 应用设置预设
   */
  static async applySettingsPreset(request: ApplyPresetRequest): Promise<BatchUpdateResponse> {
    return api.post(`${this.BASE_PATH}/presets/apply`, request)
  }

  /**
   * 删除设置预设
   */
  static async deleteSettingsPreset(presetId: string): Promise<StandardResponse<void>> {
    return api.delete(`${this.BASE_PATH}/presets/${presetId}`)
  }

  /**
   * 从当前设置创建预设
   */
  static async createPresetFromCurrent(
    name: string, 
    description?: string, 
    category?: SettingCategory
  ): Promise<StandardResponse<SettingsPreset>> {
    return api.post(`${this.BASE_PATH}/presets/from-current`, {
      name,
      description,
      category
    })
  }

  // ===========================================
  // 辅助方法
  // ===========================================

  /**
   * 验证设置值格式
   */
  static validateSettingValue(setting: Setting, value: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // 检查是否必填
    if (setting.is_required && (value === null || value === undefined || value === '')) {
      errors.push('此设置项为必填项')
    }

    // 检查类型
    if (value !== null && value !== undefined) {
      if (!this.validateSettingType(setting.type, value)) {
        errors.push(`值类型不匹配，期望 ${setting.type} 类型`)
      }
    }

    // 检查验证规则
    if (setting.validation_rules) {
      for (const rule of setting.validation_rules) {
        const ruleError = this.validateRule(rule, value)
        if (ruleError) {
          errors.push(ruleError)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * 验证设置类型
   */
  private static validateSettingType(type: SettingType, value: any): boolean {
    switch (type) {
      case SettingType.STRING:
        return typeof value === 'string'
      case SettingType.NUMBER:
        return typeof value === 'number' && !isNaN(value)
      case SettingType.BOOLEAN:
        return typeof value === 'boolean'
      case SettingType.JSON:
        try {
          if (typeof value === 'string') {
            JSON.parse(value)
          }
          return true
        } catch {
          return false
        }
      case SettingType.ARRAY:
        return Array.isArray(value)
      case SettingType.FILE:
        return typeof value === 'string' || value instanceof File
      default:
        return true
    }
  }

  /**
   * 验证规则
   */
  private static validateRule(rule: ValidationRule, value: any): string | null {
    switch (rule.type) {
      case 'required':
        if (value === null || value === undefined || value === '') {
          return rule.message || '此字段为必填项'
        }
        break
      
      case 'min':
        if (typeof value === 'number' && value < rule.value) {
          return rule.message || `值不能小于 ${rule.value}`
        }
        if (typeof value === 'string' && value.length < rule.value) {
          return rule.message || `长度不能少于 ${rule.value} 个字符`
        }
        break
      
      case 'max':
        if (typeof value === 'number' && value > rule.value) {
          return rule.message || `值不能大于 ${rule.value}`
        }
        if (typeof value === 'string' && value.length > rule.value) {
          return rule.message || `长度不能超过 ${rule.value} 个字符`
        }
        break
      
      case 'pattern':
        if (typeof value === 'string' && rule.value) {
          const regex = new RegExp(rule.value)
          if (!regex.test(value)) {
            return rule.message || '格式不正确'
          }
        }
        break
      
      case 'enum':
        if (Array.isArray(rule.value) && !rule.value.includes(value)) {
          return rule.message || `值必须是以下之一: ${rule.value.join(', ')}`
        }
        break
    }
    
    return null
  }

  /**
   * 格式化设置显示值
   */
  static formatSettingDisplayValue(setting: Setting): string {
    if (setting.value === null || setting.value === undefined) {
      return '未设置'
    }

    switch (setting.type) {
      case SettingType.BOOLEAN:
        return setting.value ? '是' : '否'
      
      case SettingType.JSON:
        try {
          return JSON.stringify(setting.value, null, 2)
        } catch {
          return String(setting.value)
        }
      
      case SettingType.ARRAY:
        if (Array.isArray(setting.value)) {
          return setting.value.join(', ')
        }
        return String(setting.value)
      
      case SettingType.FILE:
        if (typeof setting.value === 'string' && setting.value.startsWith('http')) {
          return '文件已上传'
        }
        return String(setting.value)
      
      default:
        return String(setting.value)
    }
  }

  /**
   * 获取设置类别显示名称
   */
  static getCategoryDisplayName(category: SettingCategory): string {
    const displayNames = {
      [SettingCategory.SYSTEM]: '系统设置',
      [SettingCategory.APPEARANCE]: '外观设置',
      [SettingCategory.NOTIFICATION]: '通知设置',
      [SettingCategory.SECURITY]: '安全设置',
      [SettingCategory.INTEGRATION]: '集成设置',
      [SettingCategory.BILLING]: '账单设置',
      [SettingCategory.BACKUP]: '备份设置'
    }
    return displayNames[category] || category
  }

  /**
   * 获取访问级别显示名称
   */
  static getAccessLevelDisplayName(level: SettingAccessLevel): string {
    const displayNames = {
      [SettingAccessLevel.PUBLIC]: '公开',
      [SettingAccessLevel.USER]: '用户',
      [SettingAccessLevel.ADMIN]: '管理员',
      [SettingAccessLevel.SYSTEM]: '系统'
    }
    return displayNames[level] || level
  }

  /**
   * 获取设置类型显示名称
   */
  static getTypeDisplayName(type: SettingType): string {
    const displayNames = {
      [SettingType.STRING]: '文本',
      [SettingType.NUMBER]: '数字',
      [SettingType.BOOLEAN]: '布尔值',
      [SettingType.JSON]: 'JSON',
      [SettingType.ARRAY]: '数组',
      [SettingType.FILE]: '文件'
    }
    return displayNames[type] || type
  }

  /**
   * 检查设置是否可编辑
   */
  static canEditSetting(setting: Setting, userRole: string): boolean {
    if (setting.is_readonly) {
      return false
    }

    switch (setting.access_level) {
      case SettingAccessLevel.PUBLIC:
        return true
      case SettingAccessLevel.USER:
        return ['user', 'admin', 'system'].includes(userRole)
      case SettingAccessLevel.ADMIN:
        return ['admin', 'system'].includes(userRole)
      case SettingAccessLevel.SYSTEM:
        return userRole === 'system'
      default:
        return false
    }
  }

  /**
   * 获取设置默认值
   */
  static getDefaultValue(setting: Setting): any {
    if (setting.default_value !== undefined) {
      return setting.default_value
    }

    // 根据类型返回默认值
    switch (setting.type) {
      case SettingType.STRING:
        return ''
      case SettingType.NUMBER:
        return 0
      case SettingType.BOOLEAN:
        return false
      case SettingType.JSON:
        return {}
      case SettingType.ARRAY:
        return []
      case SettingType.FILE:
        return null
      default:
        return null
    }
  }

  /**
   * 比较设置值是否相等
   */
  static isSettingValueEqual(value1: any, value2: any, type: SettingType): boolean {
    if (value1 === value2) {
      return true
    }

    switch (type) {
      case SettingType.JSON:
        try {
          return JSON.stringify(value1) === JSON.stringify(value2)
        } catch {
          return false
        }
      
      case SettingType.ARRAY:
        if (!Array.isArray(value1) || !Array.isArray(value2)) {
          return false
        }
        if (value1.length !== value2.length) {
          return false
        }
        return value1.every((item, index) => item === value2[index])
      
      default:
        return false
    }
  }

  /**
   * 创建设置备份
   */
  static createSettingsBackup(settings: Setting[]): Record<string, any> {
    const backup: Record<string, any> = {}
    
    settings.forEach(setting => {
      backup[setting.key] = {
        value: setting.value,
        updated_at: setting.updated_at
      }
    })

    return {
      settings: backup,
      created_at: new Date().toISOString(),
      version: '1.0'
    }
  }
}

// 导出默认实例
export const settingsService = SettingsService
export default settingsService