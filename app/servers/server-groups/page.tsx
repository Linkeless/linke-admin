'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Layers } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { serverGroupService } from "@/lib/server-group-service"
import { ServerGroupResponse } from "@/lib/server-group-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateServerGroupDialog
} from "@/components/servers/server-groups"

export default function ServerGroupsPage() {
  const [serverGroups, setServerGroups] = useState<ServerGroupResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      console.log('加载服务器组列表，page:', page, 'limit:', limit)
      const response = await serverGroupService.getServerGroups({
        page: page,
        limit: limit
      })
      
      if (response.code === 0 && response.data) {
        setServerGroups(response.data.items || [])
        setTotalItems(response.data.pagination.total || 0)
        setCurrentPage(page)
      }
    } catch (error) {
      console.error('加载服务器组列表失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleServerGroupCreated = useCallback(() => {
    // 重新加载服务器组列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleServerGroupUpdated = useCallback(() => {
    // 重新加载服务器组列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="服务器组管理" 
        description="管理服务器组配置"
      >
        <CreateServerGroupDialog onServerGroupCreated={handleServerGroupCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  服务器组列表
                </CardTitle>
                <CardDescription>
                  共 {totalItems} 个服务器组
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
                        onServerGroupUpdated: handleServerGroupUpdated
                      })} 
                      data={serverGroups}
                      pageCount={Math.ceil(totalItems / pageSize)}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={(page) => loadData(page, pageSize)}
                      onPageSizeChange={(newPageSize) => {
                        setPageSize(newPageSize)
                        setCurrentPage(1)
                        loadData(1, newPageSize)
                      }}
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