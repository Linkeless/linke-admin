'use client'

/**
 * 重试记录表格组件 - 简化版本
 * 注意：这是一个简化版本，完整功能需要进一步开发
 */

import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable } from '@/components/ui/data-table'
import { Info, RefreshCw, Clock, CheckCircle, XCircle, AlertCircle, MinusCircle } from 'lucide-react'
import { usePaymentRetryRecords } from '@/hooks/queries/use-payments'
import { RetryRecord, RetryStatus } from '@/lib/payment-retry-types'
import { ColumnDef } from '@tanstack/react-table'

// 重试状态配置
const getStatusConfig = (status: RetryStatus) => {
  switch (status) {
    case RetryStatus.PENDING:
      return {
        label: '等待中',
        icon: Clock,
        variant: 'secondary' as const,
        className: 'bg-blue-100 text-blue-800 hover:bg-blue-100'
      }
    case RetryStatus.IN_PROGRESS:
      return {
        label: '进行中',
        icon: AlertCircle,
        variant: 'default' as const,
        className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
      }
    case RetryStatus.SUCCESS:
      return {
        label: '成功',
        icon: CheckCircle,
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 hover:bg-green-100'
      }
    case RetryStatus.FAILED:
      return {
        label: '失败',
        icon: XCircle,
        variant: 'destructive' as const,
        className: 'bg-red-100 text-red-800 hover:bg-red-100'
      }
    case RetryStatus.CANCELLED:
      return {
        label: '取消',
        icon: MinusCircle,
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      }
    default:
      return {
        label: '未知',
        icon: AlertCircle,
        variant: 'secondary' as const,
        className: 'bg-gray-100 text-gray-800 hover:bg-gray-100'
      }
  }
}

// 列定义
const columns: ColumnDef<RetryRecord>[] = [
  {
    accessorKey: 'payment_id',
    header: '支付ID',
    cell: ({ row }) => (
      <div className="font-mono text-xs">
        {row.getValue('payment_id')}
      </div>
    )
  },
  {
    accessorKey: 'strategy_name',
    header: '策略',
    cell: ({ row }) => (
      <div className="font-medium">
        {row.getValue('strategy_name')}
      </div>
    )
  },
  {
    accessorKey: 'attempt_number',
    header: '尝试次数',
    cell: ({ row }) => (
      <Badge variant="outline">
        第 {row.getValue('attempt_number')} 次
      </Badge>
    )
  },
  {
    accessorKey: 'status',
    header: '状态',
    cell: ({ row }) => {
      const status = row.getValue('status') as RetryStatus
      const config = getStatusConfig(status)
      const IconComponent = config.icon
      
      return (
        <Badge variant={config.variant} className={config.className}>
          <IconComponent className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'error_type',
    header: '错误类型',
    cell: ({ row }) => {
      const errorType = row.getValue('error_type') as string
      return (
        <Badge variant="outline">
          {errorType}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'retry_at',
    header: '重试时间',
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {new Date(row.getValue('retry_at')).toLocaleString()}
      </div>
    )
  },
  {
    accessorKey: 'duration_ms',
    header: '耗时',
    cell: ({ row }) => {
      const duration = row.getValue('duration_ms') as number
      return duration ? (
        <div className="text-sm">
          {duration}ms
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">-</div>
      )
    }
  }
]

export function RecordsTableSimple() {
  const { 
    data: recordsResponse, 
    isLoading, 
    error, 
    refetch 
  } = usePaymentRetryRecords({
    enabled: true
  })

  const records = recordsResponse?.data?.items || []
  const total = recordsResponse?.data?.total || 0

  return (
    <Card>
      <CardContent className="pt-6">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            重试记录表格已实现基本功能，支持搜索和数据显示
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            {isLoading ? '加载中...' : `共 ${total} 条记录`}
          </div>
          <Button 
            onClick={() => refetch()} 
            size="sm" 
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-sm text-red-600 mb-2">加载失败</p>
            <p className="text-xs text-muted-foreground mb-4">
              {error instanceof Error ? error.message : '获取重试记录失败'}
            </p>
            <Button onClick={() => refetch()} size="sm" variant="outline">
              重试
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
              columns={columns}
              data={records}
              searchKey="payment_id"
              searchPlaceholder="搜索支付ID..."
            />
            
            {records.length === 0 && !isLoading && (
              <div className="text-center py-12">
                <p className="text-sm text-muted-foreground">暂无重试记录</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}