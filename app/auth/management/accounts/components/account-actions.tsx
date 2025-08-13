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
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Shield, 
  Lock, 
  Unlock, 
  RotateCcw, 
  Eye,
  AlertTriangle,
  Calendar,
  Activity
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { AccountSecurityStatus } from '../types'

interface AccountActionsProps {
  account: AccountSecurityStatus | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onActionCompleted: () => void
}

export function AccountActions({ 
  account, 
  open, 
  onOpenChange, 
  onActionCompleted 
}: AccountActionsProps) {
  const [actionLoading, setActionLoading] = useState(false)

  if (!account) return null

  const handleAction = async (action: string) => {
    setActionLoading(true)
    try {
      // 模拟API调用
      console.log(`执行操作: ${action} 对用户 ${account.user_id}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      onActionCompleted()
      onOpenChange(false)
    } catch (error) {
      console.error('操作失败:', error)
    } finally {
      setActionLoading(false)
    }
  }

  const getSecurityLevelInfo = (level: string) => {
    switch (level) {
      case 'high':
        return { color: 'text-green-600', bg: 'bg-green-100', text: '高安全级别' }
      case 'medium':
        return { color: 'text-yellow-600', bg: 'bg-yellow-100', text: '中等安全级别' }
      case 'low':
        return { color: 'text-blue-600', bg: 'bg-blue-100', text: '低安全级别' }
      case 'critical':
        return { color: 'text-red-600', bg: 'bg-red-100', text: '严重安全风险' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-100', text: '未知级别' }
    }
  }

  const securityInfo = getSecurityLevelInfo(account.security_level)

  const formatDate = (dateString?: string) => {
    if (!dateString) return '无记录'
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: zhCN 
      })
    } catch {
      return '时间格式错误'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            账户安全详情
          </DialogTitle>
          <DialogDescription>
            查看 {account.username} 的详细安全信息和执行相关操作
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="space-y-3">
            <h4 className="font-medium">基本信息</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">用户名</p>
                <p className="font-medium">{account.username}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">邮箱</p>
                <p className="font-medium">{account.email}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 安全状态 */}
          <div className="space-y-3">
            <h4 className="font-medium">安全状态</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">安全等级</p>
                <Badge className={`${securityInfo.bg} ${securityInfo.color}`}>
                  {securityInfo.text}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">账户状态</p>
                {account.is_locked ? (
                  <Badge variant="destructive">已锁定</Badge>
                ) : (
                  <Badge className="bg-green-100 text-green-800">正常</Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">双因素认证</p>
                {account.two_factor_enabled ? (
                  <Badge className="bg-green-100 text-green-800">已启用</Badge>
                ) : (
                  <Badge variant="outline">未启用</Badge>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">活跃会话</p>
                <p className="font-medium">{account.active_sessions} 个</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 登录信息 */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Activity className="h-4 w-4" />
              登录活动
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">最后登录</p>
                <p className="font-medium">{formatDate(account.last_login_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">最后失败登录</p>
                <p className="font-medium">{formatDate(account.last_failed_login_at)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">失败尝试次数</p>
                <p className={`font-medium ${
                  account.failed_login_attempts > 3 ? 'text-red-600' : ''
                }`}>
                  {account.failed_login_attempts} 次
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">可疑活动</p>
                <p className={`font-medium ${
                  account.suspicious_activities > 0 ? 'text-orange-600' : 'text-green-600'
                }`}>
                  {account.suspicious_activities} 个
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {/* 密码信息 */}
          <div className="space-y-3">
            <h4 className="font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              密码安全
            </h4>
            <div>
              <p className="text-sm text-muted-foreground">上次密码更改</p>
              <p className="font-medium">{formatDate(account.password_last_changed_at)}</p>
            </div>
          </div>

          {/* 风险警告 */}
          {(account.security_level === 'critical' || account.suspicious_activities > 0) && (
            <>
              <Separator />
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">安全警告</span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  该账户存在安全风险，建议立即采取安全措施。
                </p>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          
          {account.is_locked ? (
            <Button 
              onClick={() => handleAction('unlock')}
              disabled={actionLoading}
            >
              <Unlock className="h-4 w-4 mr-2" />
              {actionLoading ? '解锁中...' : '解锁账户'}
            </Button>
          ) : (
            <Button 
              variant="destructive"
              onClick={() => handleAction('lock')}
              disabled={actionLoading}
            >
              <Lock className="h-4 w-4 mr-2" />
              {actionLoading ? '锁定中...' : '锁定账户'}
            </Button>
          )}
          
          <Button 
            variant="outline"
            onClick={() => handleAction('reset-password')}
            disabled={actionLoading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            重置密码
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}