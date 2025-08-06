// 用户订阅表单组件 - 用于新增和编辑用户订阅

'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Badge } from '@/components/ui/badge'
import { Loader2, ArrowLeft, Save, Search, User, Calendar, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import { subscriptionService } from '@/lib/subscription-service'
import { 
  type UserSubscription,
  type SubscriptionPlan,
  type CreateSubscriptionRequest,
  type UpdateSubscriptionRequest 
} from '@/lib/subscription-types'

// 表单验证模式
const subscriptionFormSchema = z.object({
  user_id: z.number().min(1, '请选择用户'),
  subscription_plan_id: z.number().min(1, '请选择订阅计划'),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  use_trial: z.boolean().default(false),
  skip_payment: z.boolean().default(false),
  notes: z.string().optional(),
  server_group_ids: z.array(z.number()).optional()
})

type SubscriptionFormData = z.infer<typeof subscriptionFormSchema>

interface SubscriptionFormProps {
  mode: 'create' | 'edit'
  subscriptionId?: number
  initialData?: UserSubscription
}

export function SubscriptionForm({ mode, subscriptionId, initialData }: SubscriptionFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null)

  const form = useForm<SubscriptionFormData>({
    resolver: zodResolver(subscriptionFormSchema),
    defaultValues: {
      user_id: 0,
      subscription_plan_id: 0,
      start_date: '',
      end_date: '',
      use_trial: false,
      skip_payment: false,
      notes: '',
      server_group_ids: []
    }
  })

  // 加载订阅计划列表
  useEffect(() => {
    loadPlans()
  }, [])

  // 加载编辑数据
  useEffect(() => {
    if (mode === 'edit' && subscriptionId && !initialData) {
      loadSubscriptionData()
    } else if (initialData) {
      populateForm(initialData)
    }
  }, [mode, subscriptionId, initialData])

  const loadPlans = async () => {
    try {
      const response = await subscriptionService.getPlans({ limit: 100, offset: 0 })
      if (response.code === 0 && response.data) {
        setPlans(response.data)
      }
    } catch (err) {
      console.error('Load plans error:', err)
    }
  }

  const loadSubscriptionData = async () => {
    if (!subscriptionId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await subscriptionService.getUserSubscription(subscriptionId)
      
      if (response.code === 0 && response.data) {
        populateForm(response.data)
      } else {
        setError(response.message || '加载订阅数据失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('Load subscription error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleFormAction = async (formData: FormData) => {
    // Trigger form validation and submission using react-hook-form
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await handleSubmitForm(values)
    }
  }

  const populateForm = (subscription: UserSubscription) => {
    form.reset({
      user_id: subscription.user_id || 0,
      subscription_plan_id: subscription.subscription_plan_id || 0,
      start_date: subscription.start_date ? subscription.start_date.split('T')[0] : '',
      end_date: subscription.end_date ? subscription.end_date.split('T')[0] : '',
      use_trial: subscription.is_in_trial || false,
      skip_payment: false, // 这个字段在响应中没有，默认为false
      notes: '', // 这个字段在响应中没有，默认为空
      server_group_ids: [] // 这个字段在响应中没有，默认为空数组
    })

    // 设置选中的计划
    const plan = plans.find(p => p.id === subscription.subscription_plan_id)
    if (plan) {
      setSelectedPlan(plan)
    }
  }

  const handlePlanChange = (planId: string) => {
    const planIdNum = parseInt(planId)
    const plan = plans.find(p => p.id === planIdNum)
    
    if (plan) {
      setSelectedPlan(plan)
      form.setValue('subscription_plan_id', planIdNum)
    }
  }

  const handleSubmitForm = async (data: SubscriptionFormData) => {
    try {
      setSubmitLoading(true)
      setError(null)

      // 转换日期格式为ISO 8601格式
      const formatDate = (dateStr: string) => {
        if (!dateStr) return undefined
        return new Date(dateStr + 'T00:00:00Z').toISOString()
      }

      const requestData: CreateSubscriptionRequest = {
        user_id: data.user_id,
        subscription_plan_id: data.subscription_plan_id,
        start_date: data.start_date ? formatDate(data.start_date) : undefined,
        end_date: data.end_date ? formatDate(data.end_date) : undefined,
        use_trial: data.use_trial,
        skip_payment: data.skip_payment,
        notes: data.notes || undefined,
        server_group_ids: data.server_group_ids && data.server_group_ids.length > 0 ? data.server_group_ids : undefined
      }


      let response
      if (mode === 'create') {
        response = await subscriptionService.createUserSubscription(requestData)
      } else if (subscriptionId) {
        // 编辑模式需要不同的数据格式
        const updateData: UpdateSubscriptionRequest = {
          end_date: data.end_date ? formatDate(data.end_date) : undefined,
          notes: data.notes || undefined,
          server_group_ids: data.server_group_ids && data.server_group_ids.length > 0 ? data.server_group_ids : undefined,
          // 在编辑模式中，我们暂时不支持修改其他字段
        }
        response = await subscriptionService.updateUserSubscription(subscriptionId, updateData)
      }

      if (response && response.code === 0) {
        router.push('/subscriptions/users')
      } else {
        setError(response?.message || '操作失败')
      }
    } catch (err) {
      setError('网络错误，请稍后重试')
      console.error('Submit subscription error:', err)
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
            {mode === 'create' ? '创建用户订阅' : '编辑用户订阅'}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {mode === 'create' ? '为用户创建新的订阅并配置相关参数' : '修改用户订阅的配置参数'}
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
        <form action={handleFormAction} className="space-y-4 sm:space-y-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
            {/* 左侧主要信息 */}
            <div className="xl:col-span-2 space-y-4 sm:space-y-6">
              {/* 用户和计划选择 */}
              <Card>
                <CardHeader>
                  <CardTitle>用户和计划</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="user_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            用户ID *
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-3 w-3 text-muted-foreground" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>请确保用户ID存在于系统中</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input 
                                type="number"
                                placeholder="输入用户ID"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="pr-8"
                              />
                              <Search className="absolute right-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            </div>
                          </FormControl>
                          <FormDescription className="flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            输入用户的唯一ID标识，确保用户存在于系统中
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="subscription_plan_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>订阅计划 *</FormLabel>
                          <Select 
                            value={field.value?.toString() || ''} 
                            onValueChange={handlePlanChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="选择订阅计划" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {plans.map((plan) => (
                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                  <div className="flex items-center gap-2">
                                    <span>{plan.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {plan.currency} {plan.price}
                                    </Badge>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* 选中计划的详细信息 */}
                  {selectedPlan && (
                    <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2 sm:mb-3">计划详情</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">价格:</span>
                          <p className="font-medium">{selectedPlan.currency} {selectedPlan.price}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">计费周期:</span>
                          <p className="font-medium">{selectedPlan.billing_cycle}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">流量限制:</span>
                          <p className="font-medium">{selectedPlan.traffic_limit_text}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">试用天数:</span>
                          <p className="font-medium">{selectedPlan.trial_period_days}天</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 订阅时间设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>订阅时间</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            开始日期 *
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              min={new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormDescription>
                            订阅生效日期，不能早于今天
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            结束日期
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="date" 
                              {...field}
                              min={form.watch('start_date') || new Date().toISOString().split('T')[0]}
                            />
                          </FormControl>
                          <FormDescription className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            留空则根据计费周期自动计算，手动设置会覆盖自动计算
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* 备注设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>备注信息</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>管理员备注</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="可选的管理员备注信息"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          用于记录创建订阅的相关信息
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* 右侧设置 */}
            <div className="space-y-4 sm:space-y-6">
              {/* 试用设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>试用设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="use_trial"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>启用试用</FormLabel>
                          <FormDescription className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            启用后用户将先进入试用期，试用期结束后自动转为正式订阅
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

              {/* 支付设置 */}
              <Card>
                <CardHeader>
                  <CardTitle>支付设置</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="skip_payment"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between">
                        <div>
                          <FormLabel>跳过支付</FormLabel>
                          <FormDescription className="flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            管理员创建时可以跳过支付流程，直接激活订阅
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

              {/* 操作提示 */}
              <Card>
                <CardHeader>
                  <CardTitle>操作提示</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xs sm:text-sm text-muted-foreground space-y-2 sm:space-y-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>创建订阅后会立即生效</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>启用试用会使用计划设置的试用期天数</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                      <span>跳过支付适用于管理员手动创建免费订阅</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <span>不设置结束日期时，系统会根据计划的计费周期自动计算</span>
                    </div>
                  </div>
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
              {mode === 'create' ? '创建订阅' : '保存修改'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}