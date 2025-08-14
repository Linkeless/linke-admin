'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { CreatePaymentConfigRequest } from '@/lib/payment-types'
import { PaymentConfigForm } from './payment-config-form'
import { useCreatePaymentConfig } from '@/hooks/mutations/use-payment-mutations'

interface CreatePaymentConfigDialogProps {
  onConfigCreated?: () => void
}

export function CreatePaymentConfigDialog({ 
  onConfigCreated 
}: CreatePaymentConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const createPaymentConfig = useCreatePaymentConfig({
    onSuccess: () => {
      setOpen(false)
      onConfigCreated?.()
    }
  })

  const handleSubmit = async (data: CreatePaymentConfigRequest) => {
    createPaymentConfig.mutate(data)
  }

  const handleCancel = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          创建配置
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建支付配置</DialogTitle>
        </DialogHeader>
        
        <PaymentConfigForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={createPaymentConfig.isPending}
        />
      </DialogContent>
    </Dialog>
  )
}