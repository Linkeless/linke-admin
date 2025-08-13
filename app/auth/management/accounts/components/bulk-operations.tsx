'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Settings, 
  Unlock, 
  RotateCcw, 
  Bell, 
  Users,
  AlertTriangle
} from 'lucide-react'

interface BulkOperationsProps {
  selectedAccounts: number[]
  onBulkAction: (action: string, accountIds: number[]) => void
}

export function BulkOperations({ selectedAccounts, onBulkAction }: BulkOperationsProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<string>('')
  const [reason, setReason] = useState('')
  const [notifyUsers, setNotifyUsers] = useState(true)
  const [loading, setLoading] = useState(false)

  const handleOpenDialog = (action: string) => {
    setActionType(action)
    setReason('')
    setNotifyUsers(true)
    setDialogOpen(true)
  }

  const handleConfirmAction = async () => {
    setLoading(true)
    try {
      await onBulkAction(actionType, selectedAccounts)
      setDialogOpen(false)
    } catch (error) {
      console.error('批量操作失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActionTitle = () => {
    switch (actionType) {
      case 'unlock':
        return '批量解锁账户'
      case 'reset-password':
        return '批量重置密码'
      case 'send-notification':
        return '发送批量通知'
      case 'revoke-tokens':
        return '批量撤销令牌'
      default:
        return '批量操作'
    }
  }

  const getActionDescription = () => {
    switch (actionType) {
      case 'unlock':
        return `您即将解锁 ${selectedAccounts.length} 个账户。此操作将允许这些用户重新登录。`
      case 'reset-password':
        return `您即将强制重置 ${selectedAccounts.length} 个账户的密码。用户需要通过邮箱重新设置密码。`
      case 'send-notification':
        return `您即将向 ${selectedAccounts.length} 个用户发送安全通知。`
      case 'revoke-tokens':
        return `您即将撤销 ${selectedAccounts.length} 个账户的所有活跃令牌。用户需要重新登录。`
      default:
        return ''
    }
  }

  if (selectedAccounts.length === 0) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            批量操作 ({selectedAccounts.length})
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>账户管理</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleOpenDialog('unlock')}>
            <Unlock className="mr-2 h-4 w-4" />
            批量解锁
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleOpenDialog('reset-password')}>
            <RotateCcw className="mr-2 h-4 w-4" />
            批量重置密码
          </DropdownMenuItem>
          
          <DropdownMenuSeparator />
          
          <DropdownMenuItem onClick={() => handleOpenDialog('send-notification')}>
            <Bell className="mr-2 h-4 w-4" />
            发送通知
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleOpenDialog('revoke-tokens')}>
            <AlertTriangle className="mr-2 h-4 w-4" />
            撤销令牌
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              {getActionTitle()}
            </DialogTitle>
            <DialogDescription>
              {getActionDescription()}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reason">操作原因</Label>
              <Textarea
                id="reason"
                placeholder="请输入执行此操作的原因..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
            </div>
            
            {(actionType === 'reset-password' || actionType === 'send-notification') && (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notify"
                  checked={notifyUsers}
                  onCheckedChange={(checked) => setNotifyUsers(checked as boolean)}
                />
                <Label 
                  htmlFor="notify" 
                  className="text-sm font-normal"
                >
                  {actionType === 'reset-password' 
                    ? '发送邮件通知用户'
                    : '通过多种渠道发送通知'
                  }
                </Label>
              </div>
            )}
            
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>影响范围:</strong> {selectedAccounts.length} 个用户账户
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button 
              onClick={handleConfirmAction}
              disabled={loading || !reason.trim()}
            >
              {loading ? '执行中...' : '确认执行'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}