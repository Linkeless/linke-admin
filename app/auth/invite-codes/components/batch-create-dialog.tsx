'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { CalendarIcon, Users } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { inviteCodeService } from '@/lib/invite-code-service'
import { BatchInviteCodeRequest } from '@/lib/invite-code-types'

const formSchema = z.object({
  name_prefix: z.string()
    .min(1, '名称前缀不能为空')
    .max(50, '名称前缀不能超过50个字符'),
  count: z.number()
    .min(1, '生成数量必须大于0')
    .max(100, '单次最多生成100个邀请码'),
  max_uses: z.number()
    .min(1, '最大使用次数必须大于0')
    .max(10000, '最大使用次数不能超过10000')
    .optional(),
  is_unlimited: z.boolean().default(false),
  valid_from: z.date().optional(),
  valid_until: z.date().optional(),
  description: z.string()
    .max(500, '描述不能超过500个字符')
    .optional(),
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

interface BatchCreateDialogProps {
  onInviteCodesCreated?: () => void
}

export function BatchCreateDialog({ onInviteCodesCreated }: BatchCreateDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name_prefix: '',
      count: 10,
      max_uses: 1,
      is_unlimited: false,
      description: '',
    },
  })

  const isUnlimited = form.watch('is_unlimited')

  const handleSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const submitData: BatchInviteCodeRequest = {
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

      const response = await inviteCodeService.batchCreateInviteCodes(submitData)
      
      if (response.code === 0) {
        toast.success(`成功生成 ${data.count} 个邀请码`)
        setOpen(false)
        form.reset()
        onInviteCodesCreated?.()
      } else {
        toast.error(response.message || '批量生成邀请码失败')
      }
    } catch (error) {
      console.error('批量生成邀请码失败:', error)
      toast.error('批量生成邀请码时发生错误，请稍后重试')
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
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          批量生成
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>批量生成邀请码</DialogTitle>
          <DialogDescription>
            一次性生成多个邀请码，系统会自动为每个邀请码分配唯一的代码。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name_prefix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>名称前缀</FormLabel>
                    <FormControl>
                      <Input placeholder="活动邀请码" {...field} disabled={loading} />
                    </FormControl>
                    <FormDescription>
                      每个邀请码的名称前缀
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>生成数量</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="10" 
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                        disabled={loading}
                        min={1}
                        max={100}
                      />
                    </FormControl>
                    <FormDescription>
                      要生成的邀请码数量
                    </FormDescription>
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
                    为这批邀请码添加统一的描述
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
                      开启后，这批邀请码可以被无限次使用
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
                      每个邀请码最多可以被使用的次数
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
                      邀请码的生效时间
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
                      邀请码的过期时间
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? '生成中...' : `生成 ${form.watch('count')} 个邀请码`}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}