'use client'

/**
 * Shadowsocks 服务器查询 Hooks
 * 
 * 基于 React Query 实现的 Shadowsocks 服务器数据查询钩子集合
 * 支持服务器列表、详情、统计等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务29实现：服务器查询Hooks - Shadowsocks服务器模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { shadowsocksServerService } from '@/lib/shadowsocks-service'
import { serverGroupService } from '@/lib/server-group-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  ShadowsocksServerResponse,
  ShadowsocksServerSearchParams,
  ShadowsocksServerListResponse,
  ShadowsocksServerDetailResponse
} from '@/lib/shadowsocks-types'

// ==================== 类型定义 ====================

/**
 * 服务器列表查询参数
 */
export interface UseShadowsocksServersParams extends ShadowsocksServerSearchParams {
  enabled?: boolean
}

/**
 * 服务器详情查询参数
 */
export interface UseShadowsocksServerParams {
  id: number
  enabled?: boolean
}

/**
 * 服务器统计查询参数
 */
export interface UseServerStatisticsParams {
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取 Shadowsocks 服务器列表
 * 支持分页、筛选、排序等功能
 */
export const useShadowsocksServers = (params: UseShadowsocksServersParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.shadowsocksServers.list(queryParams),
    queryFn: () => shadowsocksServerService.getServers(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: ShadowsocksServerListResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data && data.data.items) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(server => ({
                ...server,
                // 添加计算属性
                statusDisplay: getServerStatusDisplay(server),
                typeDisplay: getServerTypeDisplay(server),
                loadDisplay: formatServerLoad(server),
                isOnline: checkServerOnline(server),
                isOverloaded: checkServerOverloaded(server),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'shadowsocksServers',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个 Shadowsocks 服务器详情
 */
export const useShadowsocksServer = (params: UseShadowsocksServerParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.shadowsocksServers.detail(id),
    queryFn: () => shadowsocksServerService.getServerById(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id && id > 0,
      select: (data: ShadowsocksServerDetailResponse) => {
        // 增强服务器详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusDisplay: getServerStatusDisplay(data.data),
              typeDisplay: getServerTypeDisplay(data.data),
              loadDisplay: formatServerLoad(data.data),
              isOnline: checkServerOnline(data.data),
              isOverloaded: checkServerOverloaded(data.data),
              healthScore: calculateHealthScore(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'shadowsocksServers',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取服务器统计信息
 */
export const useServerStatistics = (params: UseServerStatisticsParams = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.shadowsocksServers.statistics(),
    queryFn: () => shadowsocksServerService.getServerStatistics(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'shadowsocksServers',
          operation: 'statistics'
        })
      }
    })
  })
}

/**
 * 获取服务器健康状态
 */
export const useServerHealth = (serverId: number, params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.shadowsocksServers.health(serverId),
    queryFn: () => shadowsocksServerService.getServerHealth(serverId),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!serverId && serverId > 0,
      refetchInterval: 30000, // 每30秒刷新一次健康状态
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'shadowsocksServers',
          operation: 'health',
          params: { serverId }
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载服务器列表
 * 适用于需要滚动加载更多服务器的场景
 */
export const useInfiniteShadowsocksServers = (params: Omit<UseShadowsocksServersParams, 'page'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.shadowsocksServers.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 1 }) => 
      shadowsocksServerService.getServers({ ...queryParams, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ShadowsocksServerListResponse, allPages) => {
      if (lastPage.code === 0 && lastPage.data && lastPage.data.pagination) {
        const { page, total_pages } = lastPage.data.pagination
        return page < total_pages ? page + 1 : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.USER, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'shadowsocksServers',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<ShadowsocksServerListResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取在线服务器列表
 */
export const useOnlineServers = (params: Omit<UseShadowsocksServersParams, 'show'> = {}) => {
  return useShadowsocksServers({
    ...params,
    show: 1 // 只显示在线服务器
  })
}

/**
 * 获取离线服务器列表
 */
export const useOfflineServers = (params: Omit<UseShadowsocksServersParams, 'show'> = {}) => {
  return useShadowsocksServers({
    ...params,
    show: 0 // 只显示离线服务器
  })
}

/**
 * 根据服务器组获取服务器列表
 */
export const useServersByGroup = (groupId: number, params: Omit<UseShadowsocksServersParams, 'group_id'> = {}) => {
  return useShadowsocksServers({
    ...params,
    group_id: groupId
  })
}

/**
 * 搜索服务器
 */
export const useSearchServers = (searchTerm: string, params: Omit<UseShadowsocksServersParams, 'name'> = {}) => {
  return useShadowsocksServers({
    ...params,
    name: searchTerm,
    enabled: params.enabled !== false && !!searchTerm && searchTerm.length > 0
  })
}

// ==================== 工具函数 ====================

/**
 * 获取服务器状态显示配置
 */
const getServerStatusDisplay = (server: ShadowsocksServerResponse) => {
  const configs = {
    online: { label: '在线', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    offline: { label: '离线', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
    maintenance: { label: '维护中', color: 'bg-yellow-100 text-yellow-800', variant: 'outline' as const },
  }
  const status = server.show === 1 ? 'online' : 'offline'
  return configs[status] || { label: status, color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 获取服务器类型显示配置
 */
const getServerTypeDisplay = (server: ShadowsocksServerResponse) => {
  const types = {
    'ss': 'Shadowsocks',
    'ssr': 'ShadowsocksR',
    'vmess': 'VMess',
    'trojan': 'Trojan'
  }
  return types[server.cipher || 'ss'] || server.cipher
}

/**
 * 格式化服务器负载显示
 */
const formatServerLoad = (server: ShadowsocksServerResponse): string => {
  if (!server.traffic || !server.traffic_limit) return '0%'
  const usage = (server.traffic / server.traffic_limit) * 100
  return `${usage.toFixed(1)}%`
}

/**
 * 检查服务器是否在线
 */
const checkServerOnline = (server: ShadowsocksServerResponse): boolean => {
  return server.show === 1
}

/**
 * 检查服务器是否超负荷
 */
const checkServerOverloaded = (server: ShadowsocksServerResponse): boolean => {
  if (!server.traffic || !server.traffic_limit) return false
  return server.traffic >= server.traffic_limit * 0.9 // 超过90%视为超负荷
}

/**
 * 计算服务器健康分数
 */
const calculateHealthScore = (server: ShadowsocksServerResponse): number => {
  let score = 100
  
  // 离线扣50分
  if (server.show !== 1) score -= 50
  
  // 流量使用率
  if (server.traffic && server.traffic_limit) {
    const usage = server.traffic / server.traffic_limit
    if (usage > 0.9) score -= 30
    else if (usage > 0.7) score -= 15
    else if (usage > 0.5) score -= 5
  }
  
  return Math.max(0, score)
}

/**
 * 服务器查询相关的工具函数
 */
export const serverQueryUtils = {
  /**
   * 格式化服务器地址显示
   */
  formatServerAddress: (server: ShadowsocksServerResponse): string => {
    return `${server.host}:${server.port}`
  },

  /**
   * 格式化流量显示
   */
  formatTraffic: (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  },

  /**
   * 获取服务器健康状态
   */
  getHealthStatus: (score: number): string => {
    if (score >= 80) return '健康'
    if (score >= 60) return '一般'
    if (score >= 40) return '警告'
    return '危险'
  },

  /**
   * 检查服务器是否需要维护
   */
  needsMaintenance: (server: ShadowsocksServerResponse): boolean => {
    const healthScore = calculateHealthScore(server)
    return healthScore < 60
  },

  formatServerLoad,
  getServerStatusDisplay,
  getServerTypeDisplay,
  checkServerOnline,
  checkServerOverloaded,
  calculateHealthScore,
}

// ==================== 默认导出 ====================

export default {
  useShadowsocksServers,
  useShadowsocksServer,
  useServerStatistics,
  useServerHealth,
  useInfiniteShadowsocksServers,
  useOnlineServers,
  useOfflineServers,
  useServersByGroup,
  useSearchServers,
  serverQueryUtils
}