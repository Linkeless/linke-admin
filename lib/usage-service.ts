import { api } from './api';
import {
  UsageData,
  UsageHistory,
  UsageSummary,
  UsageStatistics,
  UsageTrend,
  UsagePrediction,
  RealtimeUsage,
  TopUsageItem,
  Alert,
  AlertConfig,
  AlertHistory,
  AlertStatistics,
  ExportRequest,
  ExportResult,
  CleanupRequest,
  CleanupResult,
  SyncRequest,
  SyncResult,
  ApiResponse,
  PaginatedResponse,
  PaginationParams,
  FilterParams,
  UsageType,
  AlertConfigFormData,
  TestNotificationData
} from './usage-types';

export class UsageService {
  private static readonly BASE_PATH = '/usage';

  // ===========================================
  // 使用量数据相关API (10个)
  // ===========================================

  /**
   * 获取当前使用量
   */
  static async getCurrentUsage(subscriptionId: string): Promise<ApiResponse<UsageData[]>> {
    return api.get(`${this.BASE_PATH}/current/${subscriptionId}`);
  }

  /**
   * 获取特定类型的当前使用量
   */
  static async getCurrentUsageByType(
    subscriptionId: string, 
    usageType: UsageType
  ): Promise<ApiResponse<UsageData>> {
    return api.get(`${this.BASE_PATH}/current/${subscriptionId}/${usageType}`);
  }

