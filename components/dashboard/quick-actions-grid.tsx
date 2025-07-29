'use client'

import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Server, Settings } from "lucide-react"
import Link from "next/link"
import { DashboardOverview } from "@/lib/stats-types"

interface QuickActionsGridProps {
  overview: DashboardOverview | null
}

export function QuickActionsGrid({ overview }: QuickActionsGridProps) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/users">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="text-center">
            <Users className="h-8 w-8 mx-auto mb-2 text-primary" />
            <CardTitle>用户管理</CardTitle>
            <CardDescription>
              {overview ? `管理 ${overview.users.total_users} 个用户账号` : '管理系统用户和权限'}
            </CardDescription>
          </CardHeader>
        </Card>
      </Link>
      
      <Link href="/servers/shadowsocks-servers">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
          <CardHeader className="text-center">
            <Server className="h-8 w-8 mx-auto mb-2 text-primary" />
            <CardTitle>服务器管理</CardTitle>
            <CardDescription>配置和监控服务器状态</CardDescription>
          </CardHeader>
        </Card>
      </Link>
      
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
        <CardHeader className="text-center">
          <Settings className="h-8 w-8 mx-auto mb-2 text-primary" />
          <CardTitle>系统设置</CardTitle>
          <CardDescription>配置系统参数和选项</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}