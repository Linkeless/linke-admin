/**
 * 重试配置表单组件
 */

'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Save, AlertTriangle, Info } from 'lucide-react'
import { toast } from 'sonner'

import { useRetryConfigManagement } from '@/hooks/use-retry-config'

const configSchema = z.object({
  maxRetries: z.number().min(1).max(10),
  initialDelay: z.number().min(100).max(30000),
  maxDelay: z.number().min(1000).max(300000),
  backoffMultiplier: z.number().min(1.1).max(5.0),
  jitterEnabled: z.boolean(),
  timeoutThreshold: z.number().min(5000).max(120000),
  enableCircuitBreaker: z.boolean(),
  circuitBreakerThreshold: z.number().min(5).max(100),
  circuitBreakerWindow: z.number().min(60).max(3600),
  enableDeadLetter: z.boolean(),
  deadLetterThreshold: z.number().min(3).max(50),
  enableMetrics: z.boolean(),
  metricsRetentionDays: z.number().min(1).max(90),
})

type ConfigFormData = z.infer<typeof configSchema>

export function ConfigForm() {
  const { config, loading, updateConfig } = useRetryConfigManagement()
  const [isSaving, setIsSaving] = useState(false)

  const form = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      maxRetries: config?.maxRetries || 3,
      initialDelay: config?.initialDelay || 1000,
      maxDelay: config?.maxDelay || 60000,
      backoffMultiplier: config?.backoffMultiplier || 2.0,
      jitterEnabled: config?.jitterEnabled || true,
      timeoutThreshold: config?.timeoutThreshold || 30000,
      enableCircuitBreaker: config?.enableCircuitBreaker || true,
      circuitBreakerThreshold: config?.circuitBreakerThreshold || 10,
      circuitBreakerWindow: config?.circuitBreakerWindow || 300,
      enableDeadLetter: config?.enableDeadLetter || true,
      deadLetterThreshold: config?.deadLetterThreshold || 5,
      enableMetrics: config?.enableMetrics || true,
      metricsRetentionDays: config?.metricsRetentionDays || 30,
    },
  })

  const handleSubmit = async (data: ConfigFormData) => {
    setIsSaving(true)
    try {
      const result = await updateConfig(data)
      if (result.success) {
        toast.success('配置更新成功', {
          description: '重试配置已保存并生效'
        })
      } else {
        toast.error('配置更新失败', {
          description: result.error || '保存配置时发生错误'
        })
      }
    } catch (error) {
      toast.error('配置更新失败', {
        description: '请检查网络连接后重试'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFormAction = async (formData: FormData) => {
    // Trigger form validation and submission using react-hook-form
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await handleSubmit(values)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            <div className="h-10 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <Form {...form}>
      <form action={handleFormAction} className="space-y-6">
        {/* 基础重试设置 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">基础重试设置</h3>
            <Badge variant="secondary">核心参数</Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="maxRetries"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大重试次数</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={10} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    单次支付最多重试次数 (1-10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="initialDelay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>初始延迟 (毫秒)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={100} 
                      max={30000} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    首次重试前的等待时间 (100-30000ms)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxDelay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最大延迟 (毫秒)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1000} 
                      max={300000} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    重试间隔的最大限制 (1-300秒)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="backoffMultiplier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>退避倍数</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.1"
                      min={1.1} 
                      max={5.0} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    每次重试延迟的增长倍数 (1.1-5.0)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="jitterEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    启用抖动机制
                  </FormLabel>
                  <FormDescription>
                    为重试延迟添加随机性，避免惊群效应
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
        </div>

        <Separator />

        {/* 超时和熔断设置 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">超时和熔断设置</h3>
            <Badge variant="outline">高级功能</Badge>
          </div>
          
          <FormField
            control={form.control}
            name="timeoutThreshold"
            render={({ field }) => (
              <FormItem>
                <FormLabel>超时阈值 (毫秒)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min={5000} 
                    max={120000} 
                    {...field} 
                    onChange={(e) => field.onChange(Number(e.target.value))}
                  />
                </FormControl>
                <FormDescription>
                  单次支付请求的超时时间 (5-120秒)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="enableCircuitBreaker"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    启用熔断器
                  </FormLabel>
                  <FormDescription>
                    在系统异常时自动停止重试，保护系统稳定性
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

          {form.watch('enableCircuitBreaker') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 ml-4">
              <FormField
                control={form.control}
                name="circuitBreakerThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>熔断阈值</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={5} 
                        max={100} 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      连续失败次数达到此值时触发熔断 (5-100)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="circuitBreakerWindow"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>熔断窗口 (秒)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={60} 
                        max={3600} 
                        {...field} 
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      熔断状态持续时间 (1-60分钟)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        <Separator />

        {/* 死信队列和监控设置 */}
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <h3 className="text-lg font-semibold">死信队列和监控</h3>
            <Badge variant="secondary">数据管理</Badge>
          </div>
          
          <FormField
            control={form.control}
            name="enableDeadLetter"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    启用死信队列
                  </FormLabel>
                  <FormDescription>
                    将重试失败的支付记录存储到死信队列，便于后续分析处理
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

          {form.watch('enableDeadLetter') && (
            <FormField
              control={form.control}
              name="deadLetterThreshold"
              render={({ field }) => (
                <FormItem className="ml-4">
                  <FormLabel>死信阈值</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={3} 
                      max={50} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    重试次数达到此值后进入死信队列 (3-50)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          <FormField
            control={form.control}
            name="enableMetrics"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    启用指标收集
                  </FormLabel>
                  <FormDescription>
                    收集重试相关的统计指标，用于监控和优化
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

          {form.watch('enableMetrics') && (
            <FormField
              control={form.control}
              name="metricsRetentionDays"
              render={({ field }) => (
                <FormItem className="ml-4">
                  <FormLabel>指标保留天数</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      min={1} 
                      max={90} 
                      {...field} 
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    指标数据在系统中的保留时间 (1-90天)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        {/* 保存按钮 */}
        <div className="flex items-center justify-between pt-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              配置更新后将立即生效，请谨慎操作
            </AlertDescription>
          </Alert>
          
          <Button type="submit" disabled={isSaving}>
            <Save className={`mr-2 h-4 w-4 ${isSaving ? 'animate-spin' : ''}`} />
            {isSaving ? '保存中...' : '保存配置'}
          </Button>
        </div>
      </form>
    </Form>
  )
}