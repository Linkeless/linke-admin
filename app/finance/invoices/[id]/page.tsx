'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Building, 
  FileText, 
  DollarSign,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
  Send,
  Edit,
  Eye
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Invoice } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'
import { InvoiceStatusBadge, InvoiceActions } from '../components'

export default function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = parseInt(params.id as string)
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 获取发票详情
  const fetchInvoice = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await invoiceService.getInvoice(invoiceId)
      
      if (response.code === 0) {
        setInvoice(response.data)
      } else {
        throw new Error(response.message || '获取发票详情失败')
      }
    } catch (error) {
      console.error('获取发票详情失败:', error)
      setError(error instanceof Error ? error.message : '获取发票详情失败')
      toast.error('获取发票详情失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number, currency: string) => {
    return invoiceService.formatAmount(amount, currency)
  }

  const calculateItemTotal = (item: any) => {
    const subtotal = item.quantity * item.unit_price
    const discount = item.discount_amount || 0
    const taxableAmount = subtotal - discount
    const tax = item.tax_amount || 0
    return taxableAmount + tax
  }

  if (loading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-10" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-24" />
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !invoice) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              加载失败
            </CardTitle>
            <CardDescription>
              {error || '未找到指定的发票'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.back()}>
                返回
              </Button>
              <Button onClick={fetchInvoice}>
                重试
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const overdueInfo = invoice.status === 'overdue' 
    ? `逾期 ${invoiceService.calculateOverdueDays(invoice.due_date)} 天`
    : null

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* 页面标题和操作 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              发票 {invoice.invoice_number}
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <InvoiceStatusBadge status={invoice.status} showIcon />
              {overdueInfo && (
                <Badge variant="destructive" className="text-xs">
                  {overdueInfo}
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <InvoiceActions 
            invoice={invoice} 
            onUpdate={fetchInvoice}
            size="lg"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* 发票信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              发票信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">发票号</div>
                <div className="font-mono">{invoice.invoice_number}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">状态</div>
                <div><InvoiceStatusBadge status={invoice.status} /></div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">开票日期</div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDate(invoice.issue_date)}
                </div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">到期日期</div>
                <div className="flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {formatDate(invoice.due_date)}
                </div>
              </div>
            </div>

            {invoice.paid_at && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">付款日期</div>
                <div className="flex items-center text-green-600">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  {formatDate(invoice.paid_at)}
                </div>
              </div>
            )}

            {invoice.sent_at && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">发送日期</div>
                <div className="flex items-center">
                  <Send className="mr-1 h-3 w-3" />
                  {formatDate(invoice.sent_at)}
                </div>
              </div>
            )}

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium text-muted-foreground">货币</div>
                <div>{invoice.currency}</div>
              </div>
              
              <div>
                <div className="text-sm font-medium text-muted-foreground">语言</div>
                <div>{invoice.language}</div>
              </div>
            </div>

            {(invoice.order_id || invoice.subscription_id) && (
              <>
                <Separator />
                <div className="space-y-2">
                  {invoice.order_id && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">关联订单</div>
                      <Link 
                        href={`/finance/orders/${invoice.order_id}`}
                        className="text-primary hover:underline"
                      >
                        订单 #{invoice.order_id}
                      </Link>
                    </div>
                  )}
                  
                  {invoice.subscription_id && (
                    <div>
                      <div className="text-sm font-medium text-muted-foreground">关联订阅</div>
                      <Link 
                        href={`/subscriptions/${invoice.subscription_id}`}
                        className="text-primary hover:underline"
                      >
                        订阅 #{invoice.subscription_id}
                      </Link>
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* 客户信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              客户信息
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">客户</div>
              <div className="font-medium">
                {invoice.user?.username || invoice.user?.email || `用户ID: ${invoice.user_id}`}
              </div>
              {invoice.user?.email && invoice.user?.username && (
                <div className="text-sm text-muted-foreground">{invoice.user.email}</div>
              )}
            </div>

            {invoice.billing_address && (
              <>
                <Separator />
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center">
                    <Building className="mr-1 h-3 w-3" />
                    计费地址
                  </div>
                  <div className="space-y-1 text-sm">
                    {invoice.billing_address.company && (
                      <div className="font-medium">{invoice.billing_address.company}</div>
                    )}
                    {invoice.billing_address.address_line_1 && (
                      <div>{invoice.billing_address.address_line_1}</div>
                    )}
                    {invoice.billing_address.address_line_2 && (
                      <div>{invoice.billing_address.address_line_2}</div>
                    )}
                    <div>
                      {[
                        invoice.billing_address.city,
                        invoice.billing_address.state,
                        invoice.billing_address.postal_code
                      ].filter(Boolean).join(', ')}
                    </div>
                    {invoice.billing_address.country && (
                      <div>{invoice.billing_address.country}</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 发票项目 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            发票项目
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {invoice.line_items?.map((item, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <div className="font-medium">{item.description}</div>
                    <div className="text-sm text-muted-foreground">
                      数量: {item.quantity} × {formatCurrency(item.unit_price, invoice.currency)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(calculateItemTotal(item), invoice.currency)}
                    </div>
                  </div>
                </div>
                
                {(item.discount_amount > 0 || item.tax_amount > 0) && (
                  <div className="text-xs text-muted-foreground space-y-1">
                    {item.discount_amount > 0 && (
                      <div>折扣: -{formatCurrency(item.discount_amount, invoice.currency)}</div>
                    )}
                    {item.tax_amount > 0 && (
                      <div>税费: {formatCurrency(item.tax_amount, invoice.currency)}</div>
                    )}
                  </div>
                )}
              </div>
            ))}

            <Separator />

            {/* 金额汇总 */}
            <div className="flex justify-end">
              <div className="w-64 space-y-2">
                <div className="flex justify-between">
                  <span>小计:</span>
                  <span>{formatCurrency(invoice.subtotal, invoice.currency)}</span>
                </div>
                
                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>折扣:</span>
                    <span>-{formatCurrency(invoice.discount_amount, invoice.currency)}</span>
                  </div>
                )}
                
                {invoice.tax_amount > 0 && (
                  <div className="flex justify-between">
                    <span>税费:</span>
                    <span>{formatCurrency(invoice.tax_amount, invoice.currency)}</span>
                  </div>
                )}
                
                <Separator />
                
                <div className="flex justify-between font-bold text-lg">
                  <span>总计:</span>
                  <span>{formatCurrency(invoice.total_amount, invoice.currency)}</span>
                </div>
                
                {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
                  <div className="flex justify-between text-green-600">
                    <span>已付:</span>
                    <span>{formatCurrency(invoice.paid_amount, invoice.currency)}</span>
                  </div>
                )}
                
                {invoice.paid_amount < invoice.total_amount && (
                  <div className="flex justify-between text-orange-600 font-medium">
                    <span>未付:</span>
                    <span>{formatCurrency(invoice.total_amount - invoice.paid_amount, invoice.currency)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 备注和条款 */}
      {(invoice.notes || invoice.terms || invoice.footer) && (
        <div className="grid gap-6 md:grid-cols-2">
          {invoice.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">备注</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">
                  {invoice.notes}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.terms && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">条款</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">
                  {invoice.terms}
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.footer && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">页脚</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="whitespace-pre-wrap text-sm">
                  {invoice.footer}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}