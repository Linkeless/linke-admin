"use client"

import * as React from "react"
import {
  LayoutDashboard,
  Layers3,
  Users,
  Shield,
  Settings,
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

// Navigation groups data
const navGroups: NavGroupProps[] = [
  {
    title: "General",
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "支付管理",
        url: "/general/payments",
        icon: CreditCard,
      },
      {
        title: "用户管理",
        url: "/users",
        icon: Users,
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
    title: "系统",
    items: [
      {
        title: "设置",
        url: "#",
        icon: Settings,
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
        ],
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
