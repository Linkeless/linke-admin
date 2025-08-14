# 财务变更 Hooks 使用指南

## 概述

财务变更 Hooks (`use-finance-mutations.ts`) 提供了完整的财务数据变更操作，支持订单、优惠券、发票的创建、更新、删除等操作，实现了完整的乐观更新机制，符合 FR-3 要求。

## 特性

### ✨ 核心特性
- **乐观更新机制**: 立即UI反馈，后台发送请求
- **自动回滚**: 请求失败时自动回滚到之前状态  
- **成功同步**: 成功后自动刷新相关查询数据
- **批量操作**: 支持批量操作的乐观更新
- **Toast通知**: 统一的成功/失败通知
- **错误处理**: 完整的错误处理和用户反馈

### 📊 支持的操作

#### 订单管理
- `useCreateSubscriptionOrder` - 创建订阅订单（用户端）
- `useCancelOrder` - 取消订单（管理员）

#### 优惠券管理  
- `useCreateCoupon` - 创建优惠券
- `useUpdateCoupon` - 更新优惠券
- `useDeleteCoupon` - 删除优惠券  
- `useBatchCoupons` - 批量操作优惠券
- `useToggleCouponStatus` - 切换优惠券状态
- `useBulkDeleteCoupons` - 批量删除优惠券

#### 发票管理
- `useCreateInvoice` - 创建发票
- `useUpdateInvoice` - 更新发票
- `useDeleteInvoice` - 删除发票
- `useMarkInvoicePaid` - 标记为已支付
- `useMarkInvoiceVoid` - 标记为作废
- `useSendInvoice` - 发送发票
- `useSendInvoiceCustom` - 自定义发送发票

#### 批量操作
- `useBulkDownloadInvoices` - 批量下载发票
- `useBulkMarkPaidInvoices` - 批量标记为已支付
- `useBulkVoidInvoices` - 批量作废发票
- `useBulkResendInvoices` - 批量重新发送
- `useBulkRegeneratePdfInvoices` - 批量重新生成PDF
- `useBulkDeleteInvoices` - 批量删除发票

## 使用示例

### 基础使用

```tsx
import { useCreateCoupon } from '@/hooks/mutations/use-finance-mutations'

function CreateCouponDialog() {
  const createCoupon = useCreateCoupon({
    onSuccess: (data) => {
      // 额外的成功处理逻辑
      console.log('优惠券创建成功:', data)
    }
  })

  const handleSubmit = async (formData: CreateCouponRequest) => {
    try {
      await createCoupon.mutateAsync(formData)
      // 成功处理 - Toast 自动显示
    } catch (error) {
      // 错误处理 - Toast 自动显示
      console.error('创建失败:', error)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* 表单内容 */}
      <button 
        type="submit" 
        disabled={createCoupon.isPending}
      >
        {createCoupon.isPending ? '创建中...' : '创建优惠券'}
      </button>
    </form>
  )
}
```

### 乐观更新示例

```tsx
import { useDeleteCoupon } from '@/hooks/mutations/use-finance-mutations'

function CouponTable() {
  const deleteCoupon = useDeleteCoupon()

  const handleDelete = (couponId: number) => {
    // 1. UI 立即显示删除效果（乐观更新）
    // 2. 后台发送删除请求
    // 3. 成功：保持UI状态，刷新数据
    // 4. 失败：恢复删除的项目，显示错误
    deleteCoupon.mutate(couponId)
  }

  return (
    <div>
      {/* 列表会立即反映删除效果 */}
    </div>
  )
}
```

### 批量操作示例

```tsx
import { useBulkDeleteCoupons } from '@/hooks/mutations/use-finance-mutations'

function BulkActions() {
  const bulkDelete = useBulkDeleteCoupons()
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return

    bulkDelete.mutate({
      ids: selectedIds,
      reason: '批量清理过期优惠券'
    })
  }

  return (
    <div>
      <button 
        onClick={handleBulkDelete}
        disabled={bulkDelete.isPending || selectedIds.length === 0}
      >
        删除选中的 {selectedIds.length} 项
      </button>
    </div>
  )
}
```

