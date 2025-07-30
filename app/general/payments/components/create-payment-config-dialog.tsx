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
import { paymentService } from '@/lib/payment-service'
import { PaymentConfigForm } from './payment-config-form'
import { toast } from 'sonner'

interface CreatePaymentConfigDialogProps {
  onConfigCreated?: () => void
}

export function CreatePaymentConfigDialog({ 
  onConfigCreated 
}: CreatePaymentConfigDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreatePaymentConfigRequest) => {
    try {
      setLoading(true)
      
      const response = await paymentService.createPaymentConfig(data)
      
      if (response.code === 0) {
        toast.success('支付配置创建成功')
        setOpen(false)
        onConfigCreated?.()
      } else {
        toast.error(response.message || '创建支付配置失败')
      }
    } catch (error) {
      console.error('创建支付配置失败:', error)
      toast.error('创建支付配置时发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
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
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  )
}