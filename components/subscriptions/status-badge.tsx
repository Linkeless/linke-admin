// 订阅状态标签组件 - 使用shadcn/ui Badge组件

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { 
  SUBSCRIPTION_STATUS_CONFIG, 
  PLAN_STATUS_CONFIG,
  type SubscriptionStatus,
  type PlanStatus 
} from '@/lib/subscription-types'

interface SubscriptionStatusBadgeProps {
  status: SubscriptionStatus
  className?: string
}

interface PlanStatusBadgeProps {
  status: PlanStatus
  className?: string
}

export const SubscriptionStatusBadge = React.memo(function SubscriptionStatusBadge({ status, className }: SubscriptionStatusBadgeProps) {
  const config = useMemo(() => SUBSCRIPTION_STATUS_CONFIG[status], [status])
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  )
})

export const PlanStatusBadge = React.memo(function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  const config = useMemo(() => PLAN_STATUS_CONFIG[status], [status])
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  )
})