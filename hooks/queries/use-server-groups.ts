'use client'

/**
 * 服务器组查询 Hooks
 * 
 * 基于 React Query 实现的服务器组数据查询钩子集合
 * 支持服务器组列表、详情、服务器关联等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务29实现：服务器查询Hooks - 服务器组模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { serverGroupService } from '@/lib/server-group-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  ServerGroupResponse,
  ServerGroupSearchParams,
  ServerGroupListResponse,
  ServerGroupDetailResponse
} from '@/lib/server-group-types'

// ==================== 类型定义 ====================

/**
 * 服务器组列表查询参数
 */
export interface UseServerGroupsParams extends ServerGroupSearchParams {
  enabled?: boolean
}

/**
 * 服务器组详情查询参数
 */
export interface UseServerGroupParams {
  id: number
  enabled?: boolean
}

/**
 * 服务器组统计查询参数
 */
export interface UseServerGroupStatisticsParams {
  enabled?: boolean
}

// ==================== 基础查询 Hooks ====================

/**
 * 获取服务器组列表
 * 支持分页、筛选、排序等功能
 */
export const useServerGroups = (params: UseServerGroupsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.serverGroups.list(queryParams),
    queryFn: () => serverGroupService.getServerGroups(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: ServerGroupListResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data && data.data.items) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(group => ({
                ...group,
                // 添加计算属性
                serverCountDisplay: formatServerCount(group),
                trafficDisplay: formatGroupTraffic(group),
                statusDisplay: getGroupStatusDisplay(group),
                utilizationRate: calculateUtilizationRate(group),
                isActive: checkGroupActive(group),
                isFull: checkGroupFull(group),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'serverGroups',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个服务器组详情
 */
export const useServerGroup = (params: UseServerGroupParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.serverGroups.detail(id),
    queryFn: () => serverGroupService.getServerGroupById(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id && id > 0,
      select: (data: ServerGroupDetailResponse) => {
        // 增强服务器组详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              serverCountDisplay: formatServerCount(data.data),
              trafficDisplay: formatGroupTraffic(data.data),
              statusDisplay: getGroupStatusDisplay(data.data),
              utilizationRate: calculateUtilizationRate(data.data),
              isActive: checkGroupActive(data.data),
              isFull: checkGroupFull(data.data),
              healthScore: calculateGroupHealthScore(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'serverGroups',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取服务器组的服务器列表
 */
export const useServerGroupServers = (groupId: number, params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.serverGroups.servers(groupId),
    queryFn: () => serverGroupService.getServerGroupServers(groupId),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!groupId && groupId > 0,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'serverGroups',
          operation: 'servers',
          params: { groupId }
        })
      }
    })
  })
}

/**
 * 获取服务器组统计信息
 */
export const useServerGroupStatistics = (params: UseServerGroupStatisticsParams = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.serverGroups.statistics(),
    queryFn: () => serverGroupService.getServerGroupStatistics(),
    ...createQueryOptions(DataType.STATS, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'serverGroups',
          operation: 'statistics'
        })
      }
    })
  })
}

// ==================== 无限查询 Hooks ====================

/**
 * 无限加载服务器组列表
 * 适用于需要滚动加载更多服务器组的场景
 */
