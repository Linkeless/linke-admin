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
import { Trash2 } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"

import { UserResponse } from "@/lib/user-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateUserDialog, 
  BatchActionsToolbar
} from "@/components/users"
import { Pagination } from "@/components/subscriptions"
import { useUsers } from "@/hooks/queries/use-users"

export default function UsersPage() {
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // 使用 React Query 获取用户数据
  const { 
    data: usersResponse, 
    isLoading, 
    error, 
    refetch 
  } = useUsers({
    page: currentPage,
    limit: pageSize
  })

  // 从响应中提取数据
  const users = usersResponse?.data?.items || []
  const totalItems = usersResponse?.data?.pagination?.total || 0
  const totalPages = usersResponse?.data?.pagination?.total_pages || 
    Math.ceil(totalItems / pageSize) || 0

  const handleUserCreated = useCallback(() => {
    // 重新加载用户列表
    refetch()
  }, [refetch])

  const handleUserUpdated = useCallback(() => {
    // 重新加载用户列表
    refetch()
  }, [refetch])

  const handleBatchComplete = useCallback(() => {
    // 批量操作完成后重新加载数据
    refetch()
    setSelectedUsers([]) // 清空选择
  }, [refetch])

  const handleClearSelection = useCallback(() => {
    setSelectedUsers([])
  }, [])

  const handleSelectionChange = useCallback((users: UserResponse[]) => {
    setSelectedUsers(users)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    if (page !== currentPage) {
      setCurrentPage(page)
      setSelectedUsers([]) // 清空选择
    }
  }, [currentPage])

  const handlePageSizeChange = useCallback((size: number) => {
    if (size !== pageSize) {
      setPageSize(size)
      setCurrentPage(1)
      setSelectedUsers([]) // 清空选择
    }
  }, [pageSize])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="用户管理" 
        description="管理系统用户账号信息"
      >
        <Link href="/users/deleted">
          <Button variant="outline" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            已删除用户
          </Button>
        </Link>
        <CreateUserDialog onUserCreated={handleUserCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>用户列表</CardTitle>
                <CardDescription>
                  共 {totalItems} 个用户，当前显示第 {currentPage} 页，共 {totalPages} 页
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
                      <p className="text-destructive">加载用户列表失败</p>
                      <Button variant="outline" onClick={() => refetch()} className="mt-2">
                        重试
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* 批量操作工具栏 */}
                    <BatchActionsToolbar
                      selectedUsers={selectedUsers}
                      onBatchComplete={handleBatchComplete}
                      onClearSelection={handleClearSelection}
                    />
                    
                    {/* 数据表格 */}
                    <DataTable 
                      columns={createColumns({ 
                        onUserUpdated: handleUserUpdated
                      })} 
                      data={users}
                      searchKey="email"
                      searchPlaceholder="筛选邮箱..."
                      onSelectionChange={handleSelectionChange}
                       hideInternalPagination
                    />

                    {/* 分页控件（服务端分页）*/}
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      className="py-4"
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