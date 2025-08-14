'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { UpdatePaymentConfigRequest, PaymentConfigResponse } from '@/lib/payment-types'
import { PaymentConfigForm } from './payment-config-form'
import { useUpdatePaymentConfig } from '@/hooks/mutations/use-payment-mutations'

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
  const updatePaymentConfig = useUpdatePaymentConfig({
    onSuccess: () => {
      onOpenChange(false)
      onConfigUpdated?.()
    }
  })

  const handleSubmit = async (data: UpdatePaymentConfigRequest) => {
    if (!config) return
    updatePaymentConfig.mutate({ id: config.id, data })
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
          loading={updatePaymentConfig.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}