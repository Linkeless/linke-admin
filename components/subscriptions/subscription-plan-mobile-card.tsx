// 订阅计划移动端卡片组件 - 遵循shadcn/ui响应式设计模式
'use client'

import { SubscriptionPlan, PLAN_STATUS_CONFIG, BILLING_CYCLE_CONFIG, CURRENCY_CONFIG } from "@/lib/subscription-types"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Package, 
  DollarSign, 
  Calendar, 
  Wifi, 
  Star, 
  Crown, 
  EyeOff, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2 
} from "lucide-react"
import { ServerGroupsDisplay } from "./server-groups-display"

interface SubscriptionPlanMobileCardProps {
  plan: SubscriptionPlan
  onView: (plan: SubscriptionPlan) => void
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (plan: SubscriptionPlan) => void
}

export function SubscriptionPlanMobileCard({
  plan,
  onView,
  onEdit,
  onDelete,
}: SubscriptionPlanMobileCardProps) {
  const statusConfig = PLAN_STATUS_CONFIG[plan.status] || PLAN_STATUS_CONFIG.inactive
  const currencyConfig = CURRENCY_CONFIG[plan.currency as keyof typeof CURRENCY_CONFIG]
  const cycleConfig = BILLING_CYCLE_CONFIG[plan.billing_cycle]

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        {/* 头部 - 名称和状态 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{plan.name}</span>
                <Badge 
                  variant={statusConfig.variant}
                  className="text-xs"
                >
                  {statusConfig.text}
                </Badge>
              </div>
              
              {/* 标识徽章 */}
              <div className="flex gap-1 flex-wrap">
                {plan.is_popular && (
                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                    <Star className="h-3 w-3 mr-1" />
                    热门
                  </Badge>
                )}
                {plan.is_recommended && (
                  <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-800 border-blue-200">
                    <Crown className="h-3 w-3 mr-1" />
                    推荐
                  </Badge>
                )}
                {!plan.is_visible && (
                  <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600">
                    <EyeOff className="h-3 w-3 mr-1" />
                    隐藏
                  </Badge>
                )}
              </div>
              
              {plan.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {plan.description}
                </p>
              )}
              
              {plan.code && (
                <span className="text-xs text-muted-foreground font-mono">
                  {plan.code}
                </span>
              )}
            </div>
          </div>
          
          {/* 操作菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onView(plan)}>
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(plan)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑计划
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(plan)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除计划
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 价格信息 */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/30 rounded-lg">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold">
                {currencyConfig?.symbol || plan.currency}{plan.price}
              </span>
              <span className="text-sm text-muted-foreground">
                /{cycleConfig?.text || plan.billing_cycle}
              </span>
            </div>
            {plan.setup_fee > 0 && (
              <span className="text-xs text-orange-600">
                +{currencyConfig?.symbol || plan.currency}{plan.setup_fee} 设置费
              </span>
            )}
          </div>
        </div>

        {/* 详细信息网格 */}
        <div className="grid grid-cols-1 gap-3 text-sm">
          {/* 计费周期 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>计费周期</span>
            </div>
            <div>
              <span className="font-medium">
                {cycleConfig?.text || plan.billing_cycle}
              </span>
              {plan.billing_interval > 1 && (
                <span className="text-xs text-muted-foreground ml-1">
                  (每{plan.billing_interval}个周期)
                </span>
              )}
            </div>
          </div>

          {/* 流量限制 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Wifi className="h-4 w-4" />
              <span>流量限制</span>
            </div>
            <div className="text-right">
              {plan.traffic_limit_gb && plan.traffic_limit_gb > 0 ? (
                <div>
                  <Badge variant="outline" className="text-xs">
                    {plan.traffic_limit_text || `${plan.traffic_limit_gb}GB`}
                  </Badge>
                  {plan.traffic_reset_cycle && (
                    <div className="text-xs text-muted-foreground mt-1">
                      {plan.traffic_reset_cycle === 'monthly' ? '每月重置' : plan.traffic_reset_cycle === 'never' ? '不重置' : plan.traffic_reset_cycle}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">无限制</span>
              )}
            </div>
          </div>

          {/* 试用期 */}
          {plan.trial_period_days > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">试用期</span>
              <Badge variant="secondary" className="text-xs text-blue-600 border-blue-200">
                {plan.trial_period_days}天
              </Badge>
            </div>
          )}

          {/* 服务器组 */}
          <div className="pt-2 border-t">
            <ServerGroupsDisplay
              serverGroups={plan.server_groups}
              serverGroupIds={plan.default_server_group_ids}
              maxDisplay={2}
              variant="compact"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}