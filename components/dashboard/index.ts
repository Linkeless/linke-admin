// 仪表板组件导出文件 - React Query优化版本

// 核心组件 - 使用React Query架构
export { DashboardRevenueChart } from './dashboard-revenue-chart'
export { DashboardStatsCards } from './dashboard-stats-cards'
export { DashboardTable } from './dashboard-table'

// 优化后的组件 - 完全支持React Query + 性能优化
export { StatsCardsGrid } from './stats-cards-grid'
export { StatsCard } from './stats-card'
export { DataOverviewCard } from './data-overview-card'
export { SystemStatusCard } from './system-status-card'
export { QuickActionsGrid } from './quick-actions-grid'

// 错误处理组件 - 增强版本
export { DashboardErrorAlert, MultipleErrorsAlert } from './dashboard-error-alert'

// 辅助组件
export { ActivityItem } from './activity-item'
export { DashboardDataTable } from './dashboard-data-table'

// 类型定义重新导出
export type { 
  DashboardStatsCardsProps,
  StatsCardsGridProps,
  DataOverviewCardProps,
  SystemStatusCardProps,
  QuickActionsGridProps,
  DashboardErrorAlertProps,
  MultipleErrorsAlertProps
} from './types'