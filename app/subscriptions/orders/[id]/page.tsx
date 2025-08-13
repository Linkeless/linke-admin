'use client'

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  ArrowLeft, 
  RefreshCcw, 
  X, 
  Copy, 
  Download,
  User,
  CreditCard,
  Package,
  Clock
} from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { 
  OrderDetail,
  ORDER_STATUS_CONFIG 
} from "@/lib/subscription-types"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.id as string
  
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [loading, setLoading] = useState(true)

  // 模拟数据加载
  const loadOrderData = useCallback(async () => {
    try {
      setLoading(true)
      
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 模拟订单详情数据
      const mockOrder: OrderDetail = {
        id: parseInt(orderId),
        user_id: 1001,
        subscription_plan_id: 2001,
        order_number: `ORD-2024-${orderId}`,
        status: 'completed',
        amount: 299.00,
        currency: 'CNY',
        payment_method: '支付宝',
        payment_status: 'completed',
        billing_address: '中国上海市浦东新区张江高科技园区',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T10:35:00Z',
        completed_at: '2024-01-15T10:35:00Z',
        notes: '用户升级到专业版订阅计划，支付成功后立即生效',
        user: {
          id: 1001,
          email: 'john@example.com',
          username: 'john_doe',
          name: 'John Doe'
        },
        subscription_plan: {
          id: 2001,
          name: '专业版月付',
          price: 299.00,
          currency: 'CNY',
          billing_cycle: 'monthly'
        },
        payment_transactions: [
          {
            id: 30001,
            order_id: parseInt(orderId),
            transaction_id: 'TXN_2024_001_ALIPAY',
            payment_method: '支付宝',
            amount: 299.00,
            currency: 'CNY',
            status: 'completed',
            gateway_response: '支付成功',
            created_at: '2024-01-15T10:30:00Z',
            updated_at: '2024-01-15T10:35:00Z'
          }
        ]
      }

      setOrder(mockOrder)
    } catch (error) {
      console.error('加载订单详情失败:', error)
    } finally {
      setLoading(false)
    }
  }, [orderId])

  useEffect(() => {
    loadOrderData()
  }, [loadOrderData])

  // 格式化货币
  const formatCurrency = (amount: number, currency: string = 'CNY') => {
    return new Intl.NumberFormat('zh-CN', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const handleRetryPayment = async () => {
    if (!order) return
    try {
      console.log('重试支付:', order.id)
      // 重新加载数据
      await loadOrderData()
    } catch (error) {
      console.error('重试支付失败:', error)
    }
  }

  const handleCancelOrder = async () => {
    if (!order) return
    if (confirm('确定要取消这个订单吗？此操作不可撤销。')) {
      try {
        console.log('取消订单:', order.id)
        await loadOrderData()
      } catch (error) {
        console.error('取消订单失败:', error)
      }
    }
  }

  const handleDownloadInvoice = () => {
    if (!order) return
    console.log('下载发票:', order.id)
    // 实际项目中这里会调用下载API
  }

  if (loading) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订单详情" 
          description="查看订单的详细信息和支付状态"
        />
        <main className="flex-1 p-6">
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </main>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="flex flex-col">
        <PageHeader 
          title="订单详情" 
          description="订单不存在或已被删除"
        />
        <main className="flex-1 p-6">
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">未找到订单信息</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const statusConfig = ORDER_STATUS_CONFIG[order.status as keyof typeof ORDER_STATUS_CONFIG]
  const canRetry = order.status === 'failed' || order.payment_status === 'failed'
  const canCancel = order.status === 'pending'

  return (
    <div className="flex flex-col">
      <PageHeader 
        title={`订单 ${order.order_number}`}
        description="查看订单的详细信息和支付状态"
      >
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          {order.status === 'completed' && (
            <Button variant="outline" onClick={handleDownloadInvoice}>
              <Download className="mr-2 h-4 w-4" />
              下载发票
            </Button>
          )}
          {canRetry && (
            <Button onClick={handleRetryPayment}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              重试支付
            </Button>
          )}
          {canCancel && (
            <Button variant="destructive" onClick={handleCancelOrder}>
              <X className="mr-2 h-4 w-4" />
              取消订单
            </Button>
          )}
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 订单概览 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  订单信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">订单号</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono">{order.order_number}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigator.clipboard.writeText(order.order_number)}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">订单状态</span>
                  <Badge variant={statusConfig?.variant || "outline"}>
                    {statusConfig?.text || order.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">订单金额</span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(order.amount, order.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">支付方式</span>
                  <Badge variant="outline">{order.payment_method}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">支付状态</span>
                  <Badge variant={order.payment_status === 'completed' ? 'default' : 'destructive'}>
                    {order.payment_status === 'completed' ? '已支付' : 
                     order.payment_status === 'pending' ? '待支付' : 
                     order.payment_status === 'failed' ? '支付失败' : '已退款'}
                  </Badge>
                </div>
                {order.billing_address && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">账单地址</span>
                      <p className="mt-1">{order.billing_address}</p>
                    </div>
                  </>
                )}
                {order.notes && (
                  <>
                    <Separator />
                    <div>
                      <span className="text-sm text-muted-foreground">备注</span>
                      <p className="mt-1">{order.notes}</p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  时间信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-sm text-muted-foreground">创建时间</span>
                  <p className="mt-1">
                    {new Date(order.created_at).toLocaleString('zh-CN')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(order.created_at), { locale: zhCN, addSuffix: true })}
                  </p>
                </div>
                {order.completed_at && (
                  <div>
                    <span className="text-sm text-muted-foreground">完成时间</span>
                    <p className="mt-1">
                      {new Date(order.completed_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}
                {order.cancelled_at && (
                  <div>
                    <span className="text-sm text-muted-foreground">取消时间</span>
                    <p className="mt-1">
                      {new Date(order.cancelled_at).toLocaleString('zh-CN')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 用户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                用户信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.user ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">姓名</span>
                    <p className="mt-1 font-medium">{order.user.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">邮箱</span>
                    <p className="mt-1">{order.user.email}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">用户名</span>
                    <p className="mt-1">{order.user.username}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">用户信息不可用</p>
              )}
            </CardContent>
          </Card>

          {/* 订阅计划信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                订阅计划
              </CardTitle>
            </CardHeader>
            <CardContent>
              {order.subscription_plan ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">计划名称</span>
                    <p className="mt-1 font-medium">{order.subscription_plan.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">价格</span>
                    <p className="mt-1">{formatCurrency(order.subscription_plan.price, order.subscription_plan.currency)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">计费周期</span>
                    <p className="mt-1">
                      {order.subscription_plan.billing_cycle === 'monthly' ? '月付' : '年付'}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">订阅计划信息不可用</p>
              )}
            </CardContent>
          </Card>

          {/* 支付交易记录 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                支付交易记录
              </CardTitle>
              <CardDescription>
                订单相关的所有支付交易信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              {order.payment_transactions && order.payment_transactions.length > 0 ? (
                <div className="space-y-4">
                  {order.payment_transactions.map((transaction) => (
                    <div key={transaction.id} className="p-4 border rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                          <span className="text-sm text-muted-foreground">交易ID</span>
                          <p className="mt-1 font-mono text-sm">{transaction.transaction_id}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">支付方式</span>
                          <p className="mt-1">{transaction.payment_method}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">金额</span>
                          <p className="mt-1">{formatCurrency(transaction.amount, transaction.currency)}</p>
                        </div>
                        <div>
                          <span className="text-sm text-muted-foreground">状态</span>
                          <Badge variant={transaction.status === 'completed' ? 'default' : 'destructive'} className="mt-1">
                            {transaction.status === 'completed' ? '成功' : 
                             transaction.status === 'pending' ? '处理中' : '失败'}
                          </Badge>
                        </div>
                      </div>
                      {transaction.gateway_response && (
                        <div className="mt-3 pt-3 border-t">
                          <span className="text-sm text-muted-foreground">网关响应</span>
                          <p className="mt-1 text-sm">{transaction.gateway_response}</p>
                        </div>
                      )}
                      <div className="mt-3 text-xs text-muted-foreground">
                        创建时间: {new Date(transaction.created_at).toLocaleString('zh-CN')}
                        {transaction.updated_at !== transaction.created_at && (
                          <> | 更新时间: {new Date(transaction.updated_at).toLocaleString('zh-CN')}</>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">暂无支付交易记录</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}