  /**
   * 获取使用量历史
   */
  static async getUsageHistory(
    subscriptionId: string, 
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<UsageHistory>> {
    return api.get(`${this.BASE_PATH}/history/${subscriptionId}`, params);
  }

  /**
   * 获取使用量摘要
   */
  static async getUsageSummary(subscriptionId: string): Promise<ApiResponse<UsageSummary>> {
    return api.get(`${this.BASE_PATH}/summary/${subscriptionId}`);
  }

  /**
   * 获取使用量统计
   */
  static async getUsageStatistics(
    subscriptionId: string,
    params?: FilterParams
  ): Promise<ApiResponse<UsageStatistics>> {
    return api.get(`${this.BASE_PATH}/statistics/${subscriptionId}`, params);
  }

  /**
   * 获取使用量趋势
   */
  static async getUsageTrends(
    subscriptionId: string,
    params?: FilterParams
  ): Promise<ApiResponse<UsageTrend[]>> {
    return api.get(`${this.BASE_PATH}/trends/${subscriptionId}`, params);
  }

  /**
   * 获取使用量预测
   */
  static async getUsagePredictions(subscriptionId: string): Promise<ApiResponse<UsagePrediction[]>> {
    return api.get(`${this.BASE_PATH}/predictions/${subscriptionId}`);
  }

  /**
   * 获取特定类型的使用量预测
   */
  static async getUsagePredictionByType(
    subscriptionId: string,
    usageType: UsageType
  ): Promise<ApiResponse<UsagePrediction>> {
    return api.get(`${this.BASE_PATH}/predictions/${subscriptionId}/${usageType}`);
  }

  /**
   * 获取实时使用量
   */
  static async getRealtimeUsage(subscriptionId: string): Promise<ApiResponse<RealtimeUsage[]>> {
    return api.get(`${this.BASE_PATH}/realtime/${subscriptionId}`);
  }

  /**
   * 获取使用量排行榜
   */
  static async getTopUsage(params?: FilterParams & PaginationParams): Promise<PaginatedResponse<TopUsageItem>> {
    return api.get(`${this.BASE_PATH}/top`, params);
  }

  /**
   * 导出使用量数据
   */
  static async exportUsageData(request: ExportRequest): Promise<ApiResponse<ExportResult>> {
    return api.post(`${this.BASE_PATH}/export`, request);
  }

  // ===========================================
  // 告警管理相关API (12个)
  // ===========================================

  /**
   * 获取订阅的告警列表
   */
  static async getAlerts(
    subscriptionId: string,
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<Alert>> {
    return api.get(`${this.BASE_PATH}/alerts/${subscriptionId}`, params);
  }

  /**
   * 确认告警
   */
  static async acknowledgeAlert(alertId: string, notes?: string): Promise<ApiResponse<Alert>> {
    return api.post(`${this.BASE_PATH}/alerts/${alertId}/acknowledge`, { notes });
  }

  /**
   * 解决告警
   */
  static async resolveAlert(alertId: string, notes?: string): Promise<ApiResponse<Alert>> {
    return api.post(`${this.BASE_PATH}/alerts/${alertId}/resolve`, { notes });
  }

  /**
   * 抑制告警
   */
  static async suppressAlert(
    alertId: string, 
    suppressUntil: string, 
    notes?: string
  ): Promise<ApiResponse<Alert>> {
    return api.post(`${this.BASE_PATH}/alerts/${alertId}/suppress`, { 
      suppress_until: suppressUntil, 
      notes 
    });
  }

  /**
   * 批量解决告警
   */
  static async bulkResolveAlerts(
    alertIds: string[], 
    notes?: string
  ): Promise<ApiResponse<{ resolved_count: number; failed_alerts: string[] }>> {
    return api.post(`${this.BASE_PATH}/alerts/bulk-resolve`, { 
      alert_ids: alertIds, 
      notes 
    });
  }

  /**
   * 获取告警配置列表
   */
  static async getAlertConfigs(params?: PaginationParams & FilterParams): Promise<PaginatedResponse<AlertConfig>> {
    return api.get(`${this.BASE_PATH}/alerts/configs`, params);
  }

  /**
   * 获取特定告警配置
   */
  static async getAlertConfig(configId: string): Promise<ApiResponse<AlertConfig>> {
    return api.get(`${this.BASE_PATH}/alerts/configs/${configId}`);
  }

  /**
   * 创建告警配置
   */
  static async createAlertConfig(
    subscriptionId: string, 
    config: AlertConfigFormData
  ): Promise<ApiResponse<AlertConfig>> {
    return api.post(`${this.BASE_PATH}/alerts/configs/${subscriptionId}`, config);
  }

  /**
   * 更新告警配置
   */
  static async updateAlertConfig(
    configId: string, 
    config: Partial<AlertConfigFormData>
  ): Promise<ApiResponse<AlertConfig>> {
    return api.put(`${this.BASE_PATH}/alerts/configs/${configId}`, config);
  }

  /**
   * 删除告警配置
   */
  static async deleteAlertConfig(configId: string): Promise<ApiResponse<void>> {
    return api.delete(`${this.BASE_PATH}/alerts/configs/${configId}`);
  }

  /**
   * 获取告警历史
   */
  static async getAlertHistory(
    subscriptionId: string,
    params?: PaginationParams & FilterParams
  ): Promise<PaginatedResponse<AlertHistory>> {
    return api.get(`${this.BASE_PATH}/alerts/history/${subscriptionId}`, params);
  }

  /**
   * 获取告警统计
   */
  static async getAlertStatistics(
    subscriptionId: string,
    params?: FilterParams
  ): Promise<ApiResponse<AlertStatistics>> {
    return api.get(`${this.BASE_PATH}/alerts/statistics/${subscriptionId}`, params);
  }

  /**
   * 测试通知
   */
  static async testNotification(data: TestNotificationData): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return api.post(`${this.BASE_PATH}/alerts/test-notification`, data);
  }

  // ===========================================
  // 管理功能相关API (3个)
  // ===========================================

  /**
   * 管理员数据清理
   */
  static async adminCleanup(request: CleanupRequest): Promise<ApiResponse<CleanupResult>> {
    return api.post(`${this.BASE_PATH}/admin/cleanup`, request);
  }

  /**
   * 重置订阅使用量
   */
  static async resetSubscriptionUsage(subscriptionId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    return api.post(`${this.BASE_PATH}/admin/reset/${subscriptionId}`);
  }

  /**
   * 同步订阅使用量
   */
  static async syncSubscriptionUsage(
    subscriptionId: string, 
    request?: SyncRequest
  ): Promise<ApiResponse<SyncResult>> {
    return api.post(`${this.BASE_PATH}/admin/sync/${subscriptionId}`, request);
  }

  // ===========================================
  // 辅助方法
  // ===========================================

  /**
   * 获取使用量状态颜色
   */
  static getUsageStatusColor(percentage: number): string {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 75) return 'orange';
    if (percentage >= 50) return 'yellow';
    return 'green';
  }

