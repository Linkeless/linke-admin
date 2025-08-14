"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Server, Shield, Activity, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ShadowsocksServerResponse } from "@/lib/shadowsocks-types"
import { serverQueryUtils } from "@/hooks/queries/use-servers"
import { 
  EditServerDialog, 
  ServerDetailDialog
} from "@/components/servers/shadowsocks-servers"

interface ShadowsocksServerMobileCardProps {
  server: ShadowsocksServerResponse
  onServerUpdated: () => void
}

export function ShadowsocksServerMobileCard({ 
  server, 
  onServerUpdated 
}: ShadowsocksServerMobileCardProps) {
  const [isOpen, setIsOpen] = React.useState(false)

  const isVisible = server.show === 1

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            {/* 服务器名称和地址 */}
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold leading-none tracking-tight truncate">
                  {server.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1 truncate">
                  {serverQueryUtils.formatServerAddress(server)}
                </p>
              </div>
            </div>

            {/* 关键信息 */}
            <div className="flex flex-wrap gap-2">
              {/* 显示状态 */}
              <Badge 
                variant={isVisible ? "default" : "secondary"} 
                className={`text-xs ${isVisible ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900 dark:text-green-100' : 'bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300'}`}
              >
                {isVisible ? "显示" : "隐藏"}
              </Badge>

              {/* 倍率 */}
              <div className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md">
                <Activity className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">
                  {serverQueryUtils.formatRateMultiplier(server.rate)}
                </span>
              </div>

              {/* 服务器组 */}
              <Badge variant="outline" className="text-xs">
                <Layers className="h-3 w-3 mr-1" />
                {server.server_group?.name || `组 ${server.group_id}`}
              </Badge>
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-1 ml-4 flex-shrink-0">
            <ServerDetailDialog 
              server={server}
              trigger={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">查看详情</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </Button>
              }
            />
            <EditServerDialog 
              server={server} 
              onServerUpdated={onServerUpdated}
              children={
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">编辑服务器</span>
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
              }
            />
          </div>
        </div>
      </CardHeader>

      {/* 详细信息 - 可展开 */}
      <CardContent className="pt-0">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between p-2 h-8 text-muted-foreground hover:text-foreground"
            >
              <span className="text-sm">
                {isOpen ? '收起详细信息' : '查看详细信息'}
              </span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-3 pt-3">
            <div className="border-t pt-3 space-y-3 text-sm">
              {/* 技术配置 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                    加密方式
                  </div>
                  <Badge variant="outline" className="text-xs">
                    <Shield className="h-3 w-3 mr-1" />
                    {serverQueryUtils.getCipherDisplayName(server.cipher)}
                  </Badge>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                    混淆方式
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {serverQueryUtils.getObfsDisplayName(server.obfs)}
                  </Badge>
                </div>
              </div>

              {/* 管理信息 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                    排序值
                  </div>
                  <Badge variant="outline" className="text-xs font-mono">
                    {server.sort}
                  </Badge>
                </div>
                {server.parent_id && (
                  <div>
                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                      父服务器
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      ID: {server.parent_id}
                    </Badge>
                  </div>
                )}
              </div>

              {/* 标签 */}
              {server.tags && (
                <div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-2">
                    标签
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {server.tags.split(',').filter(tag => tag.trim()).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag.trim()}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* 时间信息 */}
              <div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">
                  创建时间
                </div>
                <div className="text-sm text-muted-foreground">
                  {serverQueryUtils.formatDateTime(server.created_at)}
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}