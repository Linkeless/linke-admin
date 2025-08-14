'use client'

import { useState } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Search, Filter, X } from 'lucide-react'
import { orderService } from '@/lib/order-service'

interface OrderFilters {
  status: string
  order_type: string
  payment_method: string
  payment_gateway: string
  search: string
  start_date: string
  end_date: string
}

interface OrderFiltersProps {
  onFiltersChange: (filters: OrderFilters) => void
  isLoading?: boolean
  hasError?: boolean
}

export function OrderFilters({ onFiltersChange, isLoading = false, hasError = false }: OrderFiltersProps) {
  const [filters, setFilters] = useState({
    status: 'all',
    order_type: 'all',
    payment_method: 'all',
    payment_gateway: 'all',
    search: '',
    start_date: '',
    end_date: '',
  })

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleReset = () => {
    const resetFilters = {
      status: 'all',
      order_type: 'all',
      payment_method: 'all',
      payment_gateway: 'all',
      search: '',
      start_date: '',
      end_date: '',
    }
    setFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const activeFiltersCount = Object.values(filters).filter(value => value !== '' && value !== 'all').length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          筛选条件
          {activeFiltersCount > 0 && (
            <Badge variant="secondary">
              {activeFiltersCount} 个筛选条件
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索框 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索订单号、交易ID、用户邮箱..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          {activeFiltersCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleReset}>
              <X className="h-4 w-4 mr-1" />
              清空
            </Button>
          )}
        </div>

        {/* 筛选选项 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 订单状态 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">订单状态</label>
            <Select 
              value={filters.status} 
              onValueChange={(value) => handleFilterChange('status', value)}
              disabled={isLoading || hasError}
            >
              <SelectTrigger>
                <SelectValue placeholder={hasError ? "数据加载失败" : isLoading ? "加载中..." : "全部状态"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                {!hasError && orderService.getOrderStatuses().map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 订单类型 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">订单类型</label>
            <Select 
              value={filters.order_type} 
              onValueChange={(value) => handleFilterChange('order_type', value)}
              disabled={isLoading || hasError}
            >
              <SelectTrigger>
                <SelectValue placeholder={hasError ? "数据加载失败" : isLoading ? "加载中..." : "全部类型"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                {!hasError && orderService.getOrderTypes().map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 支付方式 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">支付方式</label>
            <Select 
              value={filters.payment_method} 
              onValueChange={(value) => handleFilterChange('payment_method', value)}
              disabled={isLoading || hasError}
            >
              <SelectTrigger>
                <SelectValue placeholder={hasError ? "数据加载失败" : isLoading ? "加载中..." : "全部方式"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部方式</SelectItem>
                {!hasError && orderService.getPaymentMethods().map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 支付网关 */}
          <div className="space-y-2">
            <label className="text-sm font-medium">支付网关</label>
            <Select 
              value={filters.payment_gateway} 
              onValueChange={(value) => handleFilterChange('payment_gateway', value)}
              disabled={isLoading || hasError}
            >
              <SelectTrigger>
                <SelectValue placeholder={hasError ? "数据加载失败" : isLoading ? "加载中..." : "全部网关"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部网关</SelectItem>
                {!hasError && orderService.getPaymentGateways().map((gateway) => (
                  <SelectItem key={gateway.value} value={gateway.value}>
                    {gateway.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 日期范围 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              开始日期
            </label>
            <Input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              结束日期
            </label>
            <Input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}