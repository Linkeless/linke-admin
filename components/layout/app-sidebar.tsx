"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Layers3,
  Users,
  Shield,
  User,
  CreditCard,
  Palette,
  Bell,
  HelpCircle,
  Package,
  UserCheck,
  ShoppingCart,
  Ticket,
  TicketCheck,
  FileText,
  Activity,
  Database,
  BarChart3,
  AlertTriangle,
  Workflow,
  UserCog,
  KeyRound,
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarRail,
} from "@/components/ui/sidebar"
import { NavGroup, type NavGroupProps } from "@/components/layout/nav-group"
import { NavUser } from "@/components/layout/nav-user"
import { TeamSwitcher } from "@/components/layout/team-switcher"

// Navigation groups data - 基于swagger.json API设计的11个业务领域
const navGroups: NavGroupProps[] = [
  {
    title: "仪表板",
    items: [
      {
        title: "概览",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: "用户管理",
    items: [
      {
        title: "用户列表",
        url: "/users",
        icon: Users,
      },
      {
        title: "已删除用户",
        url: "/users/deleted",
        icon: UserCog,
      },
    ],
  },
  {
    title: "认证系统",
    items: [
      {
        title: "邀请码管理",
        url: "/auth/invite-codes",
        icon: KeyRound,
      },
    ],
  },
  {
    title: "订阅管理",
    items: [
      {
        title: "订阅计划",
        url: "/subscriptions/plans",
        icon: Package,
      },
      {
        title: "用户订阅",
        url: "/subscriptions/users",
        icon: UserCheck,
      },
    ],
  },
  {
    title: "财务管理",
    items: [
      {
        title: "发票管理",
        url: "/finance/invoices",
        icon: FileText,
      },
      {
        title: "订单管理",
        url: "/finance/orders",
        icon: ShoppingCart,
      },
      {
        title: "优惠码管理",
        url: "/finance/coupons",
        icon: Ticket,
      },
    ],
  },
  {
    title: "支付系统",
    items: [
      {
        title: "支付配置",
        url: "/payments/config",
        icon: CreditCard,
      },
      {
        title: "支付重试",
        url: "/payments/retry",
        icon: Workflow,
      },
    ],
  },
  {
    title: "服务器管理",
    items: [
      {
        title: "Shadowsocks服务器",
        url: "/servers/shadowsocks-servers",
        icon: Shield,
      },
      {
        title: "服务器组",
        url: "/servers/server-groups",
        icon: Layers3,
      },
    ],
  },
  {
    title: "监控告警",
    items: [
      {
        title: "使用量告警",
        url: "/usage/alerts",
        icon: AlertTriangle,
      },
      {
        title: "系统监控",
        url: "/usage/monitoring",
        icon: Activity,
      },
    ],
  },
  {
    title: "使用量分析",
    items: [
      {
        title: "使用量统计",
        url: "/usage",
        icon: BarChart3,
      },
      {
        title: "数据分析",
        url: "/usage/analytics",
        icon: BarChart3,
      },
      {
        title: "管理后台",
        url: "/usage/admin",
        icon: UserCog,
      },
    ],
  },
  {
    title: "缓存管理",
    items: [
      {
        title: "缓存概览",
        url: "/cache",
        icon: Database,
      },
      {
        title: "缓存指标",
        url: "/cache/metrics",
        icon: BarChart3,
      },
      {
        title: "缓存管理",
        url: "/cache/management",
        icon: Database,
      },
      {
        title: "缓存监控",
        url: "/cache/monitoring",
        icon: Activity,
      },
    ],
  },
  {
    title: "客户支持",
    items: [
      {
        title: "工单管理",
        url: "/support/tickets",
        icon: TicketCheck,
      },
    ],
  },
  {
    title: "系统设置",
    items: [
      {
        title: "个人资料",
        url: "/settings/profile",
        icon: User,
      },
      {
        title: "账户设置",
        url: "/settings/account",
        icon: CreditCard,
      },
      {
        title: "外观设置",
        url: "/settings/appearance",
        icon: Palette,
      },
      {
        title: "通知设置",
        url: "/settings/notifications",
        icon: Bell,
      },
      {
        title: "帮助中心",
        url: "/help",
        icon: HelpCircle,
      },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" variant="floating" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
        <form>
          <SidebarInput placeholder="搜索..." />
        </form>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group) => (
          <NavGroup key={group.title} {...group} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
