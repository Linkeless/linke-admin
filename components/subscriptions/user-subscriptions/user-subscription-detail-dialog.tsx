'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, User, Crown, Calendar, Clock, CheckCircle2, XCircle, DollarSign } from "lucide-react"

import { UserSubscription, SUBSCRIPTION_STATUS_CONFIG } from "@/lib/subscription-types"

interface UserSubscriptionDetailDialogProps {
  subscription: UserSubscription
}

export function UserSubscriptionDetailDialog({ subscription }: UserSubscriptionDetailDialogProps) {
  const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status]

  const formatDate = (dateString: string): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>订阅详情</DialogTitle>
          <DialogDescription>
            查看用户订阅的详细信息
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">基本信息</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">用户信息</span>
                </div>
                <div className="ml-6 text-sm">
                  <div>{subscription.user?.name || subscription.user?.username || `用户${subscription.user_id}`}</div>
                  <div className="text-muted-foreground">{subscription.user?.email || `ID: ${subscription.user_id}`}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">订阅计划</span>
                </div>
                <div className="ml-6 text-sm">
                  <div>{subscription.subscription_plan?.name || `计划${subscription.subscription_plan_id}`}</div>
                  {subscription.subscription_plan && (
                    <div className="text-muted-foreground">
                      {subscription.subscription_plan.currency} {subscription.subscription_plan.price}/{subscription.subscription_plan.billing_cycle}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">状态</span>
                </div>
                <div className="ml-6">
                  <Badge variant={statusConfig?.variant || "secondary"}>
                    {statusConfig?.text || subscription.status}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">订阅详情</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">价格信息</span>
                </div>
                <div className="ml-6 text-sm">
                  <div>{subscription.currency} {subscription.price}</div>
                  <div className="text-muted-foreground">计费周期: {subscription.billing_cycle}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">剩余时间</span>
                </div>
                <div className="ml-6 text-sm">
                  <div className={subscription.days_left <= 7 ? 'text-red-600 font-medium' : 'text-green-600'}>
                    {subscription.days_left}天
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">UUID</span>
                </div>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  {subscription.uuid}
                </div>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">时间信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">开始时间</span>
                </div>
                <div className="ml-6 text-muted-foreground">{formatDate(subscription.start_date)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">结束时间</span>
                </div>
                <div className="ml-6 text-muted-foreground">{formatDate(subscription.end_date)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">当前周期开始</span>
                </div>
                <div className="ml-6 text-muted-foreground">{formatDate(subscription.current_period_start)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">当前周期结束</span>
                </div>
                <div className="ml-6 text-muted-foreground">{formatDate(subscription.current_period_end)}</div>
              </div>
              {subscription.trial_end_date && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">试用结束时间</span>
                  </div>
                  <div className="ml-6 text-muted-foreground">{formatDate(subscription.trial_end_date)}</div>
                </div>
              )}
              {subscription.next_billing_date && (
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">下次计费时间</span>
                  </div>
                  <div className="ml-6 text-muted-foreground">{formatDate(subscription.next_billing_date)}</div>
                </div>
              )}
            </div>
          </div>

          {/* 配置信息 */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">配置信息</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">自动续费</span>
                <div className="flex items-center gap-1 mt-1">
                  {subscription.auto_renew ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className={subscription.auto_renew ? 'text-green-600' : 'text-red-600'}>
                    {subscription.auto_renew ? '已开启' : '已关闭'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">周期结束时取消</span>
                <div className="flex items-center gap-1 mt-1">
                  {subscription.cancel_at_period_end ? (
                    <CheckCircle2 className="h-4 w-4 text-orange-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-green-600" />
                  )}
                  <span className={subscription.cancel_at_period_end ? 'text-orange-600' : 'text-green-600'}>
                    {subscription.cancel_at_period_end ? '是' : '否'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">试用状态</span>
                <div className="flex items-center gap-1 mt-1">
                  {subscription.is_in_trial ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-gray-600" />
                  )}
                  <span className={subscription.is_in_trial ? 'text-blue-600' : 'text-gray-600'}>
                    {subscription.is_in_trial ? '试用中' : '非试用'}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">是否过期</span>
                <div className="flex items-center gap-1 mt-1">
                  {subscription.is_expired ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  )}
                  <span className={subscription.is_expired ? 'text-red-600' : 'text-green-600'}>
                    {subscription.is_expired ? '已过期' : '未过期'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 续费信息 */}
          {(subscription.renewal_attempts > 0 || subscription.renewal_fail_reason || subscription.last_renewal_failed) && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">续费信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">续费尝试次数</span>
                  <div className="mt-1 font-medium">{subscription.renewal_attempts}</div>
                </div>
                {subscription.renewal_fail_reason && (
                  <div>
                    <span className="text-muted-foreground">续费失败原因</span>
                    <div className="mt-1 text-red-600">{subscription.renewal_fail_reason}</div>
                  </div>
                )}
                {subscription.last_renewal_failed && (
                  <div>
                    <span className="text-muted-foreground">最后续费失败时间</span>
                    <div className="mt-1 text-red-600">{formatDate(subscription.last_renewal_failed)}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 取消信息 */}
          {(subscription.cancelled_at || subscription.cancellation_reason) && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">取消信息</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {subscription.cancelled_at && (
                  <div>
                    <span className="text-muted-foreground">取消时间</span>
                    <div className="mt-1">{formatDate(subscription.cancelled_at)}</div>
                  </div>
                )}
                {subscription.cancellation_reason && (
                  <div>
                    <span className="text-muted-foreground">取消原因</span>
                    <div className="mt-1">{subscription.cancellation_reason}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 元数据 */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">元数据</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">创建时间</span>
                <div className="mt-1">{formatDate(subscription.created_at)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">更新时间</span>
                <div className="mt-1">{formatDate(subscription.updated_at)}</div>
              </div>
              {subscription.last_used_at && (
                <div>
                  <span className="text-muted-foreground">最后使用时间</span>
                  <div className="mt-1">{formatDate(subscription.last_used_at)}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}