'use client'

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Edit, Loader2 } from "lucide-react"

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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateUser } from "@/hooks/mutations/use-user-mutations"
import { UpdateUserRequest, UserResponse, UserDetailResponse } from "@/lib/user-types"

const editUserSchema = z.object({
  name: z
    .string()
    .max(255, "姓名不能超过 255 个字符")
    .optional()
    .or(z.literal("")),
  username: z
    .string()
    .max(100, "用户名不能超过 100 个字符")
    .optional()
    .or(z.literal("")),
  email: z
    .string()
    .min(1, "邮箱地址是必填项")
    .email("请输入有效的邮箱地址")
    .max(255, "邮箱地址不能超过 255 个字符"),
  role: z.enum(['user', 'admin', 'system']).optional(),
  status: z.enum(['active', 'inactive', 'suspended', 'banned']).optional(),
})

type EditUserFormValues = z.infer<typeof editUserSchema>

interface EditUserDialogProps {
  user: UserResponse
  onUserUpdated?: (user: UserDetailResponse) => void
  trigger?: React.ReactNode
}

export function EditUserDialog({ user, onUserUpdated, trigger }: EditUserDialogProps) {
  const [open, setOpen] = useState(false)
  
  // 使用React Query mutation hook
  const updateUserMutation = useUpdateUser({
    onSuccess: (data) => {
      if (data.code === 0) {
        // 关闭对话框
        setOpen(false)
        // 通知父组件用户已更新
        onUserUpdated?.(data)
      }
    }
  })

  const form = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserSchema),
    defaultValues: {
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      role: user.role || "user",
      status: user.status || "active",
    },
  })

  // 当用户数据变化时更新表单
  useEffect(() => {
    form.reset({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      role: user.role || "user",
      status: user.status || "active",
    })
  }, [user, form])

  const handleSubmit = async (values: EditUserFormValues) => {
    // 准备API请求数据 - 只包含有变化的字段
    const updateUserData: UpdateUserRequest = {}
    
    // 比较并添加变化的字段
    if (values.name !== user.name) updateUserData.name = values.name || undefined
    if (values.username !== user.username) updateUserData.username = values.username || undefined
    if (values.email !== user.email) updateUserData.email = values.email
    if (values.role !== user.role) updateUserData.role = values.role
    if (values.status !== user.status) updateUserData.status = values.status

    // 如果没有变化，直接关闭对话框
    if (Object.keys(updateUserData).length === 0) {
      setOpen(false)
      return
    }

    // 使用React Query mutation执行更新操作
    updateUserMutation.mutate({ id: user.id, data: updateUserData })
  }

  const handleFormAction = async (formData: FormData) => {
    // Trigger form validation and submission using react-hook-form
    const isValid = await form.trigger()
    if (isValid) {
      const values = form.getValues()
      await handleSubmit(values)
    }
  }

  const defaultTrigger = (
    <Button variant="ghost" size="sm">
      <Edit className="h-4 w-4" />
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑用户</DialogTitle>
          <DialogDescription>
            修改用户 {user.email} 的基本信息。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form action={handleFormAction} className="space-y-4">
            {/* 邮箱地址 */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱地址 *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="user@example.com" 
                      type="email"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 姓名 */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>姓名</FormLabel>
                  <FormControl>
                    <Input placeholder="张三" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 用户名 */}
            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户名</FormLabel>
                  <FormControl>
                    <Input placeholder="zhangsan" {...field} />
                  </FormControl>
                  <FormDescription>
                    最多100个字符
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 角色 */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户角色</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择用户角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">普通用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                      <SelectItem value="system">系统用户</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 状态 */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>用户状态</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择用户状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">活跃</SelectItem>
                      <SelectItem value="inactive">未激活</SelectItem>
                      <SelectItem value="suspended">暂停</SelectItem>
                      <SelectItem value="banned">已封禁</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={updateUserMutation.isPending}
              >
                取消
              </Button>
              <Button type="submit" disabled={updateUserMutation.isPending}>
                {updateUserMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {updateUserMutation.isPending ? '保存中...' : '保存更改'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}