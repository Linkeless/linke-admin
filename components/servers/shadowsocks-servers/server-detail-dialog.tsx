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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, Server, Shield, Activity, Globe, Clock } from "lucide-react"
import { ShadowsocksServerResponse } from "@/lib/shadowsocks-types"
import { serverQueryUtils } from "@/hooks/queries/use-servers"

interface ServerDetailDialogProps {
  server: ShadowsocksServerResponse
  children?: React.ReactNode
}

export function ServerDetailDialog({ server, children }: ServerDetailDialogProps) {
  const isVisible = serverQueryUtils.getServerShowStatus(server)
  // 注意：后端模型中没有status字段，移除状态相关代码
  
  return (
    <Dialog>
      <DialogTrigger asChild>
        {children || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            {server.name}
          </DialogTitle>
          <DialogDescription>
            服务器ID: {server.id} | 创建时间: {serverQueryUtils.formatDateTime(server.created_at)}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 基本信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-4 w-4" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">服务器名称</label>
                  <p className="text-sm">{server.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">主机地址</label>
                  <p className="text-sm font-mono">{server.host}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">端口</label>
                  <p className="text-sm font-mono">{server.server_port}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">服务器组</label>
                  <Badge variant="outline">组 {server.group_id}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 加密配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Shield className="h-4 w-4" />
                加密配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">加密方式</label>
                  <Badge variant="outline">
                    {serverQueryUtils.getCipherDisplayName(server.cipher)}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">混淆方式</label>
                  <Badge variant="secondary">
                    {serverQueryUtils.getObfsDisplayName(server.obfs)}
                  </Badge>
                </div>
              </div>
              
              {server.obfs_settings && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">混淆设置</label>
                  <p className="text-sm font-mono bg-muted p-2 rounded">{server.obfs_settings}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 网络配置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-4 w-4" />
                网络配置
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">速率限制</label>
                <p className="text-sm">{serverQueryUtils.formatRateMultiplier(server.rate)}</p>
              </div>
              
              {server.ips && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">允许IP范围</label>
                  <pre className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">{server.ips}</pre>
                </div>
              )}
              
              {server.excludes && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">排除IP范围</label>
                  <pre className="text-sm bg-muted p-2 rounded whitespace-pre-wrap">{server.excludes}</pre>
                </div>
              )}
            </CardContent>
          </Card>

          {/* 显示设置 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Eye className="h-4 w-4" />
                显示设置
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">用户端显示</span>
                <Badge variant={isVisible ? "default" : "secondary"}>
                  {isVisible ? "显示" : "隐藏"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* 时间信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-4 w-4" />
                时间信息
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-muted-foreground">创建时间</span>
                <span className="text-sm">{serverQueryUtils.formatDateTime(server.created_at)}</span>
              </div>
              {server.updated_at && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-muted-foreground">更新时间</span>
                  <span className="text-sm">{serverQueryUtils.formatDateTime(server.updated_at)}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}