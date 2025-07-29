# Linke Admin 认证授权登录页面设计

## 设计概述

基于 Linke API 的认证授权系统，设计管理端登录页面，支持本地账户登录和多种 OAuth 第三方登录方式。

## 技术栈要求

⚠️ **重要说明**: 本设计方案完全基于 **shadcn/ui** 官方组件库实现，**禁止自行编写任何 UI 组件**。

### 核心技术栈
- **UI 组件库**: shadcn/ui (官方组件)
- **样式框架**: Tailwind CSS
- **前端框架**: React + TypeScript  
- **路由管理**: React Router
- **图标库**: Lucide React (shadcn/ui 推荐)

### shadcn/ui 组件使用清单
本页面将使用以下 shadcn/ui 官方组件，**严禁自定义实现**：

```bash
# 必需的 shadcn/ui 组件
npx shadcn@latest add button
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add alert
npx shadcn@latest add checkbox
npx shadcn@latest add separator
npx shadcn@latest add form
```

## 页面布局设计

### 整体布局结构

```
┌─────────────────────────────────────────────────────────────┐
│                    Header (品牌标识)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────────┐           ┌─────────────────────────┐   │
│  │                 │           │                         │   │
│  │   品牌插图/Logo   │           │     登录表单区域          │   │
│  │                 │           │                         │   │
│  │   (左侧装饰区)    │           │  ┌─────────────────┐    │   │
│  │                 │           │  │  本地账户登录    │    │   │
│  └─────────────────┘           │  └─────────────────┘    │   │
│                                │                         │   │
│                                │  ┌─────────────────┐    │   │
│                                │  │   第三方登录     │    │   │
│                                │  └─────────────────┘    │   │
│                                └─────────────────────────┘   │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                    Footer (版权信息)                         │
└─────────────────────────────────────────────────────────────┘
```

### 响应式设计

- **桌面端 (≥1024px)**: 左右分栏布局，左侧品牌区域，右侧登录表单
- **平板端 (768px-1023px)**: 单栏布局，品牌区域缩小，登录表单居中
- **移动端 (<768px)**: 纯表单布局，品牌 Logo 顶部显示

## 登录表单组件设计

### 1. 本地账户登录表单 (使用 shadcn/ui 组件)

```tsx
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react"

interface LoginFormProps {
  onSubmit: (credentials: LoginRequest) => void
  loading: boolean
  error?: string
}

interface LoginRequest {
  email: string
  password: string
}

const LoginForm: React.FC<LoginFormProps> = ({ onSubmit, loading, error }) => {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ email, password })
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">管理员登录</CardTitle>
        <CardDescription>
          使用您的管理员账户登录系统
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱输入框 - 使用 shadcn/ui Input 组件 */}
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="admin@example.com"
                className="pl-10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          </div>
          
          {/* 密码输入框 - 使用 shadcn/ui Input 组件 */}
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                className="pl-10 pr-10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          
          {/* 记住我选项 - 使用 shadcn/ui Checkbox 组件 */}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="remember" 
              checked={remember}
              onCheckedChange={setRemember}
            />
            <Label htmlFor="remember" className="text-sm">
              记住登录状态
            </Label>
          </div>
          
          {/* 登录按钮 - 使用 shadcn/ui Button 组件 */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                登录中...
              </>
            ) : (
              '登录'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
```

**组件使用说明:**
- ✅ `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` - shadcn/ui 卡片组件
- ✅ `Input` - shadcn/ui 输入框组件  
- ✅ `Label` - shadcn/ui 标签组件
- ✅ `Button` - shadcn/ui 按钮组件
- ✅ `Alert`, `AlertDescription` - shadcn/ui 警告组件
- ✅ `Checkbox` - shadcn/ui 复选框组件
- ✅ Lucide React 图标库（shadcn/ui 推荐）

### 2. 第三方登录组件 (使用 shadcn/ui 组件)

```tsx
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Github, MessageCircle } from "lucide-react"

interface OAuthLoginProps {
  onOAuthLogin: (provider: string) => void
  loading: boolean
}

const OAuthLogin: React.FC<OAuthLoginProps> = ({ onOAuthLogin, loading }) => {
  const providers = [
    {
      name: 'google',
      label: '使用 Google 登录',
      icon: (
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
      variant: 'outline' as const,
      className: 'text-gray-700 border-gray-300 hover:bg-gray-50',
    },
    {
      name: 'github', 
      label: '使用 GitHub 登录',
      icon: <Github className="h-4 w-4" />,
      variant: 'outline' as const,
      className: 'text-gray-700 border-gray-300 hover:bg-gray-50',
    },
    {
      name: 'telegram',
      label: '使用 Telegram 登录', 
      icon: <MessageCircle className="h-4 w-4" />,
      variant: 'outline' as const,
      className: 'text-gray-700 border-gray-300 hover:bg-gray-50',
    },
  ]

  return (
    <div className="space-y-4">
      {/* 分隔线 - 使用 shadcn/ui Separator 概念 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            或使用第三方账户
          </span>
        </div>
      </div>
      
      {/* OAuth 登录按钮 - 使用 shadcn/ui Button 组件 */}
      <div className="grid gap-2">
        {providers.map((provider) => (
          <Button
            key={provider.name}
            variant={provider.variant}
            className={`w-full ${provider.className}`}
            onClick={() => onOAuthLogin(provider.name)}
            disabled={loading}
          >
            {provider.icon}
            <span className="ml-2">{provider.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
}
```

