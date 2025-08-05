'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

import { Invoice, UpdateInvoiceRequest } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'
import { InvoiceForm } from '../../components'

export default function EditInvoicePage() {
  const params = useParams()
  const router = useRouter()
  const invoiceId = parseInt(params.id as string)
  
  const [invoice, setInvoice] = useState<Invoice | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取发票详情
  const fetchInvoice = useCallback(async () => {
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
  }, [invoiceId])

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice()
    }
  }, [invoiceId, fetchInvoice])

  const handleSubmit = async (data: UpdateInvoiceRequest) => {
    try {
      setSubmitting(true)
      
      const response = await invoiceService.updateInvoice(invoiceId, data)
      
      if (response.code === 0) {
        toast.success('发票更新成功')
        router.push(`/finance/invoices/${invoiceId}`)
      } else {
        throw new Error(response.message || '更新发票失败')
      }
    } catch (error) {
      console.error('更新发票失败:', error)
      toast.error(error instanceof Error ? error.message : '更新发票失败，请稍后重试')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
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
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
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

  // 检查发票是否可编辑
  const canEdit = invoice.status === 'draft' || invoice.status === 'sent'
  
  if (!canEdit) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertCircle className="mr-2 h-5 w-5" />
              无法编辑
            </CardTitle>
            <CardDescription>
              当前状态的发票无法编辑。只有草稿或已发送状态的发票可以编辑。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => router.back()}>
                返回
              </Button>
              <Button onClick={() => router.push(`/finance/invoices/${invoiceId}`)}>
                查看详情
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            编辑发票 {invoice.invoice_number}
          </h1>
          <p className="text-muted-foreground">
            修改发票信息和项目内容
          </p>
        </div>
      </div>

      {/* 发票表单 */}
      <InvoiceForm
        invoice={invoice}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={submitting}
      />
    </div>
  )
}