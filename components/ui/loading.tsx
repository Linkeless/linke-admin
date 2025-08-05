import { Loader2, Wifi, WifiOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
  variant?: "spinner" | "dots" | "pulse" | "bars" | "wave"
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  avatar?: boolean
  variant?: "card" | "list" | "table" | "chart"
}

interface ProgressiveLoadingProps {
  steps: string[]
  currentStep: number
  className?: string
}

/**
 * 基础Loading组件
 */
export function Loading({ 
  size = "md", 
  className, 
  text, 
  variant = "spinner" 
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  const textSizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg"
  }

  if (variant === "spinner") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        {text && (
          <span className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === "dots") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className="flex space-x-1">
          <div className={cn("rounded-full bg-current animate-pulse", {
            "w-2 h-2": size === "sm",
            "w-3 h-3": size === "md", 
            "w-4 h-4": size === "lg"
          })} style={{ animationDelay: "0ms" }} />
          <div className={cn("rounded-full bg-current animate-pulse", {
            "w-2 h-2": size === "sm",
            "w-3 h-3": size === "md",
            "w-4 h-4": size === "lg" 
          })} style={{ animationDelay: "150ms" }} />
          <div className={cn("rounded-full bg-current animate-pulse", {
            "w-2 h-2": size === "sm",
            "w-3 h-3": size === "md",
            "w-4 h-4": size === "lg"
          })} style={{ animationDelay: "300ms" }} />
        </div>
        {text && (
          <span className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className={cn("rounded-full bg-current animate-pulse", sizeClasses[size])} />
        {text && (
          <span className={cn("text-muted-foreground animate-pulse", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === "bars") {
    const barHeight = {
      sm: ["h-2", "h-3", "h-2", "h-4", "h-2"],
      md: ["h-3", "h-4", "h-3", "h-5", "h-3"],
      lg: ["h-4", "h-5", "h-4", "h-6", "h-4"]
    }

    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className="flex items-end space-x-1">
          {barHeight[size].map((height, i) => (
            <div
              key={i}
              className={cn(
                "w-1 bg-current animate-pulse rounded-sm",
                height
              )}
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
        {text && (
          <span className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  if (variant === "wave") {
    return (
      <div className={cn("flex items-center justify-center gap-2", className)}>
        <div className="flex items-center space-x-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn("bg-current rounded-full animate-bounce", {
                "w-1 h-1": size === "sm",
                "w-1.5 h-1.5": size === "md",
                "w-2 h-2": size === "lg"
              })}
              style={{
                animationDelay: `${i * 150}ms`,
                animationDuration: "1.5s"
              }}
            />
          ))}
        </div>
        {text && (
          <span className={cn("text-muted-foreground", textSizeClasses[size])}>
            {text}
          </span>
        )}
      </div>
    )
  }

  return null
}

/**
 * 页面级Loading组件
 */
export function PageLoading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loading size="lg" text={text} />
    </div>
  )
}

/**
 * 卡片Loading组件
 */
export function CardLoading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loading size="md" text={text} />
    </div>
  )
}

/**
 * 按钮Loading组件
 */
export function ButtonLoading({ size = "sm", className }: LoadingSpinnerProps) {
  return (
    <Loader2 className={cn("animate-spin", {
      "w-3 h-3": size === "sm",
      "w-4 h-4": size === "md",
      "w-5 h-5": size === "lg"
    }, className)} />
  )
}

/**
 * 表格Loading组件
 */
export function TableLoading({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex space-x-4">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-4 flex-1 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
      ))}
    </div>
  )
}

/**
 * 内容骨架Loading组件
 */
