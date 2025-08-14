'use client'

import { useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"

import { UserResponse } from "@/lib/user-types"
import { createDeletedUsersColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { useDeletedUsers } from "@/hooks/queries/use-users"

export default function DeletedUsersPage() {
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 使用 React Query 获取已删除用户数据
  const { 
    data: deletedUsersResponse, 
    isLoading, 
    error, 
    refetch 
  } = useDeletedUsers({
    page: currentPage,
    limit: pageSize
  })

  // 从响应中提取数据
  const users = deletedUsersResponse?.data?.items || []
  const totalItems = deletedUsersResponse?.data?.pagination?.total || 0
  const totalPages = deletedUsersResponse?.data?.pagination?.total_pages || 
    Math.ceil(totalItems / pageSize) || 0

  const handleUserRestored = useCallback(() => {
    // 重新加载用户列表
    refetch()
  }, [refetch])

  const handleSelectionChange = useCallback((_users: UserResponse[]) => {
    // 处理选择变更 - 当前未使用
  }, [])

  // 处理分页变更
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
  }, [])

  // 处理每页显示数量变更
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // 重置到第一页
  }, [])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="已删除用户" 
        description="管理已删除的用户账号，可以选择恢复或永久删除"
      >
        <Link href="/users">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回用户管理
          </Button>
        </Link>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Card>
              <CardHeader>
                <CardTitle>已删除用户列表</CardTitle>
                <CardDescription>
                  共 {totalItems} 个已删除用户，当前显示第 {currentPage} 页，共 {totalPages} 页
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="text-center">
                      <p className="text-destructive">加载已删除用户列表失败</p>
                      <Button variant="outline" onClick={() => refetch()} className="mt-2">
                        重试
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 数据表格 */}
                    <DataTable 
                      columns={createDeletedUsersColumns({ 
                        onUserRestored: handleUserRestored
                      })} 
                      data={users}
                      pageCount={totalPages}
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalItems={totalItems}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      onSelectionChange={handleSelectionChange}
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