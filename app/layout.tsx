'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { usePathname } from "next/navigation";
import { globalErrorHandler } from "@/lib/error-handler";
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { getQueryClient } from '@/lib/query-client';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 不需要侧边栏的路径
const noSidebarPaths = ['/login', '/auth/callback'];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 检查当前路径是否需要侧边栏
  const shouldShowSidebar = !noSidebarPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    globalErrorHandler.handleError(error, `页面错误: ${pathname}`)
  }

  if (!shouldShowSidebar) {
    return (
      <ErrorBoundary onError={handleError}>
        {children}
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary onError={handleError}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          {children}
        </SidebarInset>
      </SidebarProvider>
    </ErrorBoundary>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 获取QueryClient实例
  const queryClient = getQueryClient();
  
  return (
    <html lang="en">
      <head>
        <title>Linke Admin</title>
        <meta name="description" content="Linke管理后台" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <QueryClientProvider client={queryClient}>
          <LayoutContent>{children}</LayoutContent>
          <Toaster />
          {/* 开发环境显示React Query DevTools */}
          {process.env.NODE_ENV === 'development' && (
            <ReactQueryDevtools 
              initialIsOpen={false}
              position="bottom-right"
            />
          )}
        </QueryClientProvider>
      </body>
    </html>
  );
}
