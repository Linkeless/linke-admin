'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { subscriptionService } from "@/lib/subscription-service"
import { 
  CreateSubscriptionRequest,
  SubscriptionPlan,
} from "@/lib/subscription-types"
import { useEffect } from "react"

const formSchema = z.object({
  user_id: z.number().min(1, "请输入用户ID"),
  subscription_plan_id: z.number().min(1, "请选择订阅计划"),
  reason: z.string().optional(),
  notes: z.string().optional(),
  start_date: z.string().optional(),
  use_trial: z.boolean().default(false),
  skip_payment: z.boolean().default(true),
  send_notification: z.boolean().default(true),
  custom_traffic_limit: z.number().optional(),
  custom_traffic_reset_cycle: z.string().optional(),
  disable_traffic_limit: z.boolean().default(false),
})

type FormData = z.infer<typeof formSchema>

interface CreateUserSubscriptionDialogProps {
  onSubscriptionCreated: () => void
}

export function CreateUserSubscriptionDialog({ onSubscriptionCreated }: CreateUserSubscriptionDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      user_id: 0,
      subscription_plan_id: 0,
      reason: "管理员创建订阅",
      notes: "",
      start_date: "",
      use_trial: false,
      skip_payment: true,
      send_notification: true,
      custom_traffic_limit: 0,
      custom_traffic_reset_cycle: "monthly",
      disable_traffic_limit: false,
    },
  })

  // 加载订阅计划
  useEffect(() => {
    loadPlans()
  }, [])

  const loadPlans = async () => {
    try {
      const response = await subscriptionService.getPlans({ limit: 100, offset: 0 })
      if (response.code === 0 && response.data) {
        // API返回嵌套格式: { data: { items: [...], pagination: {...} } }
        const allPlans = response.data.items || []
        setPlans(allPlans.filter(plan => plan.status === 'active'))
      }
    } catch (error) {
      console.error('加载订阅计划失败:', error)
    }
  }

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      
      // 使用新的管理员创建API
      const createData: CreateSubscriptionRequest = {
        user_id: data.user_id,
        subscription_plan_id: data.subscription_plan_id,
        reason: data.reason || "管理员创建订阅",
        notes: data.notes || undefined,
        start_date: data.start_date || undefined,
        use_trial: data.use_trial,
        skip_payment: data.skip_payment,
        send_notification: data.send_notification,
        custom_traffic_limit: data.custom_traffic_limit || undefined,
        custom_traffic_reset_cycle: data.custom_traffic_reset_cycle || undefined,
        disable_traffic_limit: data.disable_traffic_limit,
      }

      console.log('创建用户订阅数据:', createData)
      const response = await subscriptionService.createUserSubscription(createData)
      
      if (response.code === 0) {
        console.log('用户订阅创建成功:', response.data)
        form.reset()
        setOpen(false)
        onSubscriptionCreated()
      } else {
        throw new Error(response.message || '创建失败')
      }
    } catch (error: unknown) {
      console.error('创建用户订阅失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`创建用户订阅失败: ${errorMessage}`)
    } finally {
      setLoading(false)
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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建订阅
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建用户订阅</DialogTitle>
          <DialogDescription>
            为用户创建新的订阅，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-4">
            {/* 用户ID */}
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户ID</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="输入用户ID"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 订阅计划 */}
            <FormField
              control={form.control}
              name="subscription_plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>订阅计划</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue=""
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择订阅计划" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plans.map((plan) => (
                        <SelectItem key={plan.id} value={plan.id.toString()}>
                          {plan.name} - {plan.currency} {plan.price}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 创建原因 */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>创建原因</FormLabel>
                  <FormControl>
                    <Input placeholder="管理员创建订阅" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 开始日期 */}
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>开始日期（可选）</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      {...field}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 启用试用 */}
            <FormField
              control={form.control}
              name="use_trial"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">启用试用</FormLabel>
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

            {/* 跳过支付 */}
            <FormField
              control={form.control}
              name="skip_payment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">跳过支付</FormLabel>
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

            {/* 发送通知 */}
            <FormField
              control={form.control}
              name="send_notification"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">发送通知</FormLabel>
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

            {/* 自定义流量限制 */}
            <FormField
              control={form.control}
              name="custom_traffic_limit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>自定义流量限制（字节，可选）</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="留空使用计划默认值"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 流量重置周期 */}
            <FormField
              control={form.control}
              name="custom_traffic_reset_cycle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>流量重置周期（可选）</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择重置周期" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="monthly">每月</SelectItem>
                      <SelectItem value="never">永不重置</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 禁用流量限制 */}
            <FormField
              control={form.control}
              name="disable_traffic_limit"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">禁用流量限制</FormLabel>
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

            {/* 备注 */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Input placeholder="可选的备注信息" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={loading} 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}