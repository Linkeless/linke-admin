'use client'

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
import { Switch } from '@/components/ui/switch'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { CreateInviteCodeRequest, UpdateInviteCodeRequest, InviteCodeResponse } from '@/lib/invite-code-types'

const formSchema = z.object({
  code: z.string()
    .min(1, '邀请码不能为空')
    .max(50, '邀请码不能超过50个字符')
    .regex(/^[A-Z0-9_-]+$/i, '邀请码只能包含字母、数字、下划线和短横线'),
  name: z.string()
    .min(1, '名称不能为空')
    .max(100, '名称不能超过100个字符'),
  description: z.string()
    .max(500, '描述不能超过500个字符')
    .optional(),
  max_uses: z.number()
    .min(1, '最大使用次数必须大于0')
    .max(10000, '最大使用次数不能超过10000')
    .optional(),
  is_unlimited: z.boolean().default(false),
  valid_from: z.date().optional(),
  valid_until: z.date().optional(),
}).refine((data) => {
  if (data.valid_from && data.valid_until) {
    return data.valid_until > data.valid_from
  }
  return true
}, {
  message: '结束时间必须晚于开始时间',
  path: ['valid_until'],
})

type FormData = z.infer<typeof formSchema>

interface InviteCodeFormProps {
  initialData?: InviteCodeResponse
  onSubmit: (data: CreateInviteCodeRequest | UpdateInviteCodeRequest) => Promise<void>
  submitText?: string
  loading?: boolean
}

export function InviteCodeForm({ 
  initialData, 
  onSubmit, 
  submitText = '创建', 
  loading = false 
}: InviteCodeFormProps) {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: initialData?.code || '',
      name: initialData?.name || '',
      description: initialData?.description || '',
      max_uses: initialData?.max_uses || 1,
      is_unlimited: initialData?.is_unlimited || false,
      valid_from: initialData?.valid_from ? new Date(initialData.valid_from) : undefined,
      valid_until: initialData?.valid_until ? new Date(initialData.valid_until) : undefined,
    },
  })

  const isUnlimited = form.watch('is_unlimited')

  const handleSubmit = async (data: FormData) => {
    const submitData = {
      ...data,
      valid_from: data.valid_from?.toISOString(),
      valid_until: data.valid_until?.toISOString(),
      max_uses: data.is_unlimited ? undefined : data.max_uses,
    }

    // 移除未定义的字段
    Object.keys(submitData).forEach(key => {
      if (submitData[key as keyof typeof submitData] === undefined) {
        delete submitData[key as keyof typeof submitData]
      }
    })

    await onSubmit(submitData)
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
      <form action={handleFormAction} className="space-y-6">
        <FormField
          control={form.control}
          name="code"
          render={({ field }) => (
            <FormItem>
              <FormLabel>邀请码</FormLabel>
              <FormControl>
                <Input 
                  placeholder="请输入邀请码" 
                  {...field} 
                  disabled={!!initialData || loading}
                />
              </FormControl>
              <FormDescription>
                邀请码只能包含字母、数字、下划线和短横线，创建后不可修改
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>名称</FormLabel>
              <FormControl>
                <Input placeholder="请输入邀请码名称" {...field} disabled={loading} />
              </FormControl>
              <FormDescription>
                为这个邀请码起一个易于识别的名称
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>描述 (可选)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="请输入邀请码描述" 
                  {...field} 
                  disabled={loading}
                  rows={3}
                />
              </FormControl>
              <FormDescription>
                详细描述这个邀请码的用途或使用场景
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="is_unlimited"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">无限制使用</FormLabel>
                <FormDescription>
                  开启后，此邀请码可以被无限次使用
                </FormDescription>
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

        {!isUnlimited && (
          <FormField
            control={form.control}
            name="max_uses"
            render={({ field }) => (
              <FormItem>
                <FormLabel>最大使用次数</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1" 
                    {...field}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                    disabled={loading}
                    min={1}
                    max={10000}
                  />
                </FormControl>
                <FormDescription>
                  此邀请码最多可以被使用的次数
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="valid_from"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>生效时间 (可选)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={loading}
                      >
                        {field.value ? (
                          format(field.value, 'yyyy-MM-dd HH:mm')
                        ) : (
                          <span>选择开始时间</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  邀请码的生效时间，留空表示立即生效
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valid_until"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>过期时间 (可选)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                        disabled={loading}
                      >
                        {field.value ? (
                          format(field.value, 'yyyy-MM-dd HH:mm')
                        ) : (
                          <span>选择过期时间</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  邀请码的过期时间，留空表示永不过期
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? '提交中...' : submitText}
        </Button>
      </form>
    </Form>
  )
}