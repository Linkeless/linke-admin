'use client'

/**
 * 重试记录表格组件
 */

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Card, CardContent } from '@/components/ui/card'
import { 
  MoreHorizontal, 
  Eye, 
  RefreshCw, 
  StopCircle,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Pause,
  ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'

import { useRetryRecordManagement } from '@/hooks/use-retry-records'
import { paymentRetryService } from '@/lib/payment-retry-service'
import type { RetryRecord, RetryStatus } from '@/lib/payment-retry-types'
import { cn } from '@/lib/utils'

// 状态徽章组件
function StatusBadge({ status }: { status: RetryStatus }) {
  const statusConfig = {
    pending: { 
      variant: 'outline' as const, 
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      icon: Clock,
      label: '等待中'
    },
    in_progress: { 
      variant: 'outline' as const, 
      color: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      icon: RefreshCw,
      label: '进行中'
    },
    success: { 
      variant: 'outline' as const, 
      color: 'text-green-600 bg-green-50 border-green-200',
      icon: CheckCircle,
      label: '成功'
    },
    failed: { 
      variant: 'outline' as const, 
      color: 'text-red-600 bg-red-50 border-red-200',
      icon: XCircle,
      label: '失败'
    },
    cancelled: { 
      variant: 'outline' as const, 
      color: 'text-gray-600 bg-gray-50 border-gray-200',
      icon: Pause,
      label: '已取消'
    }
  }

  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge variant={config.variant} className={cn('gap-1', config.color)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  )
}

// 重试进度组件
function RetryProgress({ 
  currentAttempt, 
  maxAttempts,
  status 
}: { 
  currentAttempt: number
  maxAttempts: number
  status: RetryStatus
}) {
  const progress = (currentAttempt / maxAttempts) * 100
  
  const getProgressColor = () => {
    if (status === 'success') return 'bg-green-500'
    if (status === 'failed' || status === 'cancelled') return 'bg-red-500'
    if (status === 'in_progress') return 'bg-yellow-500'
    return 'bg-blue-500'
  }

  return (
    <div className="space-y-1">
      <Progress 
        value={progress} 
        className="h-2"
        style={{
          '--progress-foreground': getProgressColor()
        } as React.CSSProperties}
      />
      <div className="text-xs text-muted-foreground">
        {currentAttempt}/{maxAttempts} 次尝试
      </div>
    </div>
  )
}

// 记录行组件
function RecordRow({ 
  record,
  onViewDetail,
  onManualRetry,
  onCancel
}: {
  record: RetryRecord
  onViewDetail: () => void
  onManualRetry: () => void
  onCancel: () => void
}) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const getNextRetryTime = () => {
    if (record.next_retry_at) {
      const nextTime = new Date(record.next_retry_at)
      const now = new Date()
      if (nextTime > now) {
        const diffMs = nextTime.getTime() - now.getTime()
        const diffMins = Math.floor(diffMs / (1000 * 60))
        if (diffMins < 60) {
          return `${diffMins}分钟后`
        } else {
          return `${Math.floor(diffMins / 60)}小时后`
        }
      }
    }
    return null
  }

  const nextRetryTime = getNextRetryTime()
  const canRetry = record.status === 'failed' || record.status === 'pending'
  const canCancel = record.status === 'pending' || record.status === 'in_progress'

  return (
    <TableRow>
      <TableCell>
        <div className="space-y-1">
          <div className="font-mono text-sm">{record.id.slice(-12)}</div>
          <div className="text-xs text-muted-foreground">
            支付ID: {record.payment_id.slice(-8)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{record.strategy_name}</div>
          <div className="text-xs text-muted-foreground">
            ID: {record.strategy_id.slice(-8)}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <StatusBadge status={record.status} />
      </TableCell>
      <TableCell>
        <div className="w-32">
          <RetryProgress 
            currentAttempt={record.attempt_number}
            maxAttempts={5} // 这里应该从策略配置获取
            status={record.status}
          />
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="text-sm">{formatTime(record.retry_at)}</div>
          {record.completed_at && (
            <div className="text-xs text-muted-foreground">
              完成: {formatTime(record.completed_at)}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {nextRetryTime ? (
          <div className="text-sm text-blue-600">{nextRetryTime}</div>
        ) : record.status === 'in_progress' ? (
          <div className="text-sm text-yellow-600">正在重试</div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>
      <TableCell>
        {record.error_message ? (
          <div className="max-w-48">
            <div className="text-sm font-medium text-red-600 truncate">
              {record.error_type}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {record.error_message}
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>
      <TableCell>
        {record.duration_ms ? (
          <div className="text-sm">
            {record.duration_ms < 1000 
              ? `${record.duration_ms}ms`
              : `${(record.duration_ms / 1000).toFixed(1)}s`
            }
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">-</div>
        )}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewDetail}>
              <Eye className="mr-2 h-4 w-4" />
              查看详情
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/payments/${record.payment_id}`}>
                <ExternalLink className="mr-2 h-4 w-4" />
                查看支付
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {canRetry && (
              <DropdownMenuItem onClick={onManualRetry}>
                <RefreshCw className="mr-2 h-4 w-4" />
                手动重试
              </DropdownMenuItem>
            )}
            {canCancel && (
              <DropdownMenuItem 
                onClick={onCancel}
                className="text-red-600 focus:text-red-600"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                取消重试
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function RecordsTable() {
  const router = useRouter()
  const { 
    records, 
    total, 
    loading, 
    error, 
    refreshRecords,
    manualRetryAndRefresh,
    cancelRetryAndRefresh
  } = useRetryRecordManagement()

  const [retryDialogOpen, setRetryDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<RetryRecord | null>(null)

  // 查看详情
  const handleViewDetail = (record: RetryRecord) => {
    router.push(`/payments/retry/records/${record.id}`)
  }

  // 手动重试
  const handleManualRetry = (record: RetryRecord) => {
    setSelectedRecord(record)
    setRetryDialogOpen(true)
  }

  const confirmManualRetry = async () => {
    if (!selectedRecord) return

    try {
      const result = await manualRetryAndRefresh({
        payment_id: selectedRecord.payment_id,
        strategy_id: selectedRecord.strategy_id,
        reason: '手动触发重试'
      })

      if (result.success) {
        toast.success('重试已启动', {
          description: `支付 ${selectedRecord.payment_id.slice(-8)} 的重试已成功启动`
        })
      } else {
        toast.error(`重试启动失败: ${result.error}`)
      }
    } catch (error) {
      toast.error('重试启动失败')
    } finally {
      setRetryDialogOpen(false)
      setSelectedRecord(null)
    }
  }

  // 取消重试
  const handleCancel = (record: RetryRecord) => {
    setSelectedRecord(record)
    setCancelDialogOpen(true)
  }

  const confirmCancel = async () => {
    if (!selectedRecord) return

    try {
      const result = await cancelRetryAndRefresh(
        selectedRecord.payment_id,
        '用户手动取消'
      )

      if (result.success) {
        toast.success('重试已取消', {
          description: `支付 ${selectedRecord.payment_id.slice(-8)} 的重试已取消`
        })
      } else {
        toast.error(`取消失败: ${result.error}`)
      }
    } catch (error) {
      toast.error('取消失败')
    } finally {
      setCancelDialogOpen(false)
      setSelectedRecord(null)
    }
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm font-medium text-red-600 mb-2">加载重试记录失败</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button onClick={refreshRecords} size="sm">
            重试
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>记录ID</TableHead>
                  <TableHead>重试策略</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>进度</TableHead>
                  <TableHead>重试时间</TableHead>
                  <TableHead>下次重试</TableHead>
                  <TableHead>错误信息</TableHead>
                  <TableHead>耗时</TableHead>
                  <TableHead className="w-12">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && records.length === 0 ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((_, j) => (
                        <TableCell key={j}>
                          <div className="h-4 bg-gray-200 rounded animate-pulse" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-64">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Clock className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-600 mb-1">暂无重试记录</p>
                        <p className="text-xs text-gray-500">当有支付重试时，记录会显示在这里</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <RecordRow
                      key={record.id}
                      record={record}
                      onViewDetail={() => handleViewDetail(record)}
                      onManualRetry={() => handleManualRetry(record)}
                      onCancel={() => handleCancel(record)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 手动重试确认对话框 */}
      <AlertDialog open={retryDialogOpen} onOpenChange={setRetryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认手动重试</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要手动重试支付 "{selectedRecord?.payment_id.slice(-8)}" 吗？
              这将立即启动一次新的重试尝试。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={confirmManualRetry}>
              确认重试
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 取消重试确认对话框 */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认取消重试</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要取消支付 "{selectedRecord?.payment_id.slice(-8)}" 的重试吗？
              取消后将不会再进行自动重试。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmCancel}
              className="bg-red-600 hover:bg-red-700"
            >
              确认取消
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}