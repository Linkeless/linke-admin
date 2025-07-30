'use client'

import * as React from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

import { ticketService } from '@/lib/ticket-service'
import { TicketResponse, UpdateTicketRequest } from '@/lib/ticket-types'

// 表单验证 schema
const formSchema = z.object({
  title: z.string().min(5, '标题至少5个字符').max(255, '标题最多255个字符'),
  category: z.enum(['general', 'technical', 'billing', 'account', 'feature', 'bug', 'subscription', 'payment']),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']),
  status: z.enum(['open', 'in_progress', 'pending', 'resolved', 'closed']),
  description: z.string().min(10, '描述至少10个字符').max(5000, '描述最多5000个字符'),
  tags: z.string().optional(),
  metadata: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface EditTicketDialogProps {
  ticket: TicketResponse | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketUpdated: () => void
}

export function EditTicketDialog({ 
  ticket, 
  open, 
  onOpenChange, 
  onTicketUpdated 
}: EditTicketDialogProps) {
  const [loading, setLoading] = useState(false)
  const [submitError, setSubmitError] = useState<string>('')

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: ticket?.title || '',
      category: ticket?.category || 'general',
      priority: ticket?.priority || 'normal',
      status: ticket?.status || 'open',
      description: ticket?.description || '',
      tags: ticket?.tags || '',
      metadata: ticket?.metadata || '',
    },
  })

  // 当ticket变化时重置表单
  React.useEffect(() => {
    if (ticket) {
      form.reset({
        title: ticket.title,
        category: ticket.category,
        priority: ticket.priority,
        status: ticket.status,
        description: ticket.description,
        tags: ticket.tags || '',
        metadata: ticket.metadata || '',
      })
    }
  }, [ticket, form])

  const handleSubmit = async (data: FormData) => {
    if (!ticket) return
    
    try {
      setLoading(true)
      setSubmitError('')
      
      const updateData: UpdateTicketRequest = {
        title: data.title,
        category: data.category,
        priority: data.priority,
        status: data.status,
        description: data.description,
        tags: data.tags || undefined,
        metadata: data.metadata || undefined,
      }

      const response = await ticketService.updateTicket(ticket.id, updateData)
      
      if (response.code === 0) {
        onOpenChange(false)
        onTicketUpdated()
      } else {
        throw new Error(response.message || '更新工单失败')
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '更新工单失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑工单</DialogTitle>
          <DialogDescription>
            修改工单信息。工单号: {ticket?.ticket_no}
          </DialogDescription>
        </DialogHeader>
        
        {ticket && (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
              {/* 基本信息 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">基本信息</h3>
                
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>标题</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="输入工单标题" disabled={loading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>类别</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择类别" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ticketService.getTicketCategories().map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
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
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>优先级</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择优先级" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ticketService.getTicketPriorities().map((priority) => (
                              <SelectItem key={priority.value} value={priority.value}>
                                {priority.label}
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
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>状态</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={loading}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="选择状态" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ticketService.getTicketStatuses().map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>描述</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="输入工单描述" 
                          disabled={loading}
                          rows={6}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>标签</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="输入标签，用逗号分隔" disabled={loading} />
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
                          <Input {...field} placeholder="输入JSON格式的元数据" disabled={loading} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {submitError && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                  {submitError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
                  取消
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? '保存中...' : '保存更改'}
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}