### 状态切换示例

```tsx
import { useToggleCouponStatus } from '@/hooks/mutations/use-finance-mutations'

function CouponStatusToggle({ coupon }: { coupon: CouponResponse }) {
  const toggleStatus = useToggleCouponStatus()

  const handleToggle = () => {
    const newStatus = coupon.status === 'active' ? 'inactive' : 'active'
    
    toggleStatus.mutate({
      id: coupon.id,
      status: newStatus
    })
  }

  return (
    <button 
      onClick={handleToggle}
      disabled={toggleStatus.isPending}
    >
      {coupon.status === 'active' ? '禁用' : '启用'}
    </button>
  )
}
```

## 高级特性

### 自定义错误处理

```tsx
const createInvoice = useCreateInvoice({
  onError: (error, variables, context) => {
    // 自定义错误处理
    console.error('发票创建失败:', error)
    
    // 可以基于错误类型进行特殊处理
    if (error.message.includes('duplicate')) {
      toast.error('发票编号重复，请检查后重试')
    }
  }
})
```

### 自定义成功处理

```tsx
const markPaid = useMarkInvoicePaid({
  onSuccess: (data, variables, context) => {
    // 自定义成功处理
    console.log('发票已标记为已支付:', data)
    
    // 可以触发其他操作
    refetch() // 刷新相关数据
    navigate('/invoices') // 页面跳转
  }
})
```

## 工具函数

### 缓存失效工具

```tsx
import { invalidationUtils } from '@/hooks/mutations/use-finance-mutations'

// 手动失效相关缓存
await invalidationUtils.invalidateOrderQueries(queryClient, orderId)
await invalidationUtils.invalidateCouponQueries(queryClient)
await invalidationUtils.invalidateInvoiceQueries(queryClient)
await invalidationUtils.invalidateStatsQueries(queryClient)
```

### 乐观更新工具

```tsx
import { optimisticUpdateUtils } from '@/hooks/mutations/use-finance-mutations'

// 手动乐观更新
optimisticUpdateUtils.addCouponToList(queryClient, newCoupon)
optimisticUpdateUtils.updateCouponInList(queryClient, couponId, updates)
optimisticUpdateUtils.removeCouponFromList(queryClient, couponId)

// 手动回滚
optimisticUpdateUtils.rollbackOptimisticUpdate(queryClient, queryKey, previousData)
```

## 最佳实践

### 1. 错误边界
```tsx
<ErrorBoundary>
  <CouponManagement />
</ErrorBoundary>
```

### 2. 加载状态
```tsx
{mutation.isPending && <LoadingSpinner />}
<button disabled={mutation.isPending}>
  {mutation.isPending ? '处理中...' : '提交'}
</button>
```

### 3. 乐观更新指示
```tsx
// 显示乐观更新状态
{item._isOptimistic && (
  <div className="opacity-50">
    <Spinner size="sm" />
    处理中...
  </div>
)}
```

### 4. 批量操作确认
```tsx
const handleBulkDelete = () => {
  if (!confirm(`确定要删除 ${selectedIds.length} 个项目吗？`)) {
    return
  }
  
  bulkDelete.mutate({ ids: selectedIds })
}
```

## 注意事项

1. **乐观更新**: 仅在网络良好的环境下建议使用，避免频繁的回滚操作
2. **批量操作**: 大批量操作建议分批处理，避免长时间阻塞UI
3. **错误恢复**: 确保错误发生时用户能够清楚地理解发生了什么以及如何解决
4. **性能考虑**: 乐观更新会增加内存使用，注意及时清理不必要的缓存

## 依赖关系

- `@tanstack/react-query` - 数据状态管理
- `sonner` - Toast 通知
- 财务服务层 (`order-service`, `coupon-service`, `invoice-service`)
- 查询键管理 (`query-keys`)
- 缓存策略 (`cache-strategies`)
- 错误处理 (`error-handler`)