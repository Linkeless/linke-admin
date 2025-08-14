/**
 * 重试记录列表页面
 * 显示所有重试记录，支持筛选、排序和查看详情
 */

import { Suspense } from 'react'
import { Metadata } from 'next'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Settings, BarChart3, Download } from 'lucide-react'

import { RecordsTableSimple } from './components/records-table-simple'
import { RecordsFiltersSimple } from './components/records-filters-simple'
import { RecordsStatsSimple } from './components/records-stats-simple'
import { RecordsTableSkeleton } from './components/records-table-skeleton'

export const metadata: Metadata = {
  title: '重试记录',
  description: '查看和管理支付重试记录，监控重试状态和结果',
}

export default function RecordsPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">重试记录</h2>
          <p className="text-muted-foreground">
            查看支付重试记录，监控重试状态和分析重试结果
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/payments/retry">
              <BarChart3 className="mr-2 h-4 w-4" />
              统计分析
            </Link>
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            导出记录
          </Button>
          <Button variant="outline" asChild>
            <Link href="/payments/retry/config">
              <Settings className="mr-2 h-4 w-4" />
              重试配置
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      <div className="space-y-6">
        {/* 记录统计 */}
        <Suspense fallback={<div className="grid gap-4 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>}>
          <RecordsStatsSimple />
        </Suspense>

        {/* 过滤器 */}
        <Suspense fallback={<div className="h-20 bg-gray-100 rounded-lg animate-pulse" />}>
          <RecordsFiltersSimple />
        </Suspense>

        {/* 记录表格 */}
        <Suspense fallback={<RecordsTableSkeleton />}>
          <RecordsTableSimple />
        </Suspense>
      </div>
    </div>
  )
}