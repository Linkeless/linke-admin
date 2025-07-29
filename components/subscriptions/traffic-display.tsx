// 流量显示组件

import { Badge } from '@/components/ui/badge'

interface TrafficDisplayProps {
  limit: number
  limitText: string
  resetCycle: string
  className?: string
}

export function TrafficDisplay({ 
  limit, 
  limitText, 
  resetCycle, 
  className 
}: TrafficDisplayProps) {
  // 格式化重置周期显示
  const formatResetCycle = (cycle: string) => {
    const cycleMap: Record<string, string> = {
      monthly: '每月重置',
      yearly: '每年重置',
      quarterly: '每季重置',
      weekly: '每周重置',
      daily: '每日重置'
    }
    return cycleMap[cycle] || cycle
  }

  // 判断是否为无限流量
  const isUnlimited = limit <= 0 || limit >= 999999999999

  return (
    <div className={className}>
      <div className="font-medium">
        {isUnlimited ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            无限流量
          </Badge>
        ) : (
          <span>{limitText}</span>
        )}
      </div>
      {!isUnlimited && (
        <div className="text-sm text-muted-foreground">
          {formatResetCycle(resetCycle)}
        </div>
      )}
    </div>
  )
}