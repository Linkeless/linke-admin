// 订阅计划表单组件 - 用于新增和编辑订阅计划

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Loader2, ArrowLeft, Save, Info, HelpCircle, DollarSign, Clock, Zap } from 'lucide-react'
import { subscriptionService } from '@/lib/subscription-service'
import { 
  CURRENCY_CONFIG, 
  BILLING_CYCLE_CONFIG,
  type SubscriptionPlan,
  type CreatePlanRequest,
  type UpdatePlanRequest 
} from '@/lib/subscription-types'

// 表单验证模式
const planFormSchema = z.object({
  name: z.string().min(1, '计划名称不能为空').max(100, '计划名称不能超过100字符'),
  code: z.string().min(1, '计划代码不能为空').max(50, '计划代码不能超过50字符'),
  description: z.string().min(1, '计划描述不能为空').max(500, '计划描述不能超过500字符'),
  price: z.number().min(0, '价格必须大于等于0'),
  currency: z.string().min(1, '请选择货币'),
  billing_cycle: z.enum(['monthly', 'yearly', 'quarterly'], {
    required_error: '请选择计费周期'
  }),
  billing_interval: z.number().min(1, '计费间隔必须大于0'),
  traffic_limit: z.number().min(0, '流量限制必须大于等于0'),
  traffic_reset_cycle: z.string().min(1, '请选择流量重置周期'),
  trial_period_days: z.number().min(0, '试用天数必须大于等于0'),
  setup_fee: z.number().min(0, '安装费必须大于等于0'),
  cancellation_fee: z.number().min(0, '取消费用必须大于等于0'),
  status: z.enum(['active', 'inactive'], {
    required_error: '请选择状态'
  }),
  is_visible: z.boolean().default(true),
  is_popular: z.boolean().default(false),
  is_recommended: z.boolean().default(false),
  sort_order: z.number().min(0, '排序值必须大于等于0'),
  features: z.string().optional(),
  limits: z.string().optional()
})

type PlanFormData = z.infer<typeof planFormSchema>

interface PlanFormProps {
  mode: 'create' | 'edit'
  planId?: number
  initialData?: SubscriptionPlan
}

