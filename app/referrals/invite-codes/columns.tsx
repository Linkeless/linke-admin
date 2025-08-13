'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Power, PowerOff, Copy, RotateCcw } from 'lucide-react'
import { InviteCodeResponse } from '@/lib/invite-code-types'
import { inviteCodeService } from '@/lib/invite-code-service'
import { toast } from 'sonner'

interface ColumnsProps {
  onInviteCodeUpdated?: () => void
  onEdit?: (inviteCode: InviteCodeResponse) => void
}

export function createColumns({ onInviteCodeUpdated, onEdit }: ColumnsProps): ColumnDef<InviteCodeResponse>[] {
  const handleDelete = async (inviteCode: InviteCodeResponse) => {
    if (!confirm(`确定要删除邀请码"${inviteCode.code}"吗？此操作不可撤销。`)) {
      return
    }

    try {
      await inviteCodeService.deleteInviteCode(inviteCode.id)
      toast.success(`邀请码"${inviteCode.code}"已删除`)
      onInviteCodeUpdated?.()
    } catch (error) {
      console.error('删除邀请码失败:', error)
      toast.error('删除邀请码时发生错误，请稍后重试')
    }
  }

  const handleToggleStatus = async (inviteCode: InviteCodeResponse) => {
    try {
      const newStatus = inviteCode.status === 'active' ? 'inactive' : 'active'
      await inviteCodeService.toggleInviteCodeStatus(inviteCode.id, newStatus)
      
      toast.success(`邀请码"${inviteCode.code}"已${newStatus === 'active' ? '启用' : '禁用'}`)
      onInviteCodeUpdated?.()
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error('更新邀请码状态时发生错误，请稍后重试')
    }
  }

  const handleResetUsage = async (inviteCode: InviteCodeResponse) => {
    if (!confirm(`确定要重置邀请码"${inviteCode.code}"的使用次数吗？`)) {
      return
    }

    try {
      await inviteCodeService.resetInviteCodeUsage(inviteCode.id)
      toast.success(`邀请码"${inviteCode.code}"的使用次数已重置`)
      onInviteCodeUpdated?.()
    } catch (error) {
      console.error('重置使用次数失败:', error)
      toast.error('重置邀请码使用次数时发生错误，请稍后重试')
    }
  }

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    toast.success('邀请码已复制到剪贴板')
  }

  return [
    {
      accessorKey: 'code',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="邀请码" />
      ),
      cell: ({ row }) => {
        const code = row.getValue('code') as string
        return (
          <div className="flex items-center space-x-2">
            <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {code}
            </code>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleCopyCode(code)}
              className="h-6 w-6 p-0 hover:bg-muted"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        )
      },
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="名称" />
      ),
      cell: ({ row }) => {
        const inviteCode = row.original
        return (
          <div>
            <div className="font-medium">{inviteCode.name}</div>
            {inviteCode.description && (
              <div className="text-sm text-muted-foreground">
                {inviteCode.description}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: () => <div>状态</div>,
      cell: ({ row }) => {
        const status = row.getValue('status') as string
        const statusConfig = {
          active: { label: '活跃', variant: 'default' as const },
          inactive: { label: '禁用', variant: 'secondary' as const },
          expired: { label: '已过期', variant: 'destructive' as const },
        }
        const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive
        
        return (
          <div>
            <Badge variant={config.variant}>{config.label}</Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'used_count',
      header: () => <div>使用情况</div>,
      cell: ({ row }) => {
        const inviteCode = row.original
        const usageText = inviteCode.is_unlimited 
          ? `${inviteCode.used_count} / 无限制`
          : `${inviteCode.used_count} / ${inviteCode.max_uses}`
        
        const usagePercent = inviteCode.is_unlimited 
          ? 0 
          : (inviteCode.used_count / inviteCode.max_uses) * 100
        
        return (
          <div>
            <div className="text-sm font-medium">{usageText}</div>
            {!inviteCode.is_unlimited && (
              <div className="text-xs text-muted-foreground">
                {usagePercent.toFixed(0)}% 已使用
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'valid_until',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="有效期" />
      ),
      cell: ({ row }) => {
        const validUntil = row.getValue('valid_until') as string
        if (!validUntil) {
          return <div className="text-muted-foreground">永久有效</div>
        }
        
        const date = new Date(validUntil)
        const isExpired = date < new Date()
        
        return (
          <div className={isExpired ? 'text-destructive' : ''}>
            {date.toLocaleString('zh-CN', { 
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
            {isExpired && (
              <div className="text-xs text-destructive">已过期</div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="创建时间" />
      ),
      cell: ({ row }) => {
        const createdAt = row.getValue('created_at') as string
        const date = new Date(createdAt)
        return date.toLocaleString('zh-CN', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const inviteCode = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleCopyCode(inviteCode.code)}>
                <Copy className="mr-2 h-4 w-4" />
                复制邀请码
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(inviteCode.id.toString())}
              >
                复制ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(inviteCode)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(inviteCode)}>
                {inviteCode.status === 'active' ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    禁用
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    启用
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleResetUsage(inviteCode)}>
                <RotateCcw className="mr-2 h-4 w-4" />
                重置使用次数
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(inviteCode)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}