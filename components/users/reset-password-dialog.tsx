'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Key, Eye, EyeOff } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { userService } from '@/lib/user-service'
import { UserResponse } from '@/lib/user-types'

const resetPasswordSchema = z.object({
  newPassword: z
    .string()
    .min(6, '密码长度至少6个字符')
    .max(255, '密码长度不能超过255个字符'),
  confirmPassword: z
    .string()
    .min(6, '确认密码长度至少6个字符'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof resetPasswordSchema>

interface ResetPasswordDialogProps {
  user: UserResponse
  trigger?: React.ReactNode
  onPasswordReset?: () => void
}

export function ResetPasswordDialog({ 
  user, 
  trigger, 
  onPasswordReset 
}: ResetPasswordDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: '',
      confirmPassword: '',
    },
  })

  // 检查用户是否为本地账号
  const isLocalAccount = () => {
    return !user.google_id && !user.github_id && !user.telegram_id && 
           (!user.provider || user.provider === 'local')
  }

  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await userService.resetUserPassword(user.id, data.newPassword)
      
      setOpen(false)
      form.reset()
      onPasswordReset?.()
      
      // 显示成功提示
      alert('密码重置成功！')
    } catch (error) {
      console.error('重置密码失败:', error)
      
      let errorMessage = '重置密码失败'
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          errorMessage = '网络连接失败，请检查后端服务是否运行'
        } else if (error.message.includes('401')) {
          errorMessage = '认证失败，请重新登录'
        } else if (error.message.includes('403')) {
          errorMessage = '权限不足，无法执行此操作'
        } else if (error.message.includes('404')) {
          errorMessage = '用户不存在'
        } else {
          errorMessage = `重置失败: ${error.message}`
        }
      }
      
      alert(errorMessage)
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

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Key className="h-4 w-4 mr-2" />
      重置密码
    </Button>
  )

  if (!isLocalAccount()) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>无法重置密码</DialogTitle>
            <DialogDescription>
              此用户使用第三方登录（OAuth），无法重置密码。
            </DialogDescription>
          </DialogHeader>
          <Alert>
            <Key className="h-4 w-4" />
            <AlertDescription>
              OAuth用户需要通过其原始登录提供商（Google、GitHub、Telegram等）来重置密码。
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              确定
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>重置用户密码</DialogTitle>
          <DialogDescription>
            为用户 &ldquo;{userService.formatUserDisplayName(user)}&rdquo; 设置新密码
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form action={handleFormAction} className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>新密码</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? 'text' : 'password'}
                        placeholder="请输入新密码"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormDescription>
                    密码长度需要6-255个字符
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="请再次输入新密码"
                        disabled={loading}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={loading}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setOpen(false)
                  form.reset()
                }}
                disabled={loading}
              >
                取消
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? '重置中...' : '重置密码'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}