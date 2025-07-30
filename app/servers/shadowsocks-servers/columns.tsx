'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, Server, Shield, Activity, ChevronsUpDown, Eye, Edit } from "lucide-react"

import { Button } from "@/components/ui/button"
// import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { ShadowsocksServerResponse } from "@/lib/shadowsocks-types"
import { shadowsocksServerService } from "@/lib/shadowsocks-service"
import { 
  EditServerDialog, 
  ServerDetailDialog
} from "@/components/servers/shadowsocks-servers"

interface ColumnsProps {
  onServerUpdated: () => void
}

export const createColumns = ({ onServerUpdated }: ColumnsProps): ColumnDef<ShadowsocksServerResponse>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          服务器名称
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const server = row.original
      return (
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium">{server.name}</span>
            <span className="text-sm text-muted-foreground">
              {shadowsocksServerService.formatServerAddress(server)}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "cipher",
    header: () => <div className="text-center">加密方式</div>,
    cell: ({ row }) => {
      const server = row.original
      return (
        <div className="text-center">
          <div className="flex items-center gap-2 justify-center">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <Badge variant="outline">
              {shadowsocksServerService.getCipherDisplayName(server.cipher)}
            </Badge>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "show",
    header: () => <div className="text-center">显示状态</div>,
    cell: ({ row }) => {
      const server = row.original
      const isVisible = server.show === 1
      
      return (
        <div className="text-center">
          <Badge 
            variant={isVisible ? "default" : "secondary"} 
            className={`text-xs ${isVisible ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}
          >
            {isVisible ? "显示" : "隐藏"}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "rate",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          倍率
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const server = row.original
      return (
        <div className="text-center">
          <div className="flex items-center gap-1 justify-center">
            <Activity className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {shadowsocksServerService.formatRateMultiplier(server.rate)}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "sort",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          排序
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const server = row.original
      return (
        <div className="text-center">
          <Badge variant="outline" className="text-xs">
            {server.sort}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "parent_id", 
    header: "父服务器",
    cell: ({ row }) => {
      const server = row.original
      if (!server.parent_id) {
        return <span className="text-sm text-muted-foreground">-</span>
      }
      return (
        <Badge variant="secondary" className="text-xs">
          ID: {server.parent_id}
        </Badge>
      )
    },
  },
  {
    accessorKey: "group_id",
    header: "服务器组",
    cell: ({ row }) => {
      const server = row.original
      return (
        <Badge variant="outline">
          {server.server_group?.name || `组 ${server.group_id}`}
        </Badge>
      )
    },
  },
  {
    accessorKey: "obfs",
    header: "混淆方式",
    cell: ({ row }) => {
      const server = row.original
      const obfsDisplay = shadowsocksServerService.getObfsDisplayName(server.obfs)
      
      return (
        <Badge variant="secondary" className="text-xs">
          {obfsDisplay}
        </Badge>
      )
    },
  },
  {
    accessorKey: "tags",
    header: "标签",
    cell: ({ row }) => {
      const server = row.original
      if (!server.tags) {
        return <span className="text-sm text-muted-foreground">-</span>
      }
      
      const tagList = server.tags.split(',').filter(tag => tag.trim()).slice(0, 2)
      return (
        <div className="flex gap-1 flex-wrap">
          {tagList.map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag.trim()}
            </Badge>
          ))}
          {server.tags.split(',').filter(tag => tag.trim()).length > 2 && (
            <Badge variant="outline" className="text-xs">
              +{server.tags.split(',').filter(tag => tag.trim()).length - 2}
            </Badge>
          )}
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
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          创建时间
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const server = row.original
      return (
        <span className="text-sm text-muted-foreground">
          {shadowsocksServerService.formatDateTime(server.created_at)}
        </span>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const server = row.original
      
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
              onClick={() => navigator.clipboard.writeText(server.id.toString())}
            >
              复制服务器ID
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(shadowsocksServerService.formatServerAddress(server))}
            >
              复制服务器地址
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ServerDetailDialog 
              server={server}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Eye className="mr-2 h-4 w-4" />
                  查看详情
                </div>
              }
            />
            <EditServerDialog 
              server={server} 
              onServerUpdated={onServerUpdated}
              trigger={
                <div className="cursor-pointer flex items-center px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground">
                  <Edit className="mr-2 h-4 w-4" />
                  编辑服务器
                </div>
              }
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(server)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除服务器
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      
      function handleDelete(server: ShadowsocksServerResponse) {
        if (confirm('确定要删除这台服务器吗？此操作不可撤销。')) {
          shadowsocksServerService.deleteServer(server.id)
            .then(() => onServerUpdated())
            .catch((error) => {
              console.error('删除服务器失败:', error)
              alert('删除服务器失败，请重试')
            })
        }
      }
    },
  },
]