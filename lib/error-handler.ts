import { toast } from 'sonner'
import { ApiError } from './types'

// 业务错误接口
interface BusinessError extends Error {
  code: number
}

// 验证错误接口
interface ValidationError extends Error {
  errors: Record<string, string[]>
}

/**
 * 全局错误处理器
 * 提供统一的错误处理和用户友好的错误消息显示
 */
export class ErrorHandler {
  private static instance: ErrorHandler
  
  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  /**
   * 处理API错误并显示适当的用户通知
   */
  public handleError(error: unknown, context?: string): void {
    let errorMessage = '操作失败，请稍后重试'
    let errorDetails = ''

    // 根据错误类型提供不同的处理
    if (error instanceof ApiError) {
      errorMessage = error.message
      errorDetails = `错误代码: ${error.code}`
    } else if (error instanceof Error) {
      // 处理标准JavaScript错误
      if (error.name === 'BusinessError') {
        errorMessage = error.message
        errorDetails = `业务错误: ${(error as BusinessError).code}`
      } else if (error.name === 'ValidationError') {
        errorMessage = error.message
        const validationError = error as ValidationError
        if (validationError.errors && Object.keys(validationError.errors).length > 0) {
          errorDetails = this.formatValidationErrors(validationError.errors)
        }
      } else if (error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else if (error.message.includes('timeout')) {
        errorMessage = '请求超时，请稍后重试'
      } else {
        errorMessage = error.message
      }
    } else if (typeof error === 'string') {
      errorMessage = error
    }

    // 添加上下文信息
    if (context) {
      errorDetails = errorDetails ? `${context} - ${errorDetails}` : context
    }

    // 显示错误通知
    this.showErrorToast(errorMessage, errorDetails)

    // 记录错误到控制台（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', {
        context,
        error,
        message: errorMessage,
        details: errorDetails
      })
    }
  }

  /**
   * 处理成功操作并显示通知
   */
  public handleSuccess(message: string, description?: string): void {
    toast.success(message, {
      description,
      duration: 3000,
    })
  }

  /**
   * 显示信息通知
   */
  public showInfo(message: string, description?: string): void {
    toast.info(message, {
      description,
      duration: 4000,
    })
  }

  /**
   * 显示警告通知
   */
  public showWarning(message: string, description?: string): void {
    toast.warning(message, {
      description,
      duration: 5000,
    })
  }

  /**
   * 显示加载通知
   */
  public showLoading(message: string, description?: string): string {
    return toast.loading(message, {
      description,
    })
  }

  /**
   * 关闭特定的通知
   */
  public dismissToast(toastId: string): void {
    toast.dismiss(toastId)
  }

  /**
   * 显示错误Toast
   */
  private showErrorToast(message: string, details?: string): void {
    toast.error(message, {
      description: details,
      duration: 6000,
      action: details ? {
        label: '详情',
        onClick: () => {
          console.error('Error details:', details)
          // 可以在这里添加显示详细错误信息的模态框
        }
      } : undefined,
    })
  }

  /**
   * 格式化表单验证错误
   */
  private formatValidationErrors(errors: Record<string, string[]>): string {
    const errorMessages = Object.entries(errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('; ')
    
    return `表单验证错误: ${errorMessages}`
  }

  /**
   * 处理认证错误（401/403）
   */
  public handleAuthError(error: unknown): void {
    if (error instanceof ApiError && (error.code === 401 || error.code === 403)) {
      toast.error('认证失败', {
        description: '您的登录会话已过期，请重新登录',
        duration: 5000,
        action: {
          label: '前往登录',
          onClick: () => {
            window.location.href = '/login'
          }
        }
      })
    } else {
      this.handleError(error, '认证错误')
    }
  }

  /**
   * 处理网络错误
   */
  public handleNetworkError(error: unknown): void {
    toast.error('网络错误', {
      description: '无法连接到服务器，请检查网络连接',
      duration: 5000,
      action: {
        label: '重试',
        onClick: () => {
          window.location.reload()
        }
      }
    })
  }
}

// 导出单例实例和便捷方法
export const errorHandler = ErrorHandler.getInstance()

// 便捷方法
export const showError = (error: unknown, context?: string) => {
  errorHandler.handleError(error, context)
}

export const showSuccess = (message: string, description?: string) => {
  errorHandler.handleSuccess(message, description)
}

export const showInfo = (message: string, description?: string) => {
  errorHandler.showInfo(message, description)
}

export const showWarning = (message: string, description?: string) => {
  errorHandler.showWarning(message, description)
}

export const showLoading = (message: string, description?: string) => {
  return errorHandler.showLoading(message, description)
}

export default errorHandler