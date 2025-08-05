/**
 * 重试策略列表页面
 * 显示所有重试策略，支持筛选、排序和批量操作
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Plus, Settings } from 'lucide-react'

import { StrategiesTable } from './components/strategies-table'
import { StrategiesFilters } from './components/strategies-filters'
import { StrategiesStats } from './components/strategies-stats'
import { StrategiesTableSkeleton } from './components/strategies-table-skeleton'

export const metadata: Metadata = {
  title: '重试策略管理',
  description: '管理支付重试策略，配置重试规则和参数',
}

export default function StrategiesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">重试策略</h2>
          <p className="text-muted-foreground">
            管理支付重试策略，配置不同场景下的重试规则
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/payments/retry/config">
              <Settings className="mr-2 h-4 w-4" />
              全局配置
            </Link>
          </Button>
          <Button asChild>
            <Link href="/payments/retry/strategies/new">
              <Plus className="mr-2 h-4 w-4" />
              创建策略
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        {/* 策略统计 */}
        <Suspense fallback={<div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>}>
          <StrategiesStats />
        </Suspense>

        {/* 过滤器 */}
        <Suspense fallback={<div className="h-16 bg-gray-100 rounded-lg animate-pulse" />}>
          <StrategiesFilters />
        </Suspense>

        {/* 策略表格 */}
        <Suspense fallback={<StrategiesTableSkeleton />}>
          <StrategiesTable />
        </Suspense>
      </div>
    </div>
  )
}