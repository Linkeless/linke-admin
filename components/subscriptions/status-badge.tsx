// 订阅状态标签组件 - 使用shadcn/ui Badge组件

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

export function SubscriptionStatusBadge({ status, className }: SubscriptionStatusBadgeProps) {
  const config = SUBSCRIPTION_STATUS_CONFIG[status]
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  )
}

export function PlanStatusBadge({ status, className }: PlanStatusBadgeProps) {
  const config = PLAN_STATUS_CONFIG[status]
  
  return (
    <Badge variant={config.variant} className={className}>
      {config.text}
    </Badge>
  )
}