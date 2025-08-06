'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Layers, Eye, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ServerGroupResponse } from "@/lib/server-group-types"
import { serverGroupService } from "@/lib/server-group-service"
import { 
  EditServerGroupDialog, 
  ServerGroupDetailDialog
} from "@/components/servers/server-groups"

interface ColumnsProps {
  onServerGroupUpdated: () => void
}

export const createColumns = ({ onServerGroupUpdated }: ColumnsProps): ColumnDef<ServerGroupResponse>[] => [
  {
    accessorKey: "id",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => {
      const serverGroup = row.original
      return (
        <Badge variant="outline" className="text-xs font-mono">
          {serverGroup.id}
        </Badge>
      )
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="服务器组名称" />
    ),
    cell: ({ row }) => {
      const serverGroup = row.original
      return (
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">{serverGroup.name}</span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="创建时间" />
    ),
    cell: ({ row }) => {
      const serverGroup = row.original
      return (
        <span className="text-sm text-muted-foreground">
          {serverGroupService.formatDateTime(serverGroup.created_at)}
        </span>
      )
    },
  },
  {
    accessorKey: "updated_at",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="更新时间" />
    ),
    cell: ({ row }) => {
      const serverGroup = row.original
      return (
        <span className="text-sm text-muted-foreground">
          {serverGroupService.formatDateTime(serverGroup.updated_at)}
        </span>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const serverGroup = row.original
      
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">打开菜单</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>操作</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(serverGroup.id.toString())}
            >
              复制服务器组ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(serverGroup.name)}
            >
              复制服务器组名称
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ServerGroupDetailDialog 
              serverGroup={serverGroup}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </div>
              }
            />
            <EditServerGroupDialog 
              serverGroup={serverGroup} 
              onServerGroupUpdated={onServerGroupUpdated}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Edit className="mr-2 h-4 w-4" />
                  编辑服务器组
                </div>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(serverGroup)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除服务器组
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      
      function handleDelete(serverGroup: ServerGroupResponse) {
        if (confirm('确定要删除这个服务器组吗？此操作不可撤销。')) {
          serverGroupService.deleteServerGroup(serverGroup.id)
            .then(() => onServerGroupUpdated())
            .catch((error) => {
              console.error('删除服务器组失败:', error)
              alert('删除服务器组失败，请重试')
            })
        }
      }
    },
  },
]