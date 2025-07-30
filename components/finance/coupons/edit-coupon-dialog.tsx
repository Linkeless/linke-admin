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
import { couponService } from '@/lib/coupon-service'
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
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: UpdateCouponRequest) => {
    if (!coupon) return
    
    try {
      setLoading(true)
      const response = await couponService.updateCoupon(coupon.id, data)
      
      if (response.code === 0) {
        onOpenChange(false)
        onCouponUpdated()
      } else {
        throw new Error(response.message || '���新优惠码失败')
      }
    } catch (error) {
      console.error('更新优惠码失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
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
            loading={loading}
            onCancel={() => onOpenChange(false)}
            isEdit={true}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}