'use client'

/**
 * 服务器查询 Hooks
 * 
 * 基于 React Query 实现的服务器数据查询钩子集合
 * 支持 Shadowsocks 节点、服务器分组的列表、详情、统计等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务29实现：服务器查询Hooks - 服务器管理模块
 */

import { useQuery, useInfiniteQuery, UseQueryOptions, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { shadowsocksServerService } from '@/lib/shadowsocks-service'
import { serverGroupService } from '@/lib/server-group-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  ShadowsocksServerResponse,
  ShadowsocksServerListResponse,
  ShadowsocksServerDetailResponse,
  ShadowsocksServerSearchParams,
} from '@/lib/shadowsocks-types'
import {
  ServerGroupResponse,
  ServerGroupListResponse,
  ServerGroupDetailResponse,
  ServerGroupSearchParams,
} from '@/lib/server-group-types'
import { StandardResponse } from '@/lib/types'

// ==================== 类型定义 ====================

/**
 * 服务器列表查询参数
 */
export interface UseServersParams extends ShadowsocksServerSearchParams {
  enabled?: boolean
}

/**
 * 服务器详情查询参数
 */
export interface UseServerParams {
  id: number
  enabled?: boolean
}

/**
 * 服务器分组列表查询参数
 */
export interface UseServerGroupsParams extends ServerGroupSearchParams {
  enabled?: boolean
}

/**
 * 服务器分组详情查询参数
 */
export interface UseServerGroupParams {
  id: number
  enabled?: boolean
}

/**
 * 按分组获取服务器参数
 */
export interface UseServersByGroupParams {
  groupId: number
  enabled?: boolean
}

/**
 * 可用服务器查询参数
 */
export interface UseAvailableServersParams {
  enabled?: boolean
}

// ==================== Shadowsocks 服务器查询 Hooks ====================

/**
 * 获取 Shadowsocks 服务器列表
 * 支持分页、筛选、排序等功能
 */
export const useServers = (params: UseServersParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.shadowsocks.list(queryParams),
    queryFn: () => shadowsocksServerService.getServers(queryParams),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      select: (data: ShadowsocksServerListResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(server => ({
                ...server,
                // 添加计算属性
                displayName: shadowsocksServerService.formatServerDisplayName(server),
                serverAddress: shadowsocksServerService.formatServerAddress(server),
                rateMultiplier: shadowsocksServerService.formatRateMultiplier(server.rate),
                cipherDisplayName: shadowsocksServerService.getCipherDisplayName(server.cipher),
                obfsDisplayName: shadowsocksServerService.getObfsDisplayName(server.obfs),
                showStatus: shadowsocksServerService.getServerShowStatus(server),
                createdAtFormatted: shadowsocksServerService.formatDateTime(server.created_at),
                updatedAtFormatted: shadowsocksServerService.formatDateTime(server.updated_at),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
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
export const useServer = (params: UseServerParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.shadowsocks.detail(id),
    queryFn: () => shadowsocksServerService.getServer(id),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!id,
      select: (data: ShadowsocksServerDetailResponse) => {
        // 增强服务器详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              displayName: shadowsocksServerService.formatServerDisplayName(data.data),
              serverAddress: shadowsocksServerService.formatServerAddress(data.data),
              rateMultiplier: shadowsocksServerService.formatRateMultiplier(data.data.rate),
              cipherDisplayName: shadowsocksServerService.getCipherDisplayName(data.data.cipher),
              obfsDisplayName: shadowsocksServerService.getObfsDisplayName(data.data.obfs),
              showStatus: shadowsocksServerService.getServerShowStatus(data.data),
              createdAtFormatted: shadowsocksServerService.formatDateTime(data.data.created_at),
              updatedAtFormatted: shadowsocksServerService.formatDateTime(data.data.updated_at),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取指定分组下的服务器列表
 */
export const useServersByGroup = (params: UseServersByGroupParams) => {
  const { groupId, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.shadowsocks.byGroup(groupId),
    queryFn: () => shadowsocksServerService.getServersByGroup(groupId),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!groupId,
      select: (data: ShadowsocksServerListResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(server => ({
                ...server,
                displayName: shadowsocksServerService.formatServerDisplayName(server),
                serverAddress: shadowsocksServerService.formatServerAddress(server),
                rateMultiplier: shadowsocksServerService.formatRateMultiplier(server.rate),
                showStatus: shadowsocksServerService.getServerShowStatus(server),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
          operation: 'by-group',
          params: { groupId }
        })
      }
    })
  })
}

/**
 * 获取服务器统计信息
 */
export const useServerStats = (serverId: number, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: queryKeys.shadowsocks.stats(),
    queryFn: () => shadowsocksServerService.getServerStatistics(serverId),
    ...createQueryOptions(DataType.STATS, {
      enabled: enabled && !!serverId,
      select: (data: StandardResponse) => {
        // 统计数据可以在这里进行格式化和计算
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
          operation: 'stats',
          params: { serverId }
        })
      }
    })
  })
}

/**
 * 获取服务器状态信息
 */
export const useServerStatus = (serverId: number, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: [...queryKeys.shadowsocks.all, 'status', serverId],
    queryFn: () => shadowsocksServerService.getServerStatus(serverId),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!serverId,
      refetchInterval: 5000, // 每5秒轮询一次服务器状态
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
          operation: 'status',
          params: { serverId }
        })
      }
    })
  })
}

