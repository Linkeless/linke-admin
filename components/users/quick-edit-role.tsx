'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { userService } from '@/lib/user-service'
import { UserResponse } from '@/lib/user-types'
import { cn } from '@/lib/utils'

interface QuickEditRoleProps {
  user: UserResponse
  onUpdate?: () => void
}

const roleOptions = [
  { value: 'user', label: '普通用户', description: '标准用户权限' },
  { value: 'admin', label: '管理员', description: '系统管理员权限' },
  { value: 'system', label: '系统用户', description: '系统内部用户' },
]

export function QuickEditRole({ user, onUpdate }: QuickEditRoleProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentRole = user.role

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) {
      setOpen(false)
      return
    }

    try {
      setLoading(true)
      await userService.updateUserRole(user.id, newRole)
      setOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error('更新用户角色失败:', error)
      
      // 显示用户友好的错误提示
      let errorMessage = '更新用户角色失败'
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
          errorMessage = `更新失败: ${error.message}`
        }
      }
      
      alert(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getRoleDisplay = (role: string) => {
    const config = userService.getUserRoleBadgeConfig(role)
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 hover:bg-transparent"
          disabled={loading}
        >
          {getRoleDisplay(currentRole)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>未找到角色</CommandEmpty>
            <CommandGroup>
              {roleOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleRoleChange(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentRole === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {option.description}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}