// 服务器组显示组件 - 遵循shadcn/ui组合模式
'use client'

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Server, Wifi } from "lucide-react"
import { ServerGroupInfo } from "@/lib/subscription-types"

interface ServerGroupsDisplayProps {
  serverGroups?: ServerGroupInfo[]
  serverGroupIds?: number[]
  maxDisplay?: number
  variant?: 'detailed' | 'compact'
}

export function ServerGroupsDisplay({ 
  serverGroups = [],
  serverGroupIds = [],
  maxDisplay = 3,
  variant = 'detailed'
}: ServerGroupsDisplayProps) {
  // 如果有详细信息，使用详细信息；否则使用ID
  const groups = serverGroups.length > 0 ? serverGroups : 
    serverGroupIds.map(id => ({ id, name: `群组 ${id}` }))

  if (groups.length === 0) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Server className="h-4 w-4 mr-1" />
        <span>未配置</span>
      </div>
    )
  }

  const displayGroups = groups.slice(0, maxDisplay)
  const remainingCount = groups.length - maxDisplay

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <Server className="h-4 w-4 text-muted-foreground" />
        <Badge variant="outline" className="text-xs">
          {groups.length} 个群组
        </Badge>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1 text-sm text-muted-foreground mb-1">
        <Wifi className="h-3 w-3" />
        <span className="text-xs">默认服务器组</span>
      </div>
      
      <div className="flex flex-wrap gap-1">
        {displayGroups.map((group) => (
          <TooltipProvider key={group.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className={`text-xs cursor-help ${
                    group.status === 'active' 
                      ? 'bg-green-50 text-green-700 border-green-200' 
                      : 'bg-gray-50 text-gray-600 border-gray-200'
                  }`}
                >
                  <Server className="h-3 w-3 mr-1" />
                  {group.name}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="text-xs">
                <div className="space-y-1">
                  <div className="font-medium">群组 #{group.id}</div>
                  {group.description && (
                    <div className="text-muted-foreground">{group.description}</div>
                  )}
                  {group.status && (
                    <div className={`text-xs ${
                      group.status === 'active' ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      状态: {group.status === 'active' ? '活跃' : '停用'}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        
        {remainingCount > 0 && (
          <Badge variant="outline" className="text-xs">
            +{remainingCount}
          </Badge>
        )}
      </div>
    </div>
  )
}

// 简化版本 - 仅显示数量
export function ServerGroupsBadge({ 
  count,
  status = 'default' 
}: { 
  count: number
  status?: 'default' | 'success' | 'warning'
}) {
  const variants = {
    default: 'bg-blue-50 text-blue-700 border-blue-200',
    success: 'bg-green-50 text-green-700 border-green-200',
    warning: 'bg-orange-50 text-orange-700 border-orange-200'
  }

  if (count === 0) {
    return (
      <Badge variant="outline" className="text-xs text-muted-foreground">
        <Server className="h-3 w-3 mr-1" />
        未配置
      </Badge>
    )
  }

  return (
    <Badge 
      variant="secondary" 
      className={`text-xs ${variants[status]}`}
    >
      <Server className="h-3 w-3 mr-1" />
      {count} 个群组
    </Badge>
  )
}