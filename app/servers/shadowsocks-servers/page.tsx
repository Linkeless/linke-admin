'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Server } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { shadowsocksServerService } from "@/lib/shadowsocks-service"
import { ShadowsocksServerResponse } from "@/lib/shadowsocks-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateServerDialog
} from "@/components/servers/shadowsocks-servers"

export default function ShadowsocksServersPage() {
  const [servers, setServers] = useState<ShadowsocksServerResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      const response = await shadowsocksServerService.getServers({
        page: page,
        limit: limit
      })
      
      if (response.code === 0 && response.data) {
        // API返回的数据结构：data.items 是服务器数组
        setServers(response.data.items || [])
        // 分页信息在 data.pagination 中
        setTotalItems(response.data.pagination.total || 0)
        setCurrentPage(response.data.pagination.page || page)
      }
    } catch (error) {
      // 可以添加错误提示
    } finally {
      setLoading(false)
    }
  }, [])

  const handleServerCreated = useCallback(() => {
    // 重新加载服务器列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleServerUpdated = useCallback(() => {
    // 重新加载服务器列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Shadowsocks 服务器管理" 
        description="管理 Shadowsocks 服务器配置"
      >
        <CreateServerDialog onServerCreated={handleServerCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  服务器列表
                </CardTitle>
                <CardDescription>
                  共 {totalItems} 台服务器
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : (
                  <>
                    {/* 数据表格（支持服务端分页） */}
                    <DataTable 
                      columns={createColumns({ 
                        onServerUpdated: handleServerUpdated
                      })} 
                      data={servers}
                      searchKey="name"
                      searchPlaceholder="搜索服务器名称..."
                    />
                  </>
                )}
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}