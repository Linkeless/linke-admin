'use client'

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Layers, RefreshCw, AlertCircle } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateServerGroupDialog
} from "@/components/servers/server-groups"
import { Pagination } from "@/components/subscriptions"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useServerGroups } from "@/hooks/queries/use-server-groups"
import { useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/lib/query-keys"

export default function ServerGroupsPage() {
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  
  const queryClient = useQueryClient()
  
  // 计算 offset
  const offset = (currentPage - 1) * pageSize
  
  // 使用 React Query 获取服务器组数据
  const { 
    data: groupsResponse, 
    isLoading: loading, 
    error,
    refetch 
  } = useServerGroups({
    offset,
    limit: pageSize,
  })
  
  // 解析数据
  const serverGroups = groupsResponse?.data?.items || []
  const totalItems = groupsResponse?.data?.pagination?.total || 0

  // 服务器组创建/更新后的处理
  const handleServerGroupCreated = useCallback(() => {
    // 使用 React Query 的缓存失效机制
    queryClient.invalidateQueries({ queryKey: queryKeys.serverGroups.lists() })
  }, [queryClient])

  const handleServerGroupUpdated = useCallback(() => {
    // 使用 React Query 的缓存失效机制
    queryClient.invalidateQueries({ queryKey: queryKeys.serverGroups.lists() })
  }, [queryClient])
  
  // 手动刷新
  const handleRefresh = () => {
    refetch()
  }

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
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      加载服务器组列表失败：{error?.message || '未知错误'}
                      <Button 
                        variant="link" 
                        size="sm" 
                        onClick={() => refetch()} // error refetch handler
                        className="ml-2"
                      >
                        重试
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : (
                  <>
                    {/* 刷新按钮 */}
                    <div className="flex justify-end mb-4">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleRefresh}
                        disabled={loading}
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        刷新
                      </Button>
                    </div>
                    
                    {/* 数据表格（支持服务端分页） */}
                    <DataTable 
                      columns={createColumns({ 
                        onServerGroupUpdated: handleServerGroupUpdated
                      })} 
                      data={serverGroups}
                      searchKey="name"
                      searchPlaceholder="搜索服务器组名称..."
                      hideInternalPagination
                    />

                    {/* 分页（服务端分页）*/}
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={pageSize}
                      onPageChange={(page) => {
                        if (page !== currentPage) {
                          setCurrentPage(page)
                        }
                      }}
                      onPageSizeChange={(size) => {
                        if (size !== pageSize) {
                          setPageSize(size)
                          setCurrentPage(1)
                        }
                      }}
                      className="pt-4"
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