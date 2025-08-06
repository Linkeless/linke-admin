'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Calendar,
  CreditCard, 
  DollarSign,
  Package,
  FileText,
  AlertCircle
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
  onOrderUpdated 
}: OrderDetailDialogProps) {
  const [order, setOrder] = useState<SubscriptionOrderResponse | null>(null)
  const [loading, setLoading] = useState(false)

  const fetchOrderDetail = useCallback(async () => {
    if (!orderId) return

    try {
      setLoading(true)
      const response = await orderService.getOrderById(orderId)
      
      if (response.code === 0 && response.data) {
        setOrder(response.data)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error('获取订单详情失败:', error)
      toast.error('获取订单详情失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    if (open && orderId) {
      fetchOrderDetail()
    }
  }, [open, orderId, fetchOrderDetail])

  const handleCancelOrder = async () => {
    if (!order || !confirm(`确定要取消订单"${order.order_number}"吗？`)) {
      return
    }

    try {
      await orderService.cancelOrder(order.id, {
        reason: '管理员取消'
      })
      toast.success('订单已取消')
      onOrderUpdated?.()
      onOpenChange(false)
    } catch (error) {
      console.error('取消订单失败:', error)
      toast.error('取消订单失败，请稍后重试')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: '待支付', variant: 'secondary' as const, color: 'text-yellow-600' },
      paid: { label: '已支付', variant: 'default' as const, color: 'text-green-600' },
      completed: { label: '已完成', variant: 'default' as const, color: 'text-green-600' },
      failed: { label: '支付失败', variant: 'destructive' as const, color: 'text-red-600' },
      cancelled: { label: '已取消', variant: 'outline' as const, color: 'text-gray-600' },
      refunded: { label: '已退款', variant: 'secondary' as const, color: 'text-blue-600' },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      variant: 'outline' as const, 
      color: 'text-gray-600' 
    }
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {config.label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency || 'CNY'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>订单详情</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!order) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            订单详情 - {order.order_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  基本信息
                </div>
                {getStatusBadge(order.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">订单号</p>
                  <p className="text-sm text-muted-foreground font-mono">{order.order_number}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">订单类型</p>
                  <Badge variant="outline">
                    {order.order_type === 'new' ? '新订单' : 
                     order.order_type === 'renewal' ? '续费' :
                     order.order_type === 'upgrade' ? '升级' :
                     order.order_type === 'downgrade' ? '降级' : order.order_type}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">用户ID</p>
                  <p className="text-sm text-muted-foreground">{order.user_id}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">订阅计划ID</p>
                  <p className="text-sm text-muted-foreground">{order.subscription_plan_id}</p>
                </div>
              </div>
              
              {order.subscription_plan && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">订阅计划</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{order.subscription_plan.name}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(order.subscription_plan.price, order.currency)}/月
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 金额信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                金额信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">订单金额</p>
                  <p className="text-lg font-semibold">{formatCurrency(order.amount, order.currency)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">货币</p>
                  <Badge variant="outline">{order.currency}</Badge>
                </div>
                {order.discount_amount > 0 && (
                  <>
                    <div className="space-y-2">
                      <p className="text-sm font-medium">折扣金额</p>
                      <p className="text-sm text-red-600">-{formatCurrency(order.discount_amount, order.currency)}</p>
                    </div>
                    {order.coupon_code && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">优惠券</p>
                        <Badge variant="secondary">{order.coupon_code}</Badge>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 支付信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                支付信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">支付方式</p>
                  <Badge variant="outline">{order.payment_method}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">支付网关</p>
                  <Badge variant="outline">{order.payment_gateway}</Badge>
                </div>
                {order.payment_status && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">支付状态</p>
                    <Badge variant="secondary">{order.payment_status}</Badge>
                  </div>
                )}
                {order.transaction_id && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">交易ID</p>
                    <p className="text-sm text-muted-foreground font-mono">{order.transaction_id}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                时间信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">创建时间</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.created_at)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">更新时间</p>
                  <p className="text-sm text-muted-foreground">{formatDate(order.updated_at)}</p>
                </div>
                {order.paid_at && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">支付时间</p>
                    <p className="text-sm text-muted-foreground text-green-600">{formatDate(order.paid_at)}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">计费周期</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(order.billing_period_start)} 至 {formatDate(order.billing_period_end)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 退款信息 */}
          {(order.refund_amount || order.refund_status) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  退款信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {order.refund_amount && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">退款金额</p>
                      <p className="text-sm text-orange-600">{formatCurrency(order.refund_amount, order.currency)}</p>
                    </div>
                  )}
                  {order.refund_status && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">退款状态</p>
                      <Badge variant="secondary">{order.refund_status}</Badge>
                    </div>
                  )}
                  {order.refund_reason && (
                    <div className="space-y-2 md:col-span-2">
                      <p className="text-sm font-medium">退款原因</p>
                      <p className="text-sm text-muted-foreground">{order.refund_reason}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end space-x-2 pt-4 border-t">
            {(order.status === 'pending' || order.status === 'failed') && (
              <Button variant="outline" onClick={handleCancelOrder}>
                取消订单
              </Button>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              关闭
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}