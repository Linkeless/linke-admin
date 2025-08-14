/**
 * React Query 查询键常量定义
 * 
 * 为所有业务模块提供统一的查询键命名规范和管理
 * 支持分页、筛选、排序等常用查询参数
 * 采用层级化键结构便于缓存失效管理
 */

// ==================== 类型定义 ====================

/**
 * 通用查询参数接口
 */
export interface BaseQueryParams {
  limit?: number
  offset?: number
  page?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
}

/**
 * 通用筛选参数接口
 */
export interface BaseFilters extends BaseQueryParams {
  status?: string
  date_from?: string
  date_to?: string
  search?: string
}

/**
 * 查询键工厂类型
 */
export type QueryKeyFactory<T = Record<string, any>> = {
  all: readonly string[]
  lists: () => readonly string[]
  list: (filters?: T) => readonly (string | { filters?: T })[]
  details: () => readonly string[]
  detail: (id: string | number) => readonly (string | number)[]
  search?: (query: string, filters?: T) => readonly (string | { query: string; filters?: T })[]
  stats?: () => readonly string[]
}

// ==================== 用户管理查询键 ====================

export const userQueryKeys = {
  all: ['users'] as const,
  lists: () => [...userQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    role?: string
    status?: string
    provider?: string
    subscription_status?: string
  }) => [...userQueryKeys.lists(), { filters }] as const,
  details: () => [...userQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...userQueryKeys.details(), id] as const,
  search: (query: string, filters?: BaseFilters) => 
    [...userQueryKeys.all, 'search', { query, filters }] as const,
  stats: () => [...userQueryKeys.all, 'stats'] as const,
  providers: () => [...userQueryKeys.all, 'providers'] as const,
  batchOperations: () => [...userQueryKeys.all, 'batch'] as const,
} as const

// ==================== 订阅管理查询键 ====================

export const subscriptionQueryKeys = {
  all: ['subscriptions'] as const,
  lists: () => [...subscriptionQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    plan_id?: string
    status?: string
    user_id?: string
    auto_renew?: boolean
  }) => [...subscriptionQueryKeys.lists(), { filters }] as const,
  details: () => [...subscriptionQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...subscriptionQueryKeys.details(), id] as const,
  
  // 订阅计划子模块
  plans: {
    all: ['subscriptions', 'plans'] as const,
    lists: () => [...subscriptionQueryKeys.plans.all, 'list'] as const,
    list: (filters?: BaseFilters & {
      currency?: string
      visible?: boolean
      popular?: boolean
      price_range?: [number, number]
    }) => [...subscriptionQueryKeys.plans.lists(), { filters }] as const,
    details: () => [...subscriptionQueryKeys.plans.all, 'detail'] as const,
    detail: (id: string | number) => [...subscriptionQueryKeys.plans.details(), id] as const,
    stats: () => [...subscriptionQueryKeys.plans.all, 'stats'] as const,
  },
  
  // 用户订阅子模块
  users: {
    all: ['subscriptions', 'users'] as const,
    lists: () => [...subscriptionQueryKeys.users.all, 'list'] as const,
    list: (filters?: BaseFilters & {
      user_id?: string
      plan_id?: string
      status?: string
    }) => [...subscriptionQueryKeys.users.lists(), { filters }] as const,
    details: () => [...subscriptionQueryKeys.users.all, 'detail'] as const,
    detail: (id: string | number) => [...subscriptionQueryKeys.users.details(), id] as const,
    byUser: (userId: string | number) => 
      [...subscriptionQueryKeys.users.all, 'by-user', userId] as const,
  },
} as const

// ==================== 订单管理查询键 ====================

export const orderQueryKeys = {
  all: ['orders'] as const,
  lists: () => [...orderQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    status?: string
    payment_method?: string
    user_id?: string
    amount_range?: [number, number]
    currency?: string
  }) => [...orderQueryKeys.lists(), { filters }] as const,
  details: () => [...orderQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...orderQueryKeys.details(), id] as const,
  stats: () => [...orderQueryKeys.all, 'stats'] as const,
  byUser: (userId: string | number) => [...orderQueryKeys.all, 'by-user', userId] as const,
} as const

// ==================== 优惠券管理查询键 ====================

