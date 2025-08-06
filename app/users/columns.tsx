"use client"

import { ColumnDef } from "@tanstack/react-table"
import {
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Key,
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { ProviderIcon } from "@/components/ui/provider-icon"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { userService } from "@/lib/user-service"
import { UserResponse } from "@/lib/user-types"
import { EditUserDialog, UserDetailDialog, QuickEditRole, QuickEditStatus, ResetPasswordDialog } from "@/components/users"

interface ColumnsOptions {
  onUserUpdated?: () => void
}

export const createColumns = (options?: ColumnsOptions): ColumnDef<UserResponse>[] => [
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
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">
        {row.getValue("id")}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="用户" />
    ),
    cell: ({ row }) => {
      const user = row.original
      return (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={userService.getUserAvatarUrl(user)} />
            <AvatarFallback>
              {userService.formatUserDisplayName(user).slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">
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
    header: () => <div>角色</div>,
    cell: ({ row }) => {
      const user = row.original
      return (
        <div>
          <QuickEditRole 
            user={user} 
            onUpdate={options?.onUserUpdated}
          />
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <div>状态</div>,
    cell: ({ row }) => {
      const user = row.original
      return (
        <div>
          <QuickEditStatus 
            user={user} 
            onUpdate={options?.onUserUpdated}
          />
        </div>
      )
    },
  },
  {
    id: "providers",
    header: () => <div>登录方式</div>,
    cell: ({ row }) => {
      const user = row.original
      const providers = userService.getUserProviders(user)
      
      return (
        <div>
          <div className="flex flex-wrap gap-1">
            {providers.map((provider) => {
              const config = userService.getProviderBadgeConfig(provider)
              return (
                <Badge 
                  key={provider} 
                  variant="outline" 
                  className={`${config.className} text-xs`}
                >
                  <ProviderIcon provider={config.iconType} className="mr-1 h-3 w-3" />
                  {config.label}
                </Badge>
              )
            })}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="注册时间" />
    ),
    cell: ({ row }) => (
      <div className="text-sm text-muted-foreground">
        {userService.formatDateTime(row.getValue("created_at"))}
      </div>
    ),
  },
  {
    accessorKey: "last_login_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="最后登录" />
    ),
    cell: ({ row }) => {
      const lastLogin = row.getValue("last_login_at") as string | null
      return (
        <div className="text-sm text-muted-foreground">
          {lastLogin ? userService.formatDateTime(lastLogin) : '从未登录'}
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const user = row.original
      
      const handleDeleteUser = async (user: UserResponse) => {
        if (!confirm(`确定要删除用户 "${userService.formatUserDisplayName(user)}" 吗？此操作不可撤销。`)) {
          return
        }
        
        try {
          await userService.deleteUser(user.id)
          options?.onUserUpdated?.()
        } catch (error) {
          console.error('删除用户失败:', error)
          alert('删除用户失败，请重试')
        }
      }
      
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
            <EditUserDialog 
              user={user} 
              onUserUpdated={options?.onUserUpdated}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Edit className="mr-2 h-4 w-4" />
                  编辑用户
                </div>
              }
            />
            <ResetPasswordDialog
              user={user}
              onPasswordReset={options?.onUserUpdated}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Key className="mr-2 h-4 w-4" />
                  重置密码
                </div>
              }
            />
            <DropdownMenuSeparator />
            <div 
              className="cursor-pointer flex items-center px-2 py-1.5 text-sm text-destructive hover:bg-accent hover:text-accent-foreground" 
              onClick={() => handleDeleteUser(user)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除用户
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

// 默认导出（向后兼容）
export const columns = createColumns()