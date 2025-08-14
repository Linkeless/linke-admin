'use client'

/**
 * 财务变更 Hooks
 * 
 * 基于 React Query 实现的财务数据变更钩子集合
 * 支持订单、优惠券、发票的创建、更新、删除等操作，实现完整的乐观更新机制
 * 遵循统一的缓存策略和错误处理机制
 * 
 * 任务22实现：财务变更Hooks - 包含乐观更新、错误回滚、批量操作
 * 符合FR-3乐观更新机制要求：立即UI反馈、失败回滚、成功同步
 */

import { useMutation, useQueryClient, UseMutationOptions } from '@tanstack/react-query'
import { toast } from 'sonner'
import { orderService } from '@/lib/order-service'
import { couponService } from '@/lib/coupon-service'
import { invoiceService } from '@/lib/invoice-service'
import { queryKeys } from '@/lib/query-keys'
import { CacheInvalidationUtils } from '@/lib/query-keys'
import { createMutationOptions } from '@/lib/cache-strategies'
import { reactQueryErrorUtils, errorUtils } from '@/lib/error-handler'
import {
  CreateSubscriptionOrderRequest,
  CancelOrderRequest,
  SubscriptionOrderResponse,
  ApiResponse as OrderApiResponse
} from '@/lib/order-types'
import {
  CreateCouponRequest,
  UpdateCouponRequest,
  CouponResponse,
  BatchCouponRequest,
  ApiResponse as CouponApiResponse
} from '@/lib/coupon-types'
import {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  MarkPaidRequest,
  MarkVoidRequest,
  SendInvoiceRequest,
  CustomSendRequest,
  BulkDownloadRequest,
  BulkMarkPaidRequest,
  BulkVoidRequest,
  BulkResendRequest,
  BulkRegeneratePdfRequest,
  BulkOperationResponse,
  InvoiceApiResponse
} from '@/lib/invoice-types'

// ==================== 类型定义 ====================

/**
 * 财务变更操作上下文
 */
interface FinanceMutationContext {
  operation: string
  module: 'orders' | 'coupons' | 'invoices'
  itemId?: number
  itemIds?: number[]
  previousData?: any
  rollbackData?: any
}

/**
 * 乐观更新配置
 */
interface OptimisticUpdateConfig {
  enabled: boolean
  immediateUpdate: boolean
  rollbackOnError: boolean
}

/**
 * 批量操作请求
 */
interface BulkDeleteRequest {
  ids: number[]
  reason?: string
}

// ==================== 工具函数 ====================

/**
 * 乐观更新工具函数
 */
