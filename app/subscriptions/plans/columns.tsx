'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Package, DollarSign, Calendar, ChevronsUpDown, Eye, Edit } from "lucide-react"

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
import { SubscriptionPlan } from "@/lib/subscription-types"
import { subscriptionService } from "@/lib/subscription-service"
import { 
  EditPlanDialog, 
  PlanDetailDialog
} from "@/components/subscriptions/subscription-plans"

interface ColumnsProps {
  onPlanUpdated: () => void
}

export const createPlanColumns = ({ onPlanUpdated }: ColumnsProps): ColumnDef<SubscriptionPlan>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          计划名称
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">{plan.name}</span>
            {plan.description && (
              <span className="text-sm text-muted-foreground truncate max-w-xs">
                {plan.description}
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "price",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          价格
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">
              {plan.currency} {plan.price}
            </span>
            <span className="text-sm text-muted-foreground">
              {plan.billing_cycle}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">状态</div>,
    cell: ({ row }) => {
      const plan = row.original
      const isActive = plan.status === 'active'
      
      return (
        <div className="text-center">
          <Badge 
            variant={isActive ? "default" : "secondary"} 
            className={`text-xs ${isActive ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
          >
            {isActive ? "活跃" : "停用"}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "duration_days",
    header: () => <div className="text-center">时长</div>,
    cell: ({ row }) => {
      const plan = row.original
      return (
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">
              {plan.duration_days}天
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "data_limit_gb",
    header: () => <div className="text-center">流量限制</div>,
    cell: ({ row }) => {
      const plan = row.original
      if (!plan.data_limit_gb) {
        return (
          <div className="text-center">
            <span className="text-sm text-muted-foreground">无限制</span>
          </div>
        )
      }
      return (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {plan.data_limit_gb}GB
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "device_limit",
    header: () => <div className="text-center">设备限制</div>,
    cell: ({ row }) => {
      const plan = row.original
      if (!plan.device_limit) {
        return (
          <div className="text-center">
            <span className="text-sm text-muted-foreground">无限制</span>
          </div>
        )
      }
      return (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {plan.device_limit}台
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "trial_days",
    header: () => <div className="text-center">试用天数</div>,
    cell: ({ row }) => {
      const plan = row.original
      if (!plan.trial_days) {
        return (
          <div className="text-center">
            <span className="text-sm text-muted-foreground">-</span>
          </div>
        )
      }
      return (
        <div className="text-center">
          <Badge variant="secondary" className="text-xs text-blue-600 border-blue-200">
            {plan.trial_days}天
          </Badge>
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