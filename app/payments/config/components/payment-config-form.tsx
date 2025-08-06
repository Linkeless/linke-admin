'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { 
  CreatePaymentConfigRequest, 
  UpdatePaymentConfigRequest,
  PaymentConfigResponse 
} from '@/lib/payment-types'
import { paymentService } from '@/lib/payment-service'
import { ConfigEditor } from './config-editor'

// 简化的表单验证模式
const formSchema = z.object({
  name: z.string().min(1, '请输入配置名称'),
  gateway: z.string().min(1, '请选择支付网关'),
  method: z.string().min(1, '请选择支付方式'),
  config: z.string().min(1, '请输入配置信息').refine((val) => {
    try {
      JSON.parse(val)
      return true
    } catch {
      return false
    }
  }, { message: '配置参数必须是有效的JSON格式' }),
  description: z.string().optional(),
  environment: z.string().default('production'),
  is_enabled: z.boolean().default(true),
  icon: z.string().optional(),
  min_amount: z.number().min(0).default(0.01),
  max_amount: z.number().min(0).default(999999.99),
  fee_type: z.string().default('percentage'),
  fee_value: z.number().min(0).default(0),
  supported_currencies: z.string().default('CNY'),
  sort_order: z.number().min(0).default(0),
})

type FormData = z.infer<typeof formSchema>

interface PaymentConfigFormProps {
  initialData?: PaymentConfigResponse
  onSubmit: (data: CreatePaymentConfigRequest | UpdatePaymentConfigRequest) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

export function PaymentConfigForm({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
}: PaymentConfigFormProps) {
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      gateway: '',
      method: '',
      config: '',
      description: '',
      environment: 'production',
      is_enabled: true,
      icon: '',
      min_amount: 0.01,
      max_amount: 999999.99,
      fee_type: 'percentage',
      fee_value: 0,
      supported_currencies: 'CNY',
      sort_order: 0,
    },
  })

  // 当有初始数据时，填充表单
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        gateway: initialData.gateway,
        method: initialData.method || '',
        config: initialData.config || '',
        description: initialData.description || '',
        environment: initialData.environment || 'production',
        is_enabled: initialData.is_enabled,
        icon: initialData.icon || '',
        min_amount: initialData.min_amount,
        max_amount: initialData.max_amount,
        fee_type: initialData.percentage_fee > 0 ? 'percentage' : 'fixed',
        fee_value: initialData.percentage_fee > 0 ? initialData.percentage_fee : initialData.fixed_fee,
        supported_currencies: initialData.supported_currencies,
        sort_order: initialData.sort_order,
      })
    }
  }, [initialData, form])

  const handleSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      console.error('提交表单失败:', error)
    } finally {
      setSubmitting(false)
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
    <Form {...form}>
      <form action={handleFormAction} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>配置名称</FormLabel>
                <FormControl>
                  <Input placeholder="支付宝扫码支付" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gateway"
            render={({ field }) => (
              <FormItem>
                <FormLabel>支付网关</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择支付网关" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentService.getPaymentGateways().map((gateway) => (
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

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel>支付方式</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择支付方式" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentService.getPaymentMethods().map((method) => (
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
            name="environment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>运行环境</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="production">生产环境</SelectItem>
                    <SelectItem value="sandbox">沙箱环境</SelectItem>
                    <SelectItem value="test">测试环境</SelectItem>
                  </SelectContent>
                </Select>
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
              <FormLabel>描述</FormLabel>
              <FormControl>
                <Textarea placeholder="配置描述..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="config"
          render={({ field }) => (
            <FormItem>
              <FormLabel>配置参数</FormLabel>
              <FormControl>
                <ConfigEditor
                  value={field.value}
                  onChange={field.onChange}
                  placeholder='{"api_url": "https://api.example.com", "api_key": "your_key"}'
                  disabled={loading}
                />
              </FormControl>
              <FormDescription>JSON格式的支付网关配置参数</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="min_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最小金额</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
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
            name="max_amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最大金额</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="is_enabled"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">启用配置</FormLabel>
                <FormDescription>启用后用户可以使用此支付方式</FormDescription>
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

        <div className="flex justify-end space-x-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button type="submit" disabled={submitting || loading}>
            {submitting ? '提交中...' : (initialData ? '更新' : '创建')}
          </Button>
        </div>
      </form>
    </Form>
  )
}