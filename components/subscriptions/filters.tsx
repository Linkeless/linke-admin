// 订阅管理筛选器组件 - 使用shadcn/ui组件

import { useState } from 'react'
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, X } from 'lucide-react'
import { 
  CURRENCY_CONFIG, 
  type PlanFilters, 
  type SubscriptionFilters 
} from '@/lib/subscription-types'

interface PlanFiltersProps {
  filters: PlanFilters
  onFiltersChange: (filters: PlanFilters) => void
  onReset: () => void
}

interface SubscriptionFiltersProps {
  filters: SubscriptionFilters
  onFiltersChange: (filters: SubscriptionFilters) => void
  onReset: () => void
}

// 订阅计划筛选器
export function PlanFiltersCard({ filters, onFiltersChange, onReset }: PlanFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const updateFilter = (key: keyof PlanFilters, value: string) => {
    const filterValue = value === 'all' ? undefined : value
    onFiltersChange({ ...filters, [key]: filterValue })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== 0
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          筛选条件
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto">
              {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 0).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索框 */}
        <div className="space-y-2">
          <Label htmlFor="search">搜索计划</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="搜索计划名称或代码..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* 状态筛选 */}
        <div className="space-y-2">
          <Label>状态</Label>
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">激活</SelectItem>
              <SelectItem value="inactive">未激活</SelectItem>
              <SelectItem value="archived">已归档</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 货币筛选 */}
        <div className="space-y-2">
          <Label>货币</Label>
          <Select 
            value={filters.currency || 'all'} 
            onValueChange={(value) => updateFilter('currency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择货币" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部货币</SelectItem>
              {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                <SelectItem key={code} value={code}>
                  {config.symbol} {config.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 重置按钮 */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={onReset}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            重置筛选
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// 用户订阅筛选器
export function SubscriptionFiltersCard({ filters, onFiltersChange, onReset }: SubscriptionFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')
  
  const updateFilter = (key: keyof SubscriptionFilters, value: string) => {
    const filterValue = value === 'all' ? undefined : value
    onFiltersChange({ ...filters, [key]: filterValue })
  }

  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== 0
  )

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Filter className="h-4 w-4" />
          筛选条件
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-auto">
              {Object.values(filters).filter(v => v !== undefined && v !== '' && v !== 0).length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 搜索框 */}
        <div className="space-y-2">
          <Label htmlFor="search">搜索订阅</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="搜索用户邮箱或订阅ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>

        {/* 用户ID筛选 */}
        <div className="space-y-2">
          <Label htmlFor="user_id">用户ID</Label>
          <Input
            id="user_id"
            type="number"
            placeholder="输入用户ID"
            value={filters.user_id || ''}
            onChange={(e) => updateFilter('user_id', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        {/* 状态筛选 */}
        <div className="space-y-2">
          <Label>订阅状态</Label>
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => updateFilter('status', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="选择状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="active">活跃</SelectItem>
              <SelectItem value="inactive">未激活</SelectItem>
              <SelectItem value="cancelled">已取消</SelectItem>
              <SelectItem value="expired">已过期</SelectItem>
              <SelectItem value="trialing">试用中</SelectItem>
              <SelectItem value="past_due">逾期</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 计划ID筛选 */}
        <div className="space-y-2">
          <Label htmlFor="plan_id">计划ID</Label>
          <Input
            id="plan_id"
            type="number"
            placeholder="输入计划ID"
            value={filters.plan_id || ''}
            onChange={(e) => updateFilter('plan_id', e.target.value ? parseInt(e.target.value) : undefined)}
          />
        </div>

        {/* 重置按钮 */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={onReset}
            className="w-full"
          >
            <X className="mr-2 h-4 w-4" />
            重置筛选
          </Button>
        )}
      </CardContent>
    </Card>
  )
}