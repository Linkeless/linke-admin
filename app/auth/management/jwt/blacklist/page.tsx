'use client'

import { useEffect, useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Trash2, Search, AlertTriangle, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { JwtBlacklistItem } from '../types'

// 模拟黑名单数据
const mockBlacklistItems: JwtBlacklistItem[] = [
  {
    jti: 'jwt_blocked_123',
    user_id: 123,
    email: 'suspicious@example.com',
    revoked_at: '2024-01-15T09:30:00Z',
    revoked_by: 1,
    reason: '检测到异常活动，预防性撤销',
    expires_at: '2024-01-22T09:30:00Z'
  },
  {
    jti: 'jwt_blocked_456',
    user_id: 456,
    email: 'compromised@example.com',
    revoked_at: '2024-01-14T16:20:00Z',
    revoked_by: 1,
    reason: '账户被盗用，紧急撤销所有令牌',
    expires_at: '2024-01-21T16:20:00Z'
  },
  {
    jti: 'jwt_blocked_789',
    user_id: 789,
    email: 'violation@example.com',
    revoked_at: '2024-01-13T12:15:00Z',
    revoked_by: 2,
    reason: '违反使用条款，永久撤销',
    expires_at: '2024-01-20T12:15:00Z'
  }
]

export default function JwtBlacklistPage() {
  const [blacklistItems, setBlacklistItems] = useState<JwtBlacklistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        setBlacklistItems(mockBlacklistItems)
      } catch (error) {
        console.error('加载黑名单数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleRemoveFromBlacklist = async (jti: string) => {
    try {
      // 模拟API调用
      console.log(`从黑名单移除: ${jti}`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 更新本地状态
      setBlacklistItems(items => items.filter(item => item.jti !== jti))
    } catch (error) {
      console.error('移除黑名单失败:', error)
    }
  }

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: zhCN 
      })
    } catch {
      return '时间格式错误'
    }
  }

  const isExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const filteredItems = blacklistItems.filter(item => {
    const searchLower = searchQuery.toLowerCase()
    return (
      item.email.toLowerCase().includes(searchLower) ||
      item.jti.toLowerCase().includes(searchLower) ||
      item.reason.toLowerCase().includes(searchLower)
    )
  })

  const stats = {
    total: blacklistItems.length,
    expired: blacklistItems.filter(item => isExpired(item.expires_at)).length,
    active: blacklistItems.filter(item => !isExpired(item.expires_at)).length
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="JWT黑名单管理" 
        description="管理已撤销的JWT令牌黑名单"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/jwt">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回JWT管理
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计概览 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{stats.total}</div>
                <p className="text-sm text-muted-foreground">黑名单总数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-orange-600">{stats.active}</div>
                <p className="text-sm text-muted-foreground">仍在有效期</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-gray-600">{stats.expired}</div>
                <p className="text-sm text-muted-foreground">已自然过期</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                黑名单列表
              </CardTitle>
              <CardDescription>
                已撤销并加入黑名单的JWT令牌记录
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 搜索 */}
                <div className="relative max-w-sm">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索邮箱、令牌ID或撤销原因..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                {/* 黑名单表格 */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>用户邮箱</TableHead>
                        <TableHead>令牌ID</TableHead>
                        <TableHead>撤销原因</TableHead>
                        <TableHead>撤销时间</TableHead>
                        <TableHead>原过期时间</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead className="text-right">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <p className="text-muted-foreground">加载中...</p>
                          </TableCell>
                        </TableRow>
                      ) : filteredItems.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center space-y-2">
                              <Trash2 className="h-8 w-8 text-muted-foreground" />
                              <p className="text-muted-foreground">
                                {searchQuery ? '没有找到匹配的黑名单记录' : '黑名单为空'}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredItems.map((item) => (
                          <TableRow key={item.jti}>
                            <TableCell>
                              <div className="space-y-1">
                                <div className="font-medium">{item.email}</div>
                                <div className="text-xs text-muted-foreground">
                                  ID: {item.user_id}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                              {item.jti.substring(0, 16)}...
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="text-sm">{item.reason}</p>
                                <p className="text-xs text-muted-foreground">
                                  撤销者ID: {item.revoked_by}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatTime(item.revoked_at)}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatTime(item.expires_at)}
                            </TableCell>
                            <TableCell>
                              {isExpired(item.expires_at) ? (
                                <Badge variant="outline">已过期</Badge>
                              ) : (
                                <Badge variant="destructive">黑名单中</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center space-x-1">
                                {!isExpired(item.expires_at) && (
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => handleRemoveFromBlacklist(item.jti)}
                                  >
                                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* 说明文字 */}
                <div className="text-sm text-muted-foreground">
                  <p>
                    <strong>说明：</strong>
                    黑名单中的令牌无法用于认证。已过期的令牌会自动失效，
                    但仍保留在黑名单中作为审计记录。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}