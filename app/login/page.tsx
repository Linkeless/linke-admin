'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LoginRequest, ApiError } from "@/lib/types"
import { showError, showSuccess } from "@/lib/error-handler"

function LoginPageContent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const { login, loginWithOAuth, isAuthenticated } = useAuth()
  const router = useRouter()

  // 如果已经登录，跳转到仪表板
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, router])

  // 如果已经认证，显示加载状态
  if (isAuthenticated) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>正在跳转到管理后台...</span>
        </div>
      </div>
    )
  }

  // 本地登录处理
  const handleLogin = async (credentials: LoginRequest) => {
    setLoading(true)
    setError('')
    
    try {
      await login(credentials)
      showSuccess('登录成功', '正在跳转到管理后台...')
      // 登录成功，AuthContext会自动更新状态，useEffect会处理跳转
    } catch (err: any) {
      const errorMessage = err instanceof ApiError ? err.message : '登录失败，请检查邮箱和密码'
      setError(errorMessage)
      showError(err, '登录失败')
    } finally {
      setLoading(false)
    }
  }

  // OAuth登录处理
  const handleOAuthLogin = async (provider: string) => {
    setLoading(true)
    setError('')
    
    try {
      await loginWithOAuth(provider)
      // OAuth会跳转到第三方页面，不需要额外处理
    } catch (err: any) {
      const errorMessage = err instanceof ApiError ? err.message : `${provider} 登录失败`
      setError(errorMessage)
      showError(err, `${provider} 登录`)
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      {/* 左侧登录表单区域 */}
      <div className="flex flex-col gap-6 p-6 md:p-8 lg:p-10">
        {/* 品牌Logo */}
        <div className="flex justify-center gap-2 md:justify-start">
          <a 
            href="#" 
            className="flex items-center gap-2 font-medium text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
            aria-label="Linke Admin 首页"
          >
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md shadow-sm">
              <GalleryVerticalEnd className="size-4" />
            </div>
            <span className="text-lg font-semibold">Linke Admin</span>
          </a>
        </div>
        
        {/* 表单容器 */}
        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-sm space-y-6">
            <LoginForm 
              onSubmit={handleLogin}
              onOAuthLogin={handleOAuthLogin}
              loading={loading}
              error={error}
            />
            
            {/* 页脚链接 */}
            <div className="text-center text-xs text-muted-foreground">
              <p>登录即表示您同意我们的</p>
              <div className="mt-1 space-x-2">
                <a 
                  href="#" 
                  className="underline underline-offset-4 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                >
                  服务条款
                </a>
                <span>和</span>
                <a 
                  href="#" 
                  className="underline underline-offset-4 hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
                >
                  隐私政策
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* 右侧背景图片区域 */}
      <div className="bg-muted relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
        <img
          src="/placeholder.svg"
          alt="管理后台登录背景图"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
        
        {/* 右侧内容覆盖层 */}
        <div className="absolute inset-0 flex flex-col justify-center p-10 text-white">
          <div className="max-w-md space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">
              现代化管理平台
            </h2>
            <p className="text-lg text-white/90">
              功能强大、安全可靠的企业级管理后台系统，助力您的业务快速发展。
            </p>
            <div className="space-y-2 text-sm text-white/80">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span>多业务模块集成</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span>实时数据监控</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-white/60" />
                <span>安全权限控制</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginPageContent />
    </AuthProvider>
  )
}
