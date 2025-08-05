'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar'

interface PageHeaderProps extends React.HTMLAttributes<HTMLElement> {
  title?: string
  description?: string
  sticky?: boolean
}

// 安全的侧边栏触发器组件
const SafeSidebarTrigger = () => {
  try {
    const sidebar = useSidebar()
    return (
      <>
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
      </>
    )
  } catch {
    // 如果不在 SidebarProvider 中，不渲染侧边栏触发器
    return null
  }
}

export const PageHeader = React.forwardRef<HTMLElement, PageHeaderProps>(
  ({ className, title, description, sticky = false, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className={cn(
          'flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear',
          'border-b bg-background px-4',
          'group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12',
          sticky && 'sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
          className
        )}
        {...props}
      >
        <SafeSidebarTrigger />
        
        <div className="flex flex-1 items-center justify-between gap-4">
          {(title || description) && (
            <div className="flex flex-col gap-1 min-w-0">
              {title && (
                <h1 className="text-lg font-semibold leading-none tracking-tight">
                  {title}
                </h1>
              )}
              {description && (
                <p className="text-sm text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          )}
          
          {children && (
            <div className="flex items-center gap-2 shrink-0">
              {children}
            </div>
          )}
        </div>
      </header>
    )
  }
)

PageHeader.displayName = 'PageHeader'