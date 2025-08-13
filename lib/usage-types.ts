// 使用量监控模块类型定义

export interface UsageData {
  id: string;
  subscription_id: string;
  usage_type: UsageType;
  current_usage: number;
  limit_quota: number;
  percentage: number;
  last_updated: string;
  reset_date: string;
  is_active: boolean;
}

export interface UsageHistory {
  id: string;
  subscription_id: string;
  usage_type: UsageType;
  usage_amount: number;
  recorded_at: string;
  period_start: string;
  period_end: string;
}

export interface UsageSummary {
  subscription_id: string;
  total_usage: number;
  total_limit: number;
  usage_percentage: number;
  active_alerts: number;
  usage_breakdown: UsageBreakdown[];
  period_start: string;
  period_end: string;
}

export interface UsageBreakdown {
  usage_type: UsageType;
  usage_amount: number;
  limit_quota: number;
  percentage: number;
  status: UsageStatus;
}

export interface UsageStatistics {
  subscription_id: string;
  period: TimePeriod;
  total_usage: number;
  average_daily_usage: number;
  peak_usage: number;
  peak_usage_date: string;
  growth_rate: number;
  usage_distribution: UsageDistribution[];
}

export interface UsageDistribution {
  usage_type: UsageType;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface UsageTrend {
  subscription_id: string;
  usage_type: UsageType;
  period: TimePeriod;
  data_points: TrendDataPoint[];
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  growth_rate: number;
}

export interface TrendDataPoint {
  date: string;
  usage: number;
  percentage: number;
}

export interface UsagePrediction {
  subscription_id: string;
  usage_type: UsageType;
  predicted_usage: number;
  confidence_level: number;
  prediction_date: string;
  factors: PredictionFactor[];
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  description: string;
}

export interface RealtimeUsage {
  subscription_id: string;
  usage_type: UsageType;
  current_usage: number;
  usage_rate: number; // per minute/hour
  estimated_depletion: string | null;
  status: UsageStatus;
  last_activity: string;
}

export interface TopUsageItem {
  subscription_id: string;
  user_name?: string;
  total_usage: number;
  usage_percentage: number;
  rank: number;
  change_from_last_period: number;
}

// 告警相关类型
export interface Alert {
  id: string;
  subscription_id: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  message: string;
  threshold_value: number;
  current_value: number;
  created_at: string;
  updated_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  suppressed_until?: string;
}

export interface AlertConfig {
  id: string;
  subscription_id: string;
  usage_type: UsageType;
  threshold_percentage: number;
  alert_type: AlertType;
  severity: AlertSeverity;
  notification_channels: NotificationChannel[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AlertHistory {
  id: string;
  alert_id: string;
  action: AlertAction;
  performed_by: string;
  performed_at: string;
  notes?: string;
}

export interface AlertStatistics {
  subscription_id: string;
  period: TimePeriod;
  total_alerts: number;
  resolved_alerts: number;
  pending_alerts: number;
  suppressed_alerts: number;
  average_resolution_time: number; // in minutes
  alert_frequency: AlertFrequency[];
}

export interface AlertFrequency {
  alert_type: AlertType;
  count: number;
  percentage: number;
}

// 导出相关类型
export interface ExportRequest {
  subscription_ids?: string[];
  usage_types?: UsageType[];
  date_range: DateRange;
  format: ExportFormat;
  include_predictions?: boolean;
  include_alerts?: boolean;
}

export interface ExportResult {
  id: string;
  status: ExportStatus;
  file_url?: string;
  file_size?: number;
  created_at: string;
  expires_at: string;
  error_message?: string;
}

// 管理操作相关类型
export interface CleanupRequest {
  older_than_days: number;
  usage_types?: UsageType[];
  dry_run: boolean;
}

export interface CleanupResult {
  deleted_records: number;
  freed_space: number; // in bytes
  affected_subscriptions: string[];
  execution_time: number; // in seconds
}

export interface SyncRequest {
  subscription_id: string;
  force_sync: boolean;
  sync_types: UsageType[];
}

export interface SyncResult {
  subscription_id: string;
  status: SyncStatus;
  synced_records: number;
  sync_duration: number; // in seconds
  last_sync: string;
  errors: string[];
}

// 枚举类型
export enum UsageType {
  BANDWIDTH = 'bandwidth',
  STORAGE = 'storage',
  REQUESTS = 'requests',
  CPU_TIME = 'cpu_time',
  MEMORY = 'memory',
  CONNECTIONS = 'connections',
  TRANSFER = 'transfer'
}

export enum UsageStatus {
  NORMAL = 'normal',
  WARNING = 'warning',
  CRITICAL = 'critical',
  EXCEEDED = 'exceeded'
}

export enum AlertType {
  THRESHOLD = 'threshold',
  QUOTA_EXCEEDED = 'quota_exceeded',
  UNUSUAL_ACTIVITY = 'unusual_activity',
  PREDICTION = 'prediction'
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed'
}

export enum AlertAction {
  CREATED = 'created',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  SUPPRESSED = 'suppressed',
  UPDATED = 'updated'
}

export enum NotificationChannel {
  EMAIL = 'email',
  SMS = 'sms',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app'
}

export enum TimePeriod {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year'
}

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  XLSX = 'xlsx',
  PDF = 'pdf'
}

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  EXPIRED = 'expired'
}

export enum SyncStatus {
  SUCCESS = 'success',
  PARTIAL = 'partial',
  FAILED = 'failed',
  IN_PROGRESS = 'in_progress'
}

// 辅助类型
export interface DateRange {
  start_date: string;
  end_date: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  [key: string]: unknown;
}

export interface FilterParams {
  subscription_ids?: string[];
  usage_types?: UsageType[];
  status?: UsageStatus | AlertStatus;
  date_range?: DateRange;
  search?: string;
  [key: string]: unknown;
}

// API响应类型
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  success: boolean;
  message?: string;
}

// 图表数据类型
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
  color?: string;
}

export interface UsageChartData {
  subscription_id: string;
  usage_type: UsageType;
  data_points: ChartDataPoint[];
  period: TimePeriod;
  title: string;
}

// 组件Props类型
export interface BaseComponentProps {
  className?: string;
  loading?: boolean;
  error?: string | null;
}

export interface UsageTableRow {
  id: string;
  subscription_id: string;
  user_name?: string;
  usage_type: UsageType;
  current_usage: number;
  limit_quota: number;
  percentage: number;
  status: UsageStatus;
  last_updated: string;
}

export interface AlertTableRow {
  id: string;
  subscription_id: string;
  user_name?: string;
  alert_type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  title: string;
  current_value: number;
  threshold_value: number;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

// 表单数据类型
export interface AlertConfigFormData {
  subscription_id: string;
  usage_type: UsageType;
  threshold_percentage: number;
  alert_type: AlertType;
  severity: AlertSeverity;
  notification_channels: NotificationChannel[];
  is_active: boolean;
}

export interface ExportFormData {
  subscription_ids: string[];
  usage_types: UsageType[];
  date_range: DateRange;
  format: ExportFormat;
  include_predictions: boolean;
  include_alerts: boolean;
}

export interface TestNotificationData {
  channel: NotificationChannel;
  recipient: string;
  message: string;
}