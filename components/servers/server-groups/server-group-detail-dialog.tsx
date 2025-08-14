'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, Layers, Calendar, Clock } from "lucide-react"

import { ServerGroupResponse } from "@/lib/server-group-types"
import { serverQueryUtils } from "@/hooks/queries/use-servers"

interface ServerGroupDetailDialogProps {
  serverGroup: ServerGroupResponse
}

export function ServerGroupDetailDialog({ serverGroup }: ServerGroupDetailDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            服务器组详情
          </DialogTitle>
          <DialogDescription>
            查看服务器组的详细信息
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 基本信息 */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">ID</span>
              <Badge variant="outline" className="font-mono">
                {serverGroup.id}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">名称</span>
              <span className="text-sm font-medium">
                {serverGroup.name}
              </span>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                创建时间
              </span>
              <div className="text-right">
                <span className="text-sm">
                  {serverQueryUtils.formatDateTime(serverGroup.created_at)}
                </span>
                <div className="text-xs text-muted-foreground">
                  {new Date(serverGroup.created_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>

            <div className="flex justify-between items-start">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Clock className="h-4 w-4" />
                更新时间
              </span>
              <div className="text-right">
                <span className="text-sm">
                  {serverQueryUtils.formatDateTime(serverGroup.updated_at)}
                </span>
                <div className="text-xs text-muted-foreground">
                  {new Date(serverGroup.updated_at).toLocaleDateString('zh-CN', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 分隔线 */}
          <div className="border-t pt-4">
            <div className="text-xs text-muted-foreground">
              服务器组用于将服务器进行分类管理，方便用户按地区或类型选择服务器。
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}