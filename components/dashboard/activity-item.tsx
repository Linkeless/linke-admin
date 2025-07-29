'use client'

// 活动项组件
export function ActivityItem({ 
  title, 
  description, 
  time, 
  icon: Icon 
}: {
  title: string
  description: string
  time: string
  icon: React.ElementType
}) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 space-y-1">
        <p className="text-sm font-medium leading-none">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="text-sm text-muted-foreground">{time}</div>
    </div>
  )
}