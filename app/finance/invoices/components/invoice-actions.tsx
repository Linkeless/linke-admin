'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  MoreHorizontal, 
  Eye, 
  Download, 
  Send, 
  CheckCircle, 
  XCircle, 
  FileText,
  Copy,
  Printer
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

import { Invoice } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'

interface InvoiceActionsProps {
  invoice: Invoice
  onUpdate?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export function InvoiceActions({ invoice, onUpdate, size = 'md' }: InvoiceActionsProps) {
  const [confirmAction, setConfirmAction] = useState<'paid' | 'void' | null>(null)
  const [loading, setLoading] = useState(false)

  const canMarkPaid = invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue'
  const canSend = invoice.status === 'draft' || invoice.status === 'sent'
  const canVoid = invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'cancelled'
  const canEdit = invoice.status === 'draft' || invoice.status === 'sent'

  const handleMarkPaid = async () => {
    try {
      setLoading(true)
      await invoiceService.markInvoicePaid(invoice.id, {
        payment_date: new Date().toISOString(),
        amount: invoice.total_amount,
      })
      toast.success(`发票"${invoice.invoice_number}"已标记为已付款`)
      onUpdate?.()
    } catch (error) {
      console.error('标记付款失败:', error)
      toast.error('标记付款时发生错误，请稍后重试')
    } finally {
      setLoading(false)
      setConfirmAction(null)
    }
  }

  const handleMarkVoid = async () => {
    try {
      setLoading(true)
      await invoiceService.markInvoiceVoid(invoice.id, {
        reason: '管理员作废',
      })
      toast.success(`发票"${invoice.invoice_number}"已作废`)
      onUpdate?.()
    } catch (error) {
      console.error('作废发票失败:', error)
      toast.error('作废发票时发生错误，请稍后重试')
    } finally {
      setLoading(false)
      setConfirmAction(null)
    }
  }

  const handleSend = async () => {
    try {
      setLoading(true)
      await invoiceService.sendInvoice(invoice.id, {
        to_email: invoice.user?.email,
        attach_pdf: true,
      })
      toast.success(`发票"${invoice.invoice_number}"已发送`)
      onUpdate?.()
    } catch (error) {
      console.error('发送发票失败:', error)
      toast.error('发送发票时发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = async () => {
    try {
      setLoading(true)
      const blob = await invoiceService.downloadInvoice(invoice.id)
      invoiceService.downloadFile(blob, `invoice-${invoice.invoice_number}.pdf`)
      toast.success('发票下载成功')
    } catch (error) {
      console.error('下载发票失败:', error)
      toast.error('下载发票时发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = async () => {
    try {
      const blob = await invoiceService.getInvoicePdf(invoice.id)
      const url = window.URL.createObjectURL(blob)
      const printWindow = window.open(url)
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print()
          printWindow.close()
        }
      }
    } catch (error) {
      console.error('打印发票失败:', error)
      toast.error('打印发票时发生错误，请稍后重试')
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label}已复制到剪贴板`)
  }

  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default'
  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size={buttonSize === 'sm' ? 'sm' : 'default'}
            className={size === 'sm' ? 'h-7 w-7 p-0' : 'h-8 w-8 p-0'}
            disabled={loading}
          >
            <span className="sr-only">打开菜单</span>
            <MoreHorizontal className={iconSize} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>操作</DropdownMenuLabel>
          
          <DropdownMenuItem
            onClick={() => copyToClipboard(invoice.invoice_number, '发票号')}
          >
            <Copy className={`mr-2 ${iconSize}`} />
            复制发票号
          </DropdownMenuItem>
          
          <DropdownMenuItem
            onClick={() => copyToClipboard(invoice.id.toString(), '发票ID')}
          >
            <Copy className={`mr-2 ${iconSize}`} />
            复制发票ID
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem asChild>
            <Link href={`/finance/invoices/${invoice.id}`}>
              <Eye className={`mr-2 ${iconSize}`} />
              查看详情
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handleDownload} disabled={loading}>
            <Download className={`mr-2 ${iconSize}`} />
            下载PDF
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={handlePrint} disabled={loading}>
            <Printer className={`mr-2 ${iconSize}`} />
            打印发票
          </DropdownMenuItem>
          
          {canSend && (
            <DropdownMenuItem onClick={handleSend} disabled={loading}>
              <Send className={`mr-2 ${iconSize}`} />
              发送发票
            </DropdownMenuItem>
          )}
          
          <DropdownMenuSeparator />
          
          {canMarkPaid && (
            <DropdownMenuItem onClick={() => setConfirmAction('paid')}>
              <CheckCircle className={`mr-2 ${iconSize}`} />
              标记已付款
            </DropdownMenuItem>
          )}
          
          {canVoid && (
            <DropdownMenuItem
              onClick={() => setConfirmAction('void')}
              className="text-red-600"
            >
              <XCircle className={`mr-2 ${iconSize}`} />
              作废发票
            </DropdownMenuItem>
          )}
          
          {canEdit && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/finance/invoices/${invoice.id}/edit`}>
                  <FileText className={`mr-2 ${iconSize}`} />
                  编辑发票
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* 确认对话框 */}
      <AlertDialog open={confirmAction === 'paid'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认标记为已付款</AlertDialogTitle>
            <AlertDialogDescription>
              确定要将发票&ldquo;{invoice.invoice_number}&rdquo;标记为已付款吗？
              <br />
              金额：{invoiceService.formatAmount(invoice.total_amount, invoice.currency)}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkPaid}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? '处理中...' : '确认付款'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'void'} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认作废发票</AlertDialogTitle>
            <AlertDialogDescription>
              确定要作废发票&ldquo;{invoice.invoice_number}&rdquo;吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>取消</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkVoid}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700"
            >
              {loading ? '处理中...' : '确认作废'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}