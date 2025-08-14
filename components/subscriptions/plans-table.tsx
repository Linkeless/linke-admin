// 订阅计划表格组件 - 使用shadcn/ui Table组件

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
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { MoreHorizontal, Edit, Trash2, Eye, Copy, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react'
import { PlanStatusBadge } from './status-badge'
import { PriceDisplay } from './price-display'
import { TrafficDisplay } from './traffic-display'
import type { SubscriptionPlan, Currency, BillingCycle } from '@/lib/subscription-types'

interface PlansTableProps {
  plans: SubscriptionPlan[]
  isLoading: boolean
  error?: Error | null
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number, status: 'active' | 'inactive') => void
  onView: (plan: SubscriptionPlan) => void
  onClone?: (plan: SubscriptionPlan) => void
}

export const PlansTable = React.memo(function PlansTable({
  plans,
  isLoading,
  error,
  onEdit,
  onDelete,
  onToggleStatus,
  onView,
  onClone
}: PlansTableProps) {
  const [actioningId, setActioningId] = useState<number | null>(null)

  const handleToggleStatus = useCallback(async (plan: SubscriptionPlan) => {
    setActioningId(plan.id)
    try {
      const newStatus = plan.status === 'active' ? 'inactive' : 'active'
      await onToggleStatus(plan.id, newStatus)
    } finally {
      setActioningId(null)
    }
  }, [onToggleStatus])

  const handleDelete = useCallback(async (id: number) => {
    setActioningId(id)
    try {
      await onDelete(id)
    } finally {
      setActioningId(null)
    }
  }, [onDelete])

  // 错误状态
  if (error) {
    return (
      <Card className="p-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            加载订阅计划失败: {error.message}
          </AlertDescription>
        </Alert>
      </Card>
    )
  }

  // 加载状态
  if (isLoading) {
    return <PlansTableSkeleton />
  }

  if (plans.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="text-muted-foreground">
          暂无订阅计划数据
        </div>
      </Card>
    )
  }

  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>计划信息</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>流量配置</TableHead>
            <TableHead>计费周期</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>标记</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {plans.map((plan) => (
            <TableRow key={plan.id}>
              <TableCell>
                <div>
                  <div className="font-medium">{plan.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.code}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {plan.description}
                  </div>
                </div>
              </TableCell>
              
              <TableCell>
                <PriceDisplay
                  price={plan.price}
                  currency={plan.currency as Currency}
                  billingCycle={plan.billing_cycle as BillingCycle}
                  setupFee={plan.setup_fee > 0 ? plan.setup_fee : undefined}
                />
              </TableCell>
              
              <TableCell>
                <TrafficDisplay
                  limit={plan.traffic_limit}
                  limitText={plan.traffic_limit_text}
                  resetCycle={plan.traffic_reset_cycle}
                />
              </TableCell>
              
              <TableCell>
                <div>
                  <div className="font-medium">
                    {plan.billing_cycle === 'monthly' && '月付'}
                    {plan.billing_cycle === 'quarterly' && '季付'}
                    {plan.billing_cycle === 'yearly' && '年付'}
                  </div>
                  {plan.billing_interval > 1 && (
                    <div className="text-sm text-muted-foreground">
                      每 {plan.billing_interval} 个周期
                    </div>
                  )}
                  {plan.trial_period_days > 0 && (
                    <Badge variant="outline" className="mt-1">
                      {plan.trial_period_days}天试用
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell>
                <PlanStatusBadge status={plan.status} />
              </TableCell>
              
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {plan.is_popular && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      热门
                    </Badge>
                  )}
                  {plan.is_recommended && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      推荐
                    </Badge>
                  )}
                  {!plan.is_visible && (
                    <Badge variant="outline">
                      隐藏
                    </Badge>
                  )}
                </div>
              </TableCell>
              
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="h-8 w-8 p-0"
                      disabled={actioningId === plan.id}
                    >
                      <span className="sr-only">打开菜单</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>操作</DropdownMenuLabel>
                    
                    <DropdownMenuItem onClick={() => onView(plan)}>
                      <Eye className="mr-2 h-4 w-4" />
                      查看详情
                    </DropdownMenuItem>
                    
                    <DropdownMenuItem onClick={() => onEdit(plan)}>
                      <Edit className="mr-2 h-4 w-4" />
                      编辑
                    </DropdownMenuItem>
                    
                    {onClone && (
                      <DropdownMenuItem onClick={() => onClone(plan)}>
                        <Copy className="mr-2 h-4 w-4" />
                        克隆
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={() => handleToggleStatus(plan)}>
                      {plan.status === 'active' ? (
                        <>
                          <ToggleLeft className="mr-2 h-4 w-4" />
                          停用
                        </>
                      ) : (
                        <>
                          <ToggleRight className="mr-2 h-4 w-4" />
                          激活
                        </>
                      )}
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem 
                      className="text-red-600"
                      onClick={() => handleDelete(plan.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除
                    </DropdownMenuItem>
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
const PlansTableSkeleton = React.memo(function PlansTableSkeleton() {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>计划信息</TableHead>
            <TableHead>价格</TableHead>
            <TableHead>流量配置</TableHead>
            <TableHead>计费周期</TableHead>
            <TableHead>状态</TableHead>
            <TableHead>标记</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {[...Array(5)].map((_, i) => (
            <TableRow key={i}>
              <TableCell>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-4 w-12" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-12" />
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