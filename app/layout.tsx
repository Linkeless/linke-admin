'use client'

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Toaster } from "@/components/ui/sonner";
import { usePathname } from "next/navigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 不需要侧边栏的路径
const noSidebarPaths = ['/login', '/auth'];

function LayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // 检查当前路径是否需要侧边栏
  const shouldShowSidebar = !noSidebarPaths.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <title>Linke Admin</title>
        <meta name="description" content="Linke管理后台" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <LayoutContent>{children}</LayoutContent>
        <Toaster />
      </body>
    </html>
  );
}
