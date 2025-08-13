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
import { AlertTriangle, Search, Eye, ArrowLeft, RefreshCw } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { OAuthIncident } from '../types'

// 模拟OAuth事件数据
const mockIncidents: OAuthIncident[] = [
  {
    id: 1,
    provider: 'google',
    event_type: 'login',
    user_id: 123,
    user_email: 'john@example.com',
    severity: 'info',
    description: 'Google OAuth登录成功',
    metadata: {
      ip_address: '192.168.1.100',
      user_agent: 'Chrome/120.0.0.0',
      scope: 'email profile'
    },
    occurred_at: '2024-01-15T10:30:00Z'
  },
  {
    id: 2,
    provider: 'github',
    event_type: 'error',
    user_email: 'failed@example.com',
    severity: 'warning',
    description: 'GitHub OAuth认证失败 - 无效的授权码',
    metadata: {
      ip_address: '203.0.113.10',
      error_code: 'invalid_grant',
      user_agent: 'Firefox/121.0'
    },
    occurred_at: '2024-01-15T10:15:00Z'
  },
  {
    id: 3,
    provider: 'telegram',
    event_type: 'security_violation',
    user_id: 456,
    user_email: 'suspicious@example.com',
    severity: 'critical',
    description: '检测到Telegram OAuth安全违规 - 可能的机器人攻击',
    metadata: {
      ip_address: '198.51.100.20',
      violation_type: 'rate_limit_exceeded',
      attempt_count: 50
    },
    occurred_at: '2024-01-15T09:45:00Z'
  },
  {
    id: 4,
    provider: 'google',
    event_type: 'registration',
    user_id: 789,
    user_email: 'newuser@example.com',
    severity: 'info',
    description: 'Google OAuth新用户注册',
    metadata: {
      ip_address: '10.0.0.50',
      user_agent: 'Safari/17.0',
      registration_source: 'google_oauth'
    },
    occurred_at: '2024-01-15T09:20:00Z'
  },
  {
    id: 5,
    provider: 'github',
    event_type: 'token_refresh',
    user_id: 321,
    user_email: 'developer@example.com',
    severity: 'info',
    description: 'GitHub OAuth令牌刷新成功',
    metadata: {
      ip_address: '172.16.0.100',
      token_type: 'access_token',
      expires_in: 3600
    },
    occurred_at: '2024-01-15T08:50:00Z'
  }
]

export function EventLog() {
  const [incidents, setIncidents] = useState<OAuthIncident[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'info' | 'warning' | 'error' | 'critical'>('all')

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        setIncidents(mockIncidents)
      } catch (error) {
        console.error('加载OAuth事件数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'google':
        return <div className="h-5 w-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>
      case 'github':
        return <div className="h-5 w-5 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold">GH</div>
      case 'telegram':
        return <div className="h-5 w-5 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>
      default:
        return <div className="h-5 w-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">?</div>
    }
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'info':
        return <Badge className="bg-blue-100 text-blue-800">信息</Badge>
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">警告</Badge>
      case 'error':
        return <Badge className="bg-orange-100 text-orange-800">错误</Badge>
      case 'critical':
        return <Badge variant="destructive">严重</Badge>
      default:
        return <Badge variant="outline">未知</Badge>
    }
  }

  const getEventTypeBadge = (eventType: string) => {
    switch (eventType) {
      case 'login':
        return <Badge className="bg-green-100 text-green-800">登录</Badge>
      case 'registration':
        return <Badge className="bg-purple-100 text-purple-800">注册</Badge>
      case 'token_refresh':
        return <Badge className="bg-cyan-100 text-cyan-800">刷新令牌</Badge>
      case 'error':
        return <Badge className="bg-red-100 text-red-800">错误</Badge>
      case 'security_violation':
        return <Badge variant="destructive">安全违规</Badge>
      default:
        return <Badge variant="outline">{eventType}</Badge>
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

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.provider.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (incident.user_email && incident.user_email.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesFilter = filterSeverity === 'all' || incident.severity === filterSeverity

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: incidents.length,
    info: incidents.filter(i => i.severity === 'info').length,
    warning: incidents.filter(i => i.severity === 'warning').length,
    error: incidents.filter(i => i.severity === 'error').length,
    critical: incidents.filter(i => i.severity === 'critical').length
  }

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">总事件数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.info}</div>
            <p className="text-sm text-muted-foreground">信息</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
            <p className="text-sm text-muted-foreground">警告</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.error}</div>
            <p className="text-sm text-muted-foreground">错误</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.critical}</div>
            <p className="text-sm text-muted-foreground">严重</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            OAuth事件日志
          </CardTitle>
          <CardDescription>
            监控OAuth认证过程中的所有事件和异常情况
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 搜索和过滤 */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索事件描述、提供商或用户邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={filterSeverity === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSeverity('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterSeverity === 'critical' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSeverity('critical')}
                >
                  严重
                </Button>
                <Button
                  variant={filterSeverity === 'error' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSeverity('error')}
                >
                  错误
                </Button>
                <Button
                  variant={filterSeverity === 'warning' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterSeverity('warning')}
                >
                  警告
                </Button>
              </div>
            </div>

            {/* 事件表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>提供商</TableHead>
                    <TableHead>事件类型</TableHead>
                    <TableHead>用户</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>严重性</TableHead>
                    <TableHead>发生时间</TableHead>
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
                  ) : filteredIncidents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        <p className="text-muted-foreground">
                          {searchQuery ? '没有找到匹配的事件' : '暂无OAuth事件'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredIncidents.map((incident) => (
                      <TableRow 
                        key={incident.id}
                        className={incident.severity === 'critical' ? 'bg-red-50' : 
                                 incident.severity === 'error' ? 'bg-orange-50' :
                                 incident.severity === 'warning' ? 'bg-yellow-50' : ''}
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getProviderIcon(incident.provider)}
                            <span className="font-medium capitalize">{incident.provider}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getEventTypeBadge(incident.event_type)}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{incident.user_email || '未知用户'}</div>
                            {incident.user_id && (
                              <div className="text-xs text-muted-foreground">
                                ID: {incident.user_id}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm">{incident.description}</p>
                            {incident.metadata.ip_address && (
                              <p className="text-xs text-muted-foreground">
                                IP: {incident.metadata.ip_address}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getSeverityBadge(incident.severity)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(incident.occurred_at)}
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

export default function OAuthEventsPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="OAuth事件日志" 
        description="监控OAuth认证事件和安全违规"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            刷新
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/oauth">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回OAuth管理
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <EventLog />
      </main>
    </div>
  )
}