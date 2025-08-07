'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { CalendarDays, Search, Filter, X } from 'lucide-react'
import { OrderQueryParams } from '@/lib/order-types'

interface OrderFiltersProps {
  onFiltersChange: (filters: Partial<OrderQueryParams>) => void
}

export function OrderFilters({ onFiltersChange }: OrderFiltersProps) {
  const [filters, setFilters] = useState<Partial<OrderQueryParams>>({})
  const [searchText, setSearchText] = useState('')

  // 处理筛选条件变化
  const handleFilterChange = (key: keyof OrderQueryParams, value: any) => {
    const newFilters = { ...filters }
    
    if (value === 'all' || value === '' || value === undefined) {
      delete newFilters[key]
    } else {
      newFilters[key] = value
    }
    
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  // 处理搜索
  const handleSearch = () => {
    if (searchText.trim()) {
      // 判断搜索内容是否为数字（用户ID）
      const userId = parseInt(searchText.trim())
      if (!isNaN(userId)) {
        handleFilterChange('user_id', userId)
      }
    } else {
      handleFilterChange('user_id', undefined)
    }
  }

  // 重置筛选条件
  const handleReset = () => {
    setFilters({})
    setSearchText('')
    onFiltersChange({})
  }

  // 计算活动筛选条件数量
  const activeFiltersCount = Object.keys(filters).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            筛选条件
            {activeFiltersCount > 0 && (
              <Badge variant="secondary">
                {activeFiltersCount} 个筛选
              </Badge>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8"
            >
              <X className="h-4 w-4 mr-1" />
              清空筛选
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索框 */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索用户ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <Button onClick={handleSearch} size="sm">
            搜索
          </Button>
        </div>

        {/* 筛选选项 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 订单状态 */}
          <div className="space-y-2">
            <Label htmlFor="status">订单状态</Label>
            <Select
              value={filters.status || 'all'}
              onValueChange={(value) => handleFilterChange('status', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="status">
                <SelectValue placeholder="全部状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">待支付</SelectItem>
                <SelectItem value="paid">已支付</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
                <SelectItem value="refunded">已退款</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 订单类型 */}
          <div className="space-y-2">
            <Label htmlFor="order_type">订单类型</Label>
            <Select
              value={filters.order_type || 'all'}
              onValueChange={(value) => handleFilterChange('order_type', value === 'all' ? undefined : value)}
            >
              <SelectTrigger id="order_type">
                <SelectValue placeholder="全部类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="new">新订阅</SelectItem>
                <SelectItem value="renewal">续费</SelectItem>
                <SelectItem value="upgrade">升级</SelectItem>
                <SelectItem value="downgrade">降级</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 开始日期 */}
          <div className="space-y-2">
            <Label htmlFor="date_from" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              开始日期
            </Label>
            <Input
              id="date_from"
              type="date"
              value={filters.date_from || ''}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>

          {/* 结束日期 */}
          <div className="space-y-2">
            <Label htmlFor="date_to" className="flex items-center gap-1">
              <CalendarDays className="h-4 w-4" />
              结束日期
            </Label>
            <Input
              id="date_to"
              type="date"
              value={filters.date_to || ''}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>
        </div>

        {/* 快速筛选按钮 */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const todayStr = today.toISOString().split('T')[0]
              handleFilterChange('date_from', todayStr)
              handleFilterChange('date_to', todayStr)
            }}
          >
            今天
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const yesterday = new Date(today)
              yesterday.setDate(yesterday.getDate() - 1)
              const yesterdayStr = yesterday.toISOString().split('T')[0]
              handleFilterChange('date_from', yesterdayStr)
              handleFilterChange('date_to', yesterdayStr)
            }}
          >
            昨天
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const lastWeek = new Date(today)
              lastWeek.setDate(lastWeek.getDate() - 7)
              handleFilterChange('date_from', lastWeek.toISOString().split('T')[0])
              handleFilterChange('date_to', today.toISOString().split('T')[0])
            }}
          >
            最近7天
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const lastMonth = new Date(today)
              lastMonth.setDate(lastMonth.getDate() - 30)
              handleFilterChange('date_from', lastMonth.toISOString().split('T')[0])
              handleFilterChange('date_to', today.toISOString().split('T')[0])
            }}
          >
            最近30天
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const today = new Date()
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
              const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
              handleFilterChange('date_from', firstDay.toISOString().split('T')[0])
              handleFilterChange('date_to', lastDay.toISOString().split('T')[0])
            }}
          >
            本月
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}