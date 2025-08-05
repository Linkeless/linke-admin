'use client'

/**
 * 重试策略表单组件
 * 用于创建和编辑重试策略
 */

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Plus, Minus, Clock, AlertTriangle, Info } from 'lucide-react'

import { useStrategyOptions } from '@/hooks/use-retry-strategies'
import { paymentRetryService } from '@/lib/payment-retry-service'
import type { RetryStrategy, CreateRetryStrategyRequest, UpdateRetryStrategyRequest } from '@/lib/payment-retry-types'
import { cn } from '@/lib/utils'

// 表单验证模式
const strategyFormSchema = z.object({
  name: z.string().min(1, '策略名称不能为空').max(100, '策略名称不能超过100个字符'),
  description: z.string().max(500, '描述不能超过500个字符').optional(),
  enabled: z.boolean().default(true),
  max_attempts: z.number().min(1, '最大重试次数不能少于1').max(10, '最大重试次数不能超过10'),
  retry_intervals: z.array(z.number().min(10, '重试间隔不能少于10秒').max(86400, '重试间隔不能超过24小时')).min(1, '至少需要一个重试间隔'),
  payment_methods: z.array(z.string()).min(1, '至少需要选择一种支付方式'),
  error_conditions: z.array(z.string()).min(1, '至少需要选择一种错误条件')
})

type StrategyFormData = z.infer<typeof strategyFormSchema>

interface StrategyFormProps {
  strategy?: RetryStrategy
  onSubmit: (data: CreateRetryStrategyRequest | UpdateRetryStrategyRequest) => Promise<{ success: boolean; error?: string }>
  onCancel?: () => void
  loading?: boolean
}

