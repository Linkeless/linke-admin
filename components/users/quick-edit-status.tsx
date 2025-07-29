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

interface QuickEditStatusProps {
  user: UserResponse
  onUpdate?: () => void
}

const statusOptions = [
  { value: 'active', label: '活跃', description: '用户账号正常', color: 'bg-green-500' },
  { value: 'inactive', label: '未激活', description: '用户尚未激活账号', color: 'bg-yellow-500' },
  { value: 'suspended', label: '暂停', description: '账号被临时暂停', color: 'bg-orange-500' },
  { value: 'banned', label: '封禁', description: '账号被永久封禁', color: 'bg-red-500' },
]

export function QuickEditStatus({ user, onUpdate }: QuickEditStatusProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const currentStatus = user.status

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setOpen(false)
      return
    }

    try {
      setLoading(true)
      await userService.updateUserStatus(user.id, newStatus)
      setOpen(false)
      onUpdate?.()
    } catch (error) {
      console.error('更新用户状态失败:', error)
      
      // 显示用户友好的错误提示
      let errorMessage = '更新用户状态失败'
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

  const getStatusDisplay = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status)
    if (!option) {
      return (
        <Badge variant="outline">
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {status || '未知'}
          </div>
        </Badge>
      )
    }

    const config = userService.getUserStatusBadgeConfig(status)
    return (
      <Badge variant={config.variant} className={config.className}>
        <div className="flex items-center gap-1">
          <div className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
          {config.label}
        </div>
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
          {getStatusDisplay(currentStatus)}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command>
          <CommandList>
            <CommandEmpty>未找到状态</CommandEmpty>
            <CommandGroup>
              {statusOptions.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  onSelect={() => handleStatusChange(option.value)}
                  className="cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      currentStatus === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${option.color}`} />
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
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