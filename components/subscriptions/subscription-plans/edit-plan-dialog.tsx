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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Edit, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { subscriptionService } from "@/lib/subscription-service"
import { 
  CURRENCY_CONFIG, 
  BILLING_CYCLE_CONFIG,
  type SubscriptionPlan,
  type UpdatePlanRequest
} from "@/lib/subscription-types"
import { useUpdateSubscriptionPlan } from "@/hooks/mutations/use-subscription-mutations"

const formSchema = z.object({
  name: z.string().min(1, '计划名称不能为空').max(100, '计划名称不能超过100字符'),
  description: z.string().min(1, '计划描述不能为空').max(500, '计划描述不能超过500字符'),
  price: z.number().min(0, '价格必须大于等于0'),
  currency: z.string().min(1, '请选择货币'),
  billing_cycle: z.enum(['monthly', 'yearly', 'quarterly'], {
    required_error: '请选择计费周期'
  }),
  duration_days: z.number().min(1, '时长天数必须大于0'),
  data_limit_gb: z.number().min(0, '流量限制必须大于等于0'),
  device_limit: z.number().min(0, '设备限制必须大于等于0'),
  trial_days: z.number().min(0, '试用天数必须大于等于0'),
  status: z.enum(['active', 'inactive'], {
    required_error: '请选择状态'
  }),
})

type FormData = z.infer<typeof formSchema>

interface EditPlanDialogProps {
  plan: SubscriptionPlan
  onPlanUpdated: () => void
}

export function EditPlanDialog({ plan, onPlanUpdated }: EditPlanDialogProps) {
  const [open, setOpen] = useState(false)
  
  const updatePlanMutation = useUpdateSubscriptionPlan({
    onSuccess: () => {
      setOpen(false)
      onPlanUpdated()
    },
    onError: (error) => {
      console.error('更新订阅计划失败:', error)
    }
  })

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      billing_cycle: plan.billing_cycle,
      duration_days: plan.duration_days,
      data_limit_gb: plan.data_limit_gb || 0,
      device_limit: plan.device_limit || 0,
      trial_days: plan.trial_days || 0,
      status: plan.status,
    },
  })

  const handleSubmit = async (data: FormData) => {
    const updateData: UpdatePlanRequest = data
    updatePlanMutation.mutate({ id: plan.id, data: updateData })
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
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑订阅计划</DialogTitle>
          <DialogDescription>
            修改订阅计划的配置信息，完成后点击保存。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 计划名称 */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>计划名称</FormLabel>
                    <FormControl>
                      <Input placeholder="如：基础套餐" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 状态 */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>计划状态</FormLabel>
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
            </div>

            {/* 计划描述 */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>计划描述</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="描述此订阅计划的特点和适用场景"
                      className="resize-none"
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 价格 */}
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>价格</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="9.99"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 货币 */}
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>货币</FormLabel>
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

              {/* 计费周期 */}
              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>计费周期</FormLabel>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 时长天数 */}
              <FormField
                control={form.control}
                name="duration_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>时长天数</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="30"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 流量限制GB */}
              <FormField
                control={form.control}
                name="data_limit_gb"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>流量限制(GB)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="0 = 无限制"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 设备限制 */}
              <FormField
                control={form.control}
                name="device_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>设备限制</FormLabel>
                    <FormControl>
                      <Input 
                        type="number"
                        placeholder="0 = 无限制"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 试用天数 */}
            <FormField
              control={form.control}
              name="trial_days"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>试用天数</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="0"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    />
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
                disabled={updatePlanMutation.isPending}
                className="flex-1"
              >
                取消
              </Button>
              <Button 
                type="submit" 
                disabled={updatePlanMutation.isPending} 
                className="flex-1"
              >
                {updatePlanMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                保存
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}