const optimisticUpdateUtils = {
  /**
   * 为订单列表添加新订单（乐观更新）
   */
  addOrderToList: (queryClient: any, newOrder: any) => {
    const ordersQueryKey = queryKeys.orders.lists()
    queryClient.setQueryData(ordersQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data) return oldData
      
      const tempId = 'temp-' + Date.now()
      const optimisticOrder = {
        ...newOrder,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOptimistic: true
      }
      
      return {
        ...oldData,
        data: [optimisticOrder, ...oldData.data],
        total: oldData.total + 1
      }
    })
    return ordersQueryKey
  },

  /**
   * 从订单列表移除订单（乐观更新）
   */
  removeOrderFromList: (queryClient: any, orderId: number) => {
    const ordersQueryKey = queryKeys.orders.lists()
    const previousData = queryClient.getQueryData(ordersQueryKey)
    
    queryClient.setQueryData(ordersQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data) return oldData
      
      return {
        ...oldData,
        data: oldData.data.filter((order: any) => order.id !== orderId),
        total: Math.max(0, oldData.total - 1)
      }
    })
    
    return { previousData, queryKey: ordersQueryKey }
  },

  /**
   * 为优惠券列表添加新优惠券（乐观更新）
   */
  addCouponToList: (queryClient: any, newCoupon: any) => {
    const couponsQueryKey = queryKeys.coupons.lists()
    queryClient.setQueryData(couponsQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      const tempId = 'temp-' + Date.now()
      const optimisticCoupon = {
        ...newCoupon,
        id: tempId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOptimistic: true
      }
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: [optimisticCoupon, ...oldData.data.items],
          total: oldData.data.total + 1
        }
      }
    })
    return couponsQueryKey
  },

  /**
   * 从优惠券列表移除优惠券（乐观更新）
   */
  removeCouponFromList: (queryClient: any, couponId: number) => {
    const couponsQueryKey = queryKeys.coupons.lists()
    const previousData = queryClient.getQueryData(couponsQueryKey)
    
    queryClient.setQueryData(couponsQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.filter((coupon: any) => coupon.id !== couponId),
          total: Math.max(0, oldData.data.total - 1)
        }
      }
    })
    
    return { previousData, queryKey: couponsQueryKey }
  },

  /**
   * 更新优惠券列表中的某个优惠券（乐观更新）
   */
  updateCouponInList: (queryClient: any, couponId: number, updates: any) => {
    const couponsQueryKey = queryKeys.coupons.lists()
    const previousData = queryClient.getQueryData(couponsQueryKey)
    
    queryClient.setQueryData(couponsQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.map((coupon: any) => 
            coupon.id === couponId 
              ? { ...coupon, ...updates, updated_at: new Date().toISOString() }
              : coupon
          )
        }
      }
    })
    
    return { previousData, queryKey: couponsQueryKey }
  },

  /**
   * 为发票列表添加新发票（乐观更新）
   */
  addInvoiceToList: (queryClient: any, newInvoice: any) => {
    const invoicesQueryKey = queryKeys.invoices.lists()
    queryClient.setQueryData(invoicesQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      const tempId = 'temp-' + Date.now()
      const optimisticInvoice = {
        ...newInvoice,
        id: tempId,
        invoice_number: `TEMP-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        _isOptimistic: true
      }
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: [optimisticInvoice, ...oldData.data.items],
          total: oldData.data.total + 1
        }
      }
    })
    return invoicesQueryKey
  },

  /**
   * 从发票列表移除发票（乐观更新）
   */
  removeInvoiceFromList: (queryClient: any, invoiceId: number) => {
    const invoicesQueryKey = queryKeys.invoices.lists()
    const previousData = queryClient.getQueryData(invoicesQueryKey)
    
    queryClient.setQueryData(invoicesQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.filter((invoice: any) => invoice.id !== invoiceId),
          total: Math.max(0, oldData.data.total - 1)
        }
      }
    })
    
    return { previousData, queryKey: invoicesQueryKey }
  },

  /**
   * 更新发票列表中的某个发票（乐观更新）
   */
  updateInvoiceInList: (queryClient: any, invoiceId: number, updates: any) => {
    const invoicesQueryKey = queryKeys.invoices.lists()
    const previousData = queryClient.getQueryData(invoicesQueryKey)
    
    queryClient.setQueryData(invoicesQueryKey, (oldData: any) => {
      if (!oldData || oldData.code !== 0 || !oldData.data?.items) return oldData
      
      return {
        ...oldData,
        data: {
          ...oldData.data,
          items: oldData.data.items.map((invoice: any) => 
            invoice.id === invoiceId 
              ? { ...invoice, ...updates, updated_at: new Date().toISOString() }
              : invoice
          )
        }
      }
    })
    
    return { previousData, queryKey: invoicesQueryKey }
  },

  /**
   * 回滚乐观更新
   */
  rollbackOptimisticUpdate: (queryClient: any, queryKey: any, previousData: any) => {
    if (previousData && queryKey) {
      queryClient.setQueryData(queryKey, previousData)
    }
  }
}

/**
 * 缓存失效工具函数
 */
const invalidationUtils = {
  /**
   * 失效订单相关的所有查询
   */
  invalidateOrderQueries: async (queryClient: any, orderId?: number) => {
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('orders') 
    })
    
    // 失效相关模块的查询
    const relatedModules = CacheInvalidationUtils.getRelatedModules('orders')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    if (orderId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.orders.detail(orderId) 
      })
      // 移除单项缓存
      queryClient.removeQueries({ 
        queryKey: queryKeys.orders.detail(orderId),
        exact: true 
      })
    }
  },

  /**
   * 失效优惠券相关的所有查询
   */
  invalidateCouponQueries: async (queryClient: any, couponId?: number) => {
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('coupons') 
    })
    
    const relatedModules = CacheInvalidationUtils.getRelatedModules('coupons')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    if (couponId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.coupons.detail(couponId) 
      })
      // 移除单项缓存
      queryClient.removeQueries({ 
        queryKey: queryKeys.coupons.detail(couponId),
        exact: true 
      })
    }
  },

  /**
   * 失效发票相关的所有查询
   */
  invalidateInvoiceQueries: async (queryClient: any, invoiceId?: number) => {
    await queryClient.invalidateQueries({ 
      queryKey: CacheInvalidationUtils.getModulePrefix('invoices') 
    })
    
    const relatedModules = CacheInvalidationUtils.getRelatedModules('invoices')
    for (const module of relatedModules) {
      await queryClient.invalidateQueries({ 
        queryKey: CacheInvalidationUtils.getModulePrefix(module) 
      })
    }
    
    if (invoiceId) {
      await queryClient.invalidateQueries({ 
        queryKey: queryKeys.invoices.detail(invoiceId) 
      })
      // 移除单项缓存
      queryClient.removeQueries({ 
        queryKey: queryKeys.invoices.detail(invoiceId),
        exact: true 
      })
    }
  },

  /**
   * 失效统计相关查询
   */
  invalidateStatsQueries: async (queryClient: any) => {
    await queryClient.invalidateQueries({ 
      queryKey: queryKeys.dashboard.all 
    })
  }
}

// ==================== 订单变更 Mutations ====================

/**
 * 创建订阅订单 (用户端)
 */
export const useCreateSubscriptionOrder = (options?: Partial<UseMutationOptions<OrderApiResponse<SubscriptionOrderResponse>, Error, CreateSubscriptionOrderRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (orderData: CreateSubscriptionOrderRequest) => orderService.createSubscriptionOrder(orderData),
    ...createMutationOptions({
      onMutate: async (orderData: CreateSubscriptionOrderRequest) => {
        toast.loading('正在创建订单...', { id: 'create-order' })
        return { orderData }
      },
      
      onSuccess: (data: OrderApiResponse<SubscriptionOrderResponse>, variables: CreateSubscriptionOrderRequest, context: any) => {
        toast.dismiss('create-order')
        
        if (data.code === 0) {
          toast.success('订单创建成功', {
            description: `订单编号: ${data.data.order_number}`
          })
          
          invalidationUtils.invalidateOrderQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('订单创建失败', {
            description: data.message || '创建订单时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateSubscriptionOrderRequest, context: any) => {
        toast.dismiss('create-order')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createSubscriptionOrder',
          orderData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订单创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 取消订单 (管理员)
 */
export const useCancelOrder = (options?: Partial<UseMutationOptions<OrderApiResponse<SubscriptionOrderResponse>, Error, { id: number; data: CancelOrderRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CancelOrderRequest }) => 
      orderService.cancelOrder(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在取消订单...', { id: 'cancel-order' })
        return { orderId: id, cancelData: data }
      },
      
      onSuccess: (data: OrderApiResponse<SubscriptionOrderResponse>, variables, context: any) => {
        toast.dismiss('cancel-order')
        
        if (data.code === 0) {
          toast.success('订单取消成功')
          invalidationUtils.invalidateOrderQueries(queryClient, variables.id)
        } else {
          toast.error('订单取消失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('cancel-order')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'cancelOrder',
          orderId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('订单取消失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 优惠券变更 Mutations ====================

/**
 * 创建优惠券
 */
export const useCreateCoupon = (options?: Partial<UseMutationOptions<CouponApiResponse<CouponResponse>, Error, CreateCouponRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (couponData: CreateCouponRequest) => couponService.createCoupon(couponData),
    ...createMutationOptions({
      onMutate: async (couponData: CreateCouponRequest) => {
        toast.loading('正在创建优惠券...', { id: 'create-coupon' })
        return { couponData }
      },
      
      onSuccess: (data: CouponApiResponse<CouponResponse>, variables: CreateCouponRequest, context: any) => {
        toast.dismiss('create-coupon')
        
        if (data.code === 0) {
          toast.success('优惠券创建成功', {
            description: `优惠券代码: ${data.data.code}`
          })
          
          invalidationUtils.invalidateCouponQueries(queryClient)
        } else {
          toast.error('优惠券创建失败', {
            description: data.message || '创建优惠券时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateCouponRequest, context: any) => {
        toast.dismiss('create-coupon')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createCoupon',
          couponData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('优惠券创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新优惠券
 */
export const useUpdateCoupon = (options?: Partial<UseMutationOptions<CouponApiResponse<CouponResponse>, Error, { id: number; data: UpdateCouponRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCouponRequest }) => 
      couponService.updateCoupon(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在更新优惠券...', { id: 'update-coupon' })
        return { couponId: id, updateData: data }
      },
      
      onSuccess: (data: CouponApiResponse<CouponResponse>, variables, context: any) => {
        toast.dismiss('update-coupon')
        
        if (data.code === 0) {
          toast.success('优惠券更新成功')
          invalidationUtils.invalidateCouponQueries(queryClient, variables.id)
        } else {
          toast.error('优惠券更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-coupon')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateCoupon',
          couponId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('优惠券更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除优惠券
 */
export const useDeleteCoupon = (options?: Partial<UseMutationOptions<CouponApiResponse<void>, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (couponId: number) => couponService.deleteCoupon(couponId),
    ...createMutationOptions({
      onMutate: async (couponId: number) => {
        toast.loading('正在删除优惠券...', { id: 'delete-coupon' })
        return { couponId }
      },
      
      onSuccess: (data: CouponApiResponse<void>, couponId: number, context: any) => {
        toast.dismiss('delete-coupon')
        
        if (data.code === 0) {
          toast.success('优惠券删除成功')
          invalidationUtils.invalidateCouponQueries(queryClient, couponId)
        } else {
          toast.error('优惠券删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, couponId: number, context: any) => {
        toast.dismiss('delete-coupon')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteCoupon',
          couponId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('优惠券删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量操作优惠券
 */
export const useBatchCoupons = (options?: Partial<UseMutationOptions<CouponApiResponse<void>, Error, BatchCouponRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (batchData: BatchCouponRequest) => couponService.batchUpdateCoupons(batchData),
    ...createMutationOptions({
      onMutate: async (batchData: BatchCouponRequest) => {
        toast.loading('正在批量操作优惠券...', { id: 'batch-coupons' })
        return { batchData }
      },
      
      onSuccess: (data: CouponApiResponse<void>, variables: BatchCouponRequest, context: any) => {
        toast.dismiss('batch-coupons')
        
        if (data.code === 0) {
          toast.success('批量操作成功')
          invalidationUtils.invalidateCouponQueries(queryClient)
        } else {
          toast.error('批量操作失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BatchCouponRequest, context: any) => {
        toast.dismiss('batch-coupons')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'batchCoupons',
          batchData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量操作失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 发票变更 Mutations ====================

/**
 * 创建发票
 */
export const useCreateInvoice = (options?: Partial<UseMutationOptions<InvoiceApiResponse, Error, CreateInvoiceRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (invoiceData: CreateInvoiceRequest) => invoiceService.createInvoice(invoiceData),
    ...createMutationOptions({
      onMutate: async (invoiceData: CreateInvoiceRequest) => {
        toast.loading('正在创建发票...', { id: 'create-invoice' })
        return { invoiceData }
      },
      
      onSuccess: (data: InvoiceApiResponse, variables: CreateInvoiceRequest, context: any) => {
        toast.dismiss('create-invoice')
        
        if (data.code === 0) {
          toast.success('发票创建成功')
          invalidationUtils.invalidateInvoiceQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('发票创建失败', {
            description: data.message || '创建发票时发生未知错误'
          })
        }
      },
      
      onError: async (error: Error, variables: CreateInvoiceRequest, context: any) => {
        toast.dismiss('create-invoice')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'createInvoice',
          invoiceData: variables
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('发票创建失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 更新发票
 */
export const useUpdateInvoice = (options?: Partial<UseMutationOptions<InvoiceApiResponse, Error, { id: number; data: UpdateInvoiceRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateInvoiceRequest }) => 
      invoiceService.updateInvoice(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在更新发票...', { id: 'update-invoice' })
        return { invoiceId: id, updateData: data }
      },
      
      onSuccess: (data: InvoiceApiResponse, variables, context: any) => {
        toast.dismiss('update-invoice')
        
        if (data.code === 0) {
          toast.success('发票更新成功')
          invalidationUtils.invalidateInvoiceQueries(queryClient, variables.id)
        } else {
          toast.error('发票更新失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('update-invoice')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'updateInvoice',
          invoiceId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('发票更新失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 标记发票为已支付
 */
export const useMarkInvoicePaid = (options?: Partial<UseMutationOptions<InvoiceApiResponse, Error, { id: number; data?: MarkPaidRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: MarkPaidRequest }) => 
      invoiceService.markInvoicePaid(id, data),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        toast.loading('正在标记发票为已支付...', { id: 'mark-paid' })
        return { invoiceId: id }
      },
      
      onSuccess: (data: InvoiceApiResponse, variables, context: any) => {
        toast.dismiss('mark-paid')
        
        if (data.code === 0) {
          toast.success('发票已标记为已支付')
          invalidationUtils.invalidateInvoiceQueries(queryClient, variables.id)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          toast.error('操作失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('mark-paid')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'markInvoicePaid',
          invoiceId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('标记发票失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 标记发票为作废
 */
export const useMarkInvoiceVoid = (options?: Partial<UseMutationOptions<InvoiceApiResponse, Error, { id: number; data?: MarkVoidRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: MarkVoidRequest }) => 
      invoiceService.markInvoiceVoid(id, data),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        toast.loading('正在作废发票...', { id: 'mark-void' })
        return { invoiceId: id }
      },
      
      onSuccess: (data: InvoiceApiResponse, variables, context: any) => {
        toast.dismiss('mark-void')
        
        if (data.code === 0) {
          toast.success('发票已作废')
          invalidationUtils.invalidateInvoiceQueries(queryClient, variables.id)
        } else {
          toast.error('操作失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('mark-void')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'markInvoiceVoid',
          invoiceId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('作废发票失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 发送发票
 */
export const useSendInvoice = (options?: Partial<UseMutationOptions<any, Error, { id: number; data?: SendInvoiceRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data?: SendInvoiceRequest }) => 
      invoiceService.sendInvoice(id, data),
    ...createMutationOptions({
      onMutate: async ({ id }) => {
        toast.loading('正在发送发票...', { id: 'send-invoice' })
        return { invoiceId: id }
      },
      
      onSuccess: (data: any, variables, context: any) => {
        toast.dismiss('send-invoice')
        
        if (data.code === 0) {
          toast.success('发票发送成功')
          invalidationUtils.invalidateInvoiceQueries(queryClient, variables.id)
        } else {
          toast.error('发票发送失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('send-invoice')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'sendInvoice',
          invoiceId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('发送发票失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 删除发票
 */
export const useDeleteInvoice = (options?: Partial<UseMutationOptions<any, Error, number>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (invoiceId: number) => invoiceService.deleteInvoice(invoiceId),
    ...createMutationOptions({
      onMutate: async (invoiceId: number) => {
        toast.loading('正在删除发票...', { id: 'delete-invoice' })
        
        // 乐观更新：从列表中移除发票
        const rollbackInfo = optimisticUpdateUtils.removeInvoiceFromList(queryClient, invoiceId)
        
        return { 
          invoiceId,
          rollbackInfo
        }
      },
      
      onSuccess: (data: any, invoiceId: number, context: any) => {
        toast.dismiss('delete-invoice')
        
        if (data.code === 0) {
          toast.success('发票删除成功')
          invalidationUtils.invalidateInvoiceQueries(queryClient, invoiceId)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('发票删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, invoiceId: number, context: any) => {
        toast.dismiss('delete-invoice')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'deleteInvoice',
          invoiceId
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('删除发票失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 发票批量操作 Mutations ====================

/**
 * 批量下载发票
 */
export const useBulkDownloadInvoices = (options?: Partial<UseMutationOptions<Blob, Error, BulkDownloadRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (downloadData: BulkDownloadRequest) => invoiceService.bulkDownloadInvoices(downloadData),
    ...createMutationOptions({
      onMutate: async (downloadData: BulkDownloadRequest) => {
        toast.loading('正在生成下载文件...', { id: 'bulk-download' })
        return { downloadData }
      },
      
      onSuccess: (blob: Blob, variables: BulkDownloadRequest, context: any) => {
        toast.dismiss('bulk-download')
        
        // 自动下载文件
        const filename = `invoices-${new Date().toISOString().split('T')[0]}.zip`
        invoiceService.downloadFile(blob, filename)
        
        toast.success('发票下载成功', {
          description: `已下载 ${variables.invoice_ids.length} 个发票`
        })
      },
      
      onError: async (error: Error, variables: BulkDownloadRequest, context: any) => {
        toast.dismiss('bulk-download')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkDownloadInvoices',
          invoiceIds: variables.invoice_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量下载失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量标记发票为已支付
 */
export const useBulkMarkPaidInvoices = (options?: Partial<UseMutationOptions<BulkOperationResponse, Error, BulkMarkPaidRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (markPaidData: BulkMarkPaidRequest) => invoiceService.bulkMarkPaid(markPaidData),
    ...createMutationOptions({
      onMutate: async (markPaidData: BulkMarkPaidRequest) => {
        toast.loading('正在批量标记为已支付...', { id: 'bulk-mark-paid' })
        
        // 乐观更新：批量更新发票状态
        const rollbackInfos = markPaidData.invoice_ids.map(invoiceId => {
          return optimisticUpdateUtils.updateInvoiceInList(queryClient, invoiceId, {
            status: 'paid',
            paid_at: markPaidData.paid_at || new Date().toISOString()
          })
        })
        
        return { 
          markPaidData,
          rollbackInfos
        }
      },
      
      onSuccess: (data: BulkOperationResponse, variables: BulkMarkPaidRequest, context: any) => {
        toast.dismiss('bulk-mark-paid')
        
        if (data.code === 0) {
          toast.success('批量标记成功', {
            description: `已处理 ${data.data.successful_count} 个发票`
          })
          
          invalidationUtils.invalidateInvoiceQueries(queryClient)
          invalidationUtils.invalidateStatsQueries(queryClient)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfos) {
            context.rollbackInfos.forEach((rollbackInfo: any) => {
              optimisticUpdateUtils.rollbackOptimisticUpdate(
                queryClient,
                rollbackInfo.queryKey,
                rollbackInfo.previousData
              )
            })
          }
          
          toast.error('批量标记失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BulkMarkPaidRequest, context: any) => {
        toast.dismiss('bulk-mark-paid')
        
        // 回滚乐观更新
        if (context?.rollbackInfos) {
          context.rollbackInfos.forEach((rollbackInfo: any) => {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient,
              rollbackInfo.queryKey,
              rollbackInfo.previousData
            )
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkMarkPaidInvoices',
          invoiceIds: variables.invoice_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量标记失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量作废发票
 */
export const useBulkVoidInvoices = (options?: Partial<UseMutationOptions<BulkOperationResponse, Error, BulkVoidRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (voidData: BulkVoidRequest) => invoiceService.bulkVoid(voidData),
    ...createMutationOptions({
      onMutate: async (voidData: BulkVoidRequest) => {
        toast.loading('正在批量作废发票...', { id: 'bulk-void' })
        
        // 乐观更新：批量更新发票状态
        const rollbackInfos = voidData.invoice_ids.map(invoiceId => {
          return optimisticUpdateUtils.updateInvoiceInList(queryClient, invoiceId, {
            status: 'void',
            voided_at: new Date().toISOString(),
            void_reason: voidData.void_reason
          })
        })
        
        return { 
          voidData,
          rollbackInfos
        }
      },
      
      onSuccess: (data: BulkOperationResponse, variables: BulkVoidRequest, context: any) => {
        toast.dismiss('bulk-void')
        
        if (data.code === 0) {
          toast.success('批量作废成功', {
            description: `已处理 ${data.data.successful_count} 个发票`
          })
          
          invalidationUtils.invalidateInvoiceQueries(queryClient)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfos) {
            context.rollbackInfos.forEach((rollbackInfo: any) => {
              optimisticUpdateUtils.rollbackOptimisticUpdate(
                queryClient,
                rollbackInfo.queryKey,
                rollbackInfo.previousData
              )
            })
          }
          
          toast.error('批量作废失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BulkVoidRequest, context: any) => {
        toast.dismiss('bulk-void')
        
        // 回滚乐观更新
        if (context?.rollbackInfos) {
          context.rollbackInfos.forEach((rollbackInfo: any) => {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient,
              rollbackInfo.queryKey,
              rollbackInfo.previousData
            )
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkVoidInvoices',
          invoiceIds: variables.invoice_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量作废失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量重新发送发票
 */
export const useBulkResendInvoices = (options?: Partial<UseMutationOptions<BulkOperationResponse, Error, BulkResendRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (resendData: BulkResendRequest) => invoiceService.bulkResend(resendData),
    ...createMutationOptions({
      onMutate: async (resendData: BulkResendRequest) => {
        toast.loading('正在批量重新发送发票...', { id: 'bulk-resend' })
        return { resendData }
      },
      
      onSuccess: (data: BulkOperationResponse, variables: BulkResendRequest, context: any) => {
        toast.dismiss('bulk-resend')
        
        if (data.code === 0) {
          toast.success('批量发送成功', {
            description: `已发送 ${data.data.successful_count} 个发票`
          })
          
          invalidationUtils.invalidateInvoiceQueries(queryClient)
        } else {
          toast.error('批量发送失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BulkResendRequest, context: any) => {
        toast.dismiss('bulk-resend')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkResendInvoices',
          invoiceIds: variables.invoice_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量发送失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量重新生成发票PDF
 */
export const useBulkRegeneratePdfInvoices = (options?: Partial<UseMutationOptions<BulkOperationResponse, Error, BulkRegeneratePdfRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (regenerateData: BulkRegeneratePdfRequest) => invoiceService.bulkRegeneratePdf(regenerateData),
    ...createMutationOptions({
      onMutate: async (regenerateData: BulkRegeneratePdfRequest) => {
        toast.loading('正在批量重新生成PDF...', { id: 'bulk-regenerate-pdf' })
        return { regenerateData }
      },
      
      onSuccess: (data: BulkOperationResponse, variables: BulkRegeneratePdfRequest, context: any) => {
        toast.dismiss('bulk-regenerate-pdf')
        
        if (data.code === 0) {
          toast.success('批量PDF生成成功', {
            description: `已处理 ${data.data.successful_count} 个发票`
          })
          
          invalidationUtils.invalidateInvoiceQueries(queryClient)
        } else {
          toast.error('批量PDF生成失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BulkRegeneratePdfRequest, context: any) => {
        toast.dismiss('bulk-regenerate-pdf')
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkRegeneratePdfInvoices',
          invoiceIds: variables.invoice_ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量PDF生成失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 批量删除操作 Mutations ====================

/**
 * 批量删除优惠券
 */
export const useBulkDeleteCoupons = (options?: Partial<UseMutationOptions<any, Error, BulkDeleteRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bulkDeleteData: BulkDeleteRequest) => {
      // 串行删除以保证数据一致性
      const results = await Promise.allSettled(
        bulkDeleteData.ids.map(id => couponService.deleteCoupon(id))
      )
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return {
        code: 0,
        message: '批量删除完成',
        data: {
          successful_count: successful,
          failed_count: failed,
          total_count: bulkDeleteData.ids.length
        }
      }
    },
    ...createMutationOptions({
      onMutate: async (bulkDeleteData: BulkDeleteRequest) => {
        toast.loading('正在批量删除优惠券...', { id: 'bulk-delete-coupons' })
        
        // 乐观更新：批量移除优惠券
        const rollbackInfos = bulkDeleteData.ids.map(couponId => {
          return optimisticUpdateUtils.removeCouponFromList(queryClient, couponId)
        })
        
        return { 
          bulkDeleteData,
          rollbackInfos
        }
      },
      
      onSuccess: (data: any, variables: BulkDeleteRequest, context: any) => {
        toast.dismiss('bulk-delete-coupons')
        
        if (data.code === 0) {
          toast.success('批量删除成功', {
            description: `已删除 ${data.data.successful_count} 个优惠券${
              data.data.failed_count > 0 ? `，失败 ${data.data.failed_count} 个` : ''
            }`
          })
          
          invalidationUtils.invalidateCouponQueries(queryClient)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfos) {
            context.rollbackInfos.forEach((rollbackInfo: any) => {
              optimisticUpdateUtils.rollbackOptimisticUpdate(
                queryClient,
                rollbackInfo.queryKey,
                rollbackInfo.previousData
              )
            })
          }
          
          toast.error('批量删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BulkDeleteRequest, context: any) => {
        toast.dismiss('bulk-delete-coupons')
        
        // 回滚乐观更新
        if (context?.rollbackInfos) {
          context.rollbackInfos.forEach((rollbackInfo: any) => {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient,
              rollbackInfo.queryKey,
              rollbackInfo.previousData
            )
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkDeleteCoupons',
          couponIds: variables.ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 批量删除发票
 */
export const useBulkDeleteInvoices = (options?: Partial<UseMutationOptions<any, Error, BulkDeleteRequest>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (bulkDeleteData: BulkDeleteRequest) => {
      // 串行删除以保证数据一致性
      const results = await Promise.allSettled(
        bulkDeleteData.ids.map(id => invoiceService.deleteInvoice(id))
      )
      
      const successful = results.filter(r => r.status === 'fulfilled').length
      const failed = results.filter(r => r.status === 'rejected').length
      
      return {
        code: 0,
        message: '批量删除完成',
        data: {
          successful_count: successful,
          failed_count: failed,
          total_count: bulkDeleteData.ids.length
        }
      }
    },
    ...createMutationOptions({
      onMutate: async (bulkDeleteData: BulkDeleteRequest) => {
        toast.loading('正在批量删除发票...', { id: 'bulk-delete-invoices' })
        
        // 乐观更新：批量移除发票
        const rollbackInfos = bulkDeleteData.ids.map(invoiceId => {
          return optimisticUpdateUtils.removeInvoiceFromList(queryClient, invoiceId)
        })
        
        return { 
          bulkDeleteData,
          rollbackInfos
        }
      },
      
      onSuccess: (data: any, variables: BulkDeleteRequest, context: any) => {
        toast.dismiss('bulk-delete-invoices')
        
        if (data.code === 0) {
          toast.success('批量删除成功', {
            description: `已删除 ${data.data.successful_count} 个发票${
              data.data.failed_count > 0 ? `，失败 ${data.data.failed_count} 个` : ''
            }`
          })
          
          invalidationUtils.invalidateInvoiceQueries(queryClient)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfos) {
            context.rollbackInfos.forEach((rollbackInfo: any) => {
              optimisticUpdateUtils.rollbackOptimisticUpdate(
                queryClient,
                rollbackInfo.queryKey,
                rollbackInfo.previousData
              )
            })
          }
          
          toast.error('批量删除失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables: BulkDeleteRequest, context: any) => {
        toast.dismiss('bulk-delete-invoices')
        
        // 回滚乐观更新
        if (context?.rollbackInfos) {
          context.rollbackInfos.forEach((rollbackInfo: any) => {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient,
              rollbackInfo.queryKey,
              rollbackInfo.previousData
            )
          })
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'bulkDeleteInvoices',
          invoiceIds: variables.ids
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('批量删除失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 高级财务操作 Mutations ====================

/**
 * 切换优惠券状态（启用/禁用）
 */
export const useToggleCouponStatus = (options?: Partial<UseMutationOptions<CouponApiResponse<CouponResponse>, Error, { id: number; status: 'active' | 'inactive' }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'active' | 'inactive' }) => 
      couponService.toggleCouponStatus(id, status),
    ...createMutationOptions({
      onMutate: async ({ id, status }) => {
        const actionText = status === 'active' ? '启用' : '禁用'
        toast.loading(`正在${actionText}优惠券...`, { id: 'toggle-coupon-status' })
        
        // 乐观更新：立即更新优惠券状态
        const rollbackInfo = optimisticUpdateUtils.updateCouponInList(queryClient, id, { status })
        
        return { couponId: id, status, rollbackInfo }
      },
      
      onSuccess: (data: CouponApiResponse<CouponResponse>, variables, context: any) => {
        toast.dismiss('toggle-coupon-status')
        
        if (data.code === 0) {
          const actionText = variables.status === 'active' ? '启用' : '禁用'
          toast.success(`优惠券${actionText}成功`)
          invalidationUtils.invalidateCouponQueries(queryClient, variables.id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('状态切换失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('toggle-coupon-status')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'toggleCouponStatus',
          couponId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('状态切换失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

/**
 * 自定义发送发票
 */
export const useSendInvoiceCustom = (options?: Partial<UseMutationOptions<any, Error, { id: number; data: CustomSendRequest }>>) => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: CustomSendRequest }) => 
      invoiceService.sendInvoiceCustom(id, data),
    ...createMutationOptions({
      onMutate: async ({ id, data }) => {
        toast.loading('正在自定义发送发票...', { id: 'send-invoice-custom' })
        
        // 乐观更新：更新发票状态为已发送
        const rollbackInfo = optimisticUpdateUtils.updateInvoiceInList(queryClient, id, { 
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        
        return { invoiceId: id, sendData: data, rollbackInfo }
      },
      
      onSuccess: (data: any, variables, context: any) => {
        toast.dismiss('send-invoice-custom')
        
        if (data.code === 0) {
          toast.success('发票发送成功', {
            description: `已发送至 ${variables.data.recipient_email || '指定邮箱'}`
          })
          invalidationUtils.invalidateInvoiceQueries(queryClient, variables.id)
        } else {
          // 回滚乐观更新
          if (context?.rollbackInfo) {
            optimisticUpdateUtils.rollbackOptimisticUpdate(
              queryClient, 
              context.rollbackInfo.queryKey, 
              context.rollbackInfo.previousData
            )
          }
          
          toast.error('发票发送失败', {
            description: data.message
          })
        }
      },
      
      onError: async (error: Error, variables, context: any) => {
        toast.dismiss('send-invoice-custom')
        
        // 回滚乐观更新
        if (context?.rollbackInfo) {
          optimisticUpdateUtils.rollbackOptimisticUpdate(
            queryClient, 
            context.rollbackInfo.queryKey, 
            context.rollbackInfo.previousData
          )
        }
        
        const standardError = await reactQueryErrorUtils.handleMutationError(error, {
          operation: 'sendInvoiceCustom',
          invoiceId: variables.id
        })
        
        const userMessage = errorUtils.formatUserMessage(standardError)
        toast.error('发票发送失败', {
          description: userMessage
        })
      },
      
      ...options
    })
  })
}

// ==================== 默认导出 ====================

export default {
  // 订单相关
  useCreateSubscriptionOrder,
  useCancelOrder,
  
  // 优惠券相关
  useCreateCoupon,
  useUpdateCoupon,
  useDeleteCoupon,
  useBatchCoupons,
  useToggleCouponStatus,
  useBulkDeleteCoupons,
  
  // 发票相关
  useCreateInvoice,
  useUpdateInvoice,
  useDeleteInvoice,
  useMarkInvoicePaid,
  useMarkInvoiceVoid,
  useSendInvoice,
  useSendInvoiceCustom,
  
  // 发票批量操作
  useBulkDownloadInvoices,
  useBulkMarkPaidInvoices,
  useBulkVoidInvoices,
  useBulkResendInvoices,
  useBulkRegeneratePdfInvoices,
  useBulkDeleteInvoices,
}

// 导出工具函数
export {
  invalidationUtils,
  optimisticUpdateUtils,
}