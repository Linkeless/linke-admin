// 用户订阅表格组件 - 使用shadcn/ui Table组件

import React, { useState, useCallback } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  MoreHorizontal, 
  Edit, 
  Eye, 
  RefreshCw, 
  Ban, 
  CheckCircle,
  AlertTriangle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { SubscriptionStatusBadge } from './status-badge'
import { PriceDisplay } from './price-display'
import { RenewalStatus } from './renewal-status'
import type { UserSubscription, Currency, BillingCycle } from '@/lib/subscription-types'

interface SubscriptionsTableProps {
  subscriptions: UserSubscription[]
  isLoading: boolean
  error?: Error | null
  onEdit: (subscription: UserSubscription) => void
  onRenew: (id: number) => void
  onCancel: (id: number) => void
  onReactivate: (id: number) => void
  onView: (subscription: UserSubscription) => void
}

export const SubscriptionsTable = React.memo(function SubscriptionsTable({
  subscriptions,
  isLoading,
  error,
  onEdit,
  onRenew,
  onCancel,
  onReactivate,
  onView
}: SubscriptionsTableProps) {
  const [actioningId, setActioningId] = useState<number | null>(null)

  const handleRenew = useCallback(async (id: number) => {
    setActioningId(id)
    try {
      onRenew(id)
    } finally {
      setActioningId(null)
    }
  }, [onRenew])

  const handleCancel = useCallback(async (id: number) => {
    setActioningId(id)
    try {
      onCancel(id)
    } finally {
      setActioningId(null)
    }
  }, [onCancel])

  const handleReactivate = useCallback(async (id: number) => {
    setActioningId(id)
    try {
      onReactivate(id)
    } finally {
      setActioningId(null)
    }
  }, [onReactivate])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getDaysLeftDisplay = (daysLeft: number, isExpired: boolean) => {
    if (isExpired) {
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          已过期
        </Badge>
      )
    }
    
    if (daysLeft < 0) {
      return (
        <Badge variant="secondary">
          永久
        </Badge>
      )
    }
    
    if (daysLeft <= 7) {
      return (
        <Badge variant="outline" className="text-orange-600 border-orange-600">
          <Clock className="w-3 h-3 mr-1" />
          {daysLeft}天
        </Badge>
      )
    }
    
    return (
      <Badge variant="secondary">
        {daysLeft}天
      </Badge>
    )
  }

  // 错误状态
  if (error) {
    return (
      <Card className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            加载用户订阅失败: {error.message}
          </AlertDescription>
        </Alert>
      </Card>
    )
  }

  if (isLoading) {
    return <SubscriptionsTableSkeleton />
  }

  if (subscriptions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">
          暂无用户订阅数据
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户信息</TableHead>
            <TableHead>订阅计划</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>时间信息</TableHead>
            <TableHead>剩余时间</TableHead>
            <TableHead>续费状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscriptions.map((subscription) => (
            <TableRow key={subscription.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={subscription.user?.avatar} />
                    <AvatarFallback>
                      {subscription.user?.name?.charAt(0) || 
                       subscription.user?.username?.charAt(0) || 
                       '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">
                      {subscription.user?.name || subscription.user?.username}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {subscription.user?.email}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      ID: {subscription.user_id}
                    </div>
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <div>
                  <div className="font-medium">
                    {subscription.subscription_plan?.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {subscription.subscription_plan?.code}
                  </div>
                  <PriceDisplay
                    price={subscription.price}
                    currency={subscription.currency as Currency}
                    billingCycle={subscription.billing_cycle as BillingCycle}
                    className="mt-1"
                  />
                </div>
              </TableCell>
              
              <TableCell>
                <div className="space-y-2">
                  <SubscriptionStatusBadge status={subscription.status} />
                  {subscription.is_in_trial && (
                    <Badge variant="outline" className="bg-blue-50 text-blue-700">
                      试用中
                    </Badge>
                  )}
                  {subscription.cancel_at_period_end && (
                    <Badge variant="outline" className="bg-orange-50 text-orange-700">
                      周期结束取消
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <div className="text-sm">
                  <div>
                    <span className="text-muted-foreground">开始:</span>{' '}
                    {formatDate(subscription.start_date)}
                  </div>
                  <div>
                    <span className="text-muted-foreground">结束:</span>{' '}
                    {formatDate(subscription.end_date)}
                  </div>
                  {subscription.trial_end_date && (
                    <div>
                      <span className="text-muted-foreground">试用至:</span>{' '}
                      {formatDate(subscription.trial_end_date)}
                    </div>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                {getDaysLeftDisplay(subscription.days_left, subscription.is_expired)}
              </TableCell>
              
              <TableCell>
                <RenewalStatus
                  autoRenew={subscription.auto_renew}
                  nextBillingDate={subscription.next_billing_date}
                  renewalAttempts={subscription.renewal_attempts}
                  failReason={subscription.renewal_fail_reason}
                />
              </TableCell>
              
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={actioningId === subscription.id}
                    >
                      <span className="sr-only">打开菜单</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>操作</DropdownMenuLabel>
                    
                    <DropdownMenuItem onClick={() => onView(subscription)}>
                      <Eye className="mr-2 h-4 w-4" />
                      查看详情
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onEdit(subscription)}>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {subscription.status === 'active' && (
                      <DropdownMenuItem onClick={() => handleRenew(subscription.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        立即续费
                      </DropdownMenuItem>
                    )}
                    
                    {subscription.status === 'active' ? (
                      <DropdownMenuItem 
                        variant="destructive"
                        onClick={() => handleCancel(subscription.id)}
                      >
                        <Ban className="mr-2 h-4 w-4" />
                        取消订阅
                      </DropdownMenuItem>
                    ) : subscription.status === 'cancelled' && (
                      <DropdownMenuItem 
                        onClick={() => handleReactivate(subscription.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        重新激活
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
})

// 加载骨架屏组件
const SubscriptionsTableSkeleton = React.memo(function SubscriptionsTableSkeleton() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>用户信息</TableHead>
            <TableHead>订阅计划</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>时间信息</TableHead>
            <TableHead>剩余时间</TableHead>
            <TableHead>续费状态</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-32" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-8 w-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  )
})