export const couponQueryKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    type?: string
    status?: string
    expired?: boolean
    usage_limit?: number
  }) => [...couponQueryKeys.lists(), { filters }] as const,
  details: () => [...couponQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...couponQueryKeys.details(), id] as const,
  validate: (code: string) => [...couponQueryKeys.all, 'validate', code] as const,
  stats: () => [...couponQueryKeys.all, 'stats'] as const,
} as const

// ==================== 发票管理查询键 ====================

export const invoiceQueryKeys = {
  all: ['invoices'] as const,
  lists: () => [...invoiceQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    status?: string
    user_id?: string
    order_id?: string
    amount_range?: [number, number]
  }) => [...invoiceQueryKeys.lists(), { filters }] as const,
  details: () => [...invoiceQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...invoiceQueryKeys.details(), id] as const,
  byUser: (userId: string | number) => [...invoiceQueryKeys.all, 'by-user', userId] as const,
  byOrder: (orderId: string | number) => [...invoiceQueryKeys.all, 'by-order', orderId] as const,
} as const

// ==================== 支付配置查询键 ====================

export const paymentQueryKeys = {
  all: ['payments'] as const,
  lists: () => [...paymentQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    provider?: string
    enabled?: boolean
    currency?: string
  }) => [...paymentQueryKeys.lists(), { filters }] as const,
  details: () => [...paymentQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...paymentQueryKeys.details(), id] as const,
  config: () => [...paymentQueryKeys.all, 'config'] as const,
  providers: () => [...paymentQueryKeys.all, 'providers'] as const,
} as const

// ==================== 支付重试查询键 ====================

export const paymentRetryQueryKeys = {
  all: ['payment-retry'] as const,
  lists: () => [...paymentRetryQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    status?: string
    payment_id?: string
    retry_count_range?: [number, number]
  }) => [...paymentRetryQueryKeys.lists(), { filters }] as const,
  details: () => [...paymentRetryQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...paymentRetryQueryKeys.details(), id] as const,
  byPayment: (paymentId: string | number) => 
    [...paymentRetryQueryKeys.all, 'by-payment', paymentId] as const,
  stats: () => [...paymentRetryQueryKeys.all, 'stats'] as const,
} as const

// ==================== 服务器分组查询键 ====================

export const serverGroupQueryKeys = {
  all: ['server-groups'] as const,
  lists: () => [...serverGroupQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    status?: string
    region?: string
    protocol?: string
  }) => [...serverGroupQueryKeys.lists(), { filters }] as const,
  details: () => [...serverGroupQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...serverGroupQueryKeys.details(), id] as const,
  stats: () => [...serverGroupQueryKeys.all, 'stats'] as const,
} as const

// ==================== Shadowsocks节点查询键 ====================

export const shadowsocksQueryKeys = {
  all: ['shadowsocks'] as const,
  lists: () => [...shadowsocksQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    group_id?: string
    status?: string
    region?: string
    protocol?: string
    online?: boolean
  }) => [...shadowsocksQueryKeys.lists(), { filters }] as const,
  details: () => [...shadowsocksQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...shadowsocksQueryKeys.details(), id] as const,
  byGroup: (groupId: string | number) => 
    [...shadowsocksQueryKeys.all, 'by-group', groupId] as const,
  stats: () => [...shadowsocksQueryKeys.all, 'stats'] as const,
  health: () => [...shadowsocksQueryKeys.all, 'health'] as const,
} as const

// ==================== 工单系统查询键 ====================

export const ticketQueryKeys = {
  all: ['tickets'] as const,
  lists: () => [...ticketQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    status?: string
    priority?: string
    category?: string
    assigned_to?: string
    user_id?: string
  }) => [...ticketQueryKeys.lists(), { filters }] as const,
  details: () => [...ticketQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...ticketQueryKeys.details(), id] as const,
  byUser: (userId: string | number) => [...ticketQueryKeys.all, 'by-user', userId] as const,
  byAssignee: (assigneeId: string | number) => 
    [...ticketQueryKeys.all, 'by-assignee', assigneeId] as const,
  stats: () => [...ticketQueryKeys.all, 'stats'] as const,
  categories: () => [...ticketQueryKeys.all, 'categories'] as const,
} as const

// ==================== 邀请码管理查询键 ====================

