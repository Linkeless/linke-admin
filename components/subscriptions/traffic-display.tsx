// 流量显示组件

import React, { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'

interface TrafficDisplayProps {
  limit: number
  limitText: string
  resetCycle: string
  className?: string
}

export const TrafficDisplay = React.memo(function TrafficDisplay({ 
  limit, 
  limitText, 
  resetCycle, 
  className 
}: TrafficDisplayProps) {
  // 格式化重置周期显示 - 使用useMemo缓存结果
  const formattedResetCycle = useMemo(() => {
    const cycleMap: Record<string, string> = {
      monthly: '每月重置',
      yearly: '每年重置',
      quarterly: '每季重置',
      weekly: '每周重置',
      daily: '每日重置'
    }
    return cycleMap[resetCycle] || resetCycle
  }, [resetCycle])

  // 判断是否为无限流量 - 使用useMemo缓存计算结果
  const isUnlimited = useMemo(() => 
    limit <= 0 || limit >= 999999999999,
    [limit]
  )

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
          {formattedResetCycle}
        </div>
      )}
    </div>
  )
})