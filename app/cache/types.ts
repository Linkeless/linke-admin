/**
 * 缓存模块类型导出
 * 统一导出缓存管理相关的所有类型定义
 */

export type {
  // 基础类型
  ApiResponse,
  CacheError,
  Pagination,
  QueryParams,
  TimeRange,
  
  // 缓存指标类型
  CacheMetrics,
  MetricsDataPoint,
  MetricsHistory,
  CacheStats,
  CachePerformance,
  CacheHealth,
  
  // 监控类型
  RealtimeMonitorData,
  CacheAlert,
  CreateAlertRequest,
  
  // 操作类型
  CacheOperationRequest,
  CacheOperationResponse,
  CacheMaintenanceRequest,
  CacheMaintenanceResponse,
  
  // 键管理类型
  CacheKey,
  CacheKeysResponse,
  CacheKeysQuery,
  
  // 配置类型
  CacheConfig,
} from '@/lib/cache-types';

export { CacheOperation } from '@/lib/cache-types';