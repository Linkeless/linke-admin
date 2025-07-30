'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Users, Crown, Activity, ChevronsUpDown, RotateCcw, Pause, Eye, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { UserSubscription, SUBSCRIPTION_STATUS_CONFIG } from "@/lib/subscription-types"
import { subscriptionService } from "@/lib/subscription-service"
import { 
  EditUserSubscriptionDialog, 
  UserSubscriptionDetailDialog
} from "@/components/subscriptions/user-subscriptions"

interface ColumnsProps {
  onSubscriptionUpdated: () => void
}

export const createUserSubscriptionColumns = ({ onSubscriptionUpdated }: ColumnsProps): ColumnDef<UserSubscription>[] => [
  {
    accessorKey: "user",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          用户信息
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const subscription = row.original
      const user = subscription.user
      return (
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">{user?.name || user?.username || `用户${subscription.user_id}`}</span>
            <span className="text-sm text-muted-foreground">
              {user?.email || `ID: ${subscription.user_id}`}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "subscription_plan",
    header: () => <div className="text-center">订阅计划</div>,
    cell: ({ row }) => {
      const subscription = row.original
      const plan = subscription.subscription_plan
      return (
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <Crown className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-col">
              <Badge variant="outline">
                {plan?.name || `计划${subscription.subscription_plan_id}`}
              </Badge>
              {plan && (
                <span className="text-sm text-muted-foreground mt-1">
                  {plan.currency} {plan.price}/{plan.billing_cycle}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">状态</div>,
    cell: ({ row }) => {
      const subscription = row.original
      const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status]
      
      return (
        <div className="text-center">
          <Badge 
            variant={statusConfig?.variant || "secondary"} 
            className="text-xs"
          >
            {statusConfig?.text || subscription.status}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "current_period_start",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          当前周期
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const subscription = row.original
      return (
        <div className="flex flex-col text-sm">
          <span className="text-muted-foreground">
            开始: {formatDate(subscription.current_period_start)}
          </span>
          <span className="text-muted-foreground">
            结束: {formatDate(subscription.current_period_end)}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "auto_renew",
    header: () => <div className="text-center">自动续费</div>,
    cell: ({ row }) => {
      const subscription = row.original
      
      return (
        <div className="text-center">
          <Badge 
            variant={subscription.auto_renew ? "default" : "secondary"} 
            className={`text-xs ${subscription.auto_renew ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
          >
            {subscription.auto_renew ? "已开启" : "已关闭"}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "days_left",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          剩余天数
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const subscription = row.original
      return (
        <div className="flex items-center gap-1">
          <Activity className="h-4 w-4 text-muted-foreground" />
          <span className={`text-sm font-medium ${subscription.days_left <= 7 ? 'text-red-600' : subscription.days_left <= 30 ? 'text-orange-600' : 'text-green-600'}`}>
            {subscription.days_left}天
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "is_in_trial",
    header: () => <div className="text-center">试用状态</div>,
    cell: ({ row }) => {
      const subscription = row.original
      return (
        <div className="text-center">
          {!subscription.is_in_trial ? (
            <span className="text-sm text-muted-foreground">-</span>
          ) : (
            <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
              试用中
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          创建时间
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const subscription = row.original
      return (
        <span className="text-sm text-muted-foreground">
          {formatDate(subscription.created_at)}
        </span>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const subscription = row.original
      
      const handleDelete = async () => {
        if (confirm('确定要删除这个订阅吗？此操作不可撤销。')) {
          try {
            await subscriptionService.deleteUserSubscription(subscription.id)
            onSubscriptionUpdated()
          } catch (error) {
            console.error('删除订阅失败:', error)
            alert('删除订阅失败，请重试')
          }
        }
      }

      const handleRenew = async () => {
        try {
          await subscriptionService.renewUserSubscription(subscription.id)
          onSubscriptionUpdated()
        } catch (error) {
          console.error('续费订阅失败:', error)
          alert('续费订阅失败，请重试')
        }
      }

      const handleCancel = async () => {
        if (confirm('确定要取消这个订阅吗？')) {
          try {
            await subscriptionService.cancelUserSubscription(subscription.id, '管理员操作')
            onSubscriptionUpdated()
          } catch (error) {
            console.error('取消订阅失败:', error)
            alert('取消订阅失败，请重试')
          }
        }
      }

      const handleReactivate = async () => {
        try {
          await subscriptionService.reactivateUserSubscription(subscription.id)
          onSubscriptionUpdated()
        } catch (error) {
          console.error('重新激活订阅失败:', error)
          alert('重新激活订阅失败，请重试')
        }
      }

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
              onClick={() => navigator.clipboard.writeText(subscription.id.toString())}
            >
              复制订阅ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(subscription.uuid)}
            >
              复制UUID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <UserSubscriptionDetailDialog 
              subscription={subscription}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </div>
              }
            />
            <EditUserSubscriptionDialog 
              subscription={subscription} 
              onSubscriptionUpdated={onSubscriptionUpdated}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Edit className="mr-2 h-4 w-4" />
                  编辑订阅
                </div>
              }
            />
            <DropdownMenuSeparator />
            {subscription.status === 'active' && (
              <DropdownMenuItem onClick={handleCancel}>
                <Pause className="mr-2 h-4 w-4" />
                取消订阅
              </DropdownMenuItem>
            )}
            {(subscription.status === 'cancelled' || subscription.status === 'expired') && (
              <DropdownMenuItem onClick={handleReactivate}>
                <RotateCcw className="mr-2 h-4 w-4" />
                重新激活
              </DropdownMenuItem>
            )}
            {subscription.status === 'active' && (
              <DropdownMenuItem onClick={handleRenew}>
                <RotateCcw className="mr-2 h-4 w-4" />
                立即续费
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDelete}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除订阅
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// 工具函数：格式化日期
function formatDate(dateString: string): string {
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