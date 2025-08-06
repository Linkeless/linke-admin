'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { CreateInvoiceRequest } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'
import { InvoiceForm } from '../components'

export default function CreateInvoicePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateInvoiceRequest) => {
    try {
      setLoading(true)
      console.log('创建发票数据:', data)
      
      // 数据验证
      if (!data.user_id || data.user_id === 0) {
        toast.error('请选择用户')
        return
      }
      
      if (!data.line_items || data.line_items.length === 0) {
        toast.error('请至少添加一个发票项目')
        return
      }
      
      // 检查项目描述和金额
      const hasInvalidItems = data.line_items.some(item => 
        !item.description.trim() || item.quantity <= 0 || item.unit_price < 0
      )
      
      if (hasInvalidItems) {
        toast.error('请检查发票项目的描述、数量和单价')
        return
      }
      
      const response = await invoiceService.createInvoice(data)
      
      if (response.code === 0) {
        toast.success('发票创建成功！', {
          description: `发票编号: ${response.data?.invoice_number || '已生成'}`
        })
        console.log('创建成功，发票信息:', response.data)
        
        // 延迟跳转，让用户看到成功提示
        setTimeout(() => {
          router.push('/finance/invoices')
        }, 2000)
      } else {
        throw new Error(response.message || '创建发票失败')
      }
    } catch (error) {
      console.error('创建发票失败:', error)
      
      // 更详细的错误处理
      if (error instanceof Error) {
        const errorMessage = error.message
        
        if (errorMessage.includes('user_id')) {
          toast.error('用户信息有误，请重新选择用户')
        } else if (errorMessage.includes('line_items')) {
          toast.error('发票项目信息有误，请检查项目详情')
        } else if (errorMessage.includes('date')) {
          toast.error('日期格式有误，请检查开票日期和到期日期')
        } else if (errorMessage.includes('currency')) {
          toast.error('货币类型有误，请重新选择')
        } else {
          toast.error(errorMessage)
        }
      } else {
        toast.error('创建发票失败，请稍后重试')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/finance/invoices')
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/finance/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回发票列表
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight">创建发票</h1>
          <p className="text-muted-foreground">
            填写发票信息，创建新的发票
          </p>
        </div>
      </div>

      {/* 发票表单 */}
      <InvoiceForm
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        loading={loading}
      />
    </div>
  )
}