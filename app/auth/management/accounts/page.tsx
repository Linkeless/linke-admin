'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Users, Search, UserCheck, UserX, Shield } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import { DataTable } from '@/components/ui/data-table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { AccountTable, AccountActions, BulkOperations } from './components'
import type { AccountSecurityStatus } from '../types'

// 模拟数据
const mockAccounts: AccountSecurityStatus[] = [
  {
    user_id: 1,
    username: 'john_doe',
    email: 'john@example.com',
    security_level: 'high',
    is_locked: false,
    failed_login_attempts: 0,
    last_login_at: '2024-01-15T09:30:00Z',
    password_last_changed_at: '2024-01-01T00:00:00Z',
    two_factor_enabled: true,
    active_sessions: 2,
    suspicious_activities: 0
  },
  {
    user_id: 2,
    username: 'jane_smith',
    email: 'jane@example.com',
    security_level: 'medium',
    is_locked: false,
    failed_login_attempts: 1,
    last_login_at: '2024-01-14T15:20:00Z',
    password_last_changed_at: '2023-12-15T10:00:00Z',
    two_factor_enabled: false,
    active_sessions: 1,
    suspicious_activities: 0
  },
  {
    user_id: 3,
    username: 'bob_wilson',
    email: 'bob@example.com',
    security_level: 'critical',
    is_locked: true,
    failed_login_attempts: 5,
    last_failed_login_at: '2024-01-15T08:45:00Z',
    password_last_changed_at: '2023-11-20T14:30:00Z',
    two_factor_enabled: false,
    active_sessions: 0,
    suspicious_activities: 3
  }
]

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountSecurityStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAccounts, setSelectedAccounts] = useState<number[]>([])
  
  // 过滤状态
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'locked' | 'suspicious'>('all')

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      setAccounts(mockAccounts)
    } catch (error) {
      console.error('加载账户数据失败:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 过滤账户数据
  const filteredAccounts = accounts.filter(account => {
    const matchesSearch = 
      account.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.email.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesFilter = (() => {
      switch (filterStatus) {
        case 'locked':
          return account.is_locked
        case 'suspicious':
          return account.suspicious_activities > 0 || account.security_level === 'critical'
        case 'active':
          return !account.is_locked && account.active_sessions > 0
        default:
          return true
      }
    })()

    return matchesSearch && matchesFilter
  })

  const handleBulkAction = useCallback((action: string, accountIds: number[]) => {
    console.log(`执行批量操作: ${action}`, accountIds)
    // 这里应该调用相应的API
    setSelectedAccounts([])
    loadData() // 重新加载数据
  }, [loadData])

  const stats = {
    total: accounts.length,
    active: accounts.filter(a => !a.is_locked && a.active_sessions > 0).length,
    locked: accounts.filter(a => a.is_locked).length,
    suspicious: accounts.filter(a => a.suspicious_activities > 0 || a.security_level === 'critical').length
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="账户管理" 
        description="管理用户账户安全状态和执行批量操作"
      >
        <BulkOperations 
          selectedAccounts={selectedAccounts}
          onBulkAction={handleBulkAction}
        />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总账户数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">活跃账户</CardTitle>
                <UserCheck className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.active}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">锁定账户</CardTitle>
                <UserX className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.locked}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">可疑账户</CardTitle>
                <Shield className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.suspicious}</div>
              </CardContent>
            </Card>
          </div>

          {/* 搜索和过滤 */}
          <Card>
            <CardHeader>
              <CardTitle>账户列表</CardTitle>
              <CardDescription>
                管理用户账户的安全状态和执行相关操作
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索用户名或邮箱..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>

                <Tabs value={filterStatus} onValueChange={(value) => setFilterStatus(value as any)}>
                  <TabsList>
                    <TabsTrigger value="all">全部 ({stats.total})</TabsTrigger>
                    <TabsTrigger value="active">活跃 ({stats.active})</TabsTrigger>
                    <TabsTrigger value="locked">锁定 ({stats.locked})</TabsTrigger>
                    <TabsTrigger value="suspicious">可疑 ({stats.suspicious})</TabsTrigger>
                  </TabsList>

                  <TabsContent value={filterStatus} className="mt-4">
                    {loading ? (
                      <div className="flex items-center justify-center py-8">
                        <p className="text-muted-foreground">加载中...</p>
                      </div>
                    ) : (
                      <AccountTable 
                        data={filteredAccounts}
                        selectedAccounts={selectedAccounts}
                        onSelectionChange={setSelectedAccounts}
                        onAccountUpdated={loadData}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}