'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CouponForm } from './coupon-form'
import { useUpdateCoupon } from '@/hooks/mutations/use-finance-mutations'
import { CouponResponse, UpdateCouponRequest } from '@/lib/coupon-types'

interface EditCouponDialogProps {
  coupon: CouponResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onCouponUpdated: () => void
}

export function EditCouponDialog({ 
  coupon, 
  open, 
  onOpenChange, 
  onCouponUpdated 
}: EditCouponDialogProps) {
  // 使用 React Query mutation
  const updateCouponMutation = useUpdateCoupon({
    onSuccess: () => {
      onOpenChange(false)
      onCouponUpdated()
    }
  })

  const handleSubmit = async (data: UpdateCouponRequest) => {
    if (!coupon) return
    
    updateCouponMutation.mutate({
      id: coupon.id,
      data
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑优惠码</DialogTitle>
          <DialogDescription>
            修改优惠码信息，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        {coupon && (
          <CouponForm
            initialData={coupon}
            onSubmit={handleSubmit}
            loading={updateCouponMutation.isPending}
            onCancel={() => onOpenChange(false)}
            isEdit={true}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}