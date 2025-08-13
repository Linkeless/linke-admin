/**
 * 认证管理总览页面
 * 展示认证系统的整体状态和关键安全指标
 */

import { Metadata } from 'next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/layout/page-header';
import { Button } from '@/components/ui/button';
import { Shield, Users, Key, Settings } from 'lucide-react';
import Link from 'next/link';
import { AuthStats, SecurityOverview } from './components';

export const metadata: Metadata = {
  title: '认证管理 - 系统概览',
  description: '查看和管理认证系统的整体状态、安全指标和用户认证信息',
};

export default function AuthManagementPage() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="认证管理" 
        description="管理用户认证、安全监控和访问控制"
      >
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/security">
              <Shield className="h-4 w-4 mr-2" />
              安全监控
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/auth/management/accounts">
              <Users className="h-4 w-4 mr-2" />
              账户管理
            </Link>
          </Button>
        </div>
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">系统概览</TabsTrigger>
              <TabsTrigger value="security">安全状态</TabsTrigger>
              <TabsTrigger value="analytics">认证分析</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Link 
                  href="/auth/management/accounts"
                  className="block transition-colors hover:bg-muted/50 rounded-lg"
                >
                  <div className="p-6 border rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold">账户管理</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      用户账户状态管理、批量操作和安全控制
                    </p>
                  </div>
                </Link>

                <Link 
                  href="/auth/management/security"
                  className="block transition-colors hover:bg-muted/50 rounded-lg"
                >
                  <div className="p-6 border rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <Shield className="h-5 w-5 text-green-600" />
                      <h3 className="font-semibold">安全监控</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      登录监控、失败尝试分析和安全事件追踪
                    </p>
                  </div>
                </Link>

                <Link 
                  href="/auth/management/jwt"
                  className="block transition-colors hover:bg-muted/50 rounded-lg"
                >
                  <div className="p-6 border rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <Key className="h-5 w-5 text-purple-600" />
                      <h3 className="font-semibold">JWT管理</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      令牌管理、黑名单控制和会话监控
                    </p>
                  </div>
                </Link>

                <Link 
                  href="/auth/management/oauth"
                  className="block transition-colors hover:bg-muted/50 rounded-lg"
                >
                  <div className="p-6 border rounded-lg space-y-2">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-orange-600" />
                      <h3 className="font-semibold">OAuth管理</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      第三方登录提供商配置和事件监控
                    </p>
                  </div>
                </Link>
              </div>

              {/* 认证统计概览 */}
              <AuthStats />
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <SecurityOverview />
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-4">认证方式分布</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">邮箱密码</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Google OAuth</span>
                      <span className="text-sm font-medium">22%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">GitHub OAuth</span>
                      <span className="text-sm font-medium">8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Telegram</span>
                      <span className="text-sm font-medium">2%</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 border rounded-lg">
                  <h3 className="font-semibold mb-4">24小时活动统计</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">新用户注册</span>
                      <span className="text-sm font-medium">42</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">成功登录</span>
                      <span className="text-sm font-medium">1,284</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">失败登录</span>
                      <span className="text-sm font-medium text-red-600">89</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">密码重置</span>
                      <span className="text-sm font-medium">12</span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}