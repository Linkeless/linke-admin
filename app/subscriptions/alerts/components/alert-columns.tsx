"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, CheckCircle, X } from "lucide-react"
import { 
  SubscriptionAlert,
  ALERT_TYPE_CONFIG,
  ALERT_SEVERITY_CONFIG 
} from "@/lib/subscription-types"
import { formatDistanceToNow } from "date-fns"
import { zhCN } from "date-fns/locale"

interface AlertColumnsOptions {
  onAlertUpdated: () => void
  onSelectionChange: (selected: number[]) => void
  selectedAlerts: number[]
}

export function createAlertColumns({ 
  onAlertUpdated, 
  onSelectionChange,
  selectedAlerts 
}: AlertColumnsOptions): ColumnDef<SubscriptionAlert>[] {
  
  const handleResolveAlert = async (alert: SubscriptionAlert) => {
    try {
      // 模拟API调用
      console.log('解决告警:', alert.id)
      onAlertUpdated()
    } catch (error) {
      console.error('解决告警失败:', error)
    }
  }

  const handleIgnoreAlert = async (alert: SubscriptionAlert) => {
    try {
      // 模拟API调用
      console.log('忽略告警:', alert.id)
      onAlertUpdated()
    } catch (error) {
      console.error('忽略告警失败:', error)
    }
  }

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value)
            if (value) {
              const allIds = table.getRowModel().rows.map(row => row.original.id)
              onSelectionChange(allIds)
            } else {
              onSelectionChange([])
            }
          }}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => {
            row.toggleSelected(!!value)
            const currentSelected = selectedAlerts.filter(id => id !== row.original.id)
            if (value) {
              onSelectionChange([...currentSelected, row.original.id])
            } else {
              onSelectionChange(currentSelected)
            }
          }}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "severity",
      header: "严重程度",
      cell: ({ row }) => {
        const severity = row.getValue("severity") as string
        const config = ALERT_SEVERITY_CONFIG[severity as keyof typeof ALERT_SEVERITY_CONFIG]
        return (
          <Badge variant={config?.variant || "outline"}>
            {config?.text || severity}
          </Badge>
        )
      },
    },
    {
      accessorKey: "alert_type",
      header: "告警类型",
      cell: ({ row }) => {
        const type = row.getValue("alert_type") as string
        const config = ALERT_TYPE_CONFIG[type as keyof typeof ALERT_TYPE_CONFIG]
        return (
          <Badge variant="outline">
            {config?.text || type}
          </Badge>
        )
      },
    },
    {
      accessorKey: "title",
      header: "告警标题",
      cell: ({ row }) => (
        <div className="max-w-md">
          <div className="font-medium">{row.getValue("title")}</div>
          <div className="text-sm text-muted-foreground truncate">
            {row.original.message}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "user",
      header: "用户信息",
      cell: ({ row }) => {
        const user = row.original.user
        return user ? (
          <div>
            <div className="font-medium">{user.name}</div>
            <div className="text-sm text-muted-foreground">{user.email}</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "subscription",
      header: "订阅信息",
      cell: ({ row }) => {
        const subscription = row.original.subscription
        return subscription ? (
          <div>
            <div className="font-medium text-sm">
              {subscription.subscription_plan?.name || "未知计划"}
            </div>
            <div className="text-xs text-muted-foreground">
              {subscription.uuid}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "status",
      header: "状态",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const variants = {
          pending: "default" as const,
          resolved: "secondary" as const,
          ignored: "outline" as const
        }
        const texts = {
          pending: "待处理",
          resolved: "已解决", 
          ignored: "已忽略"
        }
        return (
          <Badge variant={variants[status as keyof typeof variants] || "outline"}>
            {texts[status as keyof typeof texts] || status}
          </Badge>
        )
      },
    },
    {
      accessorKey: "created_at",
      header: "创建时间",
      cell: ({ row }) => {
        const date = new Date(row.getValue("created_at"))
        return (
          <div className="text-sm">
            <div>{date.toLocaleDateString('zh-CN')}</div>
            <div className="text-muted-foreground">
              {formatDistanceToNow(date, { locale: zhCN, addSuffix: true })}
            </div>
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "操作",
      cell: ({ row }) => {
        const alert = row.original
        const isPending = alert.status === 'pending'

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
                onClick={() => navigator.clipboard.writeText(alert.id.toString())}
              >
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {isPending && (
                <>
                  <DropdownMenuItem onClick={() => handleResolveAlert(alert)}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    标记为已解决
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleIgnoreAlert(alert)}>
                    <X className="mr-2 h-4 w-4" />
                    忽略此告警
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}