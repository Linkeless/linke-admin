/**
 * 缓存管理API服务层
 * 实现所有15个缓存相关接口的调用和数据处理
 */

import type {
  ApiResponse,
  CacheMetrics,
  MetricsHistory,
  CacheStats,
  CachePerformance,
  CacheHealth,
  RealtimeMonitorData,
  CacheAlert,
  CreateAlertRequest,
  CacheOperationRequest,
  CacheOperationResponse,
  CacheKey,
  CacheKeysResponse,
  CacheKeysQuery,
  CacheMaintenanceRequest,
  CacheMaintenanceResponse,
  TimeRange,
  QueryParams
} from './cache-types';

// API基础配置
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1';
const CACHE_API_PREFIX = `${API_BASE_URL}/admin/cache`;

// HTTP客户端配置
class CacheApiClient {
  private baseURL: string;

  constructor(baseURL: string = CACHE_API_PREFIX) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        // 添加认证头，假设使用Bearer token
        'Authorization': `Bearer ${this.getAuthToken()}`,
        ...options.headers,
      },
    };

    const config = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${url}:`, error);
      throw error;
    }
  }

  private getAuthToken(): string {
    // 从localStorage或其他存储中获取认证token
    if (typeof window !== 'undefined') {
      return localStorage.getItem('auth_token') || '';
    }
    return '';
  }

  // GET请求
  async get<T>(endpoint: string, params?: QueryParams): Promise<ApiResponse<T>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
    }

    const queryString = searchParams.toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request<T>(url, { method: 'GET' });
  }

  // POST请求
  async post<T>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  // DELETE请求
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// 创建API客户端实例
const apiClient = new CacheApiClient();

/**
 * 缓存指标相关API (5个接口)
 */
export class CacheMetricsService {
  /**
   * 获取缓存指标
   * GET /api/v1/admin/cache/metrics
   */
  static async getMetrics(): Promise<CacheMetrics> {
    const response = await apiClient.get<CacheMetrics>('/metrics');
    return response.data;
  }

  /**
   * 获取历史指标
   * GET /api/v1/admin/cache/metrics/history
   */
  static async getMetricsHistory(timeRange?: TimeRange): Promise<MetricsHistory> {
    const params: QueryParams = {};
    
    if (timeRange) {
      params.start = timeRange.start;
      params.end = timeRange.end;
      if (timeRange.interval) {
        params.interval = timeRange.interval;
      }
    }

    const response = await apiClient.get<MetricsHistory>('/metrics/history', params);
    return response.data;
  }

  /**
   * 获取缓存统计
   * GET /api/v1/admin/cache/stats
   */
  static async getStats(): Promise<CacheStats> {
    const response = await apiClient.get<CacheStats>('/stats');
    return response.data;
  }

  /**
   * 获取性能指标
   * GET /api/v1/admin/cache/performance
   */
  static async getPerformance(): Promise<CachePerformance> {
    const response = await apiClient.get<CachePerformance>('/performance');
    return response.data;
  }

  /**
   * 获取健康状态
   * GET /api/v1/admin/cache/health
   */
  static async getHealth(): Promise<CacheHealth> {
    const response = await apiClient.get<CacheHealth>('/health');
    return response.data;
  }
}

/**
 * 缓存监控相关API (4个接口)
 */
export class CacheMonitoringService {
  /**
   * 实时监控
   * GET /api/v1/admin/cache/monitor/realtime
   */
  static async getRealtimeData(): Promise<RealtimeMonitorData> {
    const response = await apiClient.get<RealtimeMonitorData>('/monitor/realtime');
    return response.data;
  }

  /**
   * 获取监控告警列表
   * GET /api/v1/admin/cache/monitor/alerts
   */
  static async getAlerts(params?: QueryParams): Promise<{
    alerts: CacheAlert[];
    total: number;
    page: number;
    page_size: number;
  }> {
    const response = await apiClient.get<{
      alerts: CacheAlert[];
      total: number;
      page: number;
      page_size: number;
    }>('/monitor/alerts', params);
    return response.data;
  }

  /**
   * 创建监控告警
   * POST /api/v1/admin/cache/monitor/alerts
   */
  static async createAlert(alertData: CreateAlertRequest): Promise<CacheAlert> {
    const response = await apiClient.post<CacheAlert>('/monitor/alerts', alertData);
    return response.data;
  }

  /**
   * 删除监控告警
   * DELETE /api/v1/admin/cache/monitor/alerts/{id}
   */
  static async deleteAlert(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/monitor/alerts/${id}`);
    return response.data;
  }
}

/**
 * 缓存管理相关API (6个接口)
 */
export class CacheManagementService {
  /**
   * 清理缓存
   * POST /api/v1/admin/cache/clear
   */
  static async clearCache(request: CacheOperationRequest): Promise<CacheOperationResponse> {
    const response = await apiClient.post<CacheOperationResponse>('/clear', request);
    return response.data;
  }

