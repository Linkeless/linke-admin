// 续费状态组件

import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertTriangle, CheckCircle, Clock } from 'lucide-react'

interface RenewalStatusProps {
  autoRenew: boolean
  nextBillingDate?: string
  renewalAttempts: number
  failReason?: string
  className?: string
}

export function RenewalStatus({
  autoRenew,
  nextBillingDate,
  renewalAttempts,
  failReason,
  className
}: RenewalStatusProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const hasRenewalFailure = renewalAttempts > 0 && failReason

  return (
    <div className={className}>
      {/* 自动续费状态 */}
      <div className="flex items-center gap-2 mb-2">
        {autoRenew ? (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            自动续费
          </Badge>
        ) : (
          <Badge variant="secondary">
            手动续费
          </Badge>
        )}
      </div>

      {/* 下次计费日期 */}
      {nextBillingDate && autoRenew && (
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <Clock className="w-3 h-3" />
          下次计费: {formatDate(nextBillingDate)}
        </div>
      )}

      {/* 续费失败提醒 */}
      {hasRenewalFailure && (
        <Alert className="mt-2" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            续费失败 ({renewalAttempts} 次): {failReason}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}