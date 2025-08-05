import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Next.js 中间件 - 用于保护管理页面路由
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 获取认证token
  const token = request.cookies.get('auth_token')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '')

  // 公共路径，无需认证
  const publicPaths = [
    '/login',
    '/auth/callback',
    '/_next',
    '/favicon.ico',
    '/api',
  ]

  // 检查是否为公共路径
  const isPublicPath = publicPaths.some(path => 
    pathname.startsWith(path)
  )

  // 如果是公共路径，允许访问
  if (isPublicPath) {
    return NextResponse.next()
  }

  // 如果没有token且不是登录页面，重定向到登录页
  if (!token) {
    const loginUrl = new URL('/login', request.url)
    // 保存原始路径以便登录后重定向
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // 有token的情况下，继续处理请求
  return NextResponse.next()
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api routes
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico
     * - 其他静态文件扩展名
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}