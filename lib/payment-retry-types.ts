// 支付重试状态枚举
export enum RetryStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'network_error',
  TIMEOUT = 'timeout',
  GATEWAY_ERROR = 'gateway_error',
  INSUFFICIENT_FUNDS = 'insufficient_funds',
  CARD_DECLINED = 'card_declined',
  AUTHENTICATION_FAILED = 'authentication_failed',
  RATE_LIMIT = 'rate_limit',
  SYSTEM_ERROR = 'system_error',
  UNKNOWN = 'unknown'
}

// 重试策略接口
export interface RetryStrategy {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  retry_intervals: number[]; // 重试间隔（秒）
  max_attempts: number;
  payment_methods: string[];
  error_conditions: string[];
  created_at: string;
  updated_at: string;
}

// 创建重试策略请求类型
export interface CreateRetryStrategyRequest {
  name: string;
  description?: string;
  enabled: boolean;
  retry_intervals: number[];
  max_attempts: number;
  payment_methods: string[];
  error_conditions: string[];
}

// 更新重试策略请求类型
export interface UpdateRetryStrategyRequest {
  name?: string;
  description?: string;
  enabled?: boolean;
  retry_intervals?: number[];
  max_attempts?: number;
  payment_methods?: string[];
  error_conditions?: string[];
}

// 重试记录接口
export interface RetryRecord {
  id: string;
  payment_id: string;
  strategy_id: string;
  strategy_name: string;
  attempt_number: number;
  status: RetryStatus;
  error_message?: string;
  error_type: ErrorType;
  retry_at: string;
  completed_at?: string;
  next_retry_at?: string;
  duration_ms?: number;
}

// 支付重试历史接口
export interface PaymentRetryHistory {
  payment_id: string;
  total_attempts: number;
  success_attempts: number;
  failed_attempts: number;
  current_status: RetryStatus;
  first_attempt_at: string;
  last_attempt_at?: string;
  final_success_at?: string;
  records: RetryRecord[];
}

// 手动重试请求类型
export interface ManualRetryRequest {
  payment_id: string;
  strategy_id?: string;
  force?: boolean; // 是否强制重试，忽略策略限制
  reason?: string; // 手动重试原因
}

// 重试配置接口
export interface RetryConfig {
  enabled: boolean;
  default_strategy_id: string;
  max_daily_retries: number;
  notification_enabled: boolean;
  notification_email: string;
  retry_window_hours: number;
  auto_cancel_after_hours: number;
  max_concurrent_retries: number;
}

// 更新重试配置请求类型
export interface UpdateRetryConfigRequest {
  enabled?: boolean;
  default_strategy_id?: string;
  max_daily_retries?: number;
  notification_enabled?: boolean;
  notification_email?: string;
  retry_window_hours?: number;
  auto_cancel_after_hours?: number;
  max_concurrent_retries?: number;
}

// 重试统计接口
export interface RetryStats {
  total_retries: number;
  success_rate: number;
  failure_rate: number;
  average_attempts: number;
  average_success_time_minutes: number;
  most_common_errors: Array<{
    error_type: ErrorType;
    count: number;
    percentage: number;
  }>;
  daily_stats: Array<{
    date: string;
    total_retries: number;
    success_count: number;
    failure_count: number;
    success_rate: number;
  }>;
  strategy_stats: Array<{
    strategy_id: string;
    strategy_name: string;
    total_retries: number;
    success_rate: number;
    average_attempts: number;
  }>;
}

// 重试概览接口
export interface RetryOverview {
  active_retries: number;
  pending_retries: number;
  failed_retries_today: number;
  success_rate_today: number;
  recent_activities: Array<{
    id: string;
    type: 'retry_started' | 'retry_success' | 'retry_failed' | 'strategy_updated';
    message: string;
    timestamp: string;
    payment_id?: string;
    strategy_id?: string;
  }>;
}

// 查询参数接口
export interface RetryStrategiesQueryParams {
  enabled?: boolean;
  payment_method?: string;
  error_condition?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'name' | 'created_at' | 'updated_at';
  sort_order?: 'asc' | 'desc';
}

export interface RetryRecordsQueryParams {
  payment_id?: string;
  strategy_id?: string;
  status?: RetryStatus;
  error_type?: ErrorType;
  start_date?: string;
  end_date?: string;
  limit?: number;
  offset?: number;
  sort_by?: 'retry_at' | 'completed_at' | 'attempt_number';
  sort_order?: 'asc' | 'desc';
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// 重试策略列表API响应类型
export type RetryStrategiesApiResponse = PaginatedApiResponse<RetryStrategy>

// 重试记录列表API响应类型
export type RetryRecordsApiResponse = PaginatedApiResponse<RetryRecord>

// 错误条件选项
export interface ErrorConditionOption {
  value: string;
  label: string;
  description: string;
}

// 支付方式选项
export interface PaymentMethodOption {
  value: string;
  label: string;
  enabled: boolean;
}

// 重试间隔预设选项
export interface RetryIntervalPreset {
  name: string;
  description: string;
  intervals: number[];
}

// 表格行类型
export type RetryStrategyTableRow = RetryStrategy & {
  isSelected?: boolean;
  performance_score: number; // 计算得出的性能评分
  last_used_at?: string;
}

export type RetryRecordTableRow = RetryRecord & {
  isSelected?: boolean;
  payment_amount?: number;
  payment_method?: string;
  user_id?: string;
}

// 批量操作类型
export interface BatchOperation {
  action: 'enable' | 'disable' | 'delete';
  ids: string[];
}

// 图表数据类型
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
    fill?: boolean;
  }>;
}

// 时间范围类型
export type TimeRange = '1h' | '6h' | '24h' | '7d' | '30d' | 'custom';

// 过滤器状态类型
export interface FilterState {
  status: RetryStatus | 'all';
  error_type: ErrorType | 'all';
  strategy_id: string | 'all';
  time_range: TimeRange;
  start_date?: string;
  end_date?: string;
}

// 排序状态类型
export interface SortState {
  field: string;
  direction: 'asc' | 'desc';
}

// 重试详情扩展接口
export interface RetryRecordDetail extends RetryRecord {
  payment_details: {
    amount: number;
    currency: string;
    method: string;
    gateway: string;
    user_id: string;
    order_id: string;
  };
  strategy_details: {
    name: string;
    max_attempts: number;
    retry_intervals: number[];
  };
  execution_log: Array<{
    timestamp: string;
    level: 'info' | 'warning' | 'error';
    message: string;
    details?: Record<string, unknown>;
  }>;
}

// 策略效果分析接口
export interface StrategyPerformance {
  strategy_id: string;
  strategy_name: string;
  total_payments: number;
  total_retries: number;
  success_count: number;
  failure_count: number;
  success_rate: number;
  average_attempts: number;
  average_success_time: number;
  cost_saved: number; // 避免的损失金额
  performance_score: number; // 0-100 的性能评分
  recommendations: string[]; // 优化建议
}

// 实时监控数据接口
export interface RealtimeMonitoringData {
  active_retries: Array<{
    payment_id: string;
    strategy_name: string;
    attempt_number: number;
    next_retry_at: string;
    elapsed_time: number;
  }>;
  recent_completions: Array<{
    payment_id: string;
    status: RetryStatus;
    completed_at: string;
    total_attempts: number;
    duration: number;
  }>;
  system_health: {
    retry_queue_size: number;
    processing_capacity: number;
    average_processing_time: number;
    error_rate: number;
  };
}