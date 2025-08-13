'use client'

import Image from 'next/image'
import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Edit, Trash2, Power, PowerOff, ChevronsUpDown } from 'lucide-react'
import { PaymentConfigResponse } from '@/lib/payment-types'
import { paymentService } from '@/lib/payment-service'
import { toast } from 'sonner'

interface ColumnsProps {
  onConfigUpdated?: () => void
  onEdit?: (config: PaymentConfigResponse) => void
}

export function createColumns({ onConfigUpdated, onEdit }: ColumnsProps): ColumnDef<PaymentConfigResponse>[] {
  const handleDelete = async (config: PaymentConfigResponse) => {
    if (!confirm(`确定要删除支付配置"${config.name}"吗？此操作不可撤销。`)) {
      return
    }

    try {
      await paymentService.deletePaymentConfig(config.id)
      toast.success(`支付配置"${config.name}"已删除`)
      onConfigUpdated?.()
    } catch (error) {
      console.error('删除配置失败:', error)
      toast.error('删除支付配置时发生错误，请稍后重试')
    }
  }

  const handleToggleStatus = async (config: PaymentConfigResponse) => {
    try {
      const newStatus = !config.is_enabled
      await paymentService.toggleConfigStatus(config.id, newStatus)
      
      toast.success(`支付配置"${config.name}"已${newStatus ? '启用' : '禁用'}`)
      onConfigUpdated?.()
    } catch (error) {
      console.error('更新状态失败:', error)
      toast.error('更新支付配置状态时发生错误，请稍后重试')
    }
  }

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent justify-start"
          >
            名称
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const config = row.original
        return (
          <div className="flex items-center space-x-2">
            <div>
              <div className="font-medium">{config.name}</div>
              <div className="text-sm text-muted-foreground">
                {config.method}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: 'url',
      header: () => <div className="text-center">API地址</div>,
      cell: ({ row }) => {
        const url = row.getValue('url') as string
        return (
          <div className="text-center text-sm">
            <span className="truncate max-w-[200px] inline-block" title={url}>
              {url}
            </span>
          </div>
        )
      },
    },
    {
      accessorKey: 'pid',
      header: () => <div className="text-center">商户ID</div>,
      cell: ({ row }) => {
        const pid = row.getValue('pid') as string
        return (
          <div className="text-center text-sm">
            <span className="font-mono">{pid}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'min_amount',
      header: () => <div className="text-center">金额范围</div>,
      cell: ({ row }) => {
        const config = row.original
        return (
          <div className="text-center text-sm">
            <div>{config.min_amount} - {config.max_amount}</div>
            <div className="text-muted-foreground">{config.supported_currencies}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'fixed_fee',
      header: () => <div className="text-center">费用设置</div>,
      cell: ({ row }) => {
        const config = row.original
        const hasFixedFee = config.fixed_fee > 0
        const hasPercentageFee = config.percentage_fee > 0
        
        return (
          <div className="text-center text-sm">
            {hasFixedFee && <div>固定: {config.fixed_fee}</div>}
            {hasPercentageFee && <div>百分比: {config.percentage_fee}%</div>}
            {!hasFixedFee && !hasPercentageFee && <div className="text-muted-foreground">无费用</div>}
          </div>
        )
      },
    },
    {
      accessorKey: 'is_enabled',
      header: () => <div className="text-center">状态</div>,
      cell: ({ row }) => {
        const isEnabled = row.getValue('is_enabled') as boolean
        return (
          <div className="text-center">
            <Badge variant={isEnabled ? 'default' : 'secondary'}>
              {isEnabled ? '启用' : '禁用'}
            </Badge>
          </div>
        )
      },
    },
    {
      accessorKey: 'sort_order',
      header: () => <div className="text-center">排序</div>,
      cell: ({ row }) => {
        const sortOrder = row.getValue('sort_order') as number
        return (
          <div className="text-center text-sm">
            {sortOrder}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
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
        const createdAt = row.getValue('created_at') as string
        const date = new Date(createdAt)
        return date.toLocaleString('zh-CN', { 
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const config = row.original

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
                onClick={() => navigator.clipboard.writeText(config.id.toString())}
              >
                复制配置ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onEdit?.(config)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleToggleStatus(config)}>
                {config.is_enabled ? (
                  <>
                    <PowerOff className="mr-2 h-4 w-4" />
                    禁用
                  </>
                ) : (
                  <>
                    <Power className="mr-2 h-4 w-4" />
                    启用
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(config)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}