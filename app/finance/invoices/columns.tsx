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
import { 
  MoreHorizontal, 
  Eye, 
  Download, 
  Send, 
  CheckCircle, 
  XCircle, 
  ChevronsUpDown,
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react'
import { Invoice } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'
import { toast } from 'sonner'
import Link from 'next/link'

interface ColumnsProps {
  onInvoiceUpdated?: () => void
}

export function createColumns({ onInvoiceUpdated }: ColumnsProps): ColumnDef<Invoice>[] {
  const handleMarkPaid = async (invoice: Invoice) => {
    if (!confirm(`确定要标记发票"${invoice.invoice_number}"为已付款吗？`)) {
      return
    }

    try {
      await invoiceService.markInvoicePaid(invoice.id, {
        payment_date: new Date().toISOString(),
        amount: invoice.total_amount,
      })
      toast.success(`发票"${invoice.invoice_number}"已标记为已付款`)
      onInvoiceUpdated?.()
    } catch (error) {
      console.error('标记付款失败:', error)
      toast.error('标记付款时发生错误，请稍后重试')
    }
  }

  const handleMarkVoid = async (invoice: Invoice) => {
    if (!confirm(`确定要作废发票"${invoice.invoice_number}"吗？此操作不可撤销。`)) {
      return
    }

    try {
      await invoiceService.markInvoiceVoid(invoice.id, {
        reason: '管理员作废',
      })
      toast.success(`发票"${invoice.invoice_number}"已作废`)
      onInvoiceUpdated?.()
    } catch (error) {
      console.error('作废发票失败:', error)
      toast.error('作废发票时发生错误，请稍后重试')
    }
  }

  const handleSendInvoice = async (invoice: Invoice) => {
    try {
      await invoiceService.sendInvoice(invoice.id, {
        to_email: invoice.user?.email,
        attach_pdf: true,
      })
      toast.success(`发票"${invoice.invoice_number}"已发送`)
      onInvoiceUpdated?.()
    } catch (error) {
      console.error('发送发票失败:', error)
      toast.error('发送发票时发生错误，请稍后重试')
    }
  }

  const handleDownload = async (invoice: Invoice) => {
    try {
      const blob = await invoiceService.downloadInvoice(invoice.id)
      invoiceService.downloadFile(blob, `invoice-${invoice.invoice_number}.pdf`)
      toast.success('发票下载成功')
    } catch (error) {
      console.error('下载发票失败:', error)
      toast.error('下载发票时发生错误，请稍后重试')
    }
  }

  const getStatusBadge = (status: string) => {
    const variant = invoiceService.getStatusVariant(status)
    const label = invoiceService.getStatusLabel(status)
    
    return (
      <Badge variant={variant}>
        {label}
      </Badge>
    )
  }

  const formatCurrency = (amount: number, currency: string) => {
    return invoiceService.formatAmount(amount, currency)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getOverdueInfo = (invoice: Invoice) => {
    if (invoice.status === 'overdue') {
      const overdueDays = invoiceService.calculateOverdueDays(invoice.due_date)
      return `逾期 ${overdueDays} 天`
    }
    return null
  }

  return [
    {
      accessorKey: 'invoice_number',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent justify-start"
          >
            发票号
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const invoice = row.original
        return (
          <div className="space-y-1">
            <Link 
              href={`/finance/invoices/${invoice.id}`}
              className="font-medium text-primary hover:underline"
            >
              {invoice.invoice_number}
            </Link>
            {invoice.order_id && (
              <div className="text-xs text-muted-foreground">
                订单: #{invoice.order_id}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'user',
      header: '客户',
      cell: ({ row }) => {
        const invoice = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">
              {invoice.user?.username || invoice.user?.email || `用户ID: ${invoice.user_id}`}
            </div>
            {invoice.user?.email && invoice.user?.username && (
              <div className="text-xs text-muted-foreground">
                {invoice.user.email}
              </div>
            )}
            {invoice.billing_address?.company && (
              <div className="text-xs text-muted-foreground">
                {invoice.billing_address.company}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: () => <div className="text-center">状态</div>,
      cell: ({ row }) => {
        const invoice = row.original
        const overdueInfo = getOverdueInfo(invoice)
        
        return (
          <div className="text-center space-y-1">
            {getStatusBadge(invoice.status)}
            {overdueInfo && (
              <div className="text-xs text-red-600 font-medium">
                {overdueInfo}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'total_amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent justify-end w-full"
          >
            总金额
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const invoice = row.original
        return (
          <div className="text-right space-y-1">
            <div className="font-medium">
              {formatCurrency(invoice.total_amount, invoice.currency)}
            </div>
            {invoice.paid_amount > 0 && invoice.paid_amount < invoice.total_amount && (
              <div className="text-xs text-muted-foreground">
                已付: {formatCurrency(invoice.paid_amount, invoice.currency)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'issue_date',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent justify-start"
          >
            <Calendar className="mr-2 h-3 w-3" />
            开票日期
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const invoice = row.original
        return (
          <div className="space-y-1">
            <div className="text-sm">
              {formatDate(invoice.issue_date)}
            </div>
            <div className="text-xs text-muted-foreground">
              到期: {formatDate(invoice.due_date)}
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'line_items',
      header: '项目',
      cell: ({ row }) => {
        const invoice = row.original
        const itemCount = invoice.line_items?.length || 0
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {itemCount} 个项目
            </div>
            {invoice.line_items?.[0] && (
              <div className="text-xs text-muted-foreground truncate max-w-32">
                {invoice.line_items[0].description}
                {itemCount > 1 && ` +${itemCount - 1} 更多`}
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
        const invoice = row.original
        return (
          <div className="space-y-1">
            <div className="text-sm">
              {formatDate(invoice.created_at)}
            </div>
            {invoice.sent_at && (
              <div className="text-xs text-muted-foreground">
                已发送: {formatDate(invoice.sent_at)}
              </div>
            )}
            {invoice.paid_at && (
              <div className="text-xs text-green-600">
                已付款: {formatDate(invoice.paid_at)}
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
        const invoice = row.original
        const canMarkPaid = invoice.status === 'sent' || invoice.status === 'viewed' || invoice.status === 'overdue'
        const canSend = invoice.status === 'draft' || invoice.status === 'sent'
        const canVoid = invoice.status !== 'paid' && invoice.status !== 'void' && invoice.status !== 'cancelled'

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(invoice.invoice_number)}
              >
                复制发票号
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(invoice.id.toString())}
              >
                复制发票ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href={`/finance/invoices/${invoice.id}`}>
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => handleDownload(invoice)}>
                <Download className="mr-2 h-4 w-4" />
                下载PDF
              </DropdownMenuItem>
              
              {canSend && (
                <DropdownMenuItem onClick={() => handleSendInvoice(invoice)}>
                  <Send className="mr-2 h-4 w-4" />
                  发送发票
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              {canMarkPaid && (
                <DropdownMenuItem onClick={() => handleMarkPaid(invoice)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  标记已付款
                </DropdownMenuItem>
              )}
              
              {canVoid && (
                <DropdownMenuItem
                  onClick={() => handleMarkVoid(invoice)}
                  className="text-red-600"
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  作废发票
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem asChild>
                <Link href={`/finance/invoices/${invoice.id}/edit`}>
                  <FileText className="mr-2 h-4 w-4" />
                  编辑发票
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}