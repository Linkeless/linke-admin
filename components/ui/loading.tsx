import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
  variant?: "spinner" | "dots" | "pulse"
}

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

interface LoadingSkeletonProps {
  className?: string
  lines?: number
  avatar?: boolean
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
  avatar = false 
}: LoadingSkeletonProps) {
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