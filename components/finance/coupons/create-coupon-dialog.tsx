'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CouponForm } from './coupon-form'
import { useCreateCoupon } from '@/hooks/mutations/use-finance-mutations'
import { CreateCouponRequest } from '@/lib/coupon-types'

interface CreateCouponDialogProps {
  onCouponCreated: () => void
}

export function CreateCouponDialog({ onCouponCreated }: CreateCouponDialogProps) {
  const [open, setOpen] = useState(false)
  
  // 使用 React Query mutation
  const createCouponMutation = useCreateCoupon({
    onSuccess: () => {
      setOpen(false)
      onCouponCreated()
    }
  })

  const handleSubmit = async (data: CreateCouponRequest) => {
    createCouponMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建优惠码
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建优惠码</DialogTitle>
          <DialogDescription>
            创建新的优惠码，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        <CouponForm
          onSubmit={handleSubmit}
          loading={createCouponMutation.isPending}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}