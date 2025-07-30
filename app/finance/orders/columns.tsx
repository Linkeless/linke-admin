'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, RefreshCw, Ban, DollarSign, ChevronsUpDown } from 'lucide-react'
import { SubscriptionOrderResponse } from '@/lib/order-types'
import { orderService } from '@/lib/order-service'
import { toast } from 'sonner'

interface ColumnsProps {
  onOrderUpdated?: () => void
}

export function createColumns({ onOrderUpdated }: ColumnsProps): ColumnDef<SubscriptionOrderResponse>[] {
  const handleUpdateStatus = async (order: SubscriptionOrderResponse, newStatus: string) => {
    try {
      await orderService.updateOrderStatus(order.id, {
        status: newStatus as 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded',
        admin_confirmed: true,
        reason: `状态更新为 ${newStatus}`,
        notify_user: true,
      })
      toast.success(`订单状态已更新为 ${newStatus}`)
      onOrderUpdated?.()
    } catch (error) {
      console.error('更新订单状态失败:', error)
      toast.error('更新订单状态时发生错误，请稍后重试')
    }
  }

  const handleRefund = async (order: SubscriptionOrderResponse) => {
    if (!confirm(`确定要退款订单"${order.order_number}"吗？`)) {
      return
    }

    try {
      await orderService.refundOrder(order.id, {
        admin_confirmed: true,
        reason: '管理员操作退款',
        notify_user: true,
      })
      toast.success(`订单"${order.order_number}"已成功退款`)
      onOrderUpdated?.()
    } catch (error) {
      console.error('退款失败:', error)
      toast.error('退款时发生错误，请稍后重试')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '待支付', variant: 'secondary' as const },
      paid: { label: '已支付', variant: 'default' as const },
      failed: { label: '支付失败', variant: 'destructive' as const },
      cancelled: { label: '已取消', variant: 'outline' as const },
      refunded: { label: '已退款', variant: 'secondary' as const },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, variant: 'outline' as const }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  const getOrderTypeBadge = (orderType: string) => {
    const typeConfig = {
      new: { label: '新订单', variant: 'default' as const },
      renewal: { label: '续费', variant: 'secondary' as const },
      upgrade: { label: '升级', variant: 'default' as const },
      downgrade: { label: '降级', variant: 'outline' as const },
    }
    const config = typeConfig[orderType as keyof typeof typeConfig] || { label: orderType, variant: 'outline' as const }
    
    return (
      <Badge variant={config.variant}>
        {config.label}
      </Badge>
    )
  }

  return [
    {
      accessorKey: 'order_number',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent justify-start"
          >
            订单号
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{order.order_number}</div>
            {order.transaction_id && (
              <div className="text-xs text-muted-foreground">
                交易ID: {order.transaction_id}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'user',
      header: '用户',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">用户ID: {order.user_id}</div>
            {order.user?.email && (
              <div className="text-xs text-muted-foreground">
                {order.user.email}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'order_type',
      header: () => <div className="text-center">订单类型</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {getOrderTypeBadge(row.getValue('order_type'))}
        </div>
      ),
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">状态</div>,
      cell: ({ row }) => (
        <div className="text-center">
          {getStatusBadge(row.getValue('status'))}
        </div>
      ),
    },
    {
      accessorKey: 'total_amount',
      header: () => <div className="text-right">金额</div>,
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="text-right space-y-1">
            <div className="font-medium">
              {order.currency} {order.total_amount.toFixed(2)}
            </div>
            {order.discount_amount > 0 && (
              <div className="text-xs text-muted-foreground">
                折扣: -{order.currency} {order.discount_amount.toFixed(2)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'payment_method',
      header: '支付方式',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="space-y-1">
            <div>{order.payment_method}</div>
            <div className="text-xs text-muted-foreground">
              {order.payment_gateway}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'subscription_plan',
      header: '订阅计划',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {order.subscription_plan?.name || `计划ID: ${order.subscription_plan_id}`}
            </div>
            {order.subscription_plan?.price && (
              <div className="text-xs text-muted-foreground">
                {order.currency} {order.subscription_plan.price}/月
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent justify-start"
          >
            创建时间
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string
        const paidAt = row.original.paid_at
        const date = new Date(createdAt)
        return (
          <div className="space-y-1">
            <div className="text-sm">
              {date.toLocaleString('zh-CN', { 
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </div>
            {paidAt && (
              <div className="text-xs text-muted-foreground">
                支付: {new Date(paidAt).toLocaleString('zh-CN', { 
                  month: '2-digit',
                  day: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const order = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(order.order_number)}
              >
                复制订单号
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(order.id.toString())}
              >
                复制订单ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              
              {order.status === 'pending' && (
                <>
                  <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'paid')}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    标记为已支付
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleUpdateStatus(order, 'cancelled')}>
                    <Ban className="mr-2 h-4 w-4" />
                    取消订单
                  </DropdownMenuItem>
                </>
              )}
              
              {order.status === 'paid' && (
                <DropdownMenuItem
                  onClick={() => handleRefund(order)}
                  className="text-red-600"
                >
                  <DollarSign className="mr-2 h-4 w-4" />
                  退款
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}