  /**
   * 刷新缓存
   * POST /api/v1/admin/cache/refresh
   */
  static async refreshCache(request: CacheOperationRequest): Promise<CacheOperationResponse> {
    const response = await apiClient.post<CacheOperationResponse>('/refresh', request);
    return response.data;
  }

  /**
   * 预热缓存
   * POST /api/v1/admin/cache/warmup
   */
  static async warmupCache(request: CacheOperationRequest): Promise<CacheOperationResponse> {
    const response = await apiClient.post<CacheOperationResponse>('/warmup', request);
    return response.data;
  }

  /**
   * 获取缓存键列表
   * GET /api/v1/admin/cache/keys
   */
  static async getKeys(query?: CacheKeysQuery): Promise<CacheKeysResponse> {
    const params: QueryParams = {};
    
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params[key] = value;
        }
      });
    }

    const response = await apiClient.get<CacheKeysResponse>('/keys', params);
    return response.data;
  }

  /**
   * 删除指定缓存键
   * DELETE /api/v1/admin/cache/keys/{key}
   */
  static async deleteKey(key: string): Promise<{ success: boolean; message: string }> {
    // 对key进行URL编码
    const encodedKey = encodeURIComponent(key);
    const response = await apiClient.delete<{ success: boolean; message: string }>(`/keys/${encodedKey}`);
    return response.data;
  }

  /**
   * 缓存维护
   * POST /api/v1/admin/cache/maintenance
   */
  static async performMaintenance(request: CacheMaintenanceRequest): Promise<CacheMaintenanceResponse> {
    const response = await apiClient.post<CacheMaintenanceResponse>('/maintenance', request);
    return response.data;
  }
}

/**
 * 缓存服务统一接口
 * 提供所有缓存相关功能的统一入口
 */
export class CacheService {
  // 指标相关
  static metrics = CacheMetricsService;
  
  // 监控相关
  static monitoring = CacheMonitoringService;
  
  // 管理相关
  static management = CacheManagementService;

  /**
   * 获取缓存概览数据
   * 组合多个API调用获取完整的缓存概览信息
   */
  static async getOverview(): Promise<{
    metrics: CacheMetrics;
    health: CacheHealth;
    stats: CacheStats;
    performance: CachePerformance;
  }> {
    try {
      const [metrics, health, stats, performance] = await Promise.all([
        CacheMetricsService.getMetrics(),
        CacheMetricsService.getHealth(),
        CacheMetricsService.getStats(),
        CacheMetricsService.getPerformance(),
      ]);

      return {
        metrics,
        health,
        stats,
        performance,
      };
    } catch (error) {
      console.error('获取缓存概览数据失败:', error);
      throw error;
    }
  }

  /**
   * 健康检查
   * 检查缓存服务是否正常运行
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const health = await CacheMetricsService.getHealth();
      return health.status === 'healthy';
    } catch (error) {
      console.error('缓存健康检查失败:', error);
      return false;
    }
  }

  /**
   * 批量删除缓存键
   * 根据模式匹配删除多个缓存键
   */
  static async batchDeleteKeys(pattern: string): Promise<{
    success: boolean;
    deleted_count: number;
    message: string;
  }> {
    try {
      const request: CacheOperationRequest = {
        operation: 'clear' as CacheOperation,
        target: 'pattern',
        pattern,
        confirm: true,
      };

      const result = await CacheManagementService.clearCache(request);
      
      return {
        success: result.success,
        deleted_count: result.affected_keys,
        message: result.message,
      };
    } catch (error) {
      console.error('批量删除缓存键失败:', error);
      throw error;
    }
  }

  /**
   * 获取实时性能数据
   * 用于实时监控面板
   */
  static async getRealtimePerformance(): Promise<{
    timestamp: string;
    hit_rate: number;
    memory_usage: number;
    operations_per_second: number;
    connections: number;
    response_time: number;
  }> {
    try {
      const [metrics] = await Promise.all([
        CacheMetricsService.getMetrics(),
        CacheMonitoringService.getRealtimeData(),
      ]);

      return {
        timestamp: new Date().toISOString(),
        hit_rate: metrics.hit_rate,
        memory_usage: metrics.memory_usage,
        operations_per_second: metrics.operations_per_second,
        connections: metrics.connections,
        response_time: metrics.avg_response_time,
      };
    } catch (error) {
      console.error('获取实时性能数据失败:', error);
      throw error;
    }
  }
}

// 导出默认服务
export default CacheService;

// 导出错误处理函数
export const handleCacheError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return '未知错误';
};

// 导出数据格式化函数
export const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const formatDuration = (seconds: number): string => {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`;
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`;
  } else if (minutes > 0) {
    return `${minutes}分钟 ${secs}秒`;
  } else {
    return `${secs}秒`;
  }
};

export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

export const formatPercentage = (value: number): string => {
  return `${(value * 100).toFixed(1)}%`;
};