export const useInfiniteServerGroups = (params: Omit<UseServerGroupsParams, 'page'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.serverGroups.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 1 }) => 
      serverGroupService.getServerGroups({ ...queryParams, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ServerGroupListResponse, allPages) => {
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
          module: 'serverGroups',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<ServerGroupListResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取活跃的服务器组
 */
export const useActiveServerGroups = (params: UseServerGroupsParams = {}) => {
  return useServerGroups({
    ...params,
    // 可以添加特定的筛选条件
  })
}

/**
 * 获取有可用服务器的组
 */
export const useAvailableServerGroups = (params: UseServerGroupsParams = {}) => {
  const result = useServerGroups(params)
  
  return {
    ...result,
    data: result.data ? {
      ...result.data,
      data: {
        ...result.data.data,
        items: result.data.data?.items?.filter(group => !checkGroupFull(group)) || []
      }
    } : result.data
  }
}

/**
 * 根据名称搜索服务器组
 */
export const useSearchServerGroups = (searchTerm: string, params: UseServerGroupsParams = {}) => {
  return useServerGroups({
    ...params,
    // 添加搜索参数（如果API支持）
    enabled: params.enabled !== false && !!searchTerm && searchTerm.length > 0
  })
}

// ==================== 工具函数 ====================

/**
 * 格式化服务器数量显示
 */
const formatServerCount = (group: ServerGroupResponse): string => {
  const count = group.server_count || 0
  const limit = group.server_limit || 0
  
  if (limit > 0) {
    return `${count}/${limit}`
  }
  return `${count}`
}

/**
 * 格式化组流量显示
 */
const formatGroupTraffic = (group: ServerGroupResponse): string => {
  const traffic = group.total_traffic || 0
  const limit = group.traffic_limit || 0
  
  if (limit > 0) {
    const usage = (traffic / limit) * 100
    return `${usage.toFixed(1)}%`
  }
  return formatTraffic(traffic)
}

/**
 * 获取服务器组状态显示配置
 */
const getGroupStatusDisplay = (group: ServerGroupResponse) => {
  const configs = {
    active: { label: '活跃', color: 'bg-green-100 text-green-800', variant: 'default' as const },
    inactive: { label: '未激活', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const },
    full: { label: '已满', color: 'bg-yellow-100 text-yellow-800', variant: 'secondary' as const },
    maintenance: { label: '维护中', color: 'bg-red-100 text-red-800', variant: 'destructive' as const },
  }
  
  if (checkGroupFull(group)) return configs.full
  if (!checkGroupActive(group)) return configs.inactive
  return configs.active
}

/**
 * 计算组的利用率
 */
const calculateUtilizationRate = (group: ServerGroupResponse): number => {
  const serverUtil = group.server_limit > 0 
    ? (group.server_count / group.server_limit) * 100 
    : 0
    
  const trafficUtil = group.traffic_limit > 0 
    ? ((group.total_traffic || 0) / group.traffic_limit) * 100 
    : 0
    
  return Math.max(serverUtil, trafficUtil)
}

/**
 * 检查服务器组是否活跃
 */
const checkGroupActive = (group: ServerGroupResponse): boolean => {
  return (group.server_count || 0) > 0
}

/**
 * 检查服务器组是否已满
 */
const checkGroupFull = (group: ServerGroupResponse): boolean => {
  if (group.server_limit > 0 && group.server_count >= group.server_limit) {
    return true
  }
  if (group.traffic_limit > 0 && (group.total_traffic || 0) >= group.traffic_limit) {
    return true
  }
  return false
}

/**
 * 计算服务器组健康分数
 */
const calculateGroupHealthScore = (group: ServerGroupResponse): number => {
  let score = 100
  
  // 无服务器扣30分
  if (!group.server_count || group.server_count === 0) score -= 30
  
  // 服务器使用率
  if (group.server_limit > 0) {
    const serverUsage = group.server_count / group.server_limit
    if (serverUsage >= 1) score -= 20
    else if (serverUsage > 0.8) score -= 10
  }
  
  // 流量使用率
  if (group.traffic_limit > 0 && group.total_traffic) {
    const trafficUsage = group.total_traffic / group.traffic_limit
    if (trafficUsage >= 1) score -= 30
    else if (trafficUsage > 0.9) score -= 20
    else if (trafficUsage > 0.7) score -= 10
  }
  
  return Math.max(0, score)
}

/**
 * 格式化流量显示
 */
const formatTraffic = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
}

/**
 * 服务器组查询相关的工具函数
 */
export const serverGroupQueryUtils = {
  /**
   * 格式化服务器组名称
   */
  formatGroupName: (group: ServerGroupResponse): string => {
    return group.name || `服务器组 #${group.id}`
  },

  /**
   * 获取组的可用容量
   */
  getAvailableCapacity: (group: ServerGroupResponse): number => {
    if (group.server_limit > 0) {
      return Math.max(0, group.server_limit - group.server_count)
    }
    return Infinity
  },

  /**
   * 获取组的健康状态
   */
  getHealthStatus: (score: number): string => {
    if (score >= 80) return '健康'
    if (score >= 60) return '一般'
    if (score >= 40) return '警告'
    return '危险'
  },

  /**
   * 检查组是否需要扩容
   */
  needsExpansion: (group: ServerGroupResponse): boolean => {
    const utilRate = calculateUtilizationRate(group)
    return utilRate > 80
  },

  /**
   * 获取组的优先级
   */
  getGroupPriority: (group: ServerGroupResponse): string => {
    const healthScore = calculateGroupHealthScore(group)
    if (healthScore >= 80) return '高'
    if (healthScore >= 50) return '中'
    return '低'
  },

  formatServerCount,
  formatGroupTraffic,
  formatTraffic,
  getGroupStatusDisplay,
  calculateUtilizationRate,
  checkGroupActive,
  checkGroupFull,
  calculateGroupHealthScore,
}

// ==================== 默认导出 ====================

export default {
  useServerGroups,
  useServerGroup,
  useServerGroupServers,
  useServerGroupStatistics,
  useInfiniteServerGroups,
  useActiveServerGroups,
  useAvailableServerGroups,
  useSearchServerGroups,
  serverGroupQueryUtils
}