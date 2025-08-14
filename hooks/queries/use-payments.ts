'use client'

/**
 * 支付配置查询 Hooks
 * 
 * 基于 React Query 实现的支付配置和重试策略数据查询钩子集合
 * 支持支付配置、支付方法、重试策略等功能
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务25实现：支付查询Hooks - 支付配置和重试管理模块
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { paymentService } from '@/lib/payment-service'
import { paymentRetryService } from '@/lib/payment-retry-service'
import { queryKeys } from '@/lib/query-keys'
import { createQueryOptions, DataType } from '@/lib/cache-strategies'
import { reactQueryErrorUtils } from '@/lib/error-handler'
import {
  PaymentConfigResponse,
  PaymentConfigsQueryParams,
  PaymentConfigsApiResponse,
  ApiResponse
} from '@/lib/payment-types'
import {
  RetryStrategy,
  RetryStrategiesQueryParams,
  RetryStrategiesApiResponse,
  RetryConfig,
  PaymentMethodOption,
  ErrorConditionOption
} from '@/lib/payment-retry-types'

// ==================== 类型定义 ====================

/**
 * 支付配置列表查询参数
 */
export interface UsePaymentConfigsParams extends PaymentConfigsQueryParams {
  enabled?: boolean
}

/**
 * 支付配置详情查询参数
 */
export interface UsePaymentConfigParams {
  id: number
  enabled?: boolean
}

/**
 * 重试策略列表查询参数
 */
export interface UseRetryStrategiesParams extends RetryStrategiesQueryParams {
  enabled?: boolean
}

/**
 * 重试策略详情查询参数
 */
export interface UseRetryStrategyParams {
  id: string
  enabled?: boolean
}

// ==================== 支付配置查询 Hooks ====================

/**
 * 获取支付配置列表
 * 支持分页、筛选、排序等功能
 */
export const usePaymentConfigs = (params: UsePaymentConfigsParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.payments.list(queryParams),
    queryFn: () => paymentService.getPaymentConfigs(queryParams),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      select: (data: PaymentConfigsApiResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(config => ({
              ...config,
              // 添加计算属性
              statusConfig: getPaymentStatusConfig(config.is_enabled),
              methodLabel: formatPaymentMethodLabel(config.method),
              feeDisplay: formatFeeDisplay(config.fixed_fee, config.percentage_fee),
              currencyList: parseCurrencyList(config.supported_currencies),
              isConfigured: checkConfigurationStatus(config),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'payments',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个支付配置详情
 */
export const usePaymentConfig = (params: UsePaymentConfigParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.payments.detail(id),
    queryFn: () => paymentService.getPaymentConfigs({ limit: 1000 }).then(response => {
      if (response.code === 0) {
        const config = response.data.find(c => c.id === id)
        if (config) {
          return { code: 0, message: 'Success', data: config } as ApiResponse<PaymentConfigResponse>
        }
      }
      throw new Error('Payment config not found')
    }),
    ...createQueryOptions(DataType.STATIC, {
      enabled: enabled && !!id,
      select: (data: ApiResponse<PaymentConfigResponse>) => {
        // 增强支付配置详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getPaymentStatusConfig(data.data.is_enabled),
              methodLabel: formatPaymentMethodLabel(data.data.method),
              feeDisplay: formatFeeDisplay(data.data.fixed_fee, data.data.percentage_fee),
              currencyList: parseCurrencyList(data.data.supported_currencies),
              isConfigured: checkConfigurationStatus(data.data),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'payments',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

/**
 * 获取支付方法列表
 */
export const usePaymentMethods = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.payments.providers(),
    queryFn: () => {
      const methods = paymentService.getPaymentMethods()
      return Promise.resolve({
        code: 0,
        message: 'Success',
        data: methods.map(method => ({
          value: method.value,
          label: method.label,
          enabled: true,
          description: getPaymentMethodDescription(method.value)
        }))
      })
    },
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'payments',
          operation: 'methods'
        })
      }
    })
  })
}

// ==================== 支付重试策略查询 Hooks ====================

/**
 * 获取重试策略列表
 * 支持分页、筛选、排序等功能
 */
export const usePaymentRetryStrategies = (params: UseRetryStrategiesParams = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.paymentRetry.list(queryParams),
    queryFn: () => paymentRetryService.getRetryStrategies(queryParams),
    ...createQueryOptions(DataType.USER, {
      enabled,
      select: (data: RetryStrategiesApiResponse) => {
        // 数据转换和增强
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: data.data.map(strategy => ({
              ...strategy,
              // 添加计算属性
              statusConfig: getRetryStrategyStatusConfig(strategy.enabled),
              methodsDisplay: formatPaymentMethodsDisplay(strategy.payment_methods),
              conditionsDisplay: formatErrorConditionsDisplay(strategy.error_conditions),
              intervalsDisplay: formatRetryIntervalsDisplay(strategy.retry_intervals),
              performanceScore: calculateStrategyPerformanceScore(strategy),
            }))
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'paymentRetry',
          operation: 'list',
          params: queryParams
        })
      }
    })
  })
}

