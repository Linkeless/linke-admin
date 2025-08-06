'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Package, DollarSign, Calendar, Eye, Edit, Wifi, Star, Crown, EyeOff, Zap, CheckCircle, Clock, Archive } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SubscriptionPlan, PLAN_STATUS_CONFIG, BILLING_CYCLE_CONFIG, CURRENCY_CONFIG } from "@/lib/subscription-types"
import { subscriptionService } from "@/lib/subscription-service"
import { 
  EditPlanDialog, 
  PlanDetailDialog
} from "@/components/subscriptions/subscription-plans"
import { ServerGroupsDisplay } from "@/components/subscriptions/server-groups-display"

interface ColumnsProps {
  onPlanUpdated: () => void
}

export const createPlanColumns = ({ onPlanUpdated }: ColumnsProps): ColumnDef<SubscriptionPlan>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="计划名称" />
    ),
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="flex items-start gap-2">
          <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium truncate">{plan.name}</span>
              <div className="flex gap-1.5">
                {plan.is_popular && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="text-xs bg-gradient-to-r from-orange-400 to-red-500 text-white border-0 shadow-sm hover:shadow-md transition-all hover:scale-105">
                          <Star className="h-3 w-3 mr-1" />
                          热门
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>用户最受欢迎的订阅计划，销量领先</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {plan.is_recommended && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-sm hover:shadow-md transition-all hover:scale-105">
                          <Crown className="h-3 w-3 mr-1" />
                          推荐
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>官方推荐的订阅计划，性价比最高</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {!plan.is_visible && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-300">
                          <EyeOff className="h-3 w-3 mr-1" />
                          隐藏
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>此计划对用户不可见，仅供内部管理使用</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
            {plan.description && (
              <span className="text-sm text-muted-foreground truncate">
                {plan.description}
              </span>
            )}
            {plan.code && (
              <span className="text-xs text-muted-foreground font-mono">
                {plan.code}
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="价格" />
    ),
    cell: ({ row }) => {
      const plan = row.original
      const currencyConfig = CURRENCY_CONFIG[plan.currency as keyof typeof CURRENCY_CONFIG]
      const cycleConfig = BILLING_CYCLE_CONFIG[plan.billing_cycle]
      
      return (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">
              {currencyConfig?.symbol || plan.currency}{plan.price}
            </span>
            <span className="text-xs text-muted-foreground">
              /{cycleConfig?.text || plan.billing_cycle}
            </span>
            {plan.setup_fee > 0 && (
              <span className="text-xs text-orange-600">
                +{currencyConfig?.symbol || plan.currency}{plan.setup_fee} 设置费
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <div>状态</div>,
    cell: ({ row }) => {
      const plan = row.original
      const statusConfig = PLAN_STATUS_CONFIG[plan.status] || PLAN_STATUS_CONFIG.inactive
      
      const statusIcons = {
        active: CheckCircle,
        inactive: Clock,
        archived: Archive
      }
      
      const StatusIcon = statusIcons[plan.status as keyof typeof statusIcons] || Clock
      
      const statusDescriptions = {
        active: '计划已激活，用户可以正常订阅',
        inactive: '计划未激活，用户无法看到或订阅此计划', 
        archived: '计划已归档，不再提供给新用户，现有订阅不受影响'
      }
      
      const customStyles = {
        active: 'bg-green-500 text-white border-green-600 hover:bg-green-600',
        inactive: 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200',
        archived: 'bg-red-500 text-white border-red-600 hover:bg-red-600'
      }
      
      return (
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant={statusConfig.variant}
                  className={`text-xs transition-all ${customStyles[plan.status as keyof typeof customStyles] || customStyles.inactive}`}
                >
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.text}
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>{statusDescriptions[plan.status as keyof typeof statusDescriptions] || statusDescriptions.inactive}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
  {
    accessorKey: "billing_cycle",
    header: () => <div>计费周期</div>,
    cell: ({ row }) => {
      const plan = row.original
      const cycleConfig = BILLING_CYCLE_CONFIG[plan.billing_cycle] || { text: plan.billing_cycle, interval: 1 }
      
      return (
        <div>
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {cycleConfig.text}
            </span>
          </div>
          {plan.billing_interval > 1 && (
            <div className="text-xs text-muted-foreground mt-1">
              每 {plan.billing_interval} 个周期
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "traffic_limit_gb",
    header: () => <div>流量限制</div>,
    cell: ({ row }) => {
      const plan = row.original
      if (!plan.traffic_limit_gb || plan.traffic_limit_gb <= 0) {
        return (
          <div className="flex items-center gap-1">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">无限制</span>
          </div>
        )
      }
      
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1">
            <Wifi className="h-4 w-4 text-muted-foreground" />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="outline" className="text-xs font-medium bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 transition-colors">
                    {plan.traffic_limit_text || `${plan.traffic_limit_gb}GB`}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>每个计费周期的流量使用限额</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {plan.traffic_reset_cycle && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs text-muted-foreground cursor-help">
                    {plan.traffic_reset_cycle === 'monthly' ? '每月重置' : plan.traffic_reset_cycle === 'never' ? '不重置' : plan.traffic_reset_cycle}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>流量使用量{plan.traffic_reset_cycle === 'monthly' ? '每月自动重置为0' : '累计计算，永不重置'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      )
    },
  },
  {
    id: "limits",
    header: () => <div>其他限制</div>,
    cell: ({ row }) => {
      const plan = row.original
      let limits = {}
      try {
        if (plan.limits) {
          limits = JSON.parse(plan.limits)
        }
      } catch (e) {
        // 忽略JSON解析错误
      }
      
      const deviceLimit = (limits as any)?.device_limit
      if (!deviceLimit || deviceLimit <= 0) {
        return (
          <div>
            <span className="text-sm text-muted-foreground">无限制</span>
          </div>
        )
      }
      return (
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 transition-colors">
                  {deviceLimit}台设备
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>同时可以连接的设备数量限制</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
  {
    accessorKey: "trial_period_days",
    header: () => <div>试用天数</div>,
    cell: ({ row }) => {
      const plan = row.original
      if (!plan.trial_period_days || plan.trial_period_days <= 0) {
        return (
          <div>
            <span className="text-sm text-muted-foreground">-</span>
          </div>
        )
      }
      return (
        <div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge 
                  variant="secondary" 
                  className="text-xs bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border-blue-200 hover:from-blue-100 hover:to-indigo-100 transition-all hover:scale-105"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  {plan.trial_period_days}天免费
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>用户可以免费试用 {plan.trial_period_days} 天，无需立即付费</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    },
  },
  {
    id: "server_groups",
    header: () => <div>服务器组</div>,
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="max-w-48">
          <ServerGroupsDisplay
            serverGroups={plan.server_groups}
            serverGroupIds={plan.default_server_group_ids}
            maxDisplay={2}
            variant="detailed"
          />
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="创建时间" />
    ),
    cell: ({ row }) => {
      const plan = row.original
      return (
        <span className="text-sm text-muted-foreground">
          {formatDateTime(plan.created_at)}
        </span>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const plan = row.original
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(plan.id.toString())}
            >
              复制计划ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(plan.name)}
            >
              复制计划名称
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <PlanDetailDialog 
              plan={plan}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </div>
              }
            />
            <EditPlanDialog 
              plan={plan} 
              onPlanUpdated={onPlanUpdated}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Edit className="mr-2 h-4 w-4" />
                  编辑计划
                </div>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(plan)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除计划
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      
      function handleDelete(plan: SubscriptionPlan) {
        if (confirm('确定要删除这个订阅计划吗？此操作不可撤销。')) {
          subscriptionService.deletePlan(plan.id)
            .then(() => onPlanUpdated())
            .catch((error) => {
              console.error('删除计划失败:', error)
              alert('删除计划失败，请重试')
            })
        }
      }
    },
  },
]

// 工具函数：格式化日期时间
function formatDateTime(dateString: string): string {
  if (!dateString) return '-'
  
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return '今天'
  } else if (diffDays === 1) {
    return '昨天'
  } else if (diffDays < 7) {
    return `${diffDays}天前`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks}周前`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months}个月前`
  } else {
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
}