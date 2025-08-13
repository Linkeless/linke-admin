"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface AlertStatsCardProps {
  title: string
  value: number
  icon: LucideIcon
  color: 'blue' | 'yellow' | 'green' | 'red'
  description?: string
}

const colorClasses = {
  blue: "bg-blue-50 text-blue-600 border-blue-200",
  yellow: "bg-yellow-50 text-yellow-600 border-yellow-200", 
  green: "bg-green-50 text-green-600 border-green-200",
  red: "bg-red-50 text-red-600 border-red-200"
}

export function AlertStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color,
  description 
}: AlertStatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        <div className={cn(
          "h-8 w-8 rounded-lg flex items-center justify-center border",
          colorClasses[color]
        )}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}