export function LoadingSkeleton({ 
  className, 
  lines = 3, 
  avatar = false,
  variant = "card"
}: LoadingSkeletonProps) {
  if (variant === "card") {
    return (
      <div className={cn("space-y-3", className)}>
        {avatar && (
          <div className="flex items-center space-x-4">
            <div className="skeleton h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <div className="skeleton h-4 w-[200px] rounded" />
              <div className="skeleton h-4 w-[160px] rounded" />
            </div>
          </div>
        )}
        <div className="space-y-2">
          {Array.from({ length: lines }).map((_, i) => (
            <div 
              key={i} 
              className={cn("skeleton h-4 rounded", {
                "w-full": i < lines - 1,
                "w-[80%]": i === lines - 1
              })} 
            />
          ))}
        </div>
      </div>
    )
  }

  if (variant === "list") {
    return (
      <div className={cn("space-y-4", className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex items-center space-x-4">
            <div className="skeleton h-10 w-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-4 w-3/4 rounded" />
              <div className="skeleton h-3 w-1/2 rounded" />
            </div>
            <div className="skeleton h-6 w-16 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "table") {
    return (
      <div className={cn("space-y-3", className)}>
        {/* Table header */}
        <div className="flex space-x-4 pb-2 border-b">
          <div className="skeleton h-4 w-4 rounded" />
          <div className="skeleton h-4 flex-1 rounded" />
          <div className="skeleton h-4 w-20 rounded" />
          <div className="skeleton h-4 w-16 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        {/* Table rows */}
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="flex space-x-4">
            <div className="skeleton h-4 w-4 rounded" />
            <div className="skeleton h-4 flex-1 rounded" />
            <div className="skeleton h-4 w-20 rounded" />
            <div className="skeleton h-4 w-16 rounded" />
            <div className="skeleton h-4 w-24 rounded" />
          </div>
        ))}
      </div>
    )
  }

  if (variant === "chart") {
    return (
      <div className={cn("space-y-4", className)}>
        <div className="flex items-center justify-between">
          <div className="skeleton h-6 w-32 rounded" />
          <div className="skeleton h-4 w-24 rounded" />
        </div>
        <div className="h-64 flex items-end justify-between space-x-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="skeleton flex-1 rounded-t"
              style={{
                height: `${20 + Math.random() * 80}%`,
                animationDelay: `${i * 100}ms`
              }}
            />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-3 w-8 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      {avatar && (
        <div className="flex items-center space-x-4">
          <div className="skeleton h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <div className="skeleton h-4 w-[200px] rounded" />
            <div className="skeleton h-4 w-[160px] rounded" />
          </div>
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div 
            key={i} 
            className={cn("skeleton h-4 rounded", {
              "w-full": i < lines - 1,
              "w-[80%]": i === lines - 1
            })} 
          />
        ))}
      </div>
    </div>
  )
}

/**
 * 渐进式Loading组件
 */
export function ProgressiveLoading({ steps, currentStep, className }: ProgressiveLoadingProps) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-center">
        <Loading size="lg" variant="spinner" />
      </div>
      <div className="space-y-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center space-x-3 transition-all duration-200",
              index <= currentStep ? "opacity-100" : "opacity-50"
            )}
          >
            <div
              className={cn(
                "w-2 h-2 rounded-full transition-colors duration-200",
                index < currentStep
                  ? "bg-green-500"
                  : index === currentStep
                  ? "bg-blue-500 animate-pulse"
                  : "bg-muted-foreground"
              )}
            />
            <span
              className={cn(
                "text-sm transition-colors duration-200",
                index <= currentStep ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * 网络状态Loading组件
 */
export function NetworkLoading({ 
  isConnected = true, 
  className 
}: { 
  isConnected?: boolean
  className?: string 
}) {
  return (
    <div className={cn("flex items-center justify-center gap-2", className)}>
      {isConnected ? (
        <Wifi className="w-5 h-5 text-green-500" />
      ) : (
        <WifiOff className="w-5 h-5 text-red-500" />
      )}
      <span className="text-sm text-muted-foreground">
        {isConnected ? "连接正常" : "网络异常"}
      </span>
    </div>
  )
}

/**
 * 全屏Loading组件
 */
export function FullScreenLoading({ text = "加载中..." }: { text?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="flex flex-col items-center space-y-4">
        <Loading size="lg" />
        <p className="text-sm text-muted-foreground">{text}</p>
      </div>
    </div>
  )
}