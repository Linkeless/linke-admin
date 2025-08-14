'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Shuffle, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
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
import { couponService } from '@/lib/coupon-service'
import { CouponResponse, CreateCouponRequest, UpdateCouponRequest } from '@/lib/coupon-types'

// 简化的表单验证 schema
const formSchema = z.object({
  code: z.string().min(3, '优惠码至少3个字符').max(50, '优惠码最多50个字符'),
  name: z.string().min(1, '请输入优惠码名称').max(100, '名称最多100个字符'),
  type: z.enum(['percentage', 'fixed_amount'], { 
    required_error: '请选择优惠码类型' 
  }),
  value: z.number().min(0, '折扣值不能为负数'),
  currency: z.string().min(1, '请选择货币').default('CNY'),
  max_uses: z.number().min(0, '使用限制不能为负数').default(0),
  max_uses_per_user: z.number().min(1, '用户限制不能小于1').default(1),
  min_order_amount: z.number().min(0, '最低金额不能为负数').optional(),
  description: z.string().optional(),
  is_public: z.boolean().default(true),
})

type FormData = z.infer<typeof formSchema>

interface CouponFormProps {
  initialData?: CouponResponse
  onSubmit: (data: CreateCouponRequest | UpdateCouponRequest) => Promise<void>
  loading: boolean
  onCancel: () => void
  isEdit?: boolean
}

export function CouponForm({ 
  initialData, 
  onSubmit, 
  loading, 
  onCancel,
  isEdit = false 
}: CouponFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      type: initialData?.type || 'percentage',
      value: initialData?.value || 0,
      currency: initialData?.currency || 'CNY',
      max_uses: initialData?.max_uses || 0,
      max_uses_per_user: initialData?.max_uses_per_user || 1,
      min_order_amount: initialData?.min_order_amount || undefined,
      description: initialData?.description || '',
      is_public: initialData?.is_public ?? true,
    },
  })

  const couponType = form.watch('type')

  // 生成随机优惠码
  const generateCode = async () => {
    try {
      const code = await couponService.generateCouponCode('COUPON')
      form.setValue('code', code)
    } catch (error) {
      // 生成失败时显示错误，但不阻止用户手动输入
      console.warn('优惠码生成失败，请手动输入:', error)
    }
  }

  const handleSubmit = async (data: FormData) => {
    // 直接调用父组件的onSubmit，错误处理由React Query mutations统一处理
    await onSubmit(data)
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
        {/* 优惠码 */}
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>优惠码</FormLabel>
              <div className="flex gap-2">
                <FormControl>
                  <Input 
                    {...field} 
                    placeholder="输入优惠码"
                    disabled={isEdit || loading}
                    className="font-mono"
                    onChange={(e) => {
                      field.onChange(e.target.value.toUpperCase())
                    }}
                  />
                </FormControl>
                {!isEdit && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={generateCode}
                    disabled={loading}
                  >
                    <Shuffle className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 优惠码名称 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>优惠码名称</FormLabel>
              <FormControl>
                <Input {...field} placeholder="输入优惠码名称" disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 类型和折扣值 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>类型</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isEdit || loading}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择类型" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="percentage">百分比折扣</SelectItem>
                    <SelectItem value="fixed_amount">固定金额</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  折扣值
                  {couponType === 'percentage' && ' (%)'}
                  {couponType === 'fixed_amount' && ' (元)'}
                </FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="number"
                    min="0"
                    step={couponType === 'percentage' ? '1' : '0.01'}
                    max={couponType === 'percentage' ? '100' : undefined}
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 使用限制 */}
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="max_uses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>总使用次数 (0为无限制)</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="number"
                    min="0"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="max_uses_per_user"
            render={({ field }) => (
              <FormItem>
                <FormLabel>每用户使用次数</FormLabel>
                <FormControl>
                  <Input 
                    {...field}
                    type="number"
                    min="1"
                    onChange={(e) => field.onChange(Number(e.target.value))}
                    disabled={loading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* 高级设置切换 */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="p-0 h-auto text-sm text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
            {showAdvanced ? '隐藏' : '显示'}高级设置
          </Button>
        </div>

        {/* 高级设置 */}
        {showAdvanced && (
          <div className="space-y-4 pt-2 border-t">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>货币</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择货币" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                      <SelectItem value="USD">美元 (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="min_order_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>最低消费金额</FormLabel>
                  <FormControl>
                    <Input 
                      {...field}
                      type="number"
                      min="0"
                      step="0.01"
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      disabled={loading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>描述</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="输入优惠码描述" disabled={loading} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_public"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">公开优惠码</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      是否公开显示此优惠码
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={loading}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        )}


        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            取消
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? '保存中...' : (isEdit ? '保存更改' : '创建优惠码')}
          </Button>
        </div>
      </form>
    </Form>
  )
}