/**
 * 获取服务器健康状态
 */
export const useServerHealth = (serverId: number, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: [...queryKeys.shadowsocks.all, 'health', serverId],
    queryFn: () => shadowsocksServerService.getServerHealth(serverId),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!serverId,
      refetchInterval: 10000, // 每10秒检查一次健康状态
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
          operation: 'health',
          params: { serverId }
        })
      }
    })
  })
}

/**
 * 获取可用服务器列表
 * 仅显示启用状态且可见的服务器
 */
export const useAvailableServers = (params: UseAvailableServersParams = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: [...queryKeys.shadowsocks.all, 'available'],
    queryFn: () => shadowsocksServerService.getServers({ show: 1 }),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      select: (data: ShadowsocksServerListResponse) => {
        if (data.code === 0 && data.data) {
          // 过滤可用服务器
          const availableServers = data.data.items.filter(server => 
            shadowsocksServerService.getServerShowStatus(server)
          )
          
          return {
            ...data,
            data: {
              ...data.data,
              items: availableServers.map(server => ({
                ...server,
                displayName: shadowsocksServerService.formatServerDisplayName(server),
                serverAddress: shadowsocksServerService.formatServerAddress(server),
                rateMultiplier: shadowsocksServerService.formatRateMultiplier(server.rate),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
          operation: 'available',
        })
      }
    })
  })
}

// ==================== 服务器分组查询 Hooks ====================

/**
 * 获取服务器分组列表
 * 支持分页功能
 */
export const useServerGroups = (params: UseServerGroupsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.serverGroups.list(queryParams),
    queryFn: () => serverGroupService.getServerGroups(queryParams),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      select: (data: ServerGroupListResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(group => ({
                ...group,
                displayName: serverGroupService.formatServerGroupDisplayName(group),
                createdAtFormatted: serverGroupService.formatDateTime(group.created_at),
                updatedAtFormatted: serverGroupService.formatDateTime(group.updated_at),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'server-groups',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取所有服务器分组（不分页）
 * 适用于下拉选择等场景
 */
export const useAllServerGroups = (options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: [...queryKeys.serverGroups.all, 'all'],
    queryFn: () => serverGroupService.getAllServerGroups(),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      select: (data: ServerGroupListResponse) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              items: data.data.items.map(group => ({
                ...group,
                displayName: serverGroupService.formatServerGroupDisplayName(group),
              }))
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'server-groups',
          operation: 'all'
        })
      }
    })
  })
}

/**
 * 获取单个服务器分组详情
 */
export const useServerGroup = (params: UseServerGroupParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.serverGroups.detail(id),
    queryFn: () => serverGroupService.getServerGroup(id),
    ...createQueryOptions(DataType.STATIC, {
      enabled: enabled && !!id,
      select: (data: ServerGroupDetailResponse) => {
        // 增强服务器分组详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              displayName: serverGroupService.formatServerGroupDisplayName(data.data),
              createdAtFormatted: serverGroupService.formatDateTime(data.data.created_at),
              updatedAtFormatted: serverGroupService.formatDateTime(data.data.updated_at),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'server-groups',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取服务器分组的统计信息
 */
export const useServerGroupStats = (groupId: number, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: queryKeys.serverGroups.stats(),
    queryFn: () => serverGroupService.getServerGroupStatistics(groupId),
    ...createQueryOptions(DataType.STATS, {
      enabled: enabled && !!groupId,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'server-groups',
          operation: 'stats',
          params: { groupId }
        })
      }
    })
  })
}

/**
 * 获取服务器分组内的所有服务器
 */
