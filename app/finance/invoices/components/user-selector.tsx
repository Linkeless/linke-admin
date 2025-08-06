'use client'

import { useState, useEffect, useMemo } from 'react'
import { Check, ChevronsUpDown, Search, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { userService } from '@/lib/user-service'

interface User {
  id: number
  email: string
  username?: string
  status: string
  created_at: string
}

interface UserSelectorProps {
  value?: number
  onValueChange: (value: number) => void
  placeholder?: string
  disabled?: boolean
}

export function UserSelector({ value, onValueChange, placeholder = "选择用户", disabled = false }: UserSelectorProps) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  // 获取用户列表
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const response = await userService.getUsers({
          page: 1,
          page_size: 100,
          sort_by: 'created_at',
          sort_order: 'desc'
        })
        
        if (response.code === 0) {
          // 处理不同的响应数据结构
          if (response.data && Array.isArray(response.data.items)) {
            setUsers(response.data.items)
          } else if (Array.isArray(response.data)) {
            setUsers(response.data)
          } else {
            setUsers([])
          }
        }
      } catch (error) {
        console.error('获取用户列表失败:', error)
        setUsers([])
      } finally {
        setLoading(false)
      }
    }

    if (open && users.length === 0) {
      fetchUsers()
    }
  }, [open, users.length])

  // 过滤用户
  const filteredUsers = useMemo(() => {
    if (!search) return users
    
    const searchLower = search.toLowerCase()
    return users.filter(user => 
      user.email.toLowerCase().includes(searchLower) ||
      user.username?.toLowerCase().includes(searchLower) ||
      user.id.toString().includes(search)
    )
  }, [users, search])

  // 获取选中的用户
  const selectedUser = users.find(user => user.id === value)

  // 获取用户显示文本
  const getUserDisplayText = (user: User) => {
    return user.username ? `${user.username} (${user.email})` : user.email
  }

  // 获取用户状态变体
  const getStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'active': return 'default'
      case 'inactive': return 'secondary'
      case 'suspended': return 'destructive'
      case 'banned': return 'destructive'
      default: return 'outline'
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between",
            !value && "text-muted-foreground"
          )}
          disabled={disabled}
        >
          {selectedUser ? (
            <div className="flex items-center space-x-2 truncate">
              <User className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{getUserDisplayText(selectedUser)}</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <span>{placeholder}</span>
            </div>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput 
            placeholder="搜索用户..." 
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>
              {loading ? "加载中..." : "未找到用户"}
            </CommandEmpty>
            <CommandGroup>
              {filteredUsers.map((user) => (
                <CommandItem
                  key={user.id}
                  value={user.id.toString()}
                  onSelect={() => {
                    onValueChange(user.id)
                    setOpen(false)
                  }}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === user.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1 flex items-center space-x-2 min-w-0">
                    <User className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-medium">
                        {getUserDisplayText(user)}
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          ID: {user.id}
                        </span>
                        <Badge 
                          variant={getStatusVariant(user.status)} 
                          className="text-xs h-4 px-1"
                        >
                          {user.status}
                        </Badge>
                      </div>
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