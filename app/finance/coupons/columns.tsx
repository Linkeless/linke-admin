'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Ticket, Copy, ChevronsUpDown, Edit } from "lucide-react"

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
import { CouponResponse } from "@/lib/coupon-types"
import { couponService } from "@/lib/coupon-service"

interface ColumnsProps {
  onCouponUpdated: () => void
  onEdit: (coupon: CouponResponse) => void
}

export const createColumns = ({ onCouponUpdated, onEdit }: ColumnsProps): ColumnDef<CouponResponse>[] => [
  {
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          优惠码
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const coupon = row.original
      return (
        <div className="flex items-center gap-2">
          <Ticket className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium font-mono">{coupon.code}</span>
            <span className="text-sm text-muted-foreground">
              {coupon.name}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "type",
    header: () => <div className="text-center">类型</div>,
    cell: ({ row }) => {
      const coupon = row.original
      const typeInfo = couponService.getTypeInfo(coupon.type)
      
      return (
        <div className="text-center">
          <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
            {typeInfo.label}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "value",
    header: () => <div className="text-right">折扣值</div>,
    cell: ({ row }) => {
      const coupon = row.original
      return (
        <div className="text-right font-medium">
          {couponService.formatDiscountValue(coupon.type, coupon.value, coupon.currency)}
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">状态</div>,
    cell: ({ row }) => {
      const coupon = row.original
      const actualStatus = couponService.getCouponStatus(coupon)
      const statusInfo = couponService.getStatusInfo(actualStatus)
      
      return (
        <div className="text-center">
          <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "used_count",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          使用次数
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const coupon = row.original
      return (
        <div className="text-sm">
          <span className="font-medium">
            {couponService.formatUsageCount(coupon.used_count, coupon.max_uses)}
          </span>
          {coupon.max_uses > 0 && (
            <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all" 
                style={{ width: `${Math.min((coupon.used_count / coupon.max_uses) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "max_uses_per_user",
    header: "用户限制",
    cell: ({ row }) => {
      const coupon = row.original
      return (
        <Badge variant="outline" className="text-xs">
          {coupon.max_uses_per_user === 0 ? '无限制' : `${coupon.max_uses_per_user}次/用户`}
        </Badge>
      )
    },
  },
  {
    accessorKey: "valid_from",
    header: "有效期",
    cell: ({ row }) => {
      const coupon = row.original
      const now = new Date()
      const startDate = coupon.valid_from ? new Date(coupon.valid_from) : null
      const endDate = coupon.valid_until ? new Date(coupon.valid_until) : null
      
      return (
        <div className="text-sm">
          {startDate && (
            <div className={startDate > now ? 'text-orange-600' : 'text-muted-foreground'}>
              从: {couponService.formatDateTime(coupon.valid_from!)}
            </div>
          )}
          {endDate && (
            <div className={endDate < now ? 'text-red-600' : 'text-muted-foreground'}>
              到: {couponService.formatDateTime(coupon.valid_until!)}
            </div>
          )}
          {!startDate && !endDate && (
            <span className="text-muted-foreground">永久有效</span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: "min_order_amount",
    header: "使用条件",
    cell: ({ row }) => {
      const coupon = row.original
      const conditions = []
      
      if (coupon.min_order_amount && coupon.min_order_amount > 0) {
        conditions.push(`最低¥${coupon.min_order_amount}`)
      }
      
      if (!coupon.is_public) {
        conditions.push('私有')
      }
      
      if (coupon.applicable_plans) {
        conditions.push('限定套餐')
      }
      
      return (
        <div className="flex flex-wrap gap-1">
          {conditions.length > 0 ? (
            conditions.slice(0, 2).map((condition, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {condition}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-muted-foreground">无限制</span>
          )}
          {conditions.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{conditions.length - 2}
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
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          创建时间
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const coupon = row.original
      return (
        <span className="text-sm text-muted-foreground">
          {couponService.formatDateTime(coupon.created_at)}
        </span>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const coupon = row.original
      
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
              onClick={() => navigator.clipboard.writeText(coupon.code)}
            >
              <Copy className="mr-2 h-4 w-4" />
              复制优惠码
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(coupon.id.toString())}
            >
              复制ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onEdit(coupon)}>
              <Edit className="mr-2 h-4 w-4" />
              编辑优惠码
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleToggleStatus(coupon)}
            >
              {coupon.status === 'active' ? '停用' : '启用'}优惠码
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(coupon)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除优惠码
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      
      function handleDelete(coupon: CouponResponse) {
        if (confirm('确定要删除这个优惠码吗？此操作不可撤销。')) {
          couponService.deleteCoupon(coupon.id)
            .then(() => onCouponUpdated())
            .catch((error) => {
              console.error('删除优惠码失败:', error)
              alert('删除优惠码失败，请重试')
            })
        }
      }

      function handleToggleStatus(coupon: CouponResponse) {
        const newStatus = coupon.status === 'active' ? 'inactive' : 'active'
        couponService.toggleCouponStatus(coupon.id, newStatus)
          .then(() => onCouponUpdated())
          .catch((error) => {
            console.error('切换优惠码状态失败:', error)
            alert('切换优惠码状态失败，请重试')
          })
      }
    },
  },
]