export const useServerGroupServers = (groupId: number, options?: { enabled?: boolean }) => {
  const { enabled = true } = options || {}
  
  return useQuery({
    queryKey: [...queryKeys.serverGroups.all, 'servers', groupId],
    queryFn: () => serverGroupService.getServerGroupServers(groupId),
    ...createQueryOptions(DataType.REALTIME, {
      enabled: enabled && !!groupId,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'server-groups',
          operation: 'servers',
          params: { groupId }
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
export const useInfiniteServers = (params: Omit<UseServersParams, 'page'> & { limit?: number } = {}) => {
  const { enabled = true, limit = 20, ...queryParams } = params
  
  return useInfiniteQuery({
    queryKey: queryKeys.shadowsocks.list({ ...queryParams, limit }),
    queryFn: ({ pageParam = 1 }) => 
      shadowsocksServerService.getServers({ ...queryParams, page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: (lastPage: ShadowsocksServerListResponse) => {
      if (lastPage.code === 0 && lastPage.data) {
        const { pagination } = lastPage.data
        const currentPage = pagination.page || 1
        const totalPages = pagination.total_pages || Math.ceil(pagination.total / pagination.limit)
        
        return currentPage < totalPages ? currentPage + 1 : undefined
      }
      return undefined
    },
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'servers',
          operation: 'infinite-list',
          params: queryParams
        })
      }
    }) as Partial<UseInfiniteQueryOptions<ShadowsocksServerListResponse, Error>>
  })
}

// ==================== 条件查询 Hooks ====================

/**
 * 获取显示状态的服务器列表
 */
export const useVisibleServers = (params: Omit<UseServersParams, 'show'> = {}) => {
  return useServers({
    ...params,
    show: 1
  })
}

/**
 * 获取隐藏状态的服务器列表
 */
export const useHiddenServers = (params: Omit<UseServersParams, 'show'> = {}) => {
  return useServers({
    ...params,
    show: 0
  })
}

/**
 * 获取最近更新的服务器（默认最近7天）
 */
export const useRecentServers = (days: number = 7, params: UseServersParams = {}) => {
  return useServers({
    ...params,
    sort_by: 'updated_at',
    sort_order: 'desc'
  })
}

// ==================== 工具函数 ====================

/**
 * 服务器查询相关的工具函数
 */
export const serverQueryUtils = {
  /**
   * 检查服务器是否可编辑
   */
  canEditServer: (server: ShadowsocksServerResponse, currentUserRole: string): boolean => {
    return shadowsocksServerService.canEditServer(server, currentUserRole)
  },

  /**
   * 检查服务器是否可删除
   */
  canDeleteServer: (server: ShadowsocksServerResponse, currentUserRole: string): boolean => {
    return shadowsocksServerService.canDeleteServer(server, currentUserRole)
  },

  /**
   * 格式化服务器显示名称
   */
  formatDisplayName: (server: ShadowsocksServerResponse): string => {
    return shadowsocksServerService.formatServerDisplayName(server)
  },

  /**
   * 格式化服务器地址
   */
  formatServerAddress: (server: ShadowsocksServerResponse): string => {
    return shadowsocksServerService.formatServerAddress(server)
  },

  /**
   * 格式化倍率显示
   */
  formatRateMultiplier: (rate: number): string => {
    return shadowsocksServerService.formatRateMultiplier(rate)
  },

  /**
   * 获取加密方式显示名称
   */
  getCipherDisplayName: (cipher: string): string => {
    return shadowsocksServerService.getCipherDisplayName(cipher)
  },

  /**
   * 获取混淆方式显示名称
   */
  getObfsDisplayName: (obfs?: string): string => {
    return shadowsocksServerService.getObfsDisplayName(obfs)
  },

  /**
   * 获取服务器显示状态
   */
  getServerShowStatus: (server: ShadowsocksServerResponse): boolean => {
    return shadowsocksServerService.getServerShowStatus(server)
  },

  /**
   * 格式化时间显示
   */
  formatDateTime: (timestamp: number): string => {
    return shadowsocksServerService.formatDateTime(timestamp)
  },

  /**
   * 验证服务器配置
   */
  validateServerConfig: (data: any): string[] => {
    return shadowsocksServerService.validateServerConfig(data)
  },

  /**
   * 检查服务器分组是否可编辑
   */
  canEditServerGroup: (serverGroup: ServerGroupResponse, currentUserRole: string): boolean => {
    return serverGroupService.canEditServerGroup(serverGroup, currentUserRole)
  },

  /**
   * 检查服务器分组是否可删除
   */
  canDeleteServerGroup: (serverGroup: ServerGroupResponse, currentUserRole: string): boolean => {
    return serverGroupService.canDeleteServerGroup(serverGroup, currentUserRole)
  },

  /**
   * 验证服务器分组配置
   */
  validateServerGroupConfig: (data: any): string[] => {
    return serverGroupService.validateServerGroupConfig(data)
  }
}

// ==================== 默认导出 ====================

export default {
  // Shadowsocks 服务器相关
  useServers,
  useServer,
  useServersByGroup,
  useServerStats,
  useServerStatus,
  useServerHealth,
  useAvailableServers,
  useInfiniteServers,
  useVisibleServers,
  useHiddenServers,
  useRecentServers,
  
  // 服务器分组相关
  useServerGroups,
  useAllServerGroups,
  useServerGroup,
  useServerGroupStats,
  useServerGroupServers,
  
  // 工具函数
  serverQueryUtils
}