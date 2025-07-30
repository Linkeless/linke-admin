'use client'

import { ColumnDef } from "@tanstack/react-table"
import { MoreHorizontal, Trash2, TicketCheck, User, MessageSquare, ChevronsUpDown, Edit, UserCheck, X } from "lucide-react"

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
import { TicketResponse } from "@/lib/ticket-types"
import { ticketService } from "@/lib/ticket-service"

interface ColumnsProps {
  onTicketUpdated: () => void
  onEdit: (ticket: TicketResponse) => void
  onViewMessages: (ticket: TicketResponse) => void
}

export const createColumns = ({ 
  onTicketUpdated, 
  onEdit, 
  onViewMessages 
}: ColumnsProps): ColumnDef<TicketResponse>[] => [
  {
    accessorKey: "ticket_no", // API 使用 ticket_no
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium hover:bg-transparent justify-start"
        >
          工单号
          <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const ticket = row.original
      return (
        <div className="flex items-center gap-2">
          <TicketCheck className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium font-mono">
              {ticketService.formatTicketNumber(ticket.ticket_no)} {/* 使用 ticket_no */}
            </span>
            <span className="text-sm text-muted-foreground truncate max-w-[200px]">
              {ticket.title}
            </span>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "user",
    header: "提交者",
    cell: ({ row }) => {
      const ticket = row.original
      return (
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">
              {ticket.user?.username || ticket.user?.email || `用户 ${ticket.user_id}`}
            </span>
            {ticket.user?.email && ticket.user?.username && (
              <span className="text-xs text-muted-foreground">
                {ticket.user.email}
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "category",
    header: () => <div className="text-center">类别</div>,
    cell: ({ row }) => {
      const ticket = row.original
      const categoryInfo = ticketService.getCategoryInfo(ticket.category)
      
      return (
        <div className="text-center">
          <Badge variant="secondary" className={`text-xs ${categoryInfo.color}`}>
            {categoryInfo.label}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "priority",
    header: ({ column }) => {
      return (
        <div className="text-center">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-medium hover:bg-transparent justify-center"
          >
            优先级
            <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
          </Button>
        </div>
      )
    },
    cell: ({ row }) => {
      const ticket = row.original
      const priorityInfo = ticketService.getPriorityInfo(ticket.priority)
      
      return (
        <div className="text-center">
          <Badge variant="secondary" className={`text-xs ${priorityInfo.color}`}>
            {priorityInfo.label}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "status",
    header: () => <div className="text-center">状态</div>,
    cell: ({ row }) => {
      const ticket = row.original
      const statusInfo = ticketService.getStatusInfo(ticket.status)
      
      return (
        <div className="text-center">
          <Badge variant="secondary" className={`text-xs ${statusInfo.color}`}>
            {statusInfo.label}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: "assigned_to",
    header: "分配给",
    cell: ({ row }) => {
      const ticket = row.original
      
      if (!ticket.assigned_to_id || !ticket.assigned_to) {
        return (
          <span className="text-sm text-muted-foreground">未分配</span>
        )
      }

      return (
        <div className="flex items-center gap-2">
          <UserCheck className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">
            {ticket.assigned_to.username || ticket.assigned_to.email}
          </span>
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
      const ticket = row.original
      return (
        <div className="text-sm">
          <div>{ticketService.formatDateTime(ticket.created_at)}</div>
          <div className="text-muted-foreground">
            {new Date(ticket.created_at).toLocaleTimeString('zh-CN', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: "last_response_at",
    header: "最后响应",
    cell: ({ row }) => {
      const ticket = row.original
      
      if (!ticket.last_response_at) {
        return (
          <span className="text-sm text-muted-foreground">无响应</span>
        )
      }

      const responseTime = ticketService.calculateResponseTime(
        ticket.created_at, 
        ticket.last_response_at
      )

      return (
        <div className="text-sm">
          <div>{ticket.last_response_at ? ticketService.formatDateTime(ticket.last_response_at) : '无响应'}</div>
          <div className="text-muted-foreground">
            {responseTime !== '未响应' ? `响应时间: ${responseTime}` : responseTime}
          </div>
        </div>
      )
    },
  },
  {
    id: "actions",
    enableHiding: false,
    cell: ({ row }) => {
      const ticket = row.original
      
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
              onClick={() => navigator.clipboard.writeText(ticket.ticket_no)}
            >
              复制工单号
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(ticket.id.toString())}
            >
              复制工单ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onViewMessages(ticket)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              查看消息
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(ticket)}>
              <Edit className="mr-2 h-4 w-4" />
              编辑工单
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
              <DropdownMenuItem onClick={() => handleResolve(ticket)}>
                <UserCheck className="mr-2 h-4 w-4" />
                标记为已解决
              </DropdownMenuItem>
            )}
            {ticket.status !== 'closed' && (
              <DropdownMenuItem onClick={() => handleClose(ticket)}>
                <X className="mr-2 h-4 w-4" />
                关闭工单
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleDelete(ticket)}
              className="text-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              删除工单
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
      
      function handleDelete(ticket: TicketResponse) {
        if (confirm('确定要删除这个工单吗？此操作不可撤销。')) {
          ticketService.deleteTicket(ticket.id)
            .then(() => onTicketUpdated())
            .catch((error) => {
              console.error('删除工单失败:', error)
              alert('删除工单失败，请重试')
            })
        }
      }

      function handleClose(ticket: TicketResponse) {
        if (confirm('确定要关闭这个工单吗？')) {
          ticketService.closeTicket(ticket.id)
            .then(() => onTicketUpdated())
            .catch((error) => {
              console.error('关闭工单失败:', error)
              alert('关闭工单失败，请重试')
            })
        }
      }

      function handleResolve(ticket: TicketResponse) {
        const resolution = prompt('请输入解决方案:')
        if (resolution) {
          ticketService.resolveTicket(ticket.id, { resolution })
            .then(() => onTicketUpdated())
            .catch((error) => {
              console.error('解决工单失败:', error)
              alert('解决工单失败，请重试')
            })
        }
      }
    },
  },
]