/**
 * 获取单个重试策略详情
 */
export const usePaymentRetryStrategy = (params: UseRetryStrategyParams) => {
  const { id, enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.paymentRetry.detail(id),
    queryFn: () => paymentRetryService.getRetryStrategy(id),
    ...createQueryOptions(DataType.USER, {
      enabled: enabled && !!id,
      select: (data: ApiResponse<RetryStrategy>) => {
        // 增强重试策略详情数据
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getRetryStrategyStatusConfig(data.data.enabled),
              methodsDisplay: formatPaymentMethodsDisplay(data.data.payment_methods),
              conditionsDisplay: formatErrorConditionsDisplay(data.data.error_conditions),
              intervalsDisplay: formatRetryIntervalsDisplay(data.data.retry_intervals),
              performanceScore: calculateStrategyPerformanceScore(data.data),
              totalRetryTime: calculateTotalRetryTime(data.data.retry_intervals),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'paymentRetry',
          operation: 'detail',
          params: { id }
        })
      }
    })
  })
}

// ==================== 配置和选项查询 Hooks ====================

/**
 * 获取重试配置
 */
export const useRetryConfig = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.paymentRetry.all.concat(['config']),
    queryFn: () => paymentRetryService.getRetryConfig(),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      select: (data: ApiResponse<RetryConfig>) => {
        if (data.code === 0 && data.data) {
          return {
            ...data,
            data: {
              ...data.data,
              statusConfig: getRetryConfigStatusConfig(data.data.enabled),
              windowDisplay: formatRetryWindowDisplay(data.data.retry_window_hours),
              cancelTimeDisplay: formatCancelTimeDisplay(data.data.auto_cancel_after_hours),
            }
          }
        }
        return data
      },
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'paymentRetry',
          operation: 'config'
        })
      }
    })
  })
}

/**
 * 获取错误条件选项
 */
export const useErrorConditions = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.paymentRetry.all.concat(['error-conditions']),
    queryFn: () => paymentRetryService.getErrorConditions(),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'paymentRetry',
          operation: 'error-conditions'
        })
      }
    })
  })
}

/**
 * 获取支付方式选项（用于重试策略）
 */
export const useRetryPaymentMethods = (params: { enabled?: boolean } = {}) => {
  const { enabled = true } = params
  
  return useQuery({
    queryKey: queryKeys.paymentRetry.all.concat(['payment-methods']),
    queryFn: () => paymentRetryService.getPaymentMethods(),
    ...createQueryOptions(DataType.STATIC, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'paymentRetry',
          operation: 'payment-methods'
        })
      }
    })
  })
}

// ==================== 重试记录查询 Hooks ====================

/**
 * 获取重试记录列表
 */
