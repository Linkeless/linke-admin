'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { UserPlus, Loader2 } from "lucide-react"

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
import { userService } from "@/lib/user-service"
import { CreateUserRequest, UserDetailResponse } from "@/lib/user-types"

const createUserSchema = z.object({
  email: z
    .string()
    .min(1, "邮箱地址是必填项")
    .email("请输入有效的邮箱地址")
    .max(255, "邮箱地址不能超过 255 个字符"),
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
  role: z.enum(['user', 'admin']).optional(),
  status: z.enum(['active', 'inactive', 'banned']).optional(),
  password: z
    .string()
    .min(6, "密码至少需要 6 个字符")
    .max(255, "密码不能超过 255 个字符")
    .optional()
    .or(z.literal("")),
})

type CreateUserFormValues = z.infer<typeof createUserSchema>

interface CreateUserDialogProps {
  onUserCreated?: (user: UserDetailResponse) => void
  trigger?: React.ReactNode
}

export function CreateUserDialog({ onUserCreated, trigger }: CreateUserDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: "",
      name: "",
      username: "",
      role: "user",
      status: "active",
      password: "",
    },
  })

  const onSubmit = async (values: CreateUserFormValues) => {
    try {
      setIsLoading(true)
      
      // 准备API请求数据
      const createUserData: CreateUserRequest = {
        email: values.email,
      }
      
      // 只添加非空字段
      if (values.name && values.name.trim()) createUserData.name = values.name.trim()
      if (values.username && values.username.trim()) createUserData.username = values.username.trim()
      if (values.password && values.password.trim()) createUserData.password = values.password.trim()
      if (values.role) createUserData.role = values.role
      if (values.status) createUserData.status = values.status

      console.log('创建用户请求数据:', createUserData)
      
      const response = await userService.createUser(createUserData)
      
      if (response.code === 0 && response.data) {
        console.log('用户创建成功:', response.data)
        
        // 重置表单
        form.reset()
        
        // 关闭对话框
        setOpen(false)
        
        // 通知父组件用户已创建
        onUserCreated?.(response)
        
        // TODO: 添加成功提示
        console.log('用户创建成功')
      } else {
        throw new Error(response.message || '创建用户失败')
      }
    } catch (error) {
      console.error('创建用户失败:', error)
      // TODO: 添加错误提示
      alert(error instanceof Error ? error.message : '创建用户失败')
    } finally {
      setIsLoading(false)
    }
  }

  const defaultTrigger = (
    <Button>
      <UserPlus className="mr-2 h-4 w-4" />
      创建用户
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>创建新用户</DialogTitle>
          <DialogDescription>
            填写用户基本信息来创建新的用户账号。只有邮箱地址是必填项，其他字段可选。
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择用户角色" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">普通用户</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    默认为普通用户
                  </FormDescription>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="选择用户状态" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">活跃</SelectItem>
                      <SelectItem value="inactive">未激活</SelectItem>
                      <SelectItem value="banned">已封禁</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    默认为活跃状态
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 密码 */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="留空将发送邮件邀请用户设置密码" 
                      type="password"
                      {...field} 
                    />
                  </FormControl>
                  <FormDescription>
                    至少6个字符，留空将通过邮件邀请用户设置
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isLoading}
              >
                取消
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? '创建中...' : '创建用户'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}