**组件使用说明:**
- ✅ `Button` - shadcn/ui 按钮组件（使用 `outline` variant）
- ✅ 原生 `border-t` 实现分隔线（遵循 shadcn/ui 设计语言）
- ✅ Lucide React 图标 + 内嵌 Google SVG 图标
- ✅ 使用 Tailwind CSS 类名进行样式定制

## 登录状态管理

### 认证 Context

```tsx
interface AuthContextType {
  user: UserResponse | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
  login: (credentials: LoginRequest) => Promise<void>
  loginWithOAuth: (provider: string) => Promise<void> 
  logout: () => void
  refreshToken: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // 初始化认证状态
  useEffect(() => {
    const savedToken = localStorage.getItem('auth_token')
    if (savedToken) {
      setToken(savedToken)
      // 验证 token 有效性
      validateToken(savedToken)
    }
    setLoading(false)
  }, [])

  // 本地账户登录
  const login = async (credentials: LoginRequest) => {
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials)
      
      if (response.code === 0) {
        const { token: tokenData, user: userData } = response.data
        
        // 存储认证信息
        setToken(tokenData.access_token)
        setUser(userData)
        localStorage.setItem('auth_token', tokenData.access_token)
        localStorage.setItem('refresh_token', tokenData.refresh_token)
        
        // 检查管理员权限
        if (userData.role !== 'admin') {
          throw new Error('权限不足，需要管理员角色')
        }
      } else {
        throw new Error(response.message || '登录失败')
      }
    } catch (error) {
      throw error
    }
  }

  // OAuth 登录
  const loginWithOAuth = async (provider: string) => {
    try {
      // 1. 获取授权 URL
      const urlResponse = await api.post<AuthorizeURLResponse>('/auth/url', {
        provider,
        redirect_uri: `${window.location.origin}/auth/callback`,
      })
      
      if (urlResponse.code === 0) {
        // 2. 跳转到第三方授权页面
        window.location.href = urlResponse.data.authorization_url
      }
    } catch (error) {
      throw error
    }
  }

  // 登出
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setToken(null)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('refresh_token')
    }
  }

  // Token 刷新
  const refreshToken = async () => {
    try {
      const refreshTokenValue = localStorage.getItem('refresh_token')
      if (!refreshTokenValue) return false

      const response = await api.post<RefreshTokenResponse>('/auth/refresh')
      
      if (response.code === 0) {
        setToken(response.data.access_token)
        localStorage.setItem('auth_token', response.data.access_token)
        return true
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
    }
    return false
  }

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    loginWithOAuth,
    logout,
    refreshToken,
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}
```

## 登录页面主组件 (使用 shadcn/ui 组件)

```tsx
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const { login, loginWithOAuth } = useAuth()
  const navigate = useNavigate()

  // 本地登录处理
  const handleLogin = async (credentials: LoginRequest) => {
    setLoading(true)
    setError('')
    
    try {
      await login(credentials)
      navigate('/admin') // 登录成功后跳转到管理面板
    } catch (err: any) {
      setError(err.message || '登录失败，请检查邮箱和密码')
    } finally {
      setLoading(false)
    }
  }

  // OAuth 登录处理
  const handleOAuthLogin = async (provider: string) => {
    setLoading(true)
    setError('')
    
    try {
      await loginWithOAuth(provider)
    } catch (err: any) {
      setError(err.message || `${provider} 登录失败`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header - 使用原生 HTML + Tailwind CSS */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <img className="h-8 w-auto" src="/logo.svg" alt="Linke" />
              <span className="ml-2 text-xl font-bold text-gray-900">
                Linke Admin
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* 品牌区域 - 使用原生 HTML + Tailwind CSS */}
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              管理员登录
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              请使用管理员账户登录系统
            </p>
          </div>

          {/* 登录表单 - 使用 shadcn/ui 组件 */}
          <LoginForm 
            onSubmit={handleLogin}
            loading={loading}
            error={error}
          />

          {/* 第三方登录 - 使用 shadcn/ui 组件 */}
          <OAuthLogin 
            onOAuthLogin={handleOAuthLogin}
            loading={loading}
          />
        </div>
      </main>

      {/* Footer - 使用原生 HTML + Tailwind CSS */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2025 Linke. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
```

**组件使用说明:**
- ✅ 页面布局使用原生 HTML + Tailwind CSS
- ✅ 核心表单组件使用 shadcn/ui (`LoginForm`, `OAuthLogin`)
- ✅ 遵循 shadcn/ui 设计系统的间距和色彩规范
- ✅ 保持代码简洁，不自定义任何 UI 组件

