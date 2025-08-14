// ==================== 优惠券组件 ====================
export { CouponForm } from './coupons/coupon-form'
export { CreateCouponDialog } from './coupons/create-coupon-dialog'
export { EditCouponDialog } from './coupons/edit-coupon-dialog'

// ==================== 订单组件 ====================
export { OrderFilters } from './orders/order-filters'
export { OrderStatsCards } from './orders/order-stats-cards'

// ==================== 错误处理组件 ====================
export { 
  FinanceErrorBoundary,
  withFinanceErrorBoundary,
  FinanceDataError,
  FinanceDataEmpty
} from './error-boundary'

// ==================== 错误处理Hook ====================
export { 
  useFinanceErrorHandler,
  financeQueryErrorUtils
} from './use-finance-error-handler'

// ==================== 组件类型定义 ====================
export type FinanceModule = 'orders' | 'coupons' | 'invoices' | 'finance'

// ==================== 默认导出 ====================
export default {
  // 优惠券
  CouponForm,
  CreateCouponDialog,
  EditCouponDialog,
  
  // 订单
  OrderFilters,
  OrderStatsCards,
  
  // 错误处理
  FinanceErrorBoundary,
  withFinanceErrorBoundary,
  FinanceDataError,
  FinanceDataEmpty,
  useFinanceErrorHandler,
  financeQueryErrorUtils
}