/**
 * 缓存管理模块类型定义
 * 基于swagger.json API接口规范定义的TypeScript类型
 * 遵循CLAUDE.md架构规范 - 统一的StandardResponse格式
 */

// 标准响应格式 (遵循项目规范)
export interface StandardResponse<T = unknown> {
  code: number;    // 0=成功
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// 基于swagger.json定义的缓存指标类型
export interface CacheMetrics {
  deletes: number;
  error_rate: number;
  errors: number;
  evictions: number;
  hits: number;
  hit_rate: number;
  misses: number;
  miss_rate: number;
  total_operations: number;
}

// 缓存指标报告 (swagger cache.MetricsReport)
export interface CacheMetricsReport {
  global_metrics: CacheMetrics;
  prefix_metrics: Record<string, CacheMetrics>;
  summary: CachePrefixMetricSummary[];
}

// 前缀指标摘要
export interface CachePrefixMetricSummary {
  prefix: string;
  total_keys: number;
  hit_rate: number;
  memory_usage: number;
}

// 缓存指标数据点
export interface CacheMetricsDataPoint {
  timestamp: number;
  metrics: CacheMetrics;
}

// 缓存指标历史
export interface CacheMetricsHistory {
  time_range: TimeRange;
  data_points: CacheMetricsDataPoint[];
  interval: string;
}

// 基于swagger.json的缓存统计类型 (cache.CacheStats)
export interface CacheStats {
  deletes: number;
  evictions: number;
  expires: number;
  gets: number;
  hits: number;
  misses: number;
  sets: number;
  total_keys: number;
}

// 基于swagger.json的性能指标类型 (cache.PerformanceMetrics)
export interface CachePerformanceMetrics {
  cache_consistency: number;  // L1-L2一致性评分
  data_freshness: number;     // 质量指标
  hit_ratio_l1: number;       // L1命中率
  hit_ratio_l2: number;       // L2命中率
  latency_avg: number;        // 平均延迟
  latency_p95: number;        // 95分位延迟
  latency_p99: number;        // 99分位延迟
  memory_efficiency: number;  // 内存效率
  ops_per_second: number;     // 每秒操作数
  response_time_ms: number;   // 响应时间（毫秒）
  throughput_mbps: number;    // 吞吐量 (Mbps)
}

// 基于swagger.json的健康状态类型 (cache.CacheHealthStatus)
export interface CacheHealthStatus {
  components: Record<string, string>;
  issues: string[];
  multilevel_metrics: CacheMultiLevelMetrics;
  overall_status: string;
  performance: CachePerformanceMetrics;
  timestamp: number;
}

// 多级缓存指标 (cache.MultiLevelCacheMetrics)
export interface CacheMultiLevelMetrics {
  l1_memory: CacheMemoryMetrics;
  l2_redis: CacheMetrics;
  sync_status: string;
}

// 内存缓存指标 (cache.MemoryCacheMetrics)
export interface CacheMemoryMetrics {
  evictions: number;
  hits: number;
  max_size: number;
  misses: number;
  size: number;
}

// 基于swagger.json的缓存预热指标 (cache.WarmingMetrics)
export interface CacheWarmingMetrics {
  active_warmup_tasks: number;
  completed_prefixes: string[];
  duration_ms: number;
  error_rate: number;
  keys_warmed: number;
  last_run: number;
  pending_prefixes: string[];
  success_rate: number;
  total_prefixes: number;
}

// 基于swagger.json的DTO响应类型

// 缓存仪表板响应 (dto.CacheDashboardResponse)
export interface CacheDashboardResponse {
  alerts: string[];
  health: CacheHealthResponse;
  invalidation: CacheInvalidationResponse;
  metrics: CacheMetricsResponse;
  performance: CachePerformanceResponse;
  warming: CacheWarmingResponse;
}

// 缓存健康响应 (dto.CacheHealthResponse)
export interface CacheHealthResponse {
  last_checked: number;
  memory_cache: string;
  overall: string;
  redis_cache: string;
}

// 缓存失效响应 (dto.CacheInvalidationResponse)
export interface CacheInvalidationResponse {
  invalidation_rate: number;
  last_invalidation: number;
  pending_keys: string[];
  total_invalidations: number;
}

// 缓存指标响应 (dto.CacheMetricsResponse)
export interface CacheMetricsResponse {
  avg_latency_ms: number;
  hit_rate: number;
  miss_rate: number;
  total_hits: number;
  total_misses: number;
  total_operations: number;
}

// 缓存性能响应 (dto.CachePerformanceResponse)
export interface CachePerformanceResponse {
  avg_response_time_ms: number;
  eviction_count: number;
  key_count: number;
  memory_usage_bytes: number;
  ops_per_second: number;
}

// 缓存预热响应 (dto.CacheWarmingResponse)
export interface CacheWarmingResponse {
  duration_ms: number;
  in_progress: boolean;
  last_warmed: number;
  success_rate: number;
  warmed_keys: number;
}

// 缓存基准测试响应 (dto.CacheBenchmarkResponse)
export interface CacheBenchmarkResponse {
  avg_latency_ms: number;
  duration_ms: number;
  max_latency_ms: number;
  min_latency_ms: number;
  operations_completed: number;
  ops_per_second: number;
  success_rate: number;
}

// 缓存操作请求类型
export interface CacheFlushRequest {
  confirm?: boolean;
}

export interface CachePatternDeleteRequest {
  pattern: string;
  confirm?: boolean;
}

export interface CacheWarmingTriggerRequest {
  prefixes: string[];
  priority?: number;
}

// 缓存操作枚举
export enum CacheOperation {
  FLUSH = 'flush',
  PATTERN_DELETE = 'pattern_delete',
  WARMUP = 'warmup',
  BENCHMARK = 'benchmark',
  RESET_METRICS = 'reset_metrics'
}

// 缓存操作响应类型
export interface CacheOperationResult {
  success: boolean;
  message: string;
  affected_keys?: number;
  duration_ms?: number;
  details?: Record<string, unknown>;
}

// 通用类型
export interface TimeRange {
  start: string;
  end: string;
  interval?: '1m' | '5m' | '15m' | '1h' | '6h' | '24h';
}

export interface QueryParams {
  limit?: number;
  offset?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: unknown;
}

// 缓存操作类型
export interface CacheActionRequest {
  action: CacheOperation;
  params?: Record<string, unknown>;
}

// 缓存指标查询参数
export interface CacheMetricsQuery {
  prefix?: string;
  timerange?: TimeRange;
}

// ===== 补充缺失的类型定义 =====

// 类型别名 - 兼容现有导入
export type ApiResponse<T = unknown> = StandardResponse<T>;
export type MetricsHistory = CacheMetricsHistory;
export type CachePerformance = CachePerformanceMetrics;
export type CacheHealth = CacheHealthStatus;

// 缓存操作请求 (兼容性别名)
export type CacheOperationRequest = CacheActionRequest;
export type CacheOperationResponse = CacheOperationResult;

// 缓存键相关类型
export interface CacheKey {
  key: string;
  value?: unknown;
  ttl?: number;
  created_at?: number;
  accessed_at?: number;
  size_bytes?: number;
  type?: string;
}

export interface CacheKeysResponse {
  keys: CacheKey[];
  total_count: number;
  scan_cursor?: string;
}

export interface CacheKeysQuery {
  pattern?: string;
  prefix?: string;
  limit?: number;
  cursor?: string;
  with_values?: boolean;
  with_metadata?: boolean;
}

// 缓存告警相关类型
export interface CacheAlert {
  id: string;
  type: 'performance' | 'availability' | 'capacity' | 'error_rate';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric_name: string;
  threshold: number;
  current_value: number;
  triggered_at: number;
  resolved_at?: number;
  status: 'active' | 'resolved' | 'muted';
  conditions: AlertCondition[];
}

export interface AlertCondition {
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
  threshold: number;
  duration_minutes: number;
}

export interface CreateAlertRequest {
  type: CacheAlert['type'];
  title: string;
  message?: string;
  metric_name: string;
  threshold: number;
  severity: CacheAlert['severity'];
  conditions: AlertCondition[];
  enabled?: boolean;
}

// 缓存维护相关类型
export interface CacheMaintenanceRequest {
  operation: 'cleanup' | 'optimize' | 'rebuild_index' | 'vacuum';
  schedule?: {
    start_time?: number;
    max_duration_minutes?: number;
  };
  options?: {
    force?: boolean;
    dry_run?: boolean;
    preserve_hot_keys?: boolean;
  };
}

export interface CacheMaintenanceResponse {
  operation: string;
  status: 'scheduled' | 'running' | 'completed' | 'failed';
  started_at?: number;
  completed_at?: number;
  duration_ms?: number;
  affected_keys: number;
  freed_memory_bytes: number;
  errors: string[];
  details?: Record<string, unknown>;
}

// 实时监控数据类型
export interface RealtimeMonitorData {
  timestamp: number;
  metrics: CacheMetrics;
  performance: CachePerformanceMetrics;
  health: {
    overall_status: string;
    component_status: Record<string, string>;
  };
  alerts: CacheAlert[];
  active_operations: {
    operation: string;
    progress: number;
    started_at: number;
  }[];
}

