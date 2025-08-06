'use client'

import * as React from 'react'
import { useState, useEffect } from 'react'
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
import { User, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { ticketService } from '@/lib/ticket-service'
import { userService } from '@/lib/user-service'
import { CreateTicketRequest } from '@/lib/ticket-types'

// 表单验证 schema
const formSchema = z.object({
  user_id: z.number({
    required_error: '请选择用户',
    invalid_type_error: '请选择有效用户',
  }).min(1, '请选择用户'),
  title: z.string().min(5, '标题至少5个字符').max(255, '标题最多255个字符'),
  category: z.enum(['general', 'technical', 'billing', 'account', 'feature', 'bug', 'subscription', 'payment']),
  priority: z.enum(['low', 'normal', 'high', 'urgent', 'critical']),
  description: z.string().min(10, '描述至少10个字符').max(5000, '描述最多5000个字符'),
  assigned_to_id: z.number().optional(),
  tags: z.string().optional(),
  metadata: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface User {
  id: number
  email: string
  username?: string
}

interface CreateTicketDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onTicketCreated: () => void
}

export function CreateTicketDialog({ 
  open, 
  onOpenChange, 
  onTicketCreated 
}: CreateTicketDialogProps) {
  const [loading, setLoading] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [submitError, setSubmitError] = useState<string>('')
  // Use toast from sonner directly

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: 'general',
      priority: 'normal',
      description: '',
      tags: '',
      metadata: '',
    },
  })

  // 加载用户列表
  const loadUsers = async () => {
    try {
      setLoadingUsers(true)
      const response = await userService.getUsers({
        limit: 100,
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      
      if (response.code === 0 && response.data) {
        setUsers(response.data)
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // 当对话框打开时加载用户列表
  useEffect(() => {
    if (open) {
      loadUsers()
    }
  }, [open])

  const handleSubmitForm = async (data: FormData) => {
    try {
      setLoading(true)
      setSubmitError('')
      
      const createData: CreateTicketRequest = {
        user_id: data.user_id,
        title: data.title,
        category: data.category,
        priority: data.priority,
        description: data.description,
        assigned_to_id: data.assigned_to_id,
        tags: data.tags || undefined,
        metadata: data.metadata || undefined,
      }

      const response = await ticketService.createTicket(createData)
      
      if (response.code === 0) {
        onOpenChange(false)
        onTicketCreated()
        form.reset()
        toast.success("创建成功", {
          description: `工单 ${response.data?.ticket_no} 已创建`,
        })
      } else {
        throw new Error(response.message || '创建工单失败')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '创建工单失败'
      setSubmitError(errorMessage)
      toast.error("创建失败", {
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFormAction = async (formData: FormData) => {
    // Trigger form validation and submission using react-hook-form
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await handleSubmitForm(values)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
    form.reset()
    setSubmitError('')
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建工单</DialogTitle>
          <DialogDescription>
            为用户创建新的支持工单
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-6">
            {/* 用户选择 */}
            <FormField
              control={form.control}
              name="user_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>选择用户 *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    disabled={loading || loadingUsers}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingUsers ? "正在加载用户..." : "选择用户"} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {loadingUsers ? (
                        <SelectItem value="" disabled>
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            正在加载...
                          </div>
                        </SelectItem>
                      ) : (
                        users.map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              <div className="flex flex-col">
                                <span>{user.username || user.email}</span>
                                {user.username && (
                                  <span className="text-xs text-muted-foreground">{user.email}</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 基本信息 */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">工单信息</h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>标题 *</FormLabel>
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
                      <FormLabel>类别 *</FormLabel>
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
                      <FormLabel>优先级 *</FormLabel>
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
                  name="assigned_to_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>分配给</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)} 
                        disabled={loading || loadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="选择代理人（可选）" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">不分配</SelectItem>
                          {users.map((user) => (
                            <SelectItem key={user.id} value={user.id.toString()}>
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                <span>{user.username || user.email}</span>
                              </div>
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
                    <FormLabel>描述 *</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="详细描述问题或请求" 
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
              <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    创建中...
                  </>
                ) : (
                  '创建工单'
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}