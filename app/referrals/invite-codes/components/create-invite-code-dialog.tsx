'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { inviteCodeService } from '@/lib/invite-code-service'
import { CreateInviteCodeRequest } from '@/lib/invite-code-types'
import { InviteCodeForm } from './invite-code-form'

interface CreateInviteCodeDialogProps {
  onInviteCodeCreated?: () => void
}

export function CreateInviteCodeDialog({ onInviteCodeCreated }: CreateInviteCodeDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateInviteCodeRequest) => {
    setLoading(true)
    try {
      const response = await inviteCodeService.createInviteCode(data)
      
      if (response.code === 0) {
        toast.success('邀请码创建成功')
        setOpen(false)
        onInviteCodeCreated?.()
      } else {
        toast.error(response.message || '创建邀请码失败')
      }
    } catch (error) {
      console.error('创建邀请码失败:', error)
      toast.error('创建邀请码时发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建邀请码
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建邀请码</DialogTitle>
          <DialogDescription>
            创建一个新的邀请码，用于用户注册时使用。
          </DialogDescription>
        </DialogHeader>
        <InviteCodeForm 
          onSubmit={handleSubmit}
          submitText="创建邀请码"
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  )
}