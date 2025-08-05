'use client'

/**
 * 重试记录过滤器组件
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Filter, X, RefreshCw, CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import { useRetryRecordManagement } from '@/hooks/use-retry-records'
import { cn } from '@/lib/utils'

export function RecordsFilters() {
  const { 
    filters,
    loading,
    applyFiltersAndSort,
    resetAll
  } = useRetryRecordManagement()

  const [searchTerm, setSearchTerm] = useState('')
  const [tempFilters, setTempFilters] = useState({
    status: filters.filters.status,
    error_type: filters.filters.error_type,
    strategy_id: filters.filters.strategy_id,
    time_range: filters.filters.time_range
  })
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined
    to: Date | undefined
  }>({
    from: undefined,
    to: undefined
  })

  // 应用过滤器
  const applyFilters = () => {
    const newFilters = {
      ...tempFilters,
      start_date: dateRange.from?.toISOString(),
      end_date: dateRange.to?.toISOString()
    }
    
    filters.updateFilters(newFilters)
    applyFiltersAndSort()
  }

  // 重置过滤器
  const resetFilters = () => {
    setSearchTerm('')
    setTempFilters({
      status: 'all',
      error_type: 'all',
      strategy_id: 'all',
      time_range: '24h'
    })
    setDateRange({ from: undefined, to: undefined })
    resetAll()
  }

  // 检查是否有活跃的过滤器
  const hasActiveFilters = searchTerm || 
    tempFilters.status !== 'all' || 
    tempFilters.error_type !== 'all' || 
    tempFilters.strategy_id !== 'all' ||
    tempFilters.time_range !== '24h' ||
    dateRange.from || dateRange.to

  // 计算活跃过滤器数量
  const activeFilterCount = [
    searchTerm,
    tempFilters.status !== 'all',
    tempFilters.error_type !== 'all',
    tempFilters.strategy_id !== 'all',
    tempFilters.time_range !== '24h',
    dateRange.from || dateRange.to
  ].filter(Boolean).length

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* 搜索和主要过滤器 */}
          <div className="flex flex-col lg:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder="搜索支付ID、策略名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            {/* 状态过滤器 */}
            <Select
              value={tempFilters.status}
              onValueChange={(value) => 
                setTempFilters(prev => ({ ...prev, status: value as any }))
              }
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="pending">等待中</SelectItem>
                <SelectItem value="in_progress">进行中</SelectItem>
                <SelectItem value="success">成功</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="cancelled">已取消</SelectItem>
              </SelectContent>
            </Select>

            {/* 错误类型过滤器 */}
            <Select
              value={tempFilters.error_type}
              onValueChange={(value) => 
                setTempFilters(prev => ({ ...prev, error_type: value as any }))
              }
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="错误类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部错误</SelectItem>
                <SelectItem value="network_error">网络错误</SelectItem>
                <SelectItem value="timeout">超时</SelectItem>
                <SelectItem value="gateway_error">网关错误</SelectItem>
                <SelectItem value="insufficient_funds">余额不足</SelectItem>
                <SelectItem value="card_declined">卡片被拒</SelectItem>
              </SelectContent>
            </Select>

            {/* 时间范围过滤器 */}
            <Select
              value={tempFilters.time_range}
              onValueChange={(value) => 
                setTempFilters(prev => ({ ...prev, time_range: value as any }))
              }
            >
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">最近1小时</SelectItem>
                <SelectItem value="6h">最近6小时</SelectItem>
                <SelectItem value="24h">最近24小时</SelectItem>
                <SelectItem value="7d">最近7天</SelectItem>
                <SelectItem value="30d">最近30天</SelectItem>
                <SelectItem value="custom">自定义时间</SelectItem>
              </SelectContent>
            </Select>

            {/* 自定义日期选择器 */}
            {tempFilters.time_range === 'custom' && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full lg:w-60 justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "yyyy年MM月dd日", { locale: zhCN })} -{" "}
                          {format(dateRange.to, "yyyy年MM月dd日", { locale: zhCN })}
                        </>
                      ) : (
                        format(dateRange.from, "yyyy年MM月dd日", { locale: zhCN })
                      )
                    ) : (
                      <span>选择日期范围</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => 
                      setDateRange({ from: range?.from, to: range?.to })
                    }
                    numberOfMonths={2}
                    locale={zhCN}
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button 
                onClick={applyFilters}
                size="sm"
                disabled={loading}
              >
                <Filter className="mr-2 h-4 w-4" />
                应用过滤器
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>

              {hasActiveFilters && (
                <Button 
                  onClick={resetFilters}
                  size="sm"
                  variant="outline"
                >
                  <X className="mr-2 h-4 w-4" />
                  重置
                </Button>
              )}

              <Button
                onClick={applyFiltersAndSort}
                size="sm"
                variant="ghost"
                disabled={loading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </Button>
            </div>

            {/* 活跃过滤器显示 */}
            {hasActiveFilters && (
              <div className="hidden lg:flex items-center space-x-2">
                <span className="text-sm text-muted-foreground">活跃过滤器:</span>
                <div className="flex flex-wrap gap-1">
                  {searchTerm && (
                    <Badge variant="outline" className="text-xs">
                      搜索: {searchTerm}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => setSearchTerm('')}
                      />
                    </Badge>
                  )}
                  {tempFilters.status !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      状态: {tempFilters.status}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => setTempFilters(prev => ({ ...prev, status: 'all' }))}
                      />
                    </Badge>
                  )}
                  {tempFilters.error_type !== 'all' && (
                    <Badge variant="outline" className="text-xs">
                      错误: {tempFilters.error_type}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => setTempFilters(prev => ({ ...prev, error_type: 'all' }))}
                      />
                    </Badge>
                  )}
                  {tempFilters.time_range !== '24h' && (
                    <Badge variant="outline" className="text-xs">
                      时间: {tempFilters.time_range}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => setTempFilters(prev => ({ ...prev, time_range: '24h' }))}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}