export function StrategyForm({ strategy, onSubmit, onCancel, loading }: StrategyFormProps) {
  const { 
    errorConditions, 
    paymentMethods, 
    loading: optionsLoading,
    getRetryIntervalPresets,
    formatRetryInterval 
  } = useStrategyOptions()

  const [selectedPreset, setSelectedPreset] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  const presets = getRetryIntervalPresets()

  const form = useForm<StrategyFormData>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues: {
      name: strategy?.name || '',
      description: strategy?.description || '',
      enabled: strategy?.enabled ?? true,
      max_attempts: strategy?.max_attempts || 3,
      retry_intervals: strategy?.retry_intervals || [300, 900, 1800], // 默认5分钟、15分钟、30分钟
      payment_methods: strategy?.payment_methods || [],
      error_conditions: strategy?.error_conditions || []
    }
  })

  const { fields: intervalFields, append: appendInterval, remove: removeInterval, replace: replaceIntervals } = useFieldArray({
    control: form.control,
    name: 'retry_intervals'
  })

  // 预设策略选择处理
  const handlePresetChange = (presetName: string) => {
    setSelectedPreset(presetName)
    const preset = presets.find(p => p.name === presetName)
    if (preset && preset.intervals.length > 0) {
      replaceIntervals(preset.intervals)
      form.setValue('max_attempts', preset.intervals.length)
    }
  }

  // 添加重试间隔
  const handleAddInterval = () => {
    if (intervalFields.length < 10) {
      appendInterval(300) // 默认5分钟
    }
  }

  // 删除重试间隔
  const handleRemoveInterval = (index: number) => {
    if (intervalFields.length > 1) {
      removeInterval(index)
    }
  }

  // 表单提交处理
  const handleSubmit = async (data: StrategyFormData) => {
    setValidationErrors([])

    // 额外验证
    const errors = paymentRetryService.validateRetryStrategy(data)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    // 调用外部提交处理
    const result = await onSubmit(data)
    if (!result.success && result.error) {
      setValidationErrors([result.error])
    }
  }

  // 计算预估总时间
  const calculateTotalTime = (intervals: number[]) => {
    const totalSeconds = intervals.reduce((sum, interval) => sum + interval, 0)
    if (totalSeconds < 3600) {
      return `约 ${Math.round(totalSeconds / 60)} 分钟`
    } else if (totalSeconds < 86400) {
      return `约 ${Math.round(totalSeconds / 3600)} 小时`
    } else {
      return `约 ${Math.round(totalSeconds / 86400)} 天`
    }
  }

  if (optionsLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="animate-pulse space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* 验证错误显示 */}
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>配置策略的基本属性</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>策略名称</FormLabel>
                    <FormControl>
                      <Input placeholder="输入策略名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>策略描述</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="描述策略的用途和特点"
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>启用策略</FormLabel>
                      <FormDescription>
                        是否立即启用此重试策略
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* 重试配置 */}
          <Card>
            <CardHeader>
              <CardTitle>重试配置</CardTitle>
              <CardDescription>设置重试次数和间隔时间</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="max_attempts"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最大重试次数</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                      />
                    </FormControl>
                    <FormDescription>
                      支付失败后的最大重试次数 (1-10次)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 预设策略选择 */}
              <div className="space-y-2">
                <FormLabel>重试间隔预设</FormLabel>
                <Select value={selectedPreset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择预设策略或自定义" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        <div>
                          <div className="font-medium">{preset.name}</div>
                          <div className="text-xs text-gray-500">{preset.description}</div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 重试间隔配置 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>重试间隔 (秒)</FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddInterval}
                    disabled={intervalFields.length >= 10}
                  >
                    <Plus className="mr-1 h-3 w-3" />
                    添加
                  </Button>
                </div>

                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {intervalFields.map((field, index) => (
                    <div key={field.id} className="flex items-center space-x-2">
                      <div className="flex-1">
                        <FormField
                          control={form.control}
                          name={`retry_intervals.${index}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type="number"
                                  min={10}
                                  max={86400}
                                  placeholder="间隔秒数"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 10)}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="text-sm text-gray-500 min-w-[80px]">
                        {formatRetryInterval(form.watch(`retry_intervals.${index}`) || 0)}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveInterval(index)}
                        disabled={intervalFields.length <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* 总时间预估 */}
                <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 p-2 rounded">
                  <Clock className="h-4 w-4" />
                  <span>
                    预估总重试时间: {calculateTotalTime(form.watch('retry_intervals') || [])}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 适用条件 */}
        <Card>
          <CardHeader>
            <CardTitle>适用条件</CardTitle>
            <CardDescription>选择此策略适用的支付方式和错误条件</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 支付方式选择 */}
            <FormField
              control={form.control}
              name="payment_methods"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">支付方式</FormLabel>
                    <FormDescription>
                      选择此策略适用的支付方式
                    </FormDescription>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {paymentMethods.map((method) => (
                      <FormField
                        key={method.value}
                        control={form.control}
                        name="payment_methods"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={method.value}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(method.value)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, method.value])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== method.value
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal">
                                {method.label}
                                {!method.enabled && (
                                  <Badge variant="secondary" className="ml-2 text-xs">
                                    已禁用
                                  </Badge>
                                )}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Separator />

            {/* 错误条件选择 */}
            <FormField
              control={form.control}
              name="error_conditions"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">错误条件</FormLabel>
                    <FormDescription>
                      选择触发此策略的错误类型
                    </FormDescription>
                  </div>
                  <ScrollArea className="h-48 border rounded-md p-3">
                    <div className="space-y-3">
                      {errorConditions.map((condition) => (
                        <FormField
                          key={condition.value}
                          control={form.control}
                          name="error_conditions"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={condition.value}
                                className="flex flex-row items-start space-x-3 space-y-0"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(condition.value)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, condition.value])
                                        : field.onChange(
                                            field.value?.filter(
                                              (value) => value !== condition.value
                                            )
                                          )
                                    }}
                                  />
                                </FormControl>
                                <div className="grid gap-1.5 leading-none">
                                  <FormLabel className="text-sm font-medium">
                                    {condition.label}
                                  </FormLabel>
                                  <p className="text-xs text-muted-foreground">
                                    {condition.description}
                                  </p>
                                </div>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                  </ScrollArea>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* 策略预览 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="mr-2 h-4 w-4" />
              策略预览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">重试序列</h4>
                <div className="space-y-1">
                  {form.watch('retry_intervals')?.map((interval, index) => (
                    <div key={index} className="flex justify-between">
                      <span>第 {index + 1} 次重试:</span>
                      <span>{formatRetryInterval(interval)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">策略摘要</h4>
                <div className="space-y-1">
                  <div>最大尝试: {form.watch('max_attempts')} 次</div>
                  <div>支付方式: {form.watch('payment_methods')?.length || 0} 种</div>
                  <div>错误条件: {form.watch('error_conditions')?.length || 0} 种</div>
                  <div>状态: {form.watch('enabled') ? '启用' : '禁用'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : strategy ? '更新策略' : '创建策略'}
          </Button>
        </div>
      </form>
    </Form>
  )
}