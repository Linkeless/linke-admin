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
// import { ConfigEditor } from './config-editor'

// 表单验证模式 - 严格按照swagger dto.CreatePaymentConfigRequest定义
const formSchema = z.object({
  // 必填字段
  name: z.string().min(1, '请输入配置名称'),
  method: z.string().min(1, '请选择支付方式'),
  url: z.string().url('请输入合法的API地址'),
  pid: z.string().min(1, '请输入商户/合作方ID'),
  key: z.string().min(1, '请输入密钥'),
  // 可选字段
  is_enabled: z.boolean().default(true),
  min_amount: z.coerce.number().min(0).default(0.01),
  max_amount: z.coerce.number().min(0).default(999999.99),
  fixed_fee: z.coerce.number().min(0).default(0),
  percentage_fee: z.coerce.number().min(0).default(0),
  supported_currencies: z.string().default('CNY'),
  sort_order: z.coerce.number().min(0).default(1),
  notify_url: z.string().optional().or(z.literal('')),
  return_url: z.string().optional().or(z.literal('')),
})

// 使用输入类型，避免zod默认值导致的可选/必填类型不一致
type FormData = z.input<typeof formSchema>

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
      method: '',
      url: '',
      pid: '',
      key: '',
      is_enabled: true,
      min_amount: 0.01,
      max_amount: 999999.99,
      fixed_fee: 0,
      percentage_fee: 0,
      supported_currencies: 'CNY',
      sort_order: 1,
      notify_url: '',
      return_url: '',
    },
  })

  // 当有初始数据时，填充表单
  useEffect(() => {
    if (initialData) {
      form.reset({
        name: initialData.name,
        method: initialData.method,
        url: initialData.url,
        pid: initialData.pid,
        key: initialData.key,
        is_enabled: initialData.is_enabled,
        min_amount: initialData.min_amount,
        max_amount: initialData.max_amount,
        fixed_fee: initialData.fixed_fee,
        percentage_fee: initialData.percentage_fee,
        supported_currencies: initialData.supported_currencies,
        sort_order: initialData.sort_order,
        notify_url: initialData.notify_url ?? '',
        return_url: initialData.return_url ?? '',
      })
    }
  }, [initialData, form])

  const handleSubmit = async (data: FormData) => {
    try {
      setSubmitting(true)
      // 强化数值类型，确保满足接口类型
      const payload = {
        ...data,
        min_amount: Number(data.min_amount ?? 0),
        max_amount: Number(data.max_amount ?? 0),
        fixed_fee: Number(data.fixed_fee ?? 0),
        percentage_fee: Number(data.percentage_fee ?? 0),
        sort_order: Number(data.sort_order ?? 0),
      }
      await onSubmit(payload as unknown as CreatePaymentConfigRequest)
    } catch (error) {
      console.error('提交表单失败:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormAction = async () => {
    // Trigger form validation and submission using react-hook-form
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await handleSubmit(values)
    }
  }

  return (
    <Form {...form}>
      <form action={async () => { await handleFormAction() }} className="space-y-4">
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
            name="url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>API地址</FormLabel>
                <FormControl>
                  <Input placeholder="https://api.example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pid"
            render={({ field }) => (
              <FormItem>
                <FormLabel>商户/合作方ID</FormLabel>
                <FormControl>
                  <Input placeholder="partner_id" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="key"
            render={({ field }) => (
              <FormItem>
                <FormLabel>密钥</FormLabel>
                <FormControl>
                  <Input placeholder="secret_key" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="supported_currencies"
            render={({ field }) => (
              <FormItem>
                <FormLabel>支持的货币</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择货币" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {paymentService.getSupportedCurrencies().map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
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
          <FormField
            control={form.control}
            name="notify_url"
            render={({ field }) => (
              <FormItem>
                <FormLabel>通知回调URL (可选)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/webhook" 
                    {...field}
                    value={field.value ?? ''}
                  />
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
                <FormLabel>返回URL (可选)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://example.com/return" 
                    {...field}
                    value={field.value ?? ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
                    value={Number(field.value ?? 0)}
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
                    value={Number(field.value ?? 0)}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fixed_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>固定费用</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    value={Number(field.value ?? 0)}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="percentage_fee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>百分比费用 (%)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.1" 
                    value={Number(field.value ?? 0)}
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
          name="sort_order"
          render={({ field }) => (
            <FormItem>
              <FormLabel>排序顺序</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  value={Number(field.value ?? 1)}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

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