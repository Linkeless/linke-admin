'use client'

import React from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button" 
import { Badge } from "@/components/ui/badge"
import { AlertCircle, RefreshCw, Wifi, WifiOff, Clock, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DashboardErrorAlertProps {
  error: string | null
  onRetry?: () => void
  onDismiss?: () => void
  isRetrying?: boolean
  retryCount?: number
  lastAttempt?: Date
  className?: string
}

// 错误类型枚举
enum ErrorType {
  NETWORK = 'network',
  SERVER = 'server',
  TIMEOUT = 'timeout',
  PERMISSION = 'permission',
  UNKNOWN = 'unknown'
}

// 错误分析函数
function analyzeError(error: string): {
  type: ErrorType
  severity: 'low' | 'medium' | 'high'
  suggestion: string
} {
  const errorLower = error.toLowerCase()
  
  if (errorLower.includes('network') || errorLower.includes('fetch') || errorLower.includes('connection')) {
    return {
      type: ErrorType.NETWORK,
      severity: 'medium',
      suggestion: '请检查网络连接或稍后重试'
    }
  }
  
  if (errorLower.includes('timeout') || errorLower.includes('超时')) {
    return {
      type: ErrorType.TIMEOUT,
      severity: 'medium',
      suggestion: '请求超时，请检查网络状况'
    }
  }
  
  if (errorLower.includes('500') || errorLower.includes('server error') || errorLower.includes('服务器')) {
    return {
      type: ErrorType.SERVER,
      severity: 'high',
      suggestion: '服务器暂时不可用，我们正在修复'
    }
  }
  
  if (errorLower.includes('401') || errorLower.includes('403') || errorLower.includes('unauthorized')) {
    return {
      type: ErrorType.PERMISSION,
      severity: 'high',
      suggestion: '权限不足，请重新登录'
    }
  }
  
  return {
    type: ErrorType.UNKNOWN,
    severity: 'medium',
    suggestion: '发生未知错误，请稍后重试'
  }
}

// 获取错误图标
function getErrorIcon(type: ErrorType) {
  switch (type) {
    case ErrorType.NETWORK:
    case ErrorType.TIMEOUT:
      return WifiOff
    case ErrorType.SERVER:
      return AlertCircle
    case ErrorType.PERMISSION:
      return AlertCircle
    default:
      return AlertCircle
  }
}

export const DashboardErrorAlert = React.memo<DashboardErrorAlertProps>(function DashboardErrorAlert({ 
  error, 
  onRetry,
  onDismiss,
  isRetrying = false,
  retryCount = 0,
  lastAttempt,
  className
}) {
  if (!error) return null

  const errorAnalysis = analyzeError(error)
  const ErrorIcon = getErrorIcon(errorAnalysis.type)

  // 格式化最后尝试时间
  const formattedLastAttempt = React.useMemo(() => {
    if (!lastAttempt) return null
    return lastAttempt.toLocaleTimeString('zh-CN')
  }, [lastAttempt])

  // 判断是否显示重试按钮
  const shouldShowRetry = onRetry && errorAnalysis.type !== ErrorType.PERMISSION

  return (
    <Alert 
      variant="destructive" 
      className={cn("border-l-4", className)}
    >
      <ErrorIcon className="h-4 w-4" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2 mb-2">
            数据加载失败
            <Badge variant="secondary" className="text-xs">
              {errorAnalysis.type}
            </Badge>
            {retryCount > 0 && (
              <Badge variant="outline" className="text-xs">
                已重试 {retryCount} 次
              </Badge>
            )}
          </AlertTitle>
          <AlertDescription className="space-y-2">
            <div className="text-sm">
              <p className="font-medium text-red-700">{error}</p>
              <p className="text-red-600 mt-1">{errorAnalysis.suggestion}</p>
            </div>
            
            {formattedLastAttempt && (
              <div className="flex items-center gap-2 text-xs text-red-600">
                <Clock className="h-3 w-3" />
                最后尝试时间: {formattedLastAttempt}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-3">
              {shouldShowRetry && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRetry}
                  disabled={isRetrying}
                  className="border-red-300 hover:bg-red-50"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      重试中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      重试
                    </>
                  )}
                </Button>
              )}
              
              {onDismiss && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onDismiss}
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  忽略
                </Button>
              )}

              {errorAnalysis.type === ErrorType.NETWORK && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
                  <Wifi className="h-3 w-3" />
                  网络状态检查
                </div>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
})

// 批量错误处理组件
interface MultipleErrorsAlertProps {
  errors: Array<{ id: string; message: string; timestamp: Date }>
  onRetryAll?: () => void
  onDismissAll?: () => void
  onRetryError?: (id: string) => void
  onDismissError?: (id: string) => void
  isRetrying?: boolean
  className?: string
}

export const MultipleErrorsAlert = React.memo<MultipleErrorsAlertProps>(function MultipleErrorsAlert({
  errors,
  onRetryAll,
  onDismissAll,
  onRetryError,
  onDismissError,
  isRetrying = false,
  className
}) {
  if (!errors || errors.length === 0) return null

  if (errors.length === 1) {
    return (
      <DashboardErrorAlert
        error={errors[0].message}
        onRetry={onRetryError ? () => onRetryError(errors[0].id) : undefined}
        onDismiss={onDismissError ? () => onDismissError(errors[0].id) : undefined}
        lastAttempt={errors[0].timestamp}
        className={className}
      />
    )
  }

  return (
    <Alert variant="destructive" className={cn("border-l-4", className)}>
      <AlertCircle className="h-4 w-4" />
      <div className="flex items-start justify-between w-full">
        <div className="flex-1">
          <AlertTitle className="flex items-center gap-2 mb-2">
            多个数据加载失败
            <Badge variant="destructive" className="text-xs">
              {errors.length} 个错误
            </Badge>
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {errors.map((error, index) => (
                <div key={error.id} className="text-sm border-l-2 border-red-300 pl-2">
                  <p className="font-medium text-red-700">错误 {index + 1}: {error.message}</p>
                  <p className="text-xs text-red-600">{error.timestamp.toLocaleTimeString('zh-CN')}</p>
                </div>
              ))}
            </div>
            
            <div className="flex items-center gap-2">
              {onRetryAll && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={onRetryAll}
                  disabled={isRetrying}
                  className="border-red-300 hover:bg-red-50"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      重试中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      全部重试
                    </>
                  )}
                </Button>
              )}
              
              {onDismissAll && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={onDismissAll}
                  className="text-red-600 hover:bg-red-50"
                >
                  <X className="h-4 w-4 mr-2" />
                  全部忽略
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
    </Alert>
  )
})