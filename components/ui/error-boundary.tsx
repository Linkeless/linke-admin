'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, 
  RefreshCw, 
  Bug, 
  Home, 
  ChevronDown, 
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react'
import { globalErrorHandler, StandardError, ErrorType, ErrorSeverity, errorUtils } from '@/lib/error-handler'

// ==================== 错误边界组件 ====================

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  standardError: StandardError | null
  retryCount: number
  showDetails: boolean
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  enableRetry?: boolean
  maxRetries?: number
  showErrorDetails?: boolean
  level?: 'page' | 'component' | 'critical'
  context?: Record<string, any>
}

// 主要的错误边界组件
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimer: NodeJS.Timeout | null = null

  static defaultProps: Partial<ErrorBoundaryProps> = {
    enableRetry: true,
    maxRetries: 3,
    showErrorDetails: true,
    level: 'component'
  }

  constructor(props: ErrorBoundaryProps) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      standardError: null,
      retryCount: 0,
      showDetails: false
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error
    }
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    try {
      // 使用全局错误处理器处理错误
      const standardError = await globalErrorHandler.handle(error, {
        ...this.props.context,
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: this.props.level,
        retryCount: this.state.retryCount
      })

      this.setState({
        errorInfo,
        standardError
      })

      // 调用外部错误处理回调
      this.props.onError?.(error, errorInfo)
      
    } catch (handlingError) {
      console.error('Error in error handling:', handlingError)
    }
  }

  componentWillUnmount() {
    if (this.retryTimer) {
      clearTimeout(this.retryTimer)
    }
  }

  handleRetry = () => {
    const { maxRetries = 3 } = this.props
    const { retryCount } = this.state

    if (retryCount >= maxRetries) {
      console.warn('Max retries reached, not retrying')
      return
    }

    console.log(`Attempting retry ${retryCount + 1}/${maxRetries}`)
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      standardError: null,
      retryCount: prevState.retryCount + 1,
      showDetails: false
    }))
  }

  handleAutoRetry = () => {
    const { standardError } = this.state
    
    if (!standardError || !standardError.isRetryable) return

    const delay = standardError.retryAfter || 5000
    
    console.log(`Auto retry in ${delay}ms...`)
    
    this.retryTimer = setTimeout(() => {
      this.handleRetry()
    }, delay)
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      standardError: null,
      retryCount: 0,
      showDetails: false
    })
  }

  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }))
  }

  copyErrorDetails = async () => {
    const { error, errorInfo, standardError } = this.state
    
    const errorDetails = {
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack
      },
      standardError,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString()
    }

    try {
      await navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      // 这里可以添加一个toast通知
      console.log('Error details copied to clipboard')
    } catch (clipboardError) {
      console.error('Failed to copy error details:', clipboardError)
    }
  }

  reportIssue = () => {
    const { error, standardError } = this.state
    
    // 构建GitHub Issue或错误报告URL
    const issueTitle = `Error: ${error?.name || 'Unknown Error'}`
    const issueBody = `
Error Details:
- Type: ${standardError?.type || 'Unknown'}
- Severity: ${standardError?.severity || 'Unknown'}
- Message: ${error?.message || 'No message'}
- Component Level: ${this.props.level}
- Retry Count: ${this.state.retryCount}

Stack Trace:
\`\`\`
${error?.stack || 'No stack trace'}
\`\`\`

Additional Context:
\`\`\`json
${JSON.stringify(this.props.context, null, 2)}
\`\`\`
    `.trim()

    const url = `https://github.com/your-repo/issues/new?title=${encodeURIComponent(issueTitle)}&body=${encodeURIComponent(issueBody)}`
    window.open(url, '_blank')
  }

  renderErrorContent() {
    const { error, standardError, retryCount, showDetails } = this.state
    const { enableRetry, maxRetries = 3, level } = this.props

    if (!error) return null

    const userMessage = standardError ? errorUtils.formatUserMessage(standardError) : error.message
    const canRetry = enableRetry && standardError?.isRetryable && retryCount < maxRetries
    const severity = standardError?.severity || ErrorSeverity.MEDIUM

    // 根据错误级别决定显示样式
    const getVariant = () => {
      if (level === 'critical' || severity === ErrorSeverity.CRITICAL) return 'destructive'
      if (severity === ErrorSeverity.HIGH) return 'destructive'
      return 'default'
    }

    const getSeverityColor = (severity: ErrorSeverity) => {
      switch (severity) {
        case ErrorSeverity.CRITICAL: return 'bg-red-100 text-red-800 border-red-200'
        case ErrorSeverity.HIGH: return 'bg-orange-100 text-orange-800 border-orange-200'
        case ErrorSeverity.MEDIUM: return 'bg-yellow-100 text-yellow-800 border-yellow-200'
        case ErrorSeverity.LOW: return 'bg-blue-100 text-blue-800 border-blue-200'
        default: return 'bg-gray-100 text-gray-800 border-gray-200'
      }
    }

    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <div className="flex-1">
              <CardTitle className="text-lg">出现了错误</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {standardError && (
                  <>
                    <Badge variant="outline" className={getSeverityColor(severity)}>
                      {severity}
                    </Badge>
                    <Badge variant="secondary">
                      {standardError.type}
                    </Badge>
                  </>
                )}
                {retryCount > 0 && (
                  <Badge variant="outline">
                    重试 {retryCount}/{maxRetries}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert variant={getVariant()}>
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>错误信息</AlertTitle>
            <AlertDescription>{userMessage}</AlertDescription>
          </Alert>

          {standardError?.recovery && (
            <Alert>
              <Bug className="h-4 w-4" />
              <AlertTitle>建议解决方案</AlertTitle>
              <AlertDescription>{standardError.recovery.description}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            {canRetry && (
              <Button onClick={this.handleRetry} variant="default" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                重试 ({maxRetries - retryCount} 次剩余)
              </Button>
            )}
            
            <Button onClick={this.handleReset} variant="outline" size="sm">
              重置
            </Button>
            
            <Button onClick={() => window.location.href = '/'} variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
            
            {this.props.showErrorDetails && (
              <Button onClick={this.toggleDetails} variant="ghost" size="sm">
                {showDetails ? <ChevronUp className="h-4 w-4 mr-2" /> : <ChevronDown className="h-4 w-4 mr-2" />}
                {showDetails ? '隐藏' : '显示'}详情
              </Button>
            )}
          </div>

          {showDetails && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm flex items-center justify-between">
                  错误详情
                  <div className="flex gap-1">
                    <Button onClick={this.copyErrorDetails} variant="ghost" size="sm">
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button onClick={this.reportIssue} variant="ghost" size="sm">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <strong>错误类型：</strong>
                    <code className="ml-2 px-2 py-1 bg-muted rounded">{error.name}</code>
                  </div>
                  
                  <div>
                    <strong>错误消息：</strong>
                    <code className="ml-2 px-2 py-1 bg-muted rounded block mt-1">{error.message}</code>
                  </div>

                  {standardError && (
                    <>
                      <div>
                        <strong>错误代码：</strong>
                        <code className="ml-2 px-2 py-1 bg-muted rounded">{standardError.code || 'N/A'}</code>
                      </div>
                      
                      <div>
                        <strong>时间戳：</strong>
                        <code className="ml-2 px-2 py-1 bg-muted rounded">
                          {new Date(standardError.timestamp).toLocaleString()}
                        </code>
                      </div>
                    </>
                  )}

                  {error.stack && (
                    <div>
                      <strong>堆栈跟踪：</strong>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                        {error.stack}
                      </pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {canRetry && standardError?.retryAfter && (
            <div className="text-sm text-muted-foreground">
              {standardError.recovery?.automated ? '自动重试' : '建议'}在 {Math.round(standardError.retryAfter / 1000)} 秒后重试
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  render() {
    if (this.state.hasError) {
      // 如果提供了自定义fallback，使用它
      if (this.props.fallback) {
        return this.props.fallback
      }

      // 否则渲染默认错误UI
      return (
        <div className="min-h-[200px] flex items-center justify-center p-4">
          {this.renderErrorContent()}
        </div>
      )
    }

    return this.props.children
  }
}

// 简化版错误边界（用于小组件）
export function SimpleErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: ReactNode
  fallback?: ReactNode 
}) {
  return (
    <ErrorBoundary
      level="component"
      enableRetry={false}
      showErrorDetails={false}
      fallback={fallback || (
        <Alert variant="destructive" className="m-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>组件加载失败</AlertTitle>
          <AlertDescription>
            该组件暂时无法显示，请刷新页面重试。
          </AlertDescription>
        </Alert>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

// 页面级错误边界
export function PageErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      level="page"
      enableRetry={true}
      maxRetries={3}
      showErrorDetails={true}
      context={{ level: 'page' }}
    >
      {children}
    </ErrorBoundary>
  )
}

// 关键功能错误边界
export function CriticalErrorBoundary({ 
  children, 
  feature 
}: { 
  children: ReactNode
  feature: string 
}) {
  return (
    <ErrorBoundary
      level="critical"
      enableRetry={true}
      maxRetries={5}
      showErrorDetails={true}
      context={{ feature, level: 'critical' }}
      onError={(error, errorInfo) => {
        // 关键错误需要立即报告
        console.error(`Critical error in ${feature}:`, error, errorInfo)
        // 这里可以添加即时通知逻辑
      }}
    >
      {children}
    </ErrorBoundary>
  )
}

// Hook形式的错误边界（用于函数组件内部）
export function useErrorHandler() {
  const handleError = React.useCallback(async (error: Error, context?: Record<string, any>) => {
    try {
      const standardError = await globalErrorHandler.handle(error, context)
      return standardError
    } catch (handlingError) {
      console.error('Error in error handling:', handlingError)
      throw error // 重新抛出原始错误
    }
  }, [])

  return { handleError }
}

// 异步错误处理Hook
export function useAsyncError() {
  const [, setError] = React.useState()
  
  return React.useCallback((error: Error) => {
    setError(() => {
      throw error
    })
  }, [setError])
}