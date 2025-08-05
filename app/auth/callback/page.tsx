'use client'

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { handleOAuthCallback } from "@/contexts/AuthContext"
import { setTokens } from "@/lib/api"
import { ApiError } from "@/lib/types"

export default function AuthCallbackPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCallback = useCallback(async () => {
    try {
      const code = searchParams.get('code')
      const state = searchParams.get('state')
      const provider = searchParams.get('provider') || 'google'
      
      if (!code) {
        throw new ApiError('授权码缺失', 400)
      }

      console.log('OAuth callback params:', { code, state, provider })

      // 交换授权码获取token
      const { token } = await handleOAuthCallback(code, state, provider)
      
      // 存储认证信息
      setTokens(token.access_token, token.refresh_token)
      
      // 跳转到仪表板
      router.push('/dashboard')
    } catch (err: unknown) {
      console.error('OAuth callback error:', err)
      if (err instanceof ApiError) {
        setError(err.message)
      } else if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('OAuth登录处理失败')
      }
    } finally {
      setLoading(false)
    }
  }, [searchParams, router])

  useEffect(() => {
    handleCallback()
  }, [handleCallback])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>正在处理登录...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">登录失败</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            <Button 
              onClick={() => router.push('/login')}
              className="w-full"
            >
              返回登录页面
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}