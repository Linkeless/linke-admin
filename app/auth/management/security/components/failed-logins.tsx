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
  Shield, 
  AlertTriangle,
  Ban,
  Eye
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { FailedLoginAttempt } from '../types'

// 模拟数据
const mockFailedLogins: FailedLoginAttempt[] = [
  {
    id: 1,
    user_id: 123,
    email: 'john@example.com',
    ip_address: '192.168.1.100',
    user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    failure_reason: 'invalid_password',
    attempted_at: '2024-01-15T10:30:00Z',
    country: '中国',
    city: '北京',
    is_suspicious: false
  },
  {
    id: 2,
    email: 'attacker@malicious.com',
    ip_address: '203.0.113.10',
    user_agent: 'curl/7.68.0',
    failure_reason: 'too_many_attempts',
    attempted_at: '2024-01-15T10:25:00Z',
    country: '美国',
    city: '纽约',
    is_suspicious: true
  },
  {
    id: 3,
    email: 'nonexistent@example.com',
    ip_address: '198.51.100.20',
    user_agent: 'Mozilla/5.0 (compatible; Googlebot/2.1)',
    failure_reason: 'user_not_found',
    attempted_at: '2024-01-15T10:20:00Z',
    country: '德国',
    city: '柏林',
    is_suspicious: true
  },
  {
    id: 4,
    user_id: 456,
    email: 'locked_user@example.com',
    ip_address: '10.0.0.50',
    user_agent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    failure_reason: 'account_locked',
    attempted_at: '2024-01-15T10:15:00Z',
    country: '中国',
    city: '上海',
    is_suspicious: false
  }
]

export function FailedLogins() {
  const [failedLogins, setFailedLogins] = useState<FailedLoginAttempt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSuspicious, setFilterSuspicious] = useState<'all' | 'suspicious' | 'normal'>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        setFailedLogins(mockFailedLogins)
      } catch (error) {
        console.error('加载失败登录数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getFailureReasonBadge = (reason: string) => {
    switch (reason) {
      case 'invalid_password':
        return <Badge className="bg-yellow-100 text-yellow-800">密码错误</Badge>
      case 'user_not_found':
        return <Badge className="bg-blue-100 text-blue-800">用户不存在</Badge>
      case 'account_locked':
        return <Badge className="bg-red-100 text-red-800">账户锁定</Badge>
      case 'too_many_attempts':
        return <Badge variant="destructive">尝试过多</Badge>
      default:
        return <Badge variant="outline">未知原因</Badge>
    }
  }

  const getSuspiciousBadge = (isSuspicious: boolean) => {
    return isSuspicious ? (
      <Badge variant="destructive">可疑</Badge>
    ) : (
      <Badge variant="outline">正常</Badge>
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

  const handleBlockIP = async (ipAddress: string) => {
    try {
      // 模拟API调用
      console.log(`阻止IP: ${ipAddress}`)
      await new Promise(resolve => setTimeout(resolve, 500))
      // 这里应该刷新数据或更新状态
    } catch (error) {
      console.error('阻止IP失败:', error)
    }
  }

  const filteredFailedLogins = failedLogins.filter(attempt => {
    const matchesSearch = 
      attempt.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      attempt.ip_address.includes(searchQuery) ||
      (attempt.country && attempt.country.includes(searchQuery))

    const matchesFilter = (() => {
      switch (filterSuspicious) {
        case 'suspicious':
          return attempt.is_suspicious
        case 'normal':
          return !attempt.is_suspicious
        default:
          return true
      }
    })()

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: failedLogins.length,
    suspicious: failedLogins.filter(a => a.is_suspicious).length,
    normal: failedLogins.filter(a => !a.is_suspicious).length,
    unique_ips: new Set(failedLogins.map(a => a.ip_address)).size
  }

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">失败尝试</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.suspicious}</div>
            <p className="text-sm text-muted-foreground">可疑尝试</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.normal}</div>
            <p className="text-sm text-muted-foreground">正常失败</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.unique_ips}</div>
            <p className="text-sm text-muted-foreground">不同IP</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            失败登录记录
          </CardTitle>
          <CardDescription>
            监控和分析所有失败的登录尝试，识别潜在的安全威胁
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
                  variant={filterSuspicious === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuspicious('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterSuspicious === 'suspicious' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuspicious('suspicious')}
                >
                  可疑
                </Button>
                <Button
                  variant={filterSuspicious === 'normal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSuspicious('normal')}
                >
                  正常
                </Button>
              </div>
            </div>

            {/* 失败登录表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户邮箱</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>位置</TableHead>
                    <TableHead>失败原因</TableHead>
                    <TableHead>风险等级</TableHead>
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
                  ) : filteredFailedLogins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <div className="flex flex-col items-center space-y-2">
                          <Shield className="h-8 w-8 text-green-600" />
                          <p className="text-muted-foreground">暂无失败登录记录</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFailedLogins.map((attempt) => (
                      <TableRow key={attempt.id} className={attempt.is_suspicious ? 'bg-red-50' : ''}>
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
                          <div className="flex items-center space-x-2">
                            <span>{attempt.ip_address}</span>
                            {attempt.is_suspicious && (
                              <AlertTriangle className="h-3 w-3 text-red-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-1">
                            <Globe className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {attempt.country || '未知'}, {attempt.city || '未知'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>{getFailureReasonBadge(attempt.failure_reason)}</TableCell>
                        <TableCell>{getSuspiciousBadge(attempt.is_suspicious)}</TableCell>
                        <TableCell className="text-sm">
                          {formatTime(attempt.attempted_at)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {attempt.is_suspicious && (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleBlockIP(attempt.ip_address)}
                              >
                                <Ban className="h-4 w-4 text-red-500" />
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}