export const usePaymentRetryRecords = (params: {
  limit?: number
  offset?: number
  status?: string
  payment_method?: string
  error_type?: string
  date_from?: string
  date_to?: string
  enabled?: boolean
} = {}) => {
  const { enabled = true, ...queryParams } = params
  
  return useQuery({
    queryKey: queryKeys.paymentRetry.all.concat(['records', queryParams]),
    queryFn: () => paymentRetryService.getRetryRecords(queryParams),
    ...createQueryOptions(DataType.REALTIME, {
      enabled,
      onError: (error) => {
        reactQueryErrorUtils.handleQueryError(error, {
          module: 'paymentRetry',
          operation: 'records'
        })
      }
    })
  })
}

// ==================== 工具函数 ====================

/**
 * 获取支付配置状态配置
 */
const getPaymentStatusConfig = (isEnabled: boolean) => {
  return isEnabled
    ? { label: '已启用', color: 'bg-green-100 text-green-800', variant: 'default' as const }
    : { label: '已禁用', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 获取重试策略状态配置
 */
const getRetryStrategyStatusConfig = (isEnabled: boolean) => {
  return isEnabled
    ? { label: '已启用', color: 'bg-green-100 text-green-800', variant: 'default' as const }
    : { label: '已禁用', color: 'bg-gray-100 text-gray-800', variant: 'outline' as const }
}

/**
 * 获取重试配置状态配置
 */
const getRetryConfigStatusConfig = (isEnabled: boolean) => {
  return isEnabled
    ? { label: '重试开启', color: 'bg-green-100 text-green-800', variant: 'default' as const }
    : { label: '重试关闭', color: 'bg-red-100 text-red-800', variant: 'destructive' as const }
}

/**
 * 格式化支付方法标签
 */
const formatPaymentMethodLabel = (method: string): string => {
  const methodLabels = {
    epay: '易支付 (EPay)',
    crypto_btc: '加密货币 Bitcoin',
    crypto_eth: '加密货币 Ethereum',
    crypto_usdt: '加密货币 USDT',
    stripe: 'Stripe',
    paypal: 'PayPal',
    alipay: '支付宝',
    wechat_pay: '微信支付',
  }
  return methodLabels[method as keyof typeof methodLabels] || method
}

/**
 * 格式化费用显示
 */
const formatFeeDisplay = (fixedFee: number, percentageFee: number): string => {
  const parts: string[] = []
  
  if (fixedFee > 0) {
    parts.push(`固定费用: ¥${fixedFee.toFixed(2)}`)
  }
  
  if (percentageFee > 0) {
    parts.push(`手续费率: ${percentageFee.toFixed(2)}%`)
  }
  
  return parts.length > 0 ? parts.join(', ') : '无费用'
}

/**
 * 解析货币列表
 */
const parseCurrencyList = (currencies: string): string[] => {
  if (!currencies) return []
  return currencies.split(',').map(c => c.trim()).filter(Boolean)
}

/**
 * 检查配置状态
 */
const checkConfigurationStatus = (config: PaymentConfigResponse): boolean => {
  return !!(config.name && config.method && config.url && config.pid && config.key)
}

/**
 * 获取支付方法描述
 */
const getPaymentMethodDescription = (method: string): string => {
  const descriptions = {
    epay: '易支付接口，支持多种支付方式',
    crypto_btc: '比特币数字货币支付',
    crypto_eth: '以太坊数字货币支付',
    crypto_usdt: 'USDT稳定币支付',
    stripe: '国际信用卡支付',
    paypal: 'PayPal在线支付',
    alipay: '支付宝快捷支付',
    wechat_pay: '微信支付',
  }
  return descriptions[method as keyof typeof descriptions] || '支付方式'
}

/**
 * 格式化支付方式显示
 */
const formatPaymentMethodsDisplay = (methods: string[]): string => {
  if (!methods || methods.length === 0) return '无限制'
  
  const labels = methods.map(method => formatPaymentMethodLabel(method))
  if (labels.length <= 3) {
    return labels.join(', ')
  }
  
  return `${labels.slice(0, 3).join(', ')} 等${labels.length}种`
}

/**
 * 格式化错误条件显示
 */
const formatErrorConditionsDisplay = (conditions: string[]): string => {
  if (!conditions || conditions.length === 0) return '全部错误'
  
  const conditionLabels = {
    network_error: '网络错误',
    timeout: '超时',
    gateway_error: '网关错误',
    insufficient_funds: '余额不足',
    card_declined: '卡片被拒',
    authentication_failed: '认证失败',
    rate_limit: '频率限制',
    system_error: '系统错误',
    unknown: '未知错误'
  }
  
  const labels = conditions.map(condition => 
    conditionLabels[condition as keyof typeof conditionLabels] || condition
  )
  
  if (labels.length <= 3) {
    return labels.join(', ')
  }
  
  return `${labels.slice(0, 3).join(', ')} 等${labels.length}种`
}

/**
 * 格式化重试间隔显示
 */
const formatRetryIntervalsDisplay = (intervals: number[]): string => {
  if (!intervals || intervals.length === 0) return '无重试'
  
  const formatInterval = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}分钟`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}小时`
    return `${Math.floor(seconds / 86400)}天`
  }
  
  const formatted = intervals.map(formatInterval)
  if (formatted.length <= 3) {
    return formatted.join(' → ')
  }
  
  return `${formatted.slice(0, 3).join(' → ')} ... (${intervals.length}次)`
}

