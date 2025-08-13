"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, RefreshCcw, X, Copy } from "lucide-react"
import { 
  OrderDetail,
  ORDER_STATUS_CONFIG 
} from "@/lib/subscription-types"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"
import Link from "next/link"

interface OrderColumnsOptions {
  onOrderUpdated: () => void
}

export function createOrderColumns({ 
  onOrderUpdated
}: OrderColumnsOptions): ColumnDef<OrderDetail>[] {
  
  const handleRetryPayment = async (order: OrderDetail) => {
    try {
      // 模拟API调用
      console.log('重试支付:', order.id)
      onOrderUpdated()
    } catch (error) {
      console.error('重试支付失败:', error)
    }
  }

  const handleCancelOrder = async (order: OrderDetail) => {
    if (confirm('确定要取消这个订单吗？此操作不可撤销。')) {
      try {
        // 模拟API调用
        console.log('取消订单:', order.id)
        onOrderUpdated()
      } catch (error) {
        console.error('取消订单失败:', error)
      }
    }
  }

  // 格式化货币
  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  return [
    {
      accessorKey: "order_number",
      header: "订单号",
      cell: ({ row }) => {
        const orderNumber = row.getValue("order_number") as string
        return (
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm">{orderNumber}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigator.clipboard.writeText(orderNumber)}
              className="h-6 w-6 p-0"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: "user",
      header: "用户信息",
      cell: ({ row }) => {
        const user = row.original.user
        return user ? (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "subscription_plan",
      header: "订阅计划",
      cell: ({ row }) => {
        const plan = row.original.subscription_plan
        return plan ? (
          <div>
            <div className="font-medium">{plan.name}</div>
            <div className="text-sm text-muted-foreground">
              {formatCurrency(plan.price, plan.currency)} / {plan.billing_cycle === 'monthly' ? '月' : '年'}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "amount",
      header: "订单金额",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number
        const currency = row.original.currency
        return (
          <div className="text-right">
            <div className="font-medium">{formatCurrency(amount, currency)}</div>
          </div>
        )
      },
    },
    {
      accessorKey: "payment_method",
      header: "支付方式",
      cell: ({ row }) => {
        const method = row.getValue("payment_method") as string
        return (
          <Badge variant="outline">
            {method}
          </Badge>
        )
      },
    },
    {
      accessorKey: "status",
      header: "订单状态",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const config = ORDER_STATUS_CONFIG[status as keyof typeof ORDER_STATUS_CONFIG]
        return (
          <Badge variant={config?.variant || "outline"}>
            {config?.text || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "payment_status",
      header: "支付状态",
      cell: ({ row }) => {
        const paymentStatus = row.getValue("payment_status") as string
        const variants = {
          pending: "outline" as const,
          completed: "default" as const,
          failed: "destructive" as const,
          refunded: "secondary" as const
        }
        const texts = {
          pending: "待支付",
          completed: "已支付",
          failed: "支付失败",
          refunded: "已退款"
        }
        return (
          <Badge variant={variants[paymentStatus as keyof typeof variants] || "outline"}>
            {texts[paymentStatus as keyof typeof texts] || paymentStatus}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "创建时间",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString('zh-CN')}</div>
            <div className="text-muted-foreground">
              {formatDistanceToNow(date, { locale: zhCN, addSuffix: true })}
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const order = row.original
        const canRetry = order.status === 'failed' || order.payment_status === 'failed'
        const canCancel = order.status === 'pending'

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
              <DropdownMenuItem asChild>
                <Link href={`/subscriptions/orders/${order.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(order.order_number)}
              >
                <Copy className="mr-2 h-4 w-4" />
                复制订单号
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canRetry && (
                <DropdownMenuItem onClick={() => handleRetryPayment(order)}>
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  重试支付
                </DropdownMenuItem>
              )}
              {canCancel && (
                <DropdownMenuItem 
                  onClick={() => handleCancelOrder(order)}
                  className="text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
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