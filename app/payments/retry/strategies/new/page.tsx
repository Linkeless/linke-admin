/**
 * 创建重试策略页面
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ArrowLeft, Save } from 'lucide-react'
import { toast } from 'sonner'

import { StrategyForm } from '../../components/strategy-form'
import { useCreateRetryStrategy } from '@/hooks/mutations/use-payment-mutations'
import type { CreateRetryStrategyRequest } from '@/lib/payment-retry-types'

export default function NewStrategyPage() {
  const router = useRouter()
  const createStrategyMutation = useCreateRetryStrategy()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (data: CreateRetryStrategyRequest) => {
    setIsSubmitting(true)
    try {
      const result = await createStrategyMutation.mutateAsync(data)
      
      if (result.code === 0) {
        toast.success('策略创建成功', {
          description: `策略 "${data.name}" 已成功创建并启用`
        })
        router.push('/payments/retry/strategies')
        return { success: true }
      } else {
        toast.error('策略创建失败', {
          description: result.message || '请检查配置信息后重试'
        })
        return { success: false, error: result.message }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      toast.error('策略创建失败', {
        description: errorMessage
      })
      return { success: false, error: errorMessage }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回
          </Button>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">创建重试策略</h2>
            <p className="text-muted-foreground">
              配置新的支付重试策略，定义重试规则和适用条件
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" asChild>
            <Link href="/payments/retry/strategies">
              取消
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* 策略表单 */}
      <div className="max-w-6xl">
        <StrategyForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={isSubmitting || createStrategyMutation.isPending}
        />
      </div>

      {/* 帮助信息 */}
      <Card className="max-w-6xl">
        <CardHeader>
          <CardTitle className="text-lg">策略配置说明</CardTitle>
          <CardDescription>
            创建重试策略的一些建议和最佳实践
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2">重试间隔建议</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 网络错误: 短间隔快速重试 (30秒, 1分钟, 2分钟)</li>
                <li>• 系统错误: 中等间隔重试 (5分钟, 15分钟, 30分钟)</li>
                <li>• 余额不足: 长间隔重试 (30分钟, 2小时, 4小时)</li>
                <li>• 避免设置过于频繁的重试，以免对支付网关造成压力</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">错误条件选择</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• 选择适合重试的错误类型，如网络超时、临时故障等</li>
                <li>• 避免对永久性错误(如卡片被拒)设置重试</li>
                <li>• 可以为不同错误类型创建专门的策略</li>
                <li>• 定期评估策略效果，优化配置参数</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}