'use client'

import { Component, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import { toast } from 'sonner'

interface FinanceErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

interface FinanceErrorBoundaryProps {
  children: ReactNode
  module?: 'orders' | 'coupons' | 'invoices' | 'finance'
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  showRetry?: boolean
  showHome?: boolean
}

/**
 * 财务模块专用错误边界组件
 * 提供统一的错误处理和恢复机制
 */
export class FinanceErrorBoundary extends Component<
  FinanceErrorBoundaryProps,
  FinanceErrorBoundaryState
> {
  constructor(props: FinanceErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): FinanceErrorBoundaryState {
    return {
      hasError: true,
      error,
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('财务组件错误边界捕获错误:', error, errorInfo)
    
    // 调用自定义错误处理器
    this.props.onError?.(error, errorInfo)
    
    // 记录错误信息到状态
    this.setState({
      error,
      errorInfo,
    })

    // 显示错误提示
    toast.error('组件出现错误', {
      description: '请刷新页面或联系管理员'
    })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    toast.info('正在重新加载组件...')
  }

  handleGoHome = () => {
    window.location.href = '/dashboard'
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，则使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      const moduleNames = {
        orders: '订单',
        coupons: '优惠券', 
        invoices: '发票',
        finance: '财务'
      }
      const moduleName = moduleNames[this.props.module || 'finance']

      return (
        <div className="flex items-center justify-center min-h-[400px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">
                {moduleName}组件错误
              </CardTitle>
              <CardDescription>
                组件运行时遇到了问题，无法正常显示内容
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 错误详情（开发环境） */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="p-3 bg-red-50 rounded-md border border-red-200">
                  <p className="text-sm font-medium text-red-800">错误详情：</p>
                  <p className="text-sm text-red-600 mt-1 font-mono">
                    {this.state.error.message}
                  </p>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 justify-center">
                {this.props.showRetry !== false && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={this.handleRetry}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    重试
                  </Button>
                )}
                
                {this.props.showHome !== false && (
                  <Button 
                    variant="default" 
                    size="sm" 
                    onClick={this.handleGoHome}
                    className="flex items-center gap-2"
                  >
                    <Home className="w-4 h-4" />
                    返回首页
                  </Button>
                )}
              </div>

              {/* 帮助信息 */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground">
                  如果问题持续存在，请联系技术支持
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * 高阶组件：为财务组件添加错误边界
 */
export function withFinanceErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options?: {
    module?: 'orders' | 'coupons' | 'invoices' | 'finance'
    showRetry?: boolean
    showHome?: boolean
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  }
) {
  const ComponentWithErrorBoundary = (props: P) => {
    return (
      <FinanceErrorBoundary 
        module={options?.module}
        showRetry={options?.showRetry}
        showHome={options?.showHome}
        onError={options?.onError}
      >
        <WrappedComponent {...props} />
      </FinanceErrorBoundary>
    )
  }

  ComponentWithErrorBoundary.displayName = `withFinanceErrorBoundary(${WrappedComponent.displayName || WrappedComponent.name})`

  return ComponentWithErrorBoundary
}

/**
 * 财务数据加载错误组件
 */
interface FinanceDataErrorProps {
  message?: string
  onRetry?: () => void
  showRetry?: boolean
}

export function FinanceDataError({ 
  message = '数据加载失败',
  onRetry,
  showRetry = true
}: FinanceDataErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-600" />
      </div>
      
      <h3 className="text-lg font-medium text-red-600 mb-2">
        {message}
      </h3>
      
      <p className="text-sm text-muted-foreground text-center mb-4">
        请检查网络连接或稍后重试
      </p>

      {showRetry && onRetry && (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRetry}
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          重试
        </Button>
      )}
    </div>
  )
}

/**
 * 财务数据为空组件
 */
interface FinanceDataEmptyProps {
  message?: string
  description?: string
  action?: ReactNode
}

export function FinanceDataEmpty({ 
  message = '暂无数据',
  description = '当前没有可显示的内容',
  action
}: FinanceDataEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-8 h-8 text-gray-400" />
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {message}
      </h3>
      
      <p className="text-sm text-muted-foreground text-center mb-6 max-w-md">
        {description}
      </p>

      {action}
    </div>
  )
}