export const inviteCodeQueryKeys = {
  all: ['invite-codes'] as const,
  lists: () => [...inviteCodeQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    status?: string
    used?: boolean
    created_by?: string
    usage_limit?: number
  }) => [...inviteCodeQueryKeys.lists(), { filters }] as const,
  details: () => [...inviteCodeQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...inviteCodeQueryKeys.details(), id] as const,
  validate: (code: string) => [...inviteCodeQueryKeys.all, 'validate', code] as const,
  stats: () => [...inviteCodeQueryKeys.all, 'stats'] as const,
  byCreator: (creatorId: string | number) => 
    [...inviteCodeQueryKeys.all, 'by-creator', creatorId] as const,
} as const

// ==================== 认证管理查询键 ====================

export const authQueryKeys = {
  all: ['auth'] as const,
  profile: () => [...authQueryKeys.all, 'profile'] as const,
  permissions: () => [...authQueryKeys.all, 'permissions'] as const,
  sessions: () => [...authQueryKeys.all, 'sessions'] as const,
  providers: () => [...authQueryKeys.all, 'providers'] as const,
  loginHistory: (userId?: string | number) => 
    userId 
      ? [...authQueryKeys.all, 'login-history', userId] as const
      : [...authQueryKeys.all, 'login-history'] as const,
} as const

// ==================== 缓存管理查询键 ====================

export const cacheQueryKeys = {
  all: ['cache'] as const,
  stats: () => [...cacheQueryKeys.all, 'stats'] as const,
  keys: () => [...cacheQueryKeys.all, 'keys'] as const,
  metrics: () => [...cacheQueryKeys.all, 'metrics'] as const,
  health: () => [...cacheQueryKeys.all, 'health'] as const,
} as const

// ==================== 使用监控查询键 ====================

export const usageQueryKeys = {
  all: ['usage'] as const,
  lists: () => [...usageQueryKeys.all, 'list'] as const,
  list: (filters?: BaseFilters & {
    user_id?: string
    server_id?: string
    date_range?: [string, string]
  }) => [...usageQueryKeys.lists(), { filters }] as const,
  details: () => [...usageQueryKeys.all, 'detail'] as const,
  detail: (id: string | number) => [...usageQueryKeys.details(), id] as const,
  byUser: (userId: string | number, dateRange?: [string, string]) => 
    [...usageQueryKeys.all, 'by-user', userId, { dateRange }] as const,
  byServer: (serverId: string | number, dateRange?: [string, string]) => 
    [...usageQueryKeys.all, 'by-server', serverId, { dateRange }] as const,
  stats: (dateRange?: [string, string]) => 
    [...usageQueryKeys.all, 'stats', { dateRange }] as const,
} as const

// ==================== 仪表板数据查询键 ====================

export const dashboardQueryKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardQueryKeys.all, 'stats'] as const,
  charts: () => [...dashboardQueryKeys.all, 'charts'] as const,
  metrics: () => [...dashboardQueryKeys.all, 'metrics'] as const,
  overview: () => [...dashboardQueryKeys.all, 'overview'] as const,
  
  // 具体统计数据
  userStats: () => [...dashboardQueryKeys.all, 'user-stats'] as const,
  orderStats: () => [...dashboardQueryKeys.all, 'order-stats'] as const,
  subscriptionStats: () => [...dashboardQueryKeys.all, 'subscription-stats'] as const,
  serverStats: () => [...dashboardQueryKeys.all, 'server-stats'] as const,
  ticketStats: () => [...dashboardQueryKeys.all, 'ticket-stats'] as const,
  
  // 时间范围统计
  periodStats: (period: string) => 
    [...dashboardQueryKeys.all, 'period-stats', period] as const,
} as const

// ==================== 统一查询键工厂 ====================

/**
 * 所有业务模块的查询键集合
 */
export const queryKeys = {
  // 用户管理
  users: userQueryKeys,
  
  // 订阅管理
  subscriptions: subscriptionQueryKeys,
  
  // 财务管理
  orders: orderQueryKeys,
  coupons: couponQueryKeys,
  invoices: invoiceQueryKeys,
  payments: paymentQueryKeys,
  paymentRetry: paymentRetryQueryKeys,
  
  // 服务器管理
  serverGroups: serverGroupQueryKeys,
  shadowsocks: shadowsocksQueryKeys,
  
  // 客户支持
  tickets: ticketQueryKeys,
  
  // 系统管理
  inviteCodes: inviteCodeQueryKeys,
  auth: authQueryKeys,
  cache: cacheQueryKeys,
  usage: usageQueryKeys,
  dashboard: dashboardQueryKeys,
} as const