  /**
   * 格式化使用量显示
   */
  static formatUsage(usage: number, usageType: UsageType): string {
    switch (usageType) {
      case UsageType.BANDWIDTH:
      case UsageType.STORAGE:
      case UsageType.TRANSFER:
        return this.formatBytes(usage);
      case UsageType.CPU_TIME:
        return this.formatDuration(usage);
      case UsageType.MEMORY:
        return this.formatBytes(usage);
      case UsageType.REQUESTS:
      case UsageType.CONNECTIONS:
        return usage.toLocaleString();
      default:
        return usage.toString();
    }
  }

  /**
   * 格式化字节数
   */
  static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 格式化时长（秒）
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    
    return `${hours}h ${minutes}m ${remainingSeconds}s`;
  }

  /**
   * 获取使用量类型显示名称
   */
  static getUsageTypeDisplayName(usageType: UsageType): string {
    const displayNames = {
      [UsageType.BANDWIDTH]: '带宽',
      [UsageType.STORAGE]: '存储',
      [UsageType.REQUESTS]: '请求数',
      [UsageType.CPU_TIME]: 'CPU时间',
      [UsageType.MEMORY]: '内存',
      [UsageType.CONNECTIONS]: '连接数',
      [UsageType.TRANSFER]: '传输量'
    };
    return displayNames[usageType] || usageType;
  }

  /**
   * 获取告警严重程度颜色
   */
  static getAlertSeverityColor(severity: string): string {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'orange';
      case 'medium':
        return 'yellow';
      case 'low':
        return 'blue';
      default:
        return 'secondary';
    }
  }

  /**
   * 获取告警状态颜色
   */
  static getAlertStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'active':
        return 'destructive';
      case 'acknowledged':
        return 'orange';
      case 'resolved':
        return 'green';
      case 'suppressed':
        return 'secondary';
      default:
        return 'secondary';
    }
  }

  /**
   * 计算使用量百分比
   */
  static calculateUsagePercentage(current: number, limit: number): number {
    if (limit <= 0) return 0;
    return Math.min((current / limit) * 100, 100);
  }

  /**
   * 预测使用量耗尽时间
   */
  static predictDepletionTime(
    currentUsage: number, 
    limit: number, 
    usageRate: number
  ): string | null {
    if (usageRate <= 0 || currentUsage >= limit) return null;
    
    const remainingUsage = limit - currentUsage;
    const hoursRemaining = remainingUsage / usageRate;
    
    if (hoursRemaining > 24 * 7) {
      return `${Math.ceil(hoursRemaining / (24 * 7))} 周`;
    } else if (hoursRemaining > 24) {
      return `${Math.ceil(hoursRemaining / 24)} 天`;
    } else {
      return `${Math.ceil(hoursRemaining)} 小时`;
    }
  }

  /**
   * 验证告警配置
   */
  static validateAlertConfig(config: AlertConfigFormData): string[] {
    const errors: string[] = [];

    if (!config.subscription_id) {
      errors.push('订阅ID不能为空');
    }

    if (!config.usage_type) {
      errors.push('使用量类型不能为空');
    }

    if (config.threshold_percentage <= 0 || config.threshold_percentage > 100) {
      errors.push('阈值百分比必须在1-100之间');
    }

    if (!config.alert_type) {
      errors.push('告警类型不能为空');
    }

    if (!config.severity) {
      errors.push('严重程度不能为空');
    }

    if (!config.notification_channels || config.notification_channels.length === 0) {
      errors.push('至少选择一个通知渠道');
    }

    return errors;
  }
}