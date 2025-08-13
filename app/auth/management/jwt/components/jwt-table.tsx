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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Search, 
  MoreHorizontal, 
  Trash2, 
  Eye,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  AlertTriangle
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { JwtTokenInfo } from '../types'

// 模拟JWT令牌数据
const mockJwtTokens: JwtTokenInfo[] = [
  {
    jti: 'jwt_123456789',
    user_id: 123,
    email: 'john@example.com',
    issued_at: '2024-01-15T09:00:00Z',
    expires_at: '2024-01-22T09:00:00Z',
    is_active: true,
    device_info: 'Chrome on Windows 10',
    ip_address: '192.168.1.100',
    last_used_at: '2024-01-15T10:30:00Z'
  },
  {
    jti: 'jwt_987654321',
    user_id: 456,
    email: 'jane@example.com',
    issued_at: '2024-01-14T15:20:00Z',
    expires_at: '2024-01-21T15:20:00Z',
    is_active: true,
    device_info: 'Safari on iPhone',
    ip_address: '10.0.0.50',
    last_used_at: '2024-01-15T08:45:00Z'
  },
  {
    jti: 'jwt_555666777',
    user_id: 789,
    email: 'admin@example.com',
    issued_at: '2024-01-10T12:00:00Z',
    expires_at: '2024-01-17T12:00:00Z',
    is_active: false,
    device_info: 'Firefox on Ubuntu',
    ip_address: '203.0.113.10',
    last_used_at: '2024-01-12T16:20:00Z'
  }
]

interface JwtTableProps {
  onTokenRevoked: () => void
}

export function JwtTable({ onTokenRevoked }: JwtTableProps) {
  const [tokens, setTokens] = useState<JwtTokenInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'expired'>('all')
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        setTokens(mockJwtTokens)
      } catch (error) {
        console.error('加载JWT令牌数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleRevokeToken = async (jti: string) => {
    setActionLoading(jti)
    try {
      // 模拟API调用
      console.log(`撤销令牌: ${jti}`)
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新本地状态
      setTokens(tokens.map(token => 
        token.jti === jti ? { ...token, is_active: false } : token
      ))
      
      onTokenRevoked()
    } catch (error) {
      console.error('撤销令牌失败:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getDeviceIcon = (deviceInfo: string) => {
    const device = deviceInfo.toLowerCase()
    if (device.includes('iphone') || device.includes('android')) {
      return <Smartphone className="h-4 w-4" />
    } else if (device.includes('ipad') || device.includes('tablet')) {
      return <Tablet className="h-4 w-4" />
    } else if (device.includes('chrome') || device.includes('firefox') || device.includes('safari')) {
      return <Monitor className="h-4 w-4" />
    }
    return <Globe className="h-4 w-4" />
  }

  const getStatusBadge = (token: JwtTokenInfo) => {
    const now = new Date()
    const expires = new Date(token.expires_at)
    
    if (!token.is_active) {
      return <Badge variant="destructive">已撤销</Badge>
    } else if (expires < now) {
      return <Badge variant="outline">已过期</Badge>
    } else {
      return <Badge className="bg-green-100 text-green-800">活跃</Badge>
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

  const isExpiringSoon = (expiresAt: string) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const hoursUntilExpiry = (expires.getTime() - now.getTime()) / (1000 * 60 * 60)
    return hoursUntilExpiry <= 24 && hoursUntilExpiry > 0
  }

  const filteredTokens = tokens.filter(token => {
    const matchesSearch = 
      token.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.jti.toLowerCase().includes(searchQuery.toLowerCase()) ||
      token.ip_address.includes(searchQuery)

    const matchesFilter = (() => {
      const now = new Date()
      const expires = new Date(token.expires_at)
      
      switch (filterActive) {
        case 'active':
          return token.is_active && expires > now
        case 'expired':
          return !token.is_active || expires <= now
        default:
          return true
      }
    })()

    return matchesSearch && matchesFilter
  })

  const stats = {
    total: tokens.length,
    active: tokens.filter(t => t.is_active && new Date(t.expires_at) > new Date()).length,
    expired: tokens.filter(t => !t.is_active || new Date(t.expires_at) <= new Date()).length,
    expiring_soon: tokens.filter(t => t.is_active && isExpiringSoon(t.expires_at)).length
  }

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">总令牌数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-sm text-muted-foreground">活跃令牌</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-sm text-muted-foreground">过期/撤销</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.expiring_soon}</div>
            <p className="text-sm text-muted-foreground">即将过期</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>JWT令牌列表</CardTitle>
          <CardDescription>
            管理系统中的所有JWT令牌，包括活跃和已撤销的令牌
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 搜索和过滤 */}
            <div className="flex items-center space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户邮箱、令牌ID或IP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={filterActive === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('all')}
                >
                  全部
                </Button>
                <Button
                  variant={filterActive === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('active')}
                >
                  活跃
                </Button>
                <Button
                  variant={filterActive === 'expired' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterActive('expired')}
                >
                  过期/撤销
                </Button>
              </div>
            </div>

            {/* 令牌表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>令牌ID</TableHead>
                    <TableHead>设备信息</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>签发时间</TableHead>
                    <TableHead>过期时间</TableHead>
                    <TableHead>最后使用</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-muted-foreground">加载中...</p>
                      </TableCell>
                    </TableRow>
                  ) : filteredTokens.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        <p className="text-muted-foreground">暂无令牌数据</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTokens.map((token) => (
                      <TableRow 
                        key={token.jti}
                        className={isExpiringSoon(token.expires_at) && token.is_active ? 'bg-orange-50' : ''}
                      >
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{token.email}</div>
                            <div className="text-xs text-muted-foreground">
                              ID: {token.user_id}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {token.jti.substring(0, 12)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getDeviceIcon(token.device_info || '')}
                            <span className="text-sm">{token.device_info}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {token.ip_address}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(token)}
                            {isExpiringSoon(token.expires_at) && token.is_active && (
                              <AlertTriangle className="h-3 w-3 text-orange-500" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(token.issued_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(token.expires_at)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {token.last_used_at ? formatTime(token.last_used_at) : '未使用'}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                disabled={actionLoading === token.jti}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>令牌操作</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                查看详情
                              </DropdownMenuItem>
                              
                              {token.is_active && new Date(token.expires_at) > new Date() && (
                                <DropdownMenuItem 
                                  onClick={() => handleRevokeToken(token.jti)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  撤销令牌
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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