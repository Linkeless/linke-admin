"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { X } from "lucide-react"

interface OrderFiltersProps {
  filters: {
    status: string
    payment_method: string
    date_from: string
    date_to: string
  }
  onFiltersChange: (filters: any) => void
}

export function OrderFilters({ filters, onFiltersChange }: OrderFiltersProps) {
  const handleFilterChange = (key: string, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({
      status: '',
      payment_method: '',
      date_from: '',
      date_to: ''
    })
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* 订单状态筛选 */}
        <div className="space-y-2">
          <Label htmlFor="status-filter">订单状态</Label>
          <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部状态</SelectItem>
              <SelectItem value="pending">待处理</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
              <SelectItem value="failed">失败</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="refunded">已退款</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 支付方式筛选 */}
        <div className="space-y-2">
          <Label htmlFor="payment-method-filter">支付方式</Label>
          <Select value={filters.payment_method} onValueChange={(value) => handleFilterChange('payment_method', value)}>
            <SelectTrigger>
              <SelectValue placeholder="选择支付方式" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全部方式</SelectItem>
              <SelectItem value="支付宝">支付宝</SelectItem>
              <SelectItem value="微信支付">微信支付</SelectItem>
              <SelectItem value="信用卡">信用卡</SelectItem>
              <SelectItem value="PayPal">PayPal</SelectItem>
              <SelectItem value="银行转账">银行转账</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 开始日期 */}
        <div className="space-y-2">
          <Label htmlFor="date-from">开始日期</Label>
          <Input
            id="date-from"
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
          />
        </div>

        {/* 结束日期 */}
        <div className="space-y-2">
          <Label htmlFor="date-to">结束日期</Label>
          <Input
            id="date-to"
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
          />
        </div>
      </div>

      {/* 清除筛选按钮 */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleClearFilters}>
            <X className="mr-2 h-4 w-4" />
            清除筛选
          </Button>
          <div className="text-sm text-muted-foreground">
            已应用 {Object.values(filters).filter(v => v).length} 个筛选条件
          </div>
        </div>
      )}
    </div>
  )
}