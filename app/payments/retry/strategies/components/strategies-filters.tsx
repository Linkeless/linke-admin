'use client'

/**
 * 策略过滤器组件
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, X, RefreshCw } from 'lucide-react'

import { useStrategyManagement } from '@/hooks/use-retry-strategies'
import type { RetryStrategiesQueryParams } from '@/lib/payment-retry-types'

export function StrategiesFilters() {
  const { 
    queryParams,
    updateQueryParams, 
    refreshStrategies,
    loading 
  } = useStrategyManagement()

  const [searchTerm, setSearchTerm] = useState('')
  const [tempFilters, setTempFilters] = useState({
    enabled: queryParams.enabled,
    payment_method: queryParams.payment_method,
    error_condition: queryParams.error_condition
  })

  // 应用过滤器
  const applyFilters = () => {
    const newParams: Partial<RetryStrategiesQueryParams> = {
      offset: 0, // 重置分页
    }

    if (searchTerm.trim()) {
      // 这里应该有搜索参数，但当前API可能不支持，所以先留着接口
    }

    if (tempFilters.enabled !== undefined) {
      newParams.enabled = tempFilters.enabled
    }

    if (tempFilters.payment_method) {
      newParams.payment_method = tempFilters.payment_method
    }

    if (tempFilters.error_condition) {
      newParams.error_condition = tempFilters.error_condition
    }

    updateQueryParams(newParams)
  }

  // 重置过滤器
  const resetFilters = () => {
    setSearchTerm('')
    setTempFilters({
      enabled: undefined,
      payment_method: undefined,
      error_condition: undefined
    })
    updateQueryParams({
      enabled: undefined,
      payment_method: undefined,
      error_condition: undefined,
      offset: 0
    })
  }

  // 检查是否有活跃的过滤器
  const hasActiveFilters = searchTerm || 
    tempFilters.enabled !== undefined || 
    tempFilters.payment_method || 
    tempFilters.error_condition

  // 计算活跃过滤器数量
  const activeFilterCount = [
    searchTerm,
    tempFilters.enabled !== undefined,
    tempFilters.payment_method,
    tempFilters.error_condition
  ].filter(Boolean).length

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col space-y-4">
          {/* 搜索和主要过滤器 */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* 搜索框 */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
              <Input
                placeholder="搜索策略名称或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && applyFilters()}
              />
            </div>

            {/* 状态过滤器 */}
            <Select
              value={tempFilters.enabled === undefined ? 'all' : tempFilters.enabled.toString()}
              onValueChange={(value) => 
                setTempFilters(prev => ({
                  ...prev,
                  enabled: value === 'all' ? undefined : value === 'true'
                }))
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="true">已启用</SelectItem>
                <SelectItem value="false">已禁用</SelectItem>
              </SelectContent>
            </Select>

            {/* 支付方式过滤器 */}
            <Select
              value={tempFilters.payment_method || 'all'}
              onValueChange={(value) => 
                setTempFilters(prev => ({
                  ...prev,
                  payment_method: value === 'all' ? undefined : value
                }))
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="支付方式" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部方式</SelectItem>
                <SelectItem value="alipay">支付宝</SelectItem>
                <SelectItem value="wechat_pay">微信支付</SelectItem>
                <SelectItem value="credit_card">信用卡</SelectItem>
                <SelectItem value="bank_transfer">银行转账</SelectItem>
              </SelectContent>
            </Select>

            {/* 错误条件过滤器 */}
            <Select
              value={tempFilters.error_condition || 'all'}
              onValueChange={(value) => 
                setTempFilters(prev => ({
                  ...prev,
                  error_condition: value === 'all' ? undefined : value
                }))
              }
            >
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="错误条件" />
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
                onClick={refreshStrategies}
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
              <div className="flex items-center space-x-2">
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
                  {tempFilters.enabled !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      状态: {tempFilters.enabled ? '已启用' : '已禁用'}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => setTempFilters(prev => ({ ...prev, enabled: undefined }))}
                      />
                    </Badge>
                  )}
                  {tempFilters.payment_method && (
                    <Badge variant="outline" className="text-xs">
                      支付方式: {tempFilters.payment_method}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => setTempFilters(prev => ({ ...prev, payment_method: undefined }))}
                      />
                    </Badge>
                  )}
                  {tempFilters.error_condition && (
                    <Badge variant="outline" className="text-xs">
                      错误条件: {tempFilters.error_condition}
                      <X 
                        className="ml-1 h-3 w-3 cursor-pointer" 
                        onClick={() => setTempFilters(prev => ({ ...prev, error_condition: undefined }))}
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