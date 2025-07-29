// 价格显示组件 - 使用shadcn/ui组件

import { CURRENCY_CONFIG, BILLING_CYCLE_CONFIG, type Currency, type BillingCycle } from '@/lib/subscription-types'

interface PriceDisplayProps {
  price: number
  currency: Currency
  billingCycle?: BillingCycle
  setupFee?: number
  className?: string
}

export function PriceDisplay({ 
  price, 
  currency, 
  billingCycle, 
  setupFee, 
  className 
}: PriceDisplayProps) {
  const currencyConfig = CURRENCY_CONFIG[currency] || CURRENCY_CONFIG.USD
  const cycleConfig = billingCycle ? BILLING_CYCLE_CONFIG[billingCycle] : null
  
  const formatPrice = (amount: number) => {
    return `${currencyConfig.symbol}${amount.toFixed(2)}`
  }

  return (
    <div className={className}>
      <span className="font-semibold text-lg">
        {formatPrice(price)}
        {cycleConfig && (
          <span className="text-sm text-muted-foreground ml-1">
            / {cycleConfig.text}
          </span>
        )}
      </span>
      {setupFee && setupFee > 0 && (
        <div className="text-sm text-muted-foreground">
          + {formatPrice(setupFee)} 安装费
        </div>
      )}
    </div>
  )
}