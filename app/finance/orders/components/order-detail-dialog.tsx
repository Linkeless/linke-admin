'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Calendar,
  CreditCard,
  DollarSign,
  Package,
  User,
  Ban,
  FileText,
  Hash,
  Clock,
  Tag,
} from 'lucide-react'
import { toast } from 'sonner'

import { SubscriptionOrderResponse } from '@/lib/order-types'
import { orderService } from '@/lib/order-service'

interface OrderDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: number | null
  onOrderUpdated?: () => void
}

export function OrderDetailDialog({
  open,
  onOpenChange,
  orderId,
  onOrderUpdated,
}: OrderDetailDialogProps) {
  const [order, setOrder] = useState<SubscriptionOrderResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [cancelling, setCancelling] = useState(false)

  // 获取订单详情
  useEffect(() => {
    if (!open || !orderId) {
      setOrder(null)
      return
    }

    const fetchOrderDetail = async () => {
      try {
        setLoading(true)
        const response = await orderService.getOrderById(orderId)

        if (response.code === 0 && response.data) {
          setOrder(response.data)
        } else {
          toast.error(response.message || '获取订单详情失败')
        }
      } catch (error) {
        console.error('获取订单详情失败:', error)
        toast.error('获取订单详情失败，请重试')
      } finally {
        setLoading(false)
      }
    }

    fetchOrderDetail()
  }, [open, orderId])

  // 取消订单
  const handleCancelOrder = async () => {
    if (!order) return
    if (!confirm(`确定要取消订单 ${order.order_number} 吗？`)) return

    try {
      setCancelling(true)
      const response = await orderService.cancelOrder(order.id, {
        reason: '管理员手动取消',
      })

      if (response.code === 0) {
        toast.success('订单已取消')
        onOrderUpdated?.()
        onOpenChange(false)
      } else {
        toast.error(response.message || '取消订单失败')
      }
    } catch (error) {
      console.error('取消订单失败:', error)
      toast.error('取消订单失败，请重试')
    } finally {
      setCancelling(false)
    }
  }

  // 格式化日期
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: '待支付', variant: 'secondary' },
      paid: { label: '已支付', variant: 'default' },
      completed: { label: '已完成', variant: 'default' },
      failed: { label: '失败', variant: 'destructive' },
      cancelled: { label: '已取消', variant: 'outline' },
      refunded: { label: '已退款', variant: 'secondary' },
    }
    const config = statusMap[status] || { label: status, variant: 'outline' as const }
    return <Badge variant={config.variant}>{config.label}</Badge>
  }

  // 获取订单类型徽章
  const getOrderTypeBadge = (type: string) => {
    const typeMap: Record<string, string> = {
      new: '新订阅',
      renewal: '续费',
      upgrade: '升级',
      downgrade: '降级',
    }
    return typeMap[type] || type
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>订单详情</DialogTitle>
          {order && (
            <DialogDescription>
              订单号: {order.order_number}
            </DialogDescription>
          )}
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : order ? (
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-sm font-medium mb-3">基本信息</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      订单号
                    </p>
                    <p className="font-medium">{order.order_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">状态</p>
                    <div>{getStatusBadge(order.status)}</div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Tag className="h-3 w-3" />
                      订单类型
                    </p>
                    <p className="font-medium">{getOrderTypeBadge(order.order_type)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      创建时间
                    </p>
                    <p className="font-medium">{formatDate(order.created_at)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 用户信息 */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  用户信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">用户ID</p>
                    <p className="font-medium">{order.user_id}</p>
                  </div>
                  {order.user && (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">用户名</p>
                        <p className="font-medium">{order.user.username || '-'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">邮箱</p>
                        <p className="font-medium">{order.user.email}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* 订阅计划 */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  订阅计划
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">计划ID</p>
                    <p className="font-medium">{order.subscription_plan_id}</p>
                  </div>
                  {order.subscription_plan && (
                    <>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">计划名称</p>
                        <p className="font-medium">{order.subscription_plan.name}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">计划价格</p>
                        <p className="font-medium">
                          {order.currency} {order.subscription_plan.price}/月
                        </p>
                      </div>
                    </>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">计费周期</p>
                    <p className="font-medium">
                      {formatDate(order.billing_period_start)} 至 {formatDate(order.billing_period_end)}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* 金额信息 */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  金额信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">原价</p>
                    <p className="font-medium">
                      {order.currency} {order.amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">折扣金额</p>
                    <p className="font-medium">
                      {order.discount_amount > 0 ? '-' : ''}
                      {order.currency} {order.discount_amount.toFixed(2)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">实付金额</p>
                    <p className="font-medium text-lg">
                      {order.currency} {(order.amount - order.discount_amount).toFixed(2)}
                    </p>
                  </div>
                  {order.coupon_code && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">优惠券</p>
                      <p className="font-medium">{order.coupon_code}</p>
                    </div>
                  )}
                  {order.refund_amount && order.refund_amount > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">退款金额</p>
                      <p className="font-medium text-orange-600">
                        {order.currency} {order.refund_amount.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* 支付信息 */}
              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  支付信息
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">支付方式</p>
                    <p className="font-medium">{order.payment_method}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">支付网关</p>
                    <p className="font-medium">{order.payment_gateway}</p>
                  </div>
                  {order.transaction_id && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">交易ID</p>
                      <p className="font-medium font-mono text-xs">{order.transaction_id}</p>
                    </div>
                  )}
                  {order.paid_at && (
                    <div className="space-y-1">
                      <p className="text-sm text-muted-foreground">支付时间</p>
                      <p className="font-medium">{formatDate(order.paid_at)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 发票信息 */}
              {order.invoice_number && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      发票信息
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">发票号</p>
                        <p className="font-medium">{order.invoice_number}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">发票状态</p>
                        <p className="font-medium">{order.invoice_status || '-'}</p>
                      </div>
                      {order.invoiced_at && (
                        <div className="space-y-1">
                          <p className="text-sm text-muted-foreground">开票时间</p>
                          <p className="font-medium">{formatDate(order.invoiced_at)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* 备注 */}
              {order.remark && (
                <>
                  <Separator />
                  <div>
                    <h3 className="text-sm font-medium mb-3">备注</h3>
                    <p className="text-sm text-muted-foreground">{order.remark}</p>
                  </div>
                </>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">未找到订单信息</p>
          </div>
        )}

        <DialogFooter>
          {order && (order.status === 'pending' || order.status === 'failed') && (
            <Button
              variant="destructive"
              onClick={handleCancelOrder}
              disabled={cancelling}
            >
              <Ban className="mr-2 h-4 w-4" />
              {cancelling ? '取消中...' : '取消订单'}
            </Button>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}