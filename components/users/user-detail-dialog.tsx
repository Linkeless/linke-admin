'use client'

import { useState, useEffect } from "react"
import { Eye, Loader2, Copy, Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { userService } from "@/lib/user-service"
import { UserResponse, UserDetailResponse } from "@/lib/user-types"

interface UserDetailDialogProps {
  user: UserResponse
  trigger?: React.ReactNode
}

export function UserDetailDialog({ user, trigger }: UserDetailDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [userDetail, setUserDetail] = useState<UserResponse | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const loadUserDetail = async () => {
    try {
      setLoading(true)
      const response: UserDetailResponse = await userService.getUser(user.id)
      
      if (response.code === 0 && response.data) {
        setUserDetail(response.data)
      } else {
        throw new Error(response.message || '获取用户详情失败')
      }
    } catch (error) {
      console.error('获取用户详情失败:', error)
      // 如果API失败，使用传入的用户基本信息
      setUserDetail(user)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      loadUserDetail()
    }
  }, [open, user.id])

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (error) {
      console.error('复制失败:', error)
    }
  }

  const formatDateTime = (dateString: string | undefined) => {
    if (!dateString) return '未知'
    return userService.formatDateTime(dateString)
  }

  const getProviderBadge = (provider: string) => {
    const config = userService.getProviderBadgeConfig(provider)
    return (
      <Badge variant="outline" className={config.className}>
        <span className="mr-1">{config.icon}</span>
        {config.label}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const config = userService.getUserStatusBadgeConfig(status)
    return (
      <Badge variant={config.variant} className={config.className}>
        <div className={`w-2 h-2 rounded-full mr-2 ${config.dotColor}`} />
        {config.label}
      </Badge>
    )
  }

  const getRoleBadge = (role: string) => {
    const config = userService.getUserRoleBadgeConfig(role)
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const CopyableField = ({ label, value, field }: { label: string; value: string; field: string }) => (
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        <div className="text-sm">{value}</div>
      </div>
      {value && value !== '未知' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleCopy(value, field)}
          className="h-8 w-8 p-0"
        >
          {copiedField === field ? (
            <Check className="h-4 w-4 text-green-600" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  )

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Eye className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
          <DialogDescription>
            查看用户 {user.email} 的详细信息
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>加载用户详情中...</span>
          </div>
        ) : userDetail ? (
          <div className="space-y-6">
            {/* 用户基本信息 */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16">
                <AvatarImage src={userService.getUserAvatarUrl(userDetail)} />
                <AvatarFallback className="text-lg">
                  {userService.formatUserDisplayName(userDetail).slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {userService.formatUserDisplayName(userDetail)}
                </h3>
                <p className="text-muted-foreground">{userDetail.email}</p>
                <div className="flex items-center gap-2 mt-2">
                  {getRoleBadge(userDetail.role || 'user')}
                  {getStatusBadge(userDetail.status || 'active')}
                </div>
              </div>
            </div>

            <Separator />

            {/* 基本信息 */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold">基本信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CopyableField 
                  label="用户ID" 
                  value={userDetail.id?.toString() || '未知'} 
                  field="id" 
                />
                <CopyableField 
                  label="用户名" 
                  value={userDetail.username || '未设置'} 
                  field="username" 
                />
                <CopyableField 
                  label="姓名" 
                  value={userDetail.name || '未设置'} 
                  field="name" 
                />
                <CopyableField 
                  label="邮箱地址" 
                  value={userDetail.email || '未知'} 
                  field="email" 
                />
              </div>
            </div>

            <Separator />

            {/* OAuth信息 */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold">登录方式</h4>
              <div className="flex flex-wrap gap-2">
                {userDetail.provider && getProviderBadge(userDetail.provider)}
                {userDetail.google_id && getProviderBadge('google')}
                {userDetail.github_id && getProviderBadge('github')}
                {userDetail.telegram_id && getProviderBadge('telegram')}
                {!userDetail.provider && !userDetail.google_id && !userDetail.github_id && !userDetail.telegram_id && (
                  getProviderBadge('local')
                )}
              </div>
              
              {(userDetail.google_id || userDetail.github_id || userDetail.telegram_id) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {userDetail.google_id && (
                    <CopyableField 
                      label="Google ID" 
                      value={userDetail.google_id} 
                      field="google_id" 
                    />
                  )}
                  {userDetail.github_id && (
                    <CopyableField 
                      label="GitHub ID" 
                      value={userDetail.github_id} 
                      field="github_id" 
                    />
                  )}
                  {userDetail.telegram_id && (
                    <CopyableField 
                      label="Telegram ID" 
                      value={userDetail.telegram_id} 
                      field="telegram_id" 
                    />
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* 邀请信息 */}
            {(userDetail.invite_code_id || userDetail.invite_code_used) && (
              <>
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">邀请信息</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userDetail.invite_code_id && (
                      <CopyableField 
                        label="邀请码ID" 
                        value={userDetail.invite_code_id.toString()} 
                        field="invite_code_id" 
                      />
                    )}
                    {userDetail.invite_code_used && (
                      <CopyableField 
                        label="使用的邀请码" 
                        value={userDetail.invite_code_used} 
                        field="invite_code_used" 
                      />
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* 时间信息 */}
            <div className="space-y-4">
              <h4 className="text-md font-semibold">时间信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">注册时间</div>
                  <div className="text-sm">{formatDateTime(userDetail.created_at)}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">最后更新</div>
                  <div className="text-sm">{formatDateTime(userDetail.updated_at)}</div>
                </div>
                {userDetail.last_login_at && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">最后登录</div>
                    <div className="text-sm">{formatDateTime(userDetail.last_login_at)}</div>
                  </div>
                )}
                {userDetail.deleted_at && (
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">删除时间</div>
                    <div className="text-sm text-red-600">{formatDateTime(userDetail.deleted_at)}</div>
                  </div>
                )}
              </div>
            </div>

            {/* 其他信息 */}
            {userDetail.provider_data && (
              <>
                <Separator />
                <div className="space-y-4">
                  <h4 className="text-md font-semibold">提供商数据</h4>
                  <div className="bg-muted p-3 rounded-md">
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(JSON.parse(userDetail.provider_data), null, 2)}
                    </pre>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            无法加载用户详情
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}