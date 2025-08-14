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
import { useUpdateUserRole } from '@/hooks/mutations/use-user-mutations'
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

  // 使用React Query mutation hook
  const updateRoleMutation = useUpdateUserRole({
    onSuccess: (data) => {
      if (data.code === 0) {
        setOpen(false)
        onUpdate?.()
      }
    }
  })

  const currentRole = user.role

  const handleRoleChange = async (newRole: string) => {
    if (newRole === currentRole) {
      setOpen(false)
      return
    }

    // 使用React Query mutation执行角色更新
    updateRoleMutation.mutate({ id: user.id, role: newRole })
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
          disabled={updateRoleMutation.isPending}
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