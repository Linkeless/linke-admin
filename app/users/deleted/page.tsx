'use client'

import { useEffect, useState, useCallback } from "react"
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

import { userService } from "@/lib/user-service"
import { UserResponse } from "@/lib/user-types"
import { createDeletedUsersColumns } from "./columns"
import { DataTable } from "../data-table"
import { Pagination } from "@/components/users"

export default function DeletedUsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      // 清空选择
      
      console.log('加载已删除用户列表，页码:', page, '每页:', limit)
      const response = await userService.getDeletedUsers({
        page,
        limit
      })
      
      if (response.code === 0 && response.data) {
        setUsers(response.data.items)
        setTotalItems(response.data.pagination.total)
        setTotalPages(response.data.pagination.total_pages || Math.ceil(response.data.pagination.total / response.data.pagination.limit))
        setCurrentPage(response.data.pagination.page)
      }
    } catch (error) {
      console.error('加载已删除用户列表失败:', error)
      // 可以添加错误提示
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUserRestored = useCallback(() => {
    // 重新加载用户列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleSelectionChange = useCallback((_users: UserResponse[]) => {
    // 处理选择变更 - 当前未使用
  }, [])

  // 处理分页变更
  const handlePageChange = useCallback((page: number) => {
    loadData(page, pageSize)
  }, [loadData, pageSize])

  // 处理每页显示数量变更
  const handlePageSizeChange = useCallback((newPageSize: number) => {
    setPageSize(newPageSize)
    setCurrentPage(1) // 重置到第一页
    loadData(1, newPageSize)
  }, [loadData])

  useEffect(() => {
    loadData(1, pageSize)
  }, [loadData, pageSize])

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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : (
                  <>
                    {/* 数据表格 */}
                    <DataTable 
                      columns={createDeletedUsersColumns({ 
                        onUserRestored: handleUserRestored
                      })} 
                      data={users}
                      onSelectionChange={handleSelectionChange}
                    />
                    
                    {/* 分页组件 */}
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      totalItems={totalItems}
                      itemsPerPage={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      loading={loading}
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