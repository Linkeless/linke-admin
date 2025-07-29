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
import { Switch } from "@/components/ui/switch"
import { Plus, Loader2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { subscriptionService } from "@/lib/subscription-service"
import { 
  CURRENCY_CONFIG, 
  BILLING_CYCLE_CONFIG,
  type CreatePlanRequest
} from "@/lib/subscription-types"

const formSchema = z.object({
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

type FormData = z.infer<typeof formSchema>

interface CreatePlanDialogProps {
  onPlanCreated: () => void
}

export function CreatePlanDialog({ onPlanCreated }: CreatePlanDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
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
    },
  })

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true)

      // 计算流量GB值和文本
      const traffic_limit_gb = data.traffic_limit / (1024 * 1024 * 1024)
      const traffic_limit_text = traffic_limit_gb > 0 ? `${traffic_limit_gb.toFixed(1)} GB` : '无限制'

      const createData: CreatePlanRequest = {
        ...data,
        traffic_limit_gb,
        traffic_limit_text
      }

      console.log('创建订阅计划数据:', createData)
      const response = await subscriptionService.createPlan(createData)
      
      if (response.code === 0) {
        console.log('订阅计划创建成功:', response.data)
        form.reset()
        setOpen(false)
        onPlanCreated()
      } else {
        throw new Error(response.message || '创建失败')
      }
    } catch (error: unknown) {
      console.error('创建订阅计划失败:', error)
      const errorMessage = error instanceof Error ? error.message : '未知错误'
      alert(`创建订阅计划失败: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          创建计划
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建订阅计划</DialogTitle>
          <DialogDescription>
            创建新的订阅计划，设置价格、流量、计费周期等参数。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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

              {/* 计划代码 */}
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>计划代码</FormLabel>
                    <FormControl>
                      <Input placeholder="如：basic" {...field} />
                    </FormControl>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 流量限制 */}
              <FormField
                control={form.control}
                name="traffic_limit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>流量限制（字节）</FormLabel>
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

              {/* 流量重置周期 */}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 试用天数 */}
              <FormField
                control={form.control}
                name="trial_period_days"
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

              {/* 安装费 */}
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

              {/* 取消费用 */}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              {/* 排序值 */}
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 显示选项 */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="is_visible"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">公开显示</FormLabel>
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

              <FormField
                control={form.control}
                name="is_popular"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">热门标记</FormLabel>
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

              <FormField
                control={form.control}
                name="is_recommended"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">推荐标记</FormLabel>
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
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                创建计划
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}