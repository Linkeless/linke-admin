'use client'

/**
 * 策略列表表格组件
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
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
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
  Edit, 
  Trash2, 
  Eye, 
  BarChart3,
  Clock,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react'
import { toast } from 'sonner'

import { useStrategyManagement } from '@/hooks/use-retry-strategies'
import { paymentRetryService } from '@/lib/payment-retry-service'
import type { RetryStrategy, RetryStrategyTableRow } from '@/lib/payment-retry-types'
import { cn } from '@/lib/utils'

// 表格头部选择器组件
function TableHeader({ 
  strategies, 
  selectedIds, 
  onSelectAll, 
  onBatchAction 
}: {
  strategies: RetryStrategy[]
  selectedIds: string[]
  onSelectAll: (checked: boolean) => void
  onBatchAction: (action: string) => void
}) {
  const isAllSelected = strategies.length > 0 && selectedIds.length === strategies.length
  const isIndeterminate = selectedIds.length > 0 && selectedIds.length < strategies.length

  return (
    <div className="flex items-center justify-between py-4">
      <div className="flex items-center space-x-4">
        <Checkbox
          checked={isAllSelected}
          onCheckedChange={onSelectAll}
          ref={(ref) => {
            if (ref) {
              ref.indeterminate = isIndeterminate
            }
          }}
        />
        <span className="text-sm text-muted-foreground">
          {selectedIds.length > 0
            ? `已选择 ${selectedIds.length} 个策略`
            : `共 ${strategies.length} 个策略`}
        </span>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center space-x-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBatchAction('enable')}
          >
            <Play className="mr-2 h-4 w-4" />
            批量启用
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onBatchAction('disable')}
          >
            <Pause className="mr-2 h-4 w-4" />
            批量禁用
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onBatchAction('delete')}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            批量删除
          </Button>
        </div>
      )}
    </div>
  )
}

// 策略行组件
function StrategyRow({ 
  strategy, 
  isSelected, 
  onSelect, 
  onToggleStatus, 
  onEdit, 
  onDelete, 
  onViewPerformance 
}: {
  strategy: RetryStrategyTableRow
  isSelected: boolean
  onSelect: (checked: boolean) => void
  onToggleStatus: (enabled: boolean) => void
  onEdit: () => void
  onDelete: () => void
  onViewPerformance: () => void
}) {
  const getStatusBadge = () => {
    if (strategy.enabled) {
      return <Badge variant="default" className="bg-green-100 text-green-800">启用</Badge>
    } else {
      return <Badge variant="secondary">禁用</Badge>
    }
  }

  const formatRetryIntervals = (intervals: number[]) => {
    return intervals.map(seconds => paymentRetryService.formatRetryInterval(seconds)).join(', ')
  }

  const getPerformanceScore = () => {
    const score = strategy.performance_score || 0
    if (score >= 80) return { color: 'text-green-600', label: '优秀' }
    if (score >= 60) return { color: 'text-blue-600', label: '良好' }
    if (score >= 40) return { color: 'text-yellow-600', label: '一般' } 
    return { color: 'text-red-600', label: '较差' }
  }

  const performance = getPerformanceScore()

  return (
    <TableRow className={cn(isSelected && "bg-muted/50")}>
      <TableCell>
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
        />
      </TableCell>
      <TableCell>
        <div className="space-y-1">
          <div className="font-medium">{strategy.name}</div>
          {strategy.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {strategy.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        {getStatusBadge()}
      </TableCell>
      <TableCell className="text-center">
        {strategy.max_attempts}
      </TableCell>
      <TableCell>
        <div className="text-sm">
          {formatRetryIntervals(strategy.retry_intervals)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-wrap gap-1">
          {strategy.payment_methods.slice(0, 2).map(method => (
            <Badge key={method} variant="outline" className="text-xs">
              {method}
            </Badge>
          ))}
          {strategy.payment_methods.length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{strategy.payment_methods.length - 2}
            </Badge>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className={cn("text-sm font-medium", performance.color)}>
          {strategy.performance_score ? `${strategy.performance_score}分` : '-'}
        </div>
        <div className="text-xs text-muted-foreground">
          {performance.label}
        </div>
      </TableCell>
      <TableCell>
        <div className="text-sm text-muted-foreground">
          {strategy.last_used_at 
            ? new Date(strategy.last_used_at).toLocaleDateString()
            : '未使用'
          }
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center space-x-2">
          <Switch
            checked={strategy.enabled}
            onCheckedChange={onToggleStatus}
            size="sm"
          />
        </div>
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewPerformance}>
              <BarChart3 className="mr-2 h-4 w-4" />
              查看性能
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onEdit}>
              <Edit className="mr-2 h-4 w-4" />
              编辑策略
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onDelete}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除策略
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

export function StrategiesTable() {
  const router = useRouter()
  const { 
    strategies, 
    total, 
    loading, 
    error, 
    refreshStrategies,
    batchOperationAndRefresh 
  } = useStrategyManagement()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [strategyToDelete, setStrategyToDelete] = useState<RetryStrategy | null>(null)

  // 选择处理
  const handleSelectAll = (checked: boolean) => {
    setSelectedIds(checked ? strategies.map(s => s.id) : [])
  }

  const handleSelect = (strategyId: string, checked: boolean) => {
    setSelectedIds(prev => 
      checked 
        ? [...prev, strategyId]
        : prev.filter(id => id !== strategyId)
    )
  }

  // 批量操作
  const handleBatchAction = async (action: string) => {
    if (selectedIds.length === 0) return

    try {
      const result = await batchOperationAndRefresh({
        action: action as 'enable' | 'disable' | 'delete',
        ids: selectedIds
      })

      if (result.success) {
        toast.success(`批量${action === 'enable' ? '启用' : action === 'disable' ? '禁用' : '删除'}成功`)
        setSelectedIds([])
      } else {
        toast.error(`批量操作失败: ${result.error}`)
      }
    } catch (error) {
      toast.error('批量操作失败')
    }
  }

  // 切换策略状态
  const handleToggleStatus = async (strategy: RetryStrategy, enabled: boolean) => {
    try {
      const result = await batchOperationAndRefresh({
        action: enabled ? 'enable' : 'disable',
        ids: [strategy.id]
      })

      if (result.success) {
        toast.success(`策略${enabled ? '启用' : '禁用'}成功`)
      } else {
        toast.error(`操作失败: ${result.error}`)
      }
    } catch (error) {
      toast.error('操作失败')
    }
  }

  // 删除策略
  const handleDelete = async (strategy: RetryStrategy) => {
    setStrategyToDelete(strategy)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!strategyToDelete) return

    try {
      const result = await batchOperationAndRefresh({
        action: 'delete',
        ids: [strategyToDelete.id]
      })

      if (result.success) {
        toast.success('策略删除成功')
      } else {
        toast.error(`删除失败: ${result.error}`)
      }
    } catch (error) {
      toast.error('删除失败')
    } finally {
      setDeleteDialogOpen(false)
      setStrategyToDelete(null)
    }
  }

  // 编辑策略
  const handleEdit = (strategy: RetryStrategy) => {
    router.push(`/payments/retry/strategies/${strategy.id}/edit`)
  }

  // 查看性能
  const handleViewPerformance = (strategy: RetryStrategy) => {
    router.push(`/payments/retry/strategies/${strategy.id}`)
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center h-64">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm font-medium text-red-600 mb-2">加载策略列表失败</p>
          <p className="text-xs text-muted-foreground mb-4">{error}</p>
          <Button onClick={refreshStrategies} size="sm">
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
          <TableHeader
            strategies={strategies}
            selectedIds={selectedIds}
            onSelectAll={handleSelectAll}
            onBatchAction={handleBatchAction}
          />

          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <span className="sr-only">选择</span>
                  </TableHead>
                  <TableHead>策略名称</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-center">最大重试</TableHead>
                  <TableHead>重试间隔</TableHead>
                  <TableHead>支付方式</TableHead>
                  <TableHead>性能评分</TableHead>
                  <TableHead>最后使用</TableHead>
                  <TableHead>启用状态</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">操作</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && strategies.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : strategies.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="h-64">
                      <div className="flex flex-col items-center justify-center text-center">
                        <Clock className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-sm font-medium text-gray-600 mb-1">暂无重试策略</p>
                        <p className="text-xs text-gray-500 mb-4">创建您的第一个重试策略来开始管理支付重试</p>
                        <Button asChild size="sm">
                          <Link href="/payments/retry/strategies/new">
                            <Plus className="mr-2 h-4 w-4" />
                            创建策略
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  strategies.map((strategy) => (
                    <StrategyRow
                      key={strategy.id}
                      strategy={{
                        ...strategy,
                        performance_score: Math.floor(Math.random() * 100), // 模拟性能评分
                        last_used_at: new Date().toISOString() // 模拟最后使用时间
                      }}
                      isSelected={selectedIds.includes(strategy.id)}
                      onSelect={(checked) => handleSelect(strategy.id, checked)}
                      onToggleStatus={(enabled) => handleToggleStatus(strategy, enabled)}
                      onEdit={() => handleEdit(strategy)}
                      onDelete={() => handleDelete(strategy)}
                      onViewPerformance={() => handleViewPerformance(strategy)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除策略</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除策略 "{strategyToDelete?.name}" 吗？此操作不可撤销，
              正在使用此策略的支付将切换到默认策略。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}