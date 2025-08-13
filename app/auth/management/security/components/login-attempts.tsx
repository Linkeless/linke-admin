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
import { 
  Search, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet,
  Eye,
  Filter
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { LoginAttempt } from '../types'

// 模拟数据
const mockLoginAttempts: LoginAttempt[] = [
  {
    id: 1,
    user_id: 123,
    email: 'john@example.com',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    success: true,
    attempted_at: '2024-01-15T10:30:00Z',
    country: '中国',
    city: '北京',
    device_type: 'desktop',
    browser: 'Chrome'
  },
  {
    id: 2,
    user_id: 456,
    email: 'jane@example.com',
    ip_address: '10.0.0.50',
    user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
    success: true,
    attempted_at: '2024-01-15T10:25:00Z',
    country: '中国',
    city: '上海',
    device_type: 'mobile',
    browser: 'Safari'
  },
  {
    id: 3,
    email: 'unknown@example.com',
    ip_address: '203.0.113.10',
    user_agent: 'curl/7.68.0',
    success: false,
    attempted_at: '2024-01-15T10:20:00Z',
    country: '美国',
    city: '纽约',
    device_type: 'unknown',
    browser: 'Unknown'
  }
]

export function LoginAttempts() {
  const [attempts, setAttempts] = useState<LoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSuccess, setFilterSuccess] = useState<'all' | 'success' | 'failed'>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        setAttempts(mockLoginAttempts)
      } catch (error) {
        console.error('加载登录尝试数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />
      case 'tablet':
        return <Tablet className="h-4 w-4" />
      case 'desktop':
        return <Monitor className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const getSuccessBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">成功</Badge>
    ) : (
      <Badge variant="destructive">失败</Badge>
    )
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

  const filteredAttempts = attempts.filter(attempt => {
    const matchesSearch = 
      attempt.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.ip_address.includes(searchQuery) ||
      (attempt.country && attempt.country.includes(searchQuery))

    const matchesFilter = (() => {
      switch (filterSuccess) {
        case 'success':
          return attempt.success
        case 'failed':
          return !attempt.success
        default:
          return true
      }
    })()

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: attempts.length,
    success: attempts.filter(a => a.success).length,
    failed: attempts.filter(a => !a.success).length
  }

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">总尝试次数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.success}</div>
            <p className="text-sm text-muted-foreground">成功登录</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
            <p className="text-sm text-muted-foreground">失败尝试</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>登录尝试记录</CardTitle>
          <CardDescription>
            系统内所有的登录尝试，包括成功和失败的记录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 搜索和过滤 */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索邮箱、IP或地区..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={filterSuccess === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuccess('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterSuccess === 'success' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuccess('success')}
                >
                  成功
                </Button>
                <Button
                  variant={filterSuccess === 'failed' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuccess('failed')}
                >
                  失败
                </Button>
              </div>
            </div>

            {/* 登录尝试表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>位置</TableHead>
                    <TableHead>设备</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>时间</TableHead>
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
                  ) : filteredAttempts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">暂无登录尝试记录</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAttempts.map((attempt) => (
                      <TableRow key={attempt.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{attempt.email}</div>
                            {attempt.user_id && (
                              <div className="text-xs text-muted-foreground">
                                ID: {attempt.user_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {attempt.ip_address}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {attempt.country || '未知'}, {attempt.city || '未知'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(attempt.device_type)}
                            <div>
                              <div className="text-sm">{attempt.device_type}</div>
                              <div className="text-xs text-muted-foreground">
                                {attempt.browser}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getSuccessBadge(attempt.success)}</TableCell>
                        <TableCell className="text-sm">
                          {formatTime(attempt.attempted_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}