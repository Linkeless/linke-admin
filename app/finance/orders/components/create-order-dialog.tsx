'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

import { orderService } from '@/lib/order-service'
import { CreateSubscriptionOrderRequest } from '@/lib/order-types'

// 表单验证模式
const createOrderSchema = z.object({
  user_id: z.number().min(1, '请输入用户ID'),
  subscription_plan_id: z.number().min(1, '请输入订阅计划ID'),
  order_type: z.enum(['new', 'renewal', 'upgrade', 'downgrade'], {
    message: '请选择订单类型',
  }),
  payment_method: z.string().min(1, '请选择支付方式'),
  payment_gateway: z.string().min(1, '请选择支付网关'),
  coupon_code: z.string().optional(),
  return_url: z.union([
    z.string().refine((val) => !val || /^https?:\/\/.+/.test(val), {
      message: '请输入有效的URL地址'
    }),
    z.literal('')
  ]).optional(),
  metadata: z.string().optional(),
  use_default_payment: z.boolean().optional(),
})

type CreateOrderFormData = z.infer<typeof createOrderSchema>

interface CreateOrderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onOrderCreated?: () => void
}

export function CreateOrderDialog({
  open,
  onOpenChange,
  onOrderCreated,
}: CreateOrderDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      user_id: 0,
      subscription_plan_id: 0,
      order_type: 'new',
      payment_method: 'credit_card',
      payment_gateway: 'stripe',
      coupon_code: '',
      return_url: '',
      metadata: '',
      use_default_payment: false,
    },
  })

  const handleSubmit = async (data: CreateOrderFormData) => {
    try {
      setLoading(true)

      // 构建请求数据
      const requestData: CreateSubscriptionOrderRequest = {
        user_id: data.user_id,
        subscription_plan_id: data.subscription_plan_id,
        order_type: data.order_type,
        payment_method: data.payment_method,
        payment_gateway: data.payment_gateway,
      }

      // 添加可选字段
      if (data.coupon_code) requestData.coupon_code = data.coupon_code
      if (data.return_url) requestData.return_url = data.return_url
      if (data.metadata) requestData.metadata = data.metadata
      if (data.use_default_payment) requestData.use_default_payment = data.use_default_payment

      const response = await orderService.createSubscriptionOrder(requestData)

      if (response.code === 0) {
        toast.success('订单创建成功')
        form.reset()
        onOrderCreated?.()
        onOpenChange(false)
      } else {
        toast.error(response.message || '创建订单失败')
      }
    } catch (error) {
      console.error('创建订单失败:', error)
      toast.error('创建订单失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建订单</DialogTitle>
          <DialogDescription>
            为用户创建新的订阅订单
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
                    <FormDescription>
                      订单所属的用户ID
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 订阅计划ID */}
              <FormField
                control={form.control}
                name="subscription_plan_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>订阅计划ID</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="输入订阅计划ID"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      用户要订阅的计划ID
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 订单类型 */}
              <FormField
                control={form.control}
                name="order_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>订单类型</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择订单类型" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="new">新订阅</SelectItem>
                        <SelectItem value="renewal">续费</SelectItem>
                        <SelectItem value="upgrade">升级</SelectItem>
                        <SelectItem value="downgrade">降级</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 优惠券代码 */}
              <FormField
                control={form.control}
                name="coupon_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>优惠券代码（可选）</FormLabel>
                    <FormControl>
                      <Input placeholder="输入优惠券代码" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 支付方式 */}
              <FormField
                control={form.control}
                name="payment_method"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支付方式</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择支付方式" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="credit_card">信用卡</SelectItem>
                        <SelectItem value="alipay">支付宝</SelectItem>
                        <SelectItem value="wechat">微信支付</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 支付网关 */}
              <FormField
                control={form.control}
                name="payment_gateway"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>支付网关</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择支付网关" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="stripe">Stripe</SelectItem>
                        <SelectItem value="epay">易支付</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 返回URL */}
            <FormField
              control={form.control}
              name="return_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>返回URL（可选）</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/success"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    支付成功后的跳转地址
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 元数据 */}
            <FormField
              control={form.control}
              name="metadata"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>元数据（可选）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="输入JSON格式的元数据"
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    额外的订单信息，JSON格式
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 使用默认支付方式 */}
            <FormField
              control={form.control}
              name="use_default_payment"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      使用用户默认支付方式
                    </FormLabel>
                    <FormDescription>
                      如果用户已绑定支付方式，将使用其默认支付方式
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '创建中...' : '创建订单'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}