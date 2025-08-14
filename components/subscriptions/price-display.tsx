// 价格显示组件 - 使用shadcn/ui组件

import React, { useMemo } from 'react'
import { CURRENCY_CONFIG, BILLING_CYCLE_CONFIG, type Currency, type BillingCycle } from '@/lib/subscription-types'

interface PriceDisplayProps {
  price: number
  currency: Currency
  billingCycle?: BillingCycle
  setupFee?: number
  className?: string
}

export const PriceDisplay = React.memo(function PriceDisplay({ 
  price, 
  currency, 
  billingCycle, 
  setupFee, 
  className 
}: PriceDisplayProps) {
  const currencyConfig = useMemo(() => 
    CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD, 
    [currency]
  )
  
  const cycleConfig = useMemo(() => 
    billingCycle ? BILLING_CYCLE_CONFIG[billingCycle] : null,
    [billingCycle]
  )
  
  const formatPrice = useMemo(() => (amount: number) => {
    return `${currencyConfig.symbol}${amount.toFixed(2)}`
  }, [currencyConfig.symbol])

  const formattedPrice = useMemo(() => formatPrice(price), [formatPrice, price])
  const formattedSetupFee = useMemo(() => 
    setupFee && setupFee > 0 ? formatPrice(setupFee) : null,
    [formatPrice, setupFee]
  )

  return (
    <div className={className}>
      <span className="font-semibold text-lg">
        {formattedPrice}
        {cycleConfig && (
          <span className="text-sm text-muted-foreground ml-1">
            / {cycleConfig.text}
          </span>
        )}
      </span>
      {formattedSetupFee && (
        <div className="text-sm text-muted-foreground">
          + {formattedSetupFee} 安装费
        </div>
      )}
    </div>
  )
})