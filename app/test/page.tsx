'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { api } from '@/lib/api'

export default function TestPage() {
  const [result, setResult] = useState<string>('')
  const [loading, setLoading] = useState(false)

  const testConnection = async () => {
    setLoading(true)
    try {
      const response = await api.get('/auth/providers')
      setResult(JSON.stringify(response, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const testOAuthURL = async (provider: string) => {
    setLoading(true)
    try {
      const response = await api.post('/auth/url', {
        provider,
        redirect_uri: `${window.location.origin}/auth/callback?provider=${provider}`,
      })
      setResult(JSON.stringify(response, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)   
    }
  }

  const testLogin = async () => {
    setLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email: 'test@example.com',
        password: 'password123'
      })
      setResult(JSON.stringify(response, null, 2))
    } catch (error) {
      setResult(`Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>API 连接测试</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={testConnection} disabled={loading}>
              测试 /auth/providers
            </Button>
            <Button onClick={testLogin} disabled={loading}>
              测试登录
            </Button>
            <Button onClick={() => testOAuthURL('google')} disabled={loading}>
              测试 Google OAuth URL
            </Button>
            <Button onClick={() => testOAuthURL('github')} disabled={loading}>
              测试 GitHub OAuth URL
            </Button>
            <Button onClick={() => testOAuthURL('telegram')} disabled={loading}>
              测试 Telegram OAuth URL
            </Button>
          </div>
          
          <div className="mt-4">
            <h3 className="font-semibold mb-2">API 基础URL:</h3>
            <p className="text-sm bg-gray-100 p-2 rounded">
              {process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1'}
            </p>
          </div>
          
          {result && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">响应结果:</h3>
              <pre className="text-sm bg-gray-100 p-4 rounded overflow-auto">
                {result}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}