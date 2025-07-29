'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Layers, ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          ID
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          服务器组名称
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          创建时间
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
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
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent"
        >
          更新时间
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
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
    header: "操作",
    cell: ({ row }) => {
      const serverGroup = row.original
      
      const handleDelete = async () => {
        if (confirm('确定要删除这个服务器组吗？此操作不可撤销。')) {
          try {
            await serverGroupService.deleteServerGroup(serverGroup.id)
            onServerGroupUpdated()
          } catch (error) {
            console.error('删除服务器组失败:', error)
            alert('删除服务器组失败，请重试')
          }
        }
      }

      return (
        <div className="flex items-center gap-2">
          {/* 查看详情对话框 */}
          <ServerGroupDetailDialog serverGroup={serverGroup} />
          
          {/* 编辑对话框 */}
          <EditServerGroupDialog 
            serverGroup={serverGroup} 
            onServerGroupUpdated={onServerGroupUpdated} 
          />
          
          {/* 更多操作下拉菜单 */}
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
              <DropdownMenuItem 
                onClick={handleDelete}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                删除服务器组
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]