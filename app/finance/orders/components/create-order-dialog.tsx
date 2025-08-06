'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, User, Package, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

import { CreateSubscriptionOrderRequest } from '@/lib/order-types'
import { orderService } from '@/lib/order-service'

// 表单验证模式
const createOrderSchema = z.object({
  user_id: z.number().min(1, '请输入用户ID'),
  subscription_plan_id: z.number().min(1, '请输入订阅计划ID'),
  order_type: z.enum(['new', 'renewal'], {
    required_error: '请选择订单类型',
  }),
  payment_method: z.string().min(1, '请选择支付方式'),
  payment_gateway: z.string().min(1, '请选择支付网关'),
  coupon_code: z.string().optional(),
  metadata: z.string().optional(),
  return_url: z.string().optional(),
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
  onOrderCreated 
}: CreateOrderDialogProps) {
  const [loading, setLoading] = useState(false)

  const form = useForm<CreateOrderFormData>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      user_id: 0,
      subscription_plan_id: 0,
      order_type: 'new',
      payment_method: '',
      payment_gateway: '',
      coupon_code: '',
      metadata: '',
      return_url: '',
      use_default_payment: false,
    }
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
      if (data.metadata) requestData.metadata = data.metadata
      if (data.return_url) requestData.return_url = data.return_url
      if (data.use_default_payment) requestData.use_default_payment = data.use_default_payment

      const response = await orderService.createSubscriptionOrder(requestData)

      if (response.code === 0) {
        toast.success('订单创建成功')
        onOrderCreated?.()
        onOpenChange(false)
        form.reset()
      } else {
        throw new Error(response.message || '创建失败')
      }
    } catch (error) {
      console.error('创建订单失败:', error)
      toast.error(error instanceof Error ? error.message : '创建订单失败，请稍后重试')
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            创建订单
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form action={handleFormAction} className="space-y-6">
            {/* 用户信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  用户信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="user_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>用户ID *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="请输入用户ID"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 订阅信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  订阅信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="subscription_plan_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>订阅计划ID *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="请输入订阅计划ID"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="order_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>订单类型 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择订单类型" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="new">新订单</SelectItem>
                            <SelectItem value="renewal">续费</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            {/* 支付信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  支付信息
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="payment_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>支付方式 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择支付方式" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {orderService.getPaymentMethods().map((method) => (
                              <SelectItem key={method.value} value={method.value}>
                                {method.label}
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
                    name="payment_gateway"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>支付网关 *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择支付网关" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {orderService.getPaymentGateways().map((gateway) => (
                              <SelectItem key={gateway.value} value={gateway.value}>
                                {gateway.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="coupon_code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>优惠券代码</FormLabel>
                      <FormControl>
                        <Input placeholder="输入优惠券代码（可选）" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="return_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>返回URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url" 
                          placeholder="支付完成后的返回URL（可选）" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="metadata"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>元数据</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="附加元数据（可选）" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2 pt-4 border-t">
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
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}