// Dashboard 工具函数

// 格式化数字显示
export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'  
  }
  return num.toLocaleString()
}

// 格式化收入显示
export function formatRevenue(amount: number): string {
  return `¥${formatNumber(amount)}`
}

// 计算变化百分比
export function calculateChange(current: number, total: number): string {
  if (total === 0) return '0%'
  const percentage = ((current / total) * 100).toFixed(1)
  return `+${percentage}%`
}

// 计算百分比
export function calculatePercentage(part: number, total: number): string {
  if (total === 0) return '0%'
  return `${((part / total) * 100).toFixed(1)}%`
}