# 财务组件统一错误处理

本文档说明了财务模块组件如何使用统一的错误处理机制，确保所有财务相关操作都有一致的错误处理和用户反馈。

## 核心特性

✅ **统一错误处理**: 所有财务组件使用相同的错误处理逻辑  
✅ **React Query集成**: 完美集成React Query的错误处理机制  
✅ **自动错误分类**: 自动识别网络、认证、验证等不同类型的错误  
✅ **用户友好反馈**: 提供清晰的错误提示和恢复建议  
✅ **401错误自动重定向**: 认证失败时自动跳转登录页  
✅ **错误边界保护**: 组件级错误边界防止应用崩溃  

## 使用方式

### 1. 组件错误边界

```tsx
import { FinanceErrorBoundary } from '@/components/finance'

function CouponsPage() {
  return (
    <FinanceErrorBoundary module="coupons">
      <CouponsTable />
      <CouponsStats />
    </FinanceErrorBoundary>
  )
}

// 或使用HOC方式
export default withFinanceErrorBoundary(CouponsPage, { 
  module: 'coupons' 
})
```

### 2. 错误处理Hook

```tsx
import { useFinanceErrorHandler } from '@/components/finance'

function OrdersList() {
  const { handleQueryError, handleMutationError } = useFinanceErrorHandler({
    module: 'orders'
  })

  const { data, error } = useOrders()
  const createOrderMutation = useCreateOrder({
    onError: handleMutationError
  })

  if (error) {
    handleQueryError(error, { operation: '获取订单列表' })
  }

  return <div>...</div>
}
```

### 3. React Query集成

```tsx
import { financeQueryErrorUtils } from '@/components/finance'

// 查询错误处理
const ordersQuery = useQuery({
  queryKey: ['orders'],
  queryFn: financeQueryErrorUtils.withErrorHandling(
    () => orderService.getOrders(),
    'orders'
  ),
  ...financeQueryErrorUtils.getRetryConfig()
})

// Mutation错误处理
const createOrderMutation = useMutation({
  mutationFn: orderService.createOrder,
  onError: (error) => {
    // 错误已经被React Query mutations统一处理
    console.log('创建订单失败:', error)
  }
})
```

### 4. 数据状态组件

```tsx
import { FinanceDataError, FinanceDataEmpty } from '@/components/finance'

function OrdersTable() {
  const { data, isLoading, error, refetch } = useOrders()

  if (error) {
    return (
      <FinanceDataError 
        message="订单数据加载失败"
        onRetry={refetch}
      />
    )
  }

  if (!isLoading && (!data || data.length === 0)) {
    return (
      <FinanceDataEmpty 
        message="暂无订单"
        description="还没有创建任何订单"
        action={<CreateOrderButton />}
      />
    )
  }

  return <div>...</div>
}
```

## 错误类型处理

### 认证错误 (401)
- **行为**: 自动显示"登录已过期"提示，自动跳转登录页
- **重试**: 不自动重试
- **用户操作**: 需要重新登录

### 权限错误 (403) 
- **行为**: 显示"权限不足"提示
- **重试**: 不自动重试
- **用户操作**: 联系管理员获取权限

### 网络错误
- **行为**: 显示"网络连接失败"提示，提供重试按钮
- **重试**: 自动重试2次，指数退避延迟
- **用户操作**: 检查网络连接后重试

### 验证错误
- **行为**: 显示具体的验证错误信息
- **重试**: 不自动重试  
- **用户操作**: 修正输入后重新提交

### 服务器错误 (5xx)
- **行为**: 显示"服务器错误"提示
- **重试**: 自动重试2次
- **用户操作**: 稍后重试或联系技术支持

## 组件示例

### 更新后的优惠券表单
```tsx
// components/finance/coupons/coupon-form.tsx
export function CouponForm({ onSubmit, loading }) {
  // 移除了手动错误状态管理
  // 错误处理完全由React Query mutations处理
  
  const handleSubmit = async (data) => {
    // 直接调用，错误由上层mutation处理
    await onSubmit(data)
  }

  return <form onSubmit={handleSubmit}>...</form>
}
```

### 更新后的订单统计卡片
```tsx
// components/finance/orders/order-stats-cards.tsx
export function OrderStatsCards() {
  const { data, isLoading, error } = useOrderAnalytics(queryParams)

  // 统一错误状态显示
  if (error) {
    return <ErrorStatsCards />
  }

  if (isLoading) {
    return <LoadingStatsCards />
  }

  return <StatsCards data={data} />
}
```

### 更新后的发票操作
```tsx
// app/finance/invoices/components/invoice-actions.tsx
export function InvoiceActions({ invoice, onUpdate }) {
  // 使用React Query mutations替代手动错误处理
  const markPaidMutation = useMarkInvoicePaid({
    onSuccess: onUpdate
  })

  const handleMarkPaid = () => {
    // 错误处理由mutation统一管理
    markPaidMutation.mutate({ 
      id: invoice.id,
      data: { /* ... */ }
    })
  }

  return <div>...</div>
}
```

## 最佳实践

### ✅ 推荐做法

1. **使用错误边界包装页面级组件**
2. **让React Query mutations处理错误**  
3. **提供有意义的错误消息和恢复建议**
4. **区分可重试和不可重试的错误**
5. **在开发环境显示详细错误信息**

### ❌ 避免做法

1. **不要在组件内部手动捕获和显示错误**
2. **不要忽略网络错误或认证错误**
3. **不要显示技术性的错误消息给最终用户**
4. **不要对所有错误都提供重试功能**

## 错误监控

在生产环境中，所有错误都会被记录到控制台，便于调试和监控：

```typescript
// 错误日志格式
{
  message: "优惠券操作错误:",
  error: Error,
  context: {
    module: "coupons",
    operation: "创建优惠券", 
    variables: { /* 操作参数 */ },
    timestamp: "2024-08-14T10:30:00.000Z"
  }
}
```

## 扩展性

错误处理系统具有良好的扩展性：

- 可以为不同模块定制错误处理逻辑
- 支持添加新的错误类型和处理策略  
- 可以集成外部错误监控服务
- 支持国际化错误消息

## 迁移指南

### 从旧的错误处理迁移

1. **移除组件内的错误状态管理**
2. **移除手动的try-catch错误处理**
3. **使用React Query mutations替代直接API调用**
4. **用错误边界包装组件**
5. **使用统一的错误显示组件**

这样可以确保所有财务组件都有一致的错误处理行为，提升用户体验和代码维护性。