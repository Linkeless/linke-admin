'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Shield, 
  Unlock, 
  RotateCcw, 
  Eye,
  UserX,
  UserCheck,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { AccountSecurityStatus } from '../types'

interface AccountTableProps {
  data: AccountSecurityStatus[]
  selectedAccounts: number[]
  onSelectionChange: (selected: number[]) => void
  onAccountUpdated: () => void
}

export function AccountTable({ 
  data, 
  selectedAccounts, 
  onSelectionChange, 
  onAccountUpdated 
}: AccountTableProps) {
  const [actionLoading, setActionLoading] = useState<number | null>(null)

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(data.map(account => account.user_id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (userId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAccounts, userId])
    } else {
      onSelectionChange(selectedAccounts.filter(id => id !== userId))
    }
  }

  const handleAction = async (action: string, userId: number) => {
    setActionLoading(userId)
    try {
      // 模拟API调用
      console.log(`执行操作: ${action} 对用户 ${userId}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      onAccountUpdated()
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getSecurityLevelBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">高</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">中</Badge>
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">低</Badge>
      case 'critical':
        return <Badge variant="destructive">严重</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getStatusBadge = (account: AccountSecurityStatus) => {
    if (account.is_locked) {
      return <Badge variant="destructive">已锁定</Badge>
    }
    if (account.active_sessions > 0) {
      return <Badge className="bg-green-100 text-green-800">在线</Badge>
    }
    return <Badge variant="outline">离线</Badge>
  }

  const formatLastLogin = (dateString?: string) => {
    if (!dateString) return '从未登录'
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: zhCN 
      })
    } catch {
      return '时间格式错误'
    }
  }

  const isAllSelected = data.length > 0 && selectedAccounts.length === data.length
  const isIndeterminate = selectedAccounts.length > 0 && selectedAccounts.length < data.length

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) el.indeterminate = isIndeterminate
                  }}
                />
              </TableHead>
              <TableHead>用户信息</TableHead>
              <TableHead>安全等级</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>失败尝试</TableHead>
              <TableHead>最后登录</TableHead>
              <TableHead>2FA</TableHead>
              <TableHead>会话数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Shield className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">暂无账户数据</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((account) => (
                <TableRow key={account.user_id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedAccounts.includes(account.user_id)}
                      onCheckedChange={(checked) => 
                        handleSelectOne(account.user_id, checked as boolean)
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{account.username}</div>
                      <div className="text-sm text-muted-foreground">{account.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {getSecurityLevelBadge(account.security_level)}
                      {account.suspicious_activities > 0 && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getStatusBadge(account)}</TableCell>
                  <TableCell>
                    <span className={account.failed_login_attempts > 3 ? 'text-red-600 font-medium' : ''}>
                      {account.failed_login_attempts}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatLastLogin(account.last_login_at)}
                  </TableCell>
                  <TableCell>
                    {account.two_factor_enabled ? (
                      <Badge className="bg-green-100 text-green-800">已启用</Badge>
                    ) : (
                      <Badge variant="outline">未启用</Badge>
                    )}
                  </TableCell>
                  <TableCell>{account.active_sessions}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button 
                          variant="ghost" 
                          className="h-8 w-8 p-0"
                          disabled={actionLoading === account.user_id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>账户操作</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleAction('view', account.user_id)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          查看详情
                        </DropdownMenuItem>
                        
                        {account.is_locked ? (
                          <DropdownMenuItem 
                            onClick={() => handleAction('unlock', account.user_id)}
                          >
                            <Unlock className="mr-2 h-4 w-4" />
                            解锁账户
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem 
                            onClick={() => handleAction('lock', account.user_id)}
                            className="text-red-600"
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            锁定账户
                          </DropdownMenuItem>
                        )}
                        
                        <DropdownMenuItem 
                          onClick={() => handleAction('reset-password', account.user_id)}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          强制重置密码
                        </DropdownMenuItem>
                        
                        <DropdownMenuSeparator />
                        
                        <DropdownMenuItem 
                          onClick={() => handleAction('security-check', account.user_id)}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          安全检查
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedAccounts.length > 0 && (
        <div className="text-sm text-muted-foreground">
          已选择 {selectedAccounts.length} 个账户
        </div>
      )}
    </div>
  )
}