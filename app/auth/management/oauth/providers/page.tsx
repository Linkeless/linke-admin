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
import { Switch } from '@/components/ui/switch'
import { Settings, Users, TrendingUp, ArrowLeft } from 'lucide-react'
import { PageHeader } from '@/components/layout/page-header'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { zhCN } from 'date-fns/locale'

import type { OAuthProvider } from '../types'

// 模拟OAuth提供商数据
const mockProviders: OAuthProvider[] = [
  {
    id: 1,
    name: 'Google OAuth',
    provider_type: 'google',
    client_id: 'google_client_123456789',
    is_enabled: true,
    total_users: 847,
    registrations_24h: 18,
    last_sync_at: '2024-01-15T10:30:00Z',
    configuration: {
      scopes: ['email', 'profile'],
      redirect_uri: 'https://yourdomain.com/auth/google/callback'
    }
  },
  {
    id: 2,
    name: 'GitHub OAuth',
    provider_type: 'github',
    client_id: 'github_client_987654321',
    is_enabled: true,
    total_users: 289,
    registrations_24h: 7,
    last_sync_at: '2024-01-15T09:45:00Z',
    configuration: {
      scopes: ['user:email', 'read:user'],
      redirect_uri: 'https://yourdomain.com/auth/github/callback'
    }
  },
  {
    id: 3,
    name: 'Telegram OAuth',
    provider_type: 'telegram',
    client_id: 'telegram_bot_555666777',
    is_enabled: true,
    total_users: 111,
    registrations_24h: 3,
    last_sync_at: '2024-01-15T08:20:00Z',
    configuration: {
      bot_token: 'bot555666777:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw',
      redirect_uri: 'https://yourdomain.com/auth/telegram/callback'
    }
  }
]

interface ProviderTableProps {
  onProviderUpdated: () => void
}

export function ProviderTable({ onProviderUpdated }: ProviderTableProps) {
  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 800))
        setProviders(mockProviders)
      } catch (error) {
        console.error('加载OAuth提供商数据失败:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const handleToggleProvider = async (providerId: number, enabled: boolean) => {
    try {
      // 模拟API调用
      console.log(`${enabled ? '启用' : '禁用'}提供商: ${providerId}`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 更新本地状态
      setProviders(providers.map(provider => 
        provider.id === providerId ? { ...provider, is_enabled: enabled } : provider
      ))
      
      onProviderUpdated()
    } catch (error) {
      console.error('切换提供商状态失败:', error)
    }
  }

  const getProviderIcon = (type: string) => {
    switch (type) {
      case 'google':
        return <div className="h-6 w-6 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">G</div>
      case 'github':
        return <div className="h-6 w-6 bg-gray-800 rounded-full flex items-center justify-center text-white text-xs font-bold">GH</div>
      case 'telegram':
        return <div className="h-6 w-6 bg-blue-400 rounded-full flex items-center justify-center text-white text-xs font-bold">T</div>
      default:
        return <div className="h-6 w-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">?</div>
    }
  }

  const getStatusBadge = (enabled: boolean, userCount: number) => {
    if (!enabled) {
      return <Badge variant="outline">已禁用</Badge>
    }
    if (userCount > 500) {
      return <Badge className="bg-green-100 text-green-800">活跃</Badge>
    }
    return <Badge className="bg-blue-100 text-blue-800">正常</Badge>
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return '从未同步'
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: zhCN 
      })
    } catch {
      return '时间格式错误'
    }
  }

  const totalUsers = providers.reduce((sum, provider) => sum + provider.total_users, 0)
  const total24hRegistrations = providers.reduce((sum, provider) => sum + provider.registrations_24h, 0)
  const enabledProviders = providers.filter(p => p.is_enabled).length

  return (
    <div className="space-y-4">
      {/* 统计概览 */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{enabledProviders}/{providers.length}</div>
            <p className="text-sm text-muted-foreground">活跃提供商</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{totalUsers.toLocaleString()}</div>
            <p className="text-sm text-muted-foreground">OAuth用户总数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{total24hRegistrations}</div>
            <p className="text-sm text-muted-foreground">24h新注册</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            OAuth提供商配置
          </CardTitle>
          <CardDescription>
            管理第三方OAuth登录提供商的配置和状态
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* 提供商表格 */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>提供商</TableHead>
                    <TableHead>客户端ID</TableHead>
                    <TableHead>用户数量</TableHead>
                    <TableHead>24h注册</TableHead>
                    <TableHead>最后同步</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>启用</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">加载中...</p>
                      </TableCell>
                    </TableRow>
                  ) : providers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <p className="text-muted-foreground">暂无OAuth提供商</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    providers.map((provider) => (
                      <TableRow key={provider.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getProviderIcon(provider.provider_type)}
                            <div>
                              <div className="font-medium">{provider.name}</div>
                              <div className="text-xs text-muted-foreground capitalize">
                                {provider.provider_type}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {provider.client_id.substring(0, 20)}...
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{provider.total_users.toLocaleString()}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-600">+{provider.registrations_24h}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {formatTime(provider.last_sync_at)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(provider.is_enabled, provider.total_users)}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={provider.is_enabled}
                            onCheckedChange={(checked) => handleToggleProvider(provider.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* 配置说明 */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900">配置说明</h4>
              <div className="text-sm text-blue-800 mt-1 space-y-1">
                <p>• <strong>Google OAuth:</strong> 需要在Google Cloud Console中配置OAuth 2.0客户端ID</p>
                <p>• <strong>GitHub OAuth:</strong> 需要在GitHub应用设置中注册OAuth应用</p>
                <p>• <strong>Telegram OAuth:</strong> 需要创建Telegram Bot并获取Bot Token</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function OAuthProvidersPage() {
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const handleProviderUpdated = () => {
    setRefreshTrigger(prev => prev + 1)
  }

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="OAuth提供商管理" 
        description="配置和管理第三方OAuth登录提供商"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/oauth">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回OAuth管理
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <ProviderTable onProviderUpdated={handleProviderUpdated} />
      </main>
    </div>
  )
}