'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { inviteCodeService } from '@/lib/invite-code-service'
import { UpdateInviteCodeRequest, InviteCodeResponse } from '@/lib/invite-code-types'
import { InviteCodeForm } from './invite-code-form'

interface EditInviteCodeDialogProps {
  inviteCode: InviteCodeResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onInviteCodeUpdated?: () => void
}

export function EditInviteCodeDialog({ 
  inviteCode, 
  open, 
  onOpenChange, 
  onInviteCodeUpdated 
}: EditInviteCodeDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: UpdateInviteCodeRequest) => {
    if (!inviteCode) return

    setLoading(true)
    try {
      const response = await inviteCodeService.updateInviteCode(inviteCode.id, data)
      
      if (response.code === 0) {
        toast.success('邀请码更新成功')
        onOpenChange(false)
        onInviteCodeUpdated?.()
      } else {
        toast.error(response.message || '更新邀请码失败')
      }
    } catch (error) {
      console.error('更新邀请码失败:', error)
      toast.error('更新邀请码时发生错误，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (!inviteCode) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑邀请码</DialogTitle>
          <DialogDescription>
            修改邀请码 &quot;{inviteCode.code}&quot; 的设置。注意：邀请码本身不能修改。
          </DialogDescription>
        </DialogHeader>
        <InviteCodeForm 
          initialData={inviteCode}
          onSubmit={handleSubmit}
          submitText="更新邀请码"
          loading={loading}
        />
      </DialogContent>
    </Dialog>
  )
}