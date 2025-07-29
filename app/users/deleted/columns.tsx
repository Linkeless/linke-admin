"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  MoreHorizontal,
  RotateCcw,
  Trash2,
  Eye,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ProviderIcon } from "@/components/ui/provider-icon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { userService } from "@/lib/user-service"
import { UserResponse } from "@/lib/user-types"
import { UserDetailDialog } from "@/components/users"

interface ColumnsOptions {
  onUserRestored?: () => void
}

const handleRestoreUser = async (user: UserResponse, onUserRestored?: () => void) => {
  try {
    const confirmed = confirm(`确定要恢复用户 "${userService.formatUserDisplayName(user)}" 吗？`)
    if (!confirmed) return

    await userService.restoreUser(user.id)
    onUserRestored?.()
    alert('用户恢复成功！')
  } catch (error) {
    console.error('恢复用户失败:', error)
    alert('恢复用户失败，请重试')
  }
}

const handlePermanentDelete = async (user: UserResponse, onUserRestored?: () => void) => {
  try {
    const confirmed = confirm(`警告：确定要永久删除用户 "${userService.formatUserDisplayName(user)}" 吗？此操作不可恢复！`)
    if (!confirmed) return

    // 注意：这里应该调用永久删除API，但根据当前swagger文档，似乎没有永久删除的API
    // 暂时使用常规删除API
    await userService.deleteUser(user.id)
    onUserRestored?.()
    alert('用户已永久删除！')
  } catch (error) {
    console.error('永久删除用户失败:', error)
    alert('永久删除用户失败，请重试')
  }
}

export const createDeletedUsersColumns = (options?: ColumnsOptions): ColumnDef<UserResponse>[] => [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="全选"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="选择行"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.getValue("id")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "用户",
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 opacity-50">
            <AvatarImage src={userService.getUserAvatarUrl(user)} />
            <AvatarFallback>
              {userService.formatUserDisplayName(user).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium text-muted-foreground">
              {userService.formatUserDisplayName(user)}
            </div>
            <div className="text-sm text-muted-foreground">
              {user.email}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "role",
    header: "角色",
    cell: ({ row }) => {
      const role = row.getValue("role") as string
      const config = userService.getUserRoleBadgeConfig(role)
      return (
        <Badge variant="outline" className="opacity-50">
          {config.label}
        </Badge>
      )
    },
  },
  {
    id: "providers",
    header: "登录方式",
    cell: ({ row }) => {
      const user = row.original
      const providers = userService.getUserProviders(user)
      
      return (
        <div className="flex flex-wrap gap-1">
          {providers.map((provider) => {
            const config = userService.getProviderBadgeConfig(provider)
            return (
              <Badge 
                key={provider} 
                variant="outline" 
                className={`${config.className} text-xs opacity-50`}
              >
                <ProviderIcon provider={config.iconType} className="mr-1 h-3 w-3" />
                {config.label}
              </Badge>
            )
          })}
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: "注册时间",
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {userService.formatDateTime(row.getValue("created_at"))}
      </div>
    ),
  },
  {
    accessorKey: "deleted_at",
    header: "删除时间",
    cell: ({ row }) => {
      const deletedAt = row.getValue("deleted_at") as string | null
      return (
        <div className="text-sm text-muted-foreground">
          {deletedAt ? userService.formatDateTime(deletedAt) : '未知'}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <UserDetailDialog 
              user={user}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </div>
              }
            />
            <div 
              className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground" 
              onClick={() => handleRestoreUser(user, options?.onUserRestored)}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              恢复用户
            </div>
            <DropdownMenuSeparator />
            <div 
              className="cursor-pointer flex items-center px-2 py-1.5 text-sm text-destructive hover:bg-accent hover:text-accent-foreground" 
              onClick={() => handlePermanentDelete(user, options?.onUserRestored)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              永久删除
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// 默认导出（向后兼容）
export const deletedUsersColumns = createDeletedUsersColumns()