export function PlanForm({ mode, planId, initialData }: PlanFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: '',
      code: '',
      description: '',
      price: 0,
      currency: 'USD',
      billing_cycle: 'monthly',
      billing_interval: 1,
      traffic_limit: 0,
      traffic_reset_cycle: 'monthly',
      trial_period_days: 0,
      setup_fee: 0,
      cancellation_fee: 0,
      status: 'active',
      is_visible: true,
      is_popular: false,
      is_recommended: false,
      sort_order: 0,
      features: '',
      limits: ''
    }
  })

  // 加载编辑数据
  useEffect(() => {
    if (mode === 'edit' && planId && !initialData) {
      loadPlanData()
    } else if (initialData) {
      populateForm(initialData)
    }
  }, [mode, planId, initialData])

  const loadPlanData = async () => {
    if (!planId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await subscriptionService.getPlan(planId)
      
      if (response.code === 0 && response.data) {
        populateForm(response.data)
      } else {
        setError(response.message || '加载计划数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('Load plan error:', err)
    } finally {
      setLoading(false)
    }
  }

  const populateForm = (plan: SubscriptionPlan) => {
    form.reset({
      name: plan.name || '',
      code: plan.code || '',
      description: plan.description || '',
      price: plan.price || 0,
      currency: (plan.currency as keyof typeof CURRENCY_CONFIG) || 'USD',
      billing_cycle: plan.billing_cycle || 'monthly',
      billing_interval: plan.billing_interval || 1,
      traffic_limit: plan.traffic_limit || 0,
      traffic_reset_cycle: plan.traffic_reset_cycle || 'monthly',
      trial_period_days: plan.trial_period_days || 0,
      setup_fee: plan.setup_fee || 0,
      cancellation_fee: plan.cancellation_fee || 0,
      status: (plan.status as 'active' | 'inactive') || 'active',
      is_visible: plan.is_visible ?? true,
      is_popular: plan.is_popular ?? false,
      is_recommended: plan.is_recommended ?? false,
      sort_order: plan.sort_order || 0,
      features: plan.features || '',
      limits: plan.limits || ''
    })
  }

  const onSubmit = async (data: PlanFormData) => {
    try {
      setSubmitLoading(true)
      setError(null)

      // 计算流量GB值和文本
      const traffic_limit_gb = data.traffic_limit / (1024 * 1024 * 1024)
      const traffic_limit_text = traffic_limit_gb > 0 ? `${traffic_limit_gb.toFixed(1)} GB` : '无限制'

      const requestData = {
        ...data,
        traffic_limit_gb,
        traffic_limit_text
      }

      let response
      if (mode === 'create') {
        response = await subscriptionService.createPlan(requestData as CreatePlanRequest)
      } else if (planId) {
        response = await subscriptionService.updatePlan(planId, requestData as UpdatePlanRequest)
      }

      if (response && response.code === 0) {
        router.push('/subscriptions/plans')
      } else {
        setError(response?.message || '操作失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('Submit plan error:', err)
    } finally {
      setSubmitLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-4 sm:p-6">
      {/* 页面头部 */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="self-start">
          <ArrowLeft className="mr-2 h-4 w-4" />
          返回
        </Button>
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            {mode === 'create' ? '创建订阅计划' : '编辑订阅计划'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {mode === 'create' ? '创建新的订阅计划并配置相关参数' : '修改订阅计划的配置参数'}
          </p>
        </div>
      </div>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* 左侧主要信息 */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              {/* 基本信息 */}
              <Card>
                <CardHeader>
                  <CardTitle>基本信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>计划名称 *</FormLabel>
                          <FormControl>
                            <Input placeholder="如：基础套餐" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            计划代码 *
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <HelpCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>只能包含英文字母、数字和下划线</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="如：basic" 
                              {...field}
                              pattern="[a-zA-Z0-9_]+"
                            />
                          </FormControl>
                          <FormDescription>
                            用于API调用的唯一标识符，建议使用英文和下划线
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>计划描述 *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="描述此订阅计划的特点和适用场景"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 价格设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>价格设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            价格 *
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number" 
                                step="0.01"
                                placeholder="9.99"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                                className="pl-8"
                              />
                              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription>
                            设置订阅计划的价格，支持小数点后两位
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>货币 *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择货币" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(CURRENCY_CONFIG).map(([code, config]) => (
                                <SelectItem key={code} value={code}>
                                  {config.symbol} {config.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="billing_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>计费周期 *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择周期" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(BILLING_CYCLE_CONFIG).map(([cycle, config]) => (
                                <SelectItem key={cycle} value={cycle}>
                                  {config.text}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="setup_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>安装费</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cancellation_fee"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>取消费用</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                              onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="trial_period_days"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            试用天数
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormDescription>
                            新用户可免费试用的天数，0表示无试用期
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 流量设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>流量设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="traffic_limit"
                      render={({ field }) => {
                        const trafficGB = field.value > 0 ? (field.value / (1024 * 1024 * 1024)).toFixed(2) : 0
                        return (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Zap className="h-4 w-4" />
                              流量限制（字节）
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Input 
                                  type="number"
                                  placeholder="0 = 无限制"
                                  {...field}
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="pr-20"
                                />
                                {field.value > 0 && (
                                  <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground bg-background px-1">
                                    ≈ {trafficGB} GB
                                  </div>
                                )}
                              </div>
                            </FormControl>
                            <FormDescription className="flex items-center gap-1">
                              <Info className="h-3 w-3" />
                              以字节为单位，0表示无限制。常用值：100GB = 107374182400 字节
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )
                      }}
                    />
                    <FormField
                      control={form.control}
                      name="traffic_reset_cycle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>流量重置周期</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择重置周期" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="daily">每日重置</SelectItem>
                              <SelectItem value="weekly">每周重置</SelectItem>
                              <SelectItem value="monthly">每月重置</SelectItem>
                              <SelectItem value="quarterly">每季重置</SelectItem>
                              <SelectItem value="yearly">每年重置</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 右侧设置 */}
            <div className="space-y-4 sm:space-y-6">
              {/* 状态设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>状态设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>计划状态 *</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择状态" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">激活</SelectItem>
                            <SelectItem value="inactive">未激活</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="sort_order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>排序值</FormLabel>
                        <FormControl>
                          <Input 
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          数值越小排序越靠前
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* 显示选项 */}
              <Card>
                <CardHeader>
                  <CardTitle>显示选项</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="is_visible"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>公开显示</FormLabel>
                          <FormDescription>
                            是否在前端页面中显示此计划
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
                  <Separator />
                  <FormField
                    control={form.control}
                    name="is_popular"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>热门标记</FormLabel>
                          <FormDescription>
                            标记为热门计划
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
                  <Separator />
                  <FormField
                    control={form.control}
                    name="is_recommended"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>推荐标记</FormLabel>
                          <FormDescription>
                            标记为推荐计划
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

              {/* 高级设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>高级设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="features"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>功能特性</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="JSON格式的功能特性配置"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          JSON格式，用于前端展示功能列表。例：{`["高速连接","无限设备","7x24客服"]`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="limits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>限制配置</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="JSON格式的限制配置"
                            className="resize-none"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="flex items-center gap-1">
                          <Info className="h-3 w-3" />
                          JSON格式，用于业务逻辑限制。例：{`{"max_devices":5,"max_speed":"100Mbps"}`}
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4 pt-4 sm:pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="order-2 sm:order-1"
            >
              取消
            </Button>
            <Button type="submit" disabled={submitLoading} className="order-1 sm:order-2">
              {submitLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Save className="mr-2 h-4 w-4" />
              {mode === 'create' ? '创建计划' : '保存修改'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}