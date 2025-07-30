'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UpdatePaymentConfigRequest, PaymentConfigResponse } from '@/lib/payment-types'
import { paymentService } from '@/lib/payment-service'
import { PaymentConfigForm } from './payment-config-form'
import { toast } from 'sonner'

interface EditPaymentConfigDialogProps {
  config: PaymentConfigResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfigUpdated?: () => void
}

export function EditPaymentConfigDialog({ 
  config,
  open,
  onOpenChange,
  onConfigUpdated 
}: EditPaymentConfigDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: UpdatePaymentConfigRequest) => {
    if (!config) return

    try {
      setLoading(true)
      
      const response = await paymentService.updatePaymentConfig(config.id, data)
      
      if (response.code === 0) {
        toast.success('支付配置更新成功')
        onOpenChange(false)
        onConfigUpdated?.()
      } else {
        toast.error(response.message || '更新支付配置失败')
      }
    } catch (error) {
      console.error('更新支付配置失败:', error)
      toast.error('更新支付配置时发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (!config) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑支付配置</DialogTitle>
        </DialogHeader>
        
        <PaymentConfigForm
          initialData={config}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  )
}