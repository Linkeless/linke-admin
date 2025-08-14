'use client'

import React from "react"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Users, 
  Server, 
  Settings, 
  RefreshCw, 
  Plus, 
  BarChart3, 
  Ticket,
  ShoppingCart,
  UserPlus,
  FileText,
  ArrowRight,
  Activity
} from "lucide-react"
import Link from "next/link"
import { DashboardOverview } from "@/lib/stats-types"
import { cn } from "@/lib/utils"

interface QuickActionsGridProps {
  overview: DashboardOverview | null
  onRefresh?: () => void
  isRefetching?: boolean
}

// 快速操作项接口
interface QuickActionItem {
  title: string
  description: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  variant?: 'default' | 'urgent' | 'success' | 'info'
  onClick?: () => void
  disabled?: boolean
}

export const QuickActionsGrid = React.memo<QuickActionsGridProps>(function QuickActionsGrid({ 
  overview, 
  onRefresh,
  isRefetching = false
}) {
  // 使用React.useMemo缓存计算结果
  const actionItems = React.useMemo((): QuickActionItem[] => [
    {
      title: "用户管理",
      description: overview ? `管理 ${overview.users.total_users.toLocaleString()} 个用户账号` : '管理系统用户和权限',
      href: "/users",
      icon: Users,
      badge: overview?.users.new_users_today || 0,
      variant: 'default'
    },
    {
      title: "创建用户",
      description: "快速添加新用户到系统",
      href: "/users?action=create",
      icon: UserPlus,
      variant: 'success'
    },
    {
      title: "服务器管理",
      description: "配置和监控服务器状态",
      href: "/servers/shadowsocks-servers",
      icon: Server,
      variant: 'default'
    },
    {
      title: "订单管理",
      description: overview ? `处理 ${overview.orders.pending_orders} 个待处理订单` : '管理订单和支付',
      href: "/finance/orders",
      icon: ShoppingCart,
      badge: overview?.orders.pending_orders || 0,
      variant: overview && overview.orders.pending_orders > 5 ? 'urgent' : 'default'
    },
    {
      title: "工单处理",
      description: overview ? `处理 ${overview.tickets.open_tickets} 个待处理工单` : '处理客户工单和支持请求',
      href: "/support/tickets",
      icon: Ticket,
      badge: overview?.tickets.open_tickets || 0,
      variant: overview && overview.tickets.open_tickets > 10 ? 'urgent' : 'default'
    },
    {
      title: "数据报表",
      description: "查看详细的业务分析报表",
      href: "/analytics",
      icon: BarChart3,
      variant: 'info'
    },
    {
      title: "系统设置",
      description: "配置系统参数和选项",
      href: "/settings",
      icon: Settings,
      variant: 'default'
    },
    {
      title: "刷新数据",
      description: "手动刷新仪表板数据",
      icon: RefreshCw,
      variant: 'default',
      onClick: onRefresh,
      disabled: isRefetching
    }
  ], [overview, onRefresh, isRefetching])

  return (
    <div className="space-y-4">
      {/* 标题和刷新按钮 */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">快速操作</h3>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Activity className="h-4 w-4" />
          常用功能入口
        </div>
      </div>

      {/* 快速操作网格 */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {actionItems.map((item, index) => (
          <QuickActionCard key={index} item={item} />
        ))}
      </div>

      {/* 快速统计概览 */}
      {overview && (
        <QuickStatsOverview overview={overview} />
      )}
    </div>
  )
})

// 快速操作卡片组件
const QuickActionCard = React.memo<{ item: QuickActionItem }>(function QuickActionCard({ item }) {
  const IconComponent = item.icon

  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'urgent':
        return "border-red-200 hover:border-red-300 hover:bg-red-50"
      case 'success':
        return "border-green-200 hover:border-green-300 hover:bg-green-50"
      case 'info':
        return "border-blue-200 hover:border-blue-300 hover:bg-blue-50"
      default:
        return "hover:bg-muted/50"
    }
  }

  const getBadgeVariant = (variant: string) => {
    switch (variant) {
      case 'urgent':
        return "destructive"
      case 'success':
        return "default"
      case 'info':
        return "secondary"
      default:
        return "outline"
    }
  }

  const cardContent = (
    <Card className={cn(
      "cursor-pointer transition-all duration-200 hover:scale-105",
      getVariantStyles(item.variant || 'default'),
      item.disabled && "opacity-50 cursor-not-allowed hover:scale-100"
    )}>
      <CardHeader className="text-center space-y-3">
        <div className="relative">
          <IconComponent className={cn(
            "h-8 w-8 mx-auto",
            item.variant === 'urgent' && "text-red-500",
            item.variant === 'success' && "text-green-500", 
            item.variant === 'info' && "text-blue-500",
            (!item.variant || item.variant === 'default') && "text-primary",
            isRefetching && item.icon === RefreshCw && "animate-spin"
          )} />
          {item.badge !== undefined && item.badge !== 0 && (
            <Badge 
              variant={getBadgeVariant(item.variant || 'default')}
              className="absolute -top-2 -right-6 h-5 min-w-5 px-1 text-xs"
            >
              {typeof item.badge === 'number' && item.badge > 99 ? '99+' : item.badge}
            </Badge>
          )}
        </div>
        <div>
          <CardTitle className="text-sm font-medium flex items-center justify-center gap-2">
            {item.title}
            {item.href && <ArrowRight className="h-3 w-3 opacity-50" />}
          </CardTitle>
          <CardDescription className="text-xs mt-1">
            {item.description}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>
  )

  if (item.href && !item.disabled) {
    return <Link href={item.href}>{cardContent}</Link>
  }

  if (item.onClick && !item.disabled) {
    return (
      <button onClick={item.onClick} className="text-left">
        {cardContent}
      </button>
    )
  }

  return cardContent
})

// 快速统计概览组件
const QuickStatsOverview = React.memo<{ overview: DashboardOverview }>(function QuickStatsOverview({ overview }) {
  const quickStats = React.useMemo(() => [
    {
      label: "今日新增用户",
      value: overview.users.new_users_today,
      color: "text-blue-600"
    },
    {
      label: "待处理订单",
      value: overview.orders.pending_orders,
      color: overview.orders.pending_orders > 5 ? "text-red-600" : "text-green-600"
    },
    {
      label: "待处理工单",
      value: overview.tickets.open_tickets,
      color: overview.tickets.open_tickets > 10 ? "text-red-600" : "text-green-600"
    },
    {
      label: "可用邀请码",
      value: overview.inviteCodes.unused_codes,
      color: overview.inviteCodes.unused_codes < 10 ? "text-red-600" : "text-green-600"
    }
  ], [overview])

  return (
    <div className="mt-6 p-4 rounded-lg bg-muted/30 border">
      <h4 className="text-sm font-medium mb-3">今日概览</h4>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center">
        {quickStats.map((stat, index) => (
          <div key={index} className="space-y-1">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={cn("text-lg font-bold", stat.color)}>
              {stat.value.toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
})