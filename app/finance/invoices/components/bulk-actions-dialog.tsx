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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
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
  CheckCircle2,
  XCircle,
  Send,
  FileText,
  Loader2,
  AlertTriangle,
  CreditCard,
} from 'lucide-react'
import { toast } from 'sonner'

import { Invoice, BulkOperationResult } from '@/lib/invoice-types'
import { invoiceService } from '@/lib/invoice-service'

// 批量操作类型
type BulkActionType = 'mark-paid' | 'resend' | 'void' | 'regenerate-pdf'

interface BulkActionsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedInvoices: Invoice[]
  onActionComplete: () => void
}

export function BulkActionsDialog({
  open,
  onOpenChange,
  selectedInvoices,
  onActionComplete,
}: BulkActionsDialogProps) {
  const [actionType, setActionType] = useState<BulkActionType>('mark-paid')
  const [loading, setLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  
  // 表单字段状态
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [paymentMethod, setPaymentMethod] = useState('')
  const [voidReason, setVoidReason] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')
  const [notes, setNotes] = useState('')

  // 进度状态
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<BulkOperationResult | null>(null)

  // 重置表单状态
  const resetForm = () => {
    setActionType('mark-paid')
    setPaymentDate(new Date().toISOString().split('T')[0])
    setPaymentMethod('')
    setVoidReason('')
    setEmailSubject('')
    setEmailMessage('')
    setNotes('')
    setProgress(0)
    setResult(null)
    setLoading(false)
    setShowConfirm(false)
  }

  useEffect(() => {
    if (!open) {
      resetForm()
    }
  }, [open])

  // 获取操作配置
  const getActionConfig = (type: BulkActionType) => {
    const configs = {
      'mark-paid': {
        title: '批量标记为已付款',
        description: `将 ${selectedInvoices.length} 张发票标记为已付款`,
        icon: <CreditCard className="h-4 w-4" />,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        confirmTitle: '确认标记为已付款',
        confirmMessage: `确定要将选中的 ${selectedInvoices.length} 张发票标记为已付款吗？`,
      },
      'resend': {
        title: '批量重新发送',
        description: `重新发送 ${selectedInvoices.length} 张发票邮件`,
        icon: <Send className="h-4 w-4" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        confirmTitle: '确认重新发送',
        confirmMessage: `确定要重新发送选中的 ${selectedInvoices.length} 张发票吗？`,
      },
      'void': {
        title: '批量作废',
        description: `作废 ${selectedInvoices.length} 张发票`,
        icon: <XCircle className="h-4 w-4" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        confirmTitle: '确认作废发票',
        confirmMessage: `确定要作废选中的 ${selectedInvoices.length} 张发票吗？此操作不可撤销。`,
      },
      'regenerate-pdf': {
        title: '批量重新生成PDF',
        description: `重新生成 ${selectedInvoices.length} 张发票的PDF文件`,
        icon: <FileText className="h-4 w-4" />,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        confirmTitle: '确认重新生成PDF',
        confirmMessage: `确定要重新生成选中的 ${selectedInvoices.length} 张发票的PDF文件吗？`,
      },
    }
    return configs[type]
  }

  // 检查发票状态是否符合操作要求
  const validateInvoicesForAction = (type: BulkActionType): { valid: Invoice[], invalid: Invoice[] } => {
    const valid: Invoice[] = []
    const invalid: Invoice[] = []

    selectedInvoices.forEach(invoice => {
      let isValid = false
      
      switch (type) {
        case 'mark-paid':
          isValid = ['sent', 'viewed', 'overdue'].includes(invoice.status)
          break
        case 'resend':
          isValid = ['sent', 'viewed', 'overdue'].includes(invoice.status)
          break
        case 'void':
          isValid = !['paid', 'void', 'cancelled'].includes(invoice.status)
          break
        case 'regenerate-pdf':
          isValid = true // 所有发票都可以重新生成PDF
          break
      }

      if (isValid) {
        valid.push(invoice)
      } else {
        invalid.push(invoice)
      }
    })

    return { valid, invalid }
  }

  // 执行批量操作
  const executeBulkAction = async () => {
    setLoading(true)
    setProgress(0)
    setResult(null)

    try {
      const { valid } = validateInvoicesForAction(actionType)
      const invoiceIds = valid.map(invoice => invoice.id)

      let response
      
      switch (actionType) {
        case 'mark-paid':
          response = await invoiceService.bulkMarkPaid({
            invoice_ids: invoiceIds,
            payment_date: paymentDate,
            payment_method: paymentMethod || undefined,
            notes: notes || undefined,
          })
          break
        
        case 'resend':
          response = await invoiceService.bulkResend({
            invoice_ids: invoiceIds,
            subject: emailSubject || undefined,
            message: emailMessage || undefined,
            attach_pdf: true,
          })
          break
        
        case 'void':
          response = await invoiceService.bulkVoid({
            invoice_ids: invoiceIds,
            reason: voidReason || '批量作废',
            notes: notes || undefined,
          })
          break
        
        case 'regenerate-pdf':
          response = await invoiceService.bulkRegeneratePdf({
            invoice_ids: invoiceIds,
          })
          break
      }

      setProgress(100)

      if (response.code === 0) {
        setResult(response.data)
        
        const { success_count, failed_count } = response.data
        const actionName = getActionConfig(actionType).title
        
        if (failed_count === 0) {
          toast.success(`${actionName}成功！处理了 ${success_count} 张发票`)
        } else if (success_count === 0) {
          toast.error(`${actionName}失败！${failed_count} 张发票处理失败`)
        } else {
          toast.warning(`${actionName}部分成功！${success_count} 张成功，${failed_count} 张失败`)
        }
        
        // 延迟关闭对话框，让用户看到结果
        setTimeout(() => {
          onActionComplete()
          onOpenChange(false)
        }, 2000)
      } else {
        throw new Error(response.message)
      }
    } catch (error) {
      console.error(`批量操作失败:`, error)
      toast.error('批量操作失败，请稍后重试')
      setProgress(0)
    } finally {
      setLoading(false)
    }
  }

  const config = getActionConfig(actionType)
  const { valid, invalid } = validateInvoicesForAction(actionType)

  // 渲染操作表单
  const renderActionForm = () => {
    switch (actionType) {
      case 'mark-paid':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-date">付款日期</Label>
              <Input
                id="payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">付款方式 (可选)</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="选择付款方式" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">未指定</SelectItem>
                  <SelectItem value="alipay">支付宝</SelectItem>
                  <SelectItem value="wechat">微信支付</SelectItem>
                  <SelectItem value="bank_transfer">银行转账</SelectItem>
                  <SelectItem value="credit_card">信用卡</SelectItem>
                  <SelectItem value="cash">现金</SelectItem>
                  <SelectItem value="other">其他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )

      case 'resend':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-subject">邮件主题 (可选)</Label>
              <Input
                id="email-subject"
                placeholder="默认使用系统主题"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-message">邮件内容 (可选)</Label>
              <Textarea
                id="email-message"
                placeholder="默认使用系统模板"
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
                rows={3}
              />
            </div>
          </div>
        )

      case 'void':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="void-reason">作废原因</Label>
              <Input
                id="void-reason"
                placeholder="请输入作废原因"
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>
          </div>
        )

      case 'regenerate-pdf':
        return (
          <div className="text-sm text-muted-foreground">
            将重新生成所选发票的PDF文件，原文件将被替换。
          </div>
        )
    }
  }

  // 渲染结果展示
  const renderResult = () => {
    if (!result) return null

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">操作完成</span>
          <Badge variant={result.failed_count === 0 ? 'default' : 'secondary'}>
            {result.success_count}/{result.success_count + result.failed_count}
          </Badge>
        </div>
        
        <Progress value={100} className="w-full" />
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span>成功: {result.success_count}</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-600" />
            <span>失败: {result.failed_count}</span>
          </div>
        </div>

        {result.failed_items.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm font-medium text-red-600">失败项目:</Label>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {result.failed_items.map((item) => (
                <div key={item.invoice_id} className="text-xs bg-red-50 p-2 rounded">
                  <span className="font-medium">发票ID {item.invoice_id}:</span>
                  <span className="ml-1 text-red-600">{item.error}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (selectedInvoices.length === 0) {
    return null
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <div className={`p-2 rounded-full ${config.bgColor}`}>
                <div className={config.color}>
                  {config.icon}
                </div>
              </div>
              <span>{config.title}</span>
            </DialogTitle>
            <DialogDescription>
              {config.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 操作类型选择 */}
            <div className="space-y-2">
              <Label>选择操作</Label>
              <Select value={actionType} onValueChange={(value: BulkActionType) => setActionType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mark-paid">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="h-4 w-4" />
                      <span>标记为已付款</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="resend">
                    <div className="flex items-center space-x-2">
                      <Send className="h-4 w-4" />
                      <span>重新发送</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="void">
                    <div className="flex items-center space-x-2">
                      <XCircle className="h-4 w-4" />
                      <span>作废</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="regenerate-pdf">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>重新生成PDF</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* 状态验证警告 */}
            {invalid.length > 0 && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-yellow-800">
                      {invalid.length} 张发票不符合操作条件
                    </p>
                    <p className="text-xs text-yellow-700">
                      将只处理 {valid.length} 张符合条件的发票
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 操作表单 */}
            {!loading && !result && renderActionForm()}

            {/* 操作进度 */}
            {loading && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">正在处理...</span>
                </div>
                <Progress value={progress} className="w-full" />
              </div>
            )}

            {/* 操作结果 */}
            {result && renderResult()}

            {/* 备注 */}
            {(actionType === 'mark-paid' || actionType === 'void') && !loading && !result && (
              <div className="space-y-2">
                <Label htmlFor="notes">备注 (可选)</Label>
                <Textarea
                  id="notes"
                  placeholder="输入备注信息"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {result ? '关闭' : '取消'}
            </Button>
            {!result && (
              <Button
                onClick={() => setShowConfirm(true)}
                disabled={loading || valid.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    处理中...
                  </>
                ) : (
                  '执行操作'
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 确认对话框 */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{config.confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {config.confirmMessage}
              {invalid.length > 0 && (
                <div className="mt-2 text-yellow-700">
                  注意：将跳过 {invalid.length} 张不符合条件的发票。
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              确认执行
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}