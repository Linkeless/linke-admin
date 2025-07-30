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
import { couponService } from '@/lib/coupon-service'
import { CreateCouponRequest } from '@/lib/coupon-types'

interface CreateCouponDialogProps {
  onCouponCreated: () => void
}

export function CreateCouponDialog({ onCouponCreated }: CreateCouponDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateCouponRequest) => {
    try {
      setLoading(true)
      const response = await couponService.createCoupon(data)
      
      if (response.code === 0) {
        setOpen(false)
        onCouponCreated()
      } else {
        throw new Error(response.message || '创建优惠码失败')
      }
    } catch (error) {
      console.error('创建优惠码失败:', error)
      throw error
    } finally {
      setLoading(false)
    }
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
          loading={loading}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}