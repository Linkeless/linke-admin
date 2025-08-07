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
import { MoreHorizontal, Eye, Ban, Copy, ChevronsUpDown } from 'lucide-react'
import { SubscriptionOrderResponse } from '@/lib/order-types'
import { toast } from 'sonner'

interface ColumnsProps {
  onViewDetail?: (orderId: number) => void
  onCancelOrder?: (orderId: number) => void
  onOrderUpdated?: () => void
}

export function createColumns({
  onViewDetail,
  onCancelOrder,
  onOrderUpdated,
}: ColumnsProps): ColumnDef<SubscriptionOrderResponse>[] {
  return [
    {
      accessorKey: 'order_number',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            订单号
            <ChevronsUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{order.order_number}</div>
            <div className="text-xs text-muted-foreground">
              ID: {order.id}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'user_id',
      header: '用户',
      cell: ({ row }) => {
        const order = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {order.user?.username || `用户 #${order.user_id}`}
            </div>
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
      accessorKey: 'subscription_plan',
      header: '订阅计划',
      cell: ({ row }) => {
        const order = row.original
        const plan = order.subscription_plan
        
        if (!plan) {
          return (
            <div className="text-muted-foreground">
              计划 #{order.subscription_plan_id}
            </div>
          )
        }
        
        return (
          <div className="space-y-1">
            <div className="font-medium">{plan.name}</div>
            <div className="text-xs text-muted-foreground">
              {order.currency} {plan.price}/月
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'order_type',
      header: '类型',
      cell: ({ row }) => {
        const type = row.getValue('order_type') as string
        const typeMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
          new: { label: '新订阅', variant: 'default' },
          renewal: { label: '续费', variant: 'secondary' },
          upgrade: { label: '升级', variant: 'default' },
          downgrade: { label: '降级', variant: 'outline' },
        }
        const config = typeMap[type] || { label: type, variant: 'outline' as const }
        
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
          pending: { label: '待支付', variant: 'secondary' },
          paid: { label: '已支付', variant: 'default' },
          completed: { label: '已完成', variant: 'default' },
          failed: { label: '失败', variant: 'destructive' },
          cancelled: { label: '已取消', variant: 'outline' },
          refunded: { label: '已退款', variant: 'secondary' },
        }
        const config = statusMap[status] || { label: status, variant: 'outline' as const }
        
        return (
          <Badge variant={config.variant}>
            {config.label}
          </Badge>
        )
      },
    },
    {
      accessorKey: 'amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            金额
            <ChevronsUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const order = row.original
        const totalAmount = order.amount - order.discount_amount
        
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {order.currency} {totalAmount.toFixed(2)}
            </div>
            {order.discount_amount > 0 && (
              <div className="text-xs text-muted-foreground">
                原价: {order.currency} {order.amount.toFixed(2)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'payment_method',
      header: '支付',
      cell: ({ row }) => {
        const order = row.original
        const methodMap: Record<string, string> = {
          credit_card: '信用卡',
          alipay: '支付宝',
          wechat: '微信支付',
          paypal: 'PayPal',
        }
        
        return (
          <div className="space-y-1">
            <div className="text-sm">
              {methodMap[order.payment_method] || order.payment_method}
            </div>
            <div className="text-xs text-muted-foreground">
              {order.payment_gateway}
            </div>
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
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            创建时间
            <ChevronsUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string
        const date = new Date(createdAt)
        
        return (
          <div className="text-sm">
            {date.toLocaleDateString('zh-CN')}
            <div className="text-xs text-muted-foreground">
              {date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const order = row.original
        
        const handleCopyOrderNumber = () => {
          navigator.clipboard.writeText(order.order_number)
          toast.success('订单号已复制')
        }
        
        const handleCopyTransactionId = () => {
          if (order.transaction_id) {
            navigator.clipboard.writeText(order.transaction_id)
            toast.success('交易ID已复制')
          }
        }
        
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
              <DropdownMenuItem onClick={() => onViewDetail?.(order.id)}>
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleCopyOrderNumber}>
                <Copy className="mr-2 h-4 w-4" />
                复制订单号
              </DropdownMenuItem>
              {order.transaction_id && (
                <DropdownMenuItem onClick={handleCopyTransactionId}>
                  <Copy className="mr-2 h-4 w-4" />
                  复制交易ID
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {(order.status === 'pending' || order.status === 'failed') && (
                <DropdownMenuItem
                  onClick={() => onCancelOrder?.(order.id)}
                  className="text-destructive"
                >
                  <Ban className="mr-2 h-4 w-4" />
                  取消订单
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}