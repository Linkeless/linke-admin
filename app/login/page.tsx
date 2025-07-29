'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { GalleryVerticalEnd } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { AuthProvider, useAuth } from "@/contexts/AuthContext"
import { LoginRequest, ApiError } from "@/lib/types"

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

  // 本地登录处理
  const handleLogin = async (credentials: LoginRequest) => {
    setLoading(true)
    setError('')
    
    try {
      await login(credentials)
      // 登录成功，AuthContext会自动更新状态，useEffect会处理跳转
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError('登录失败，请检查邮箱和密码')
      }
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
      if (err instanceof ApiError) {
        setError(err.message)
      } else {
        setError(`${provider} 登录失败`)
      }
      setLoading(false)
    }
  }

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Linke Admin
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm 
              onSubmit={handleLogin}
              onOAuthLogin={handleOAuthLogin}
              loading={loading}
              error={error}
            />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
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
