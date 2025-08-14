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
import { useUpdateUserStatus } from '@/hooks/mutations/use-user-mutations'
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

  // 使用React Query mutation hook
  const updateStatusMutation = useUpdateUserStatus({
    onSuccess: (data) => {
      if (data.code === 0) {
        setOpen(false)
        onUpdate?.()
      }
    }
  })

  const currentStatus = user.status

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === currentStatus) {
      setOpen(false)
      return
    }

    // 使用React Query mutation执行状态更新
    updateStatusMutation.mutate({ id: user.id, status: newStatus })
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
          disabled={updateStatusMutation.isPending}
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