## OAuth 回调处理

### OAuth 回调页面 (使用 shadcn/ui 组件)

```tsx
import { useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { api } from "@/lib/api"

const AuthCallbackPage: React.FC = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string>('')
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    handleCallback()
  }, [])

  const handleCallback = async () => {
    try {
      const urlParams = new URLSearchParams(location.search)
      const code = urlParams.get('code')
      const state = urlParams.get('state')
      const provider = urlParams.get('provider') || 'google'
      
      if (!code) {
        throw new Error('授权码缺失')
      }

      // 交换授权码获取 token
      const response = await api.post<LoginResponse>('/auth/token', {
        code,
        state,
        provider,
      })

      if (response.code === 0) {
        const { token, user } = response.data
        
        // 检查管理员权限
        if (user.role !== 'admin') {
          throw new Error('权限不足，需要管理员角色')
        }

        // 存储认证信息
        localStorage.setItem('auth_token', token.access_token)
        localStorage.setItem('refresh_token', token.refresh_token)
        
        // 跳转到管理面板
        navigate('/admin')
      } else {
        throw new Error(response.message || 'OAuth 登录失败')
      }
    } catch (err: any) {
      setError(err.message || 'OAuth 登录处理失败')
    } finally {
      setLoading(false)
    }
  }

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
        {/* 使用 shadcn/ui Card 组件 */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">登录失败</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">{error}</p>
            {/* 使用 shadcn/ui Button 组件 */}
            <Button 
              onClick={() => navigate('/login')}
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
```

**组件使用说明:**
- ✅ `Card`, `CardHeader`, `CardTitle`, `CardContent` - shadcn/ui 卡片组件
- ✅ `Button` - shadcn/ui 按钮组件
- ✅ `Loader2` - Lucide React 加载图标
- ✅ 原生 HTML + Tailwind CSS 布局

## 路由保护组件 (使用 shadcn/ui 组件)

```tsx
import { Navigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/contexts/AuthContext"

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {/* 使用 shadcn/ui Card 组件 */}
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center text-red-600">权限不足</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">您没有管理员权限，无法访问此页面</p>
            {/* 使用 shadcn/ui Button 组件 */}
            <Button onClick={() => window.location.href = '/login'}>
              重新登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return <>{children}</>
}
```

**组件使用说明:**
- ✅ `Card`, `CardHeader`, `CardTitle`, `CardContent` - shadcn/ui 卡片组件
- ✅ `Button` - shadcn/ui 按钮组件
- ✅ `Navigate` - React Router 导航组件
- ✅ 原生 HTML + Tailwind CSS 布局

## 样式主题配置

### Tailwind CSS 配置

```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
```

## 安全性考虑

### 1. Token 安全存储
- 使用 `httpOnly` Cookie 存储敏感令牌（生产环境推荐）
- localStorage 作为备选方案
- 实现自动 Token 刷新机制

### 2. CSRF 防护
- OAuth 状态参数验证
- 请求来源验证

### 3. 输入验证
- 前端表单验证
- 后端 API 二次验证

### 4. 错误处理
- 统一错误信息展示
- 避免敏感信息泄露

## 用户体验优化

### 1. 加载状态
- 登录按钮 loading 状态
- 页面级别的 loading 组件

### 2. 错误反馈
- 清晰的错误提示信息
- 区分不同类型的错误

### 3. 无障碍访问
- 键盘导航支持
- 屏幕阅读器友好
- 适当的 ARIA 标签

### 4. 移动端适配
- 响应式布局
- 触摸友好的交互元素

## shadcn/ui 组件安装清单

### 必需组件安装命令

```bash
# 基础 UI 组件
npx shadcn@latest add button
npx shadcn@latest add input  
npx shadcn@latest add label
npx shadcn@latest add card
npx shadcn@latest add alert
npx shadcn@latest add checkbox

# 如果使用 Form 组件（可选）
npx shadcn@latest add form

# 确保安装 Lucide React 图标库
npm install lucide-react
```

### 组件使用总结

本设计方案严格遵循 **shadcn/ui 官方组件库**，完全不自定义 UI 组件：

**✅ 使用的 shadcn/ui 组件:**
- `Button` - 所有按钮交互
- `Input` - 表单输入框
- `Label` - 表单标签
- `Card` 系列 - 卡片容器布局
- `Alert` 系列 - 错误提示信息  
- `Checkbox` - 复选框控件

**✅ 使用的图标库:**
- Lucide React - shadcn/ui 推荐的图标库
- 内嵌 Google SVG 图标（官方图标）

**✅ 布局和样式:**
- Tailwind CSS - 原生样式类
- shadcn/ui 设计系统色彩和间距规范
- 响应式断点和 Grid 布局

**❌ 禁止内容:**
- 自定义 UI 组件
- 自己编写的样式组件
- 第三方 UI 库组件

这个设计提供了完整的认证授权登录解决方案，支持本地账户和多种第三方登录方式，确保了安全性和用户体验，**严格基于 shadcn/ui 官方组件实现**。