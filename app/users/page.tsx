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
import { Trash2 } from "lucide-react"
import Link from "next/link"
import { PageHeader } from "@/components/layout/page-header"

import { userService } from "@/lib/user-service"
import { UserResponse } from "@/lib/user-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateUserDialog, 
  BatchActionsToolbar
} from "@/components/users"

// 移除未使用的getData函数，现在使用带分页的loadData函数

export default function UsersPage() {
  const [users, setUsers] = useState<UserResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUsers, setSelectedUsers] = useState<UserResponse[]>([])
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      setSelectedUsers([]) // 清空选择
      
      console.log('加载用户列表，页码:', page, '每页:', limit)
      const response = await userService.getUsers({
        page,
        limit
      })
      
      if (response.code === 0 && response.data) {
        setUsers(response.data.items)
        setTotalItems(response.data.pagination.total)
        setTotalPages(response.data.pagination.total_pages || 0)
        setCurrentPage(response.data.pagination.page)
      }
    } catch (error) {
      console.error('加载用户列表失败:', error)
      // 可以添加错误提示
    } finally {
      setLoading(false)
    }
  }, [])

  const handleUserCreated = useCallback(() => {
    // 重新加载用户列表
    loadData()
  }, [loadData])

  const handleUserUpdated = useCallback(() => {
    // 重新加载用户列表
    loadData()
  }, [loadData])

  const handleBatchComplete = useCallback(() => {
    // 批量操作完成后重新加载数据
    loadData()
    setSelectedUsers([]) // 清空选择
  }, [loadData])

  const handleClearSelection = useCallback(() => {
    setSelectedUsers([])
  }, [])

  const handleSelectionChange = useCallback((users: UserResponse[]) => {
    setSelectedUsers(users)
  }, [])



  useEffect(() => {
    loadData(1, pageSize)
  }, [loadData, pageSize])

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
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">加载中...</p>
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