/**
 * 计算策略性能评分（简化版）
 */
const calculateStrategyPerformanceScore = (strategy: RetryStrategy): number => {
  // 基于配置合理性的简单评分算法
  let score = 50 // 基础分
  
  // 重试次数合理性 (3-5次为最佳)
  if (strategy.max_attempts >= 3 && strategy.max_attempts <= 5) {
    score += 20
  } else if (strategy.max_attempts > 0) {
    score += 10
  }
  
  // 重试间隔合理性
  if (strategy.retry_intervals.length > 0) {
    const hasReasonableIntervals = strategy.retry_intervals.every(
      interval => interval >= 30 && interval <= 3600
    )
    if (hasReasonableIntervals) score += 20
    else score += 10
  }
  
  // 配置完整性
  if (strategy.payment_methods.length > 0) score += 5
  if (strategy.error_conditions.length > 0) score += 5
  
  return Math.min(100, Math.max(0, score))
}

/**
 * 计算总重试时间
 */
const calculateTotalRetryTime = (intervals: number[]): number => {
  return intervals.reduce((total, interval) => total + interval, 0)
}

/**
 * 格式化重试窗口显示
 */
const formatRetryWindowDisplay = (hours: number): string => {
  if (hours < 24) return `${hours}小时`
  return `${Math.floor(hours / 24)}天`
}

/**
 * 格式化取消时间显示
 */
const formatCancelTimeDisplay = (hours: number): string => {
  if (hours < 24) return `${hours}小时后自动取消`
  return `${Math.floor(hours / 24)}天后自动取消`
}

/**
 * 支付查询相关的工具函数
 */
export const paymentQueryUtils = {
  formatPaymentMethodLabel,
  formatFeeDisplay,
  parseCurrencyList,
  checkConfigurationStatus,
  getPaymentMethodDescription,
  formatPaymentMethodsDisplay,
  formatErrorConditionsDisplay,
  formatRetryIntervalsDisplay,
  calculateStrategyPerformanceScore,
  calculateTotalRetryTime,
  formatRetryWindowDisplay,
  formatCancelTimeDisplay,
}

// ==================== 默认导出 ====================

export default {
  usePaymentConfigs,
  usePaymentConfig,
  usePaymentMethods,
  usePaymentRetryStrategies,
  usePaymentRetryStrategy,
  useRetryConfig,
  useErrorConditions,
  useRetryPaymentMethods,
  usePaymentRetryRecords,
  paymentQueryUtils
}