// ==================== 查询键工具函数 ====================

/**
 * 查询键工具类
 */
export class QueryKeyUtils {
  /**
   * 验证查询键格式
   */
  static validate(queryKey: readonly unknown[]): boolean {
    return Array.isArray(queryKey) && queryKey.length > 0 && typeof queryKey[0] === 'string'
  }
  
  /**
   * 获取查询键的模块名
   */
  static getModule(queryKey: readonly unknown[]): string | null {
    if (!this.validate(queryKey)) return null
    return queryKey[0] as string
  }
  
  /**
   * 获取查询键的操作类型
   */
  static getOperation(queryKey: readonly unknown[]): string | null {
    if (!this.validate(queryKey) || queryKey.length < 2) return null
    return queryKey[1] as string
  }
  
  /**
   * 检查是否为列表查询
   */
  static isList(queryKey: readonly unknown[]): boolean {
    return this.getOperation(queryKey) === 'list'
  }
  
  /**
   * 检查是否为详情查询
   */
  static isDetail(queryKey: readonly unknown[]): boolean {
    return this.getOperation(queryKey) === 'detail'
  }
  
  /**
   * 检查是否为统计查询
   */
  static isStats(queryKey: readonly unknown[]): boolean {
    return this.getOperation(queryKey) === 'stats'
  }
  
  /**
   * 生成模糊匹配的查询键前缀
   */
  static createPrefix(module: string, operation?: string): readonly string[] {
    if (operation) {
      return [module, operation] as const
    }
    return [module] as const
  }
  
  /**
   * 提取查询参数
   */
  static extractFilters(queryKey: readonly unknown[]): Record<string, any> | null {
    const lastItem = queryKey[queryKey.length - 1]
    if (typeof lastItem === 'object' && lastItem !== null && 'filters' in lastItem) {
      return (lastItem as { filters?: Record<string, any> }).filters || {}
    }
    return null
  }
}

// ==================== 缓存失效工具 ====================

/**
 * 缓存失效工具类
 */
export class CacheInvalidationUtils {
  /**
   * 失效指定模块的所有查询
   */
  static getModulePrefix(module: keyof typeof queryKeys): readonly string[] {
    return queryKeys[module].all
  }
  
  /**
   * 失效指定模块的列表查询
   */
  static getModuleListPrefix(module: keyof typeof queryKeys): readonly string[] {
    return (queryKeys[module] as any).lists()
  }
  
  /**
   * 失效指定模块的详情查询
   */
  static getModuleDetailPrefix(module: keyof typeof queryKeys): readonly string[] {
    return (queryKeys[module] as any).details()
  }
  
  /**
   * 失效指定模块的统计查询
   */
  static getModuleStatsPrefix(module: keyof typeof queryKeys): readonly string[] {
    const moduleKeys = queryKeys[module] as any
    return moduleKeys.stats ? moduleKeys.stats() : [module, 'stats']
  }
  
  /**
   * 生成相关模块失效策略
   * 例如：用户删除时需要失效订阅、订单等相关数据
   */
  static getRelatedModules(module: keyof typeof queryKeys): Array<keyof typeof queryKeys> {
    const relations: Record<keyof typeof queryKeys, Array<keyof typeof queryKeys>> = {
      users: ['subscriptions', 'orders', 'tickets', 'usage', 'dashboard'],
      subscriptions: ['orders', 'users', 'dashboard'],
      orders: ['invoices', 'users', 'dashboard'],
      coupons: ['orders'],
      invoices: ['orders'],
      payments: ['orders'],
      paymentRetry: ['payments', 'orders'],
      serverGroups: ['shadowsocks'],
      shadowsocks: ['usage'],
      tickets: ['users'],
      inviteCodes: ['users'],
      auth: ['users'],
      cache: [],
      usage: ['dashboard'],
      dashboard: [],
    }
    
    return relations[module] || []
  }
}

// ==================== 默认导出 ====================

export default queryKeys

// ==================== 类型导出 ====================

export type {
  BaseQueryParams,
  BaseFilters,
  QueryKeyFactory,
}