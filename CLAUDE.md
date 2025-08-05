# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个现代化的企业级管理后台系统 "linke-admin"，基于最新技术栈构建：
- **Next.js 15** + **React 19** (App Router)
- **TypeScript** 严格模式，完整类型安全
- **Tailwind CSS v4** + **shadcn/ui** 企业级设计系统
- **多业务模块**: 用户管理、订阅管理、财务管理、服务器管理等12个核心模块

## 开发命令

```bash
# 启动开发服务器 (Turbopack)
npm run dev

# 生产构建
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint

# shadcn/ui 组件管理
npx shadcn@latest add [component-name]  # 添加新组件
npx shadcn@latest add button dialog     # 添加多个组件
npx shadcn@latest diff [component-name] # 检查组件更新
```

## 核心架构

### 分层架构设计
```
分层架构 (从上到下):
- 页面层 (app/) - Next.js App Router 路由和页面
- 组件层 (components/) - 三层组件架构
- 服务层 (lib/) - 业务逻辑和API封装
- 状态层 (contexts/hooks/) - 状态管理和数据流
```

### 业务模块架构
**12个核心业务模块，每个模块都有完整的CRUD操作**：
- **用户管理** (`users/`) - 多认证方式，角色权限控制
- **订阅管理** (`subscriptions/`) - 核心业务，包含plans和users子模块
- **财务管理** (`finance/`) - orders和coupons管理
- **服务器管理** (`servers/`) - Shadowsocks节点和组管理
- **客户支持** (`support/`) - 工单系统
- **系统设置** (`settings/`) - 配置管理

### 服务层设计模式
**统一的服务层架构** (`lib/`目录):
```typescript
// 每个业务模块都有独立的服务层
user-service.ts     // 17个用户管理接口
subscription-service.ts // 13个订阅管理接口
order-service.ts    // 6个订单管理接口
payment-service.ts  // 支付配置管理
ticket-service.ts   // 工单系统
dashboard-service.ts // 仪表板数据
```

**核心API客户端** (`lib/api.ts`):
- 自动JWT Token注入和刷新
- 401错误自动重试机制
- 统一错误处理和响应格式
- 环境配置切换 (localhost:8080 -> 生产环境)

**API文档规范**:
- **完整Swagger 2.0文档**: `swagger.json` 包含所有接口定义
- **API描述**: "A comprehensive service management platform with subscription-based billing, user management, and server administration"
- **认证机制**: BearerAuth (JWT Token)
- **响应规范**: 所有接口遵循统一的响应格式和错误码

### 认证授权架构
**多重认证支持**:
- 本地认证 (邮箱+密码)
- OAuth认证 (Google, GitHub, Telegram)
- JWT机制 (Access Token + Refresh Token)

**权限控制**:
- 角色层级: `system` > `admin` > `user`
- 状态控制: `active`, `inactive`, `suspended`, `banned`
- AuthContext全局状态管理

### 组件架构 - shadcn/ui三层设计
基于shadcn/ui最佳实践的组件架构模式：

```
第一层: 基础UI组件 (components/ui/) - shadcn/ui原子组件
├── button.tsx, input.tsx, dialog.tsx 等44个基础组件
├── 遵循组合模式 (Composition Pattern)
└── 统一的导入别名: @/components/ui/*

第二层: 布局复合组件 (components/layout/)
├── app-sidebar.tsx - SidebarProvider + Sidebar组合
├── page-header.tsx - 页面标题和操作栏
└── nav-user.tsx - 用户信息下拉菜单

第三层: 业务复合组件 (components/[module]/)
├── [module]-table.tsx - DataTable + columns组合
├── [module]-dialog.tsx - Dialog + Form组合
└── [module]-cards.tsx - 业务卡片组件
```

**shadcn/ui组件配置** (`components.json`):
- **Style**: "new-york" - 现代简洁风格
- **Base Color**: "neutral" - 中性色调
- **CSS Variables**: 启用，支持主题切换
- **RSC**: 启用，支持React Server Components
- **Icon Library**: "lucide" - Lucide React图标库

**关键布局组件遵循shadcn/ui模式**:
- `app-sidebar.tsx` - 使用SidebarProvider包装，条件渲染逻辑
- `page-header.tsx` - 组合Button、DropdownMenu等基础组件
- `nav-user.tsx` - Avatar + DropdownMenu组合模式

### 数据管理架构
**标准响应格式**:
```typescript
interface StandardResponse<T> {
  code: number    // 0=成功
  message: string
  data?: T
}

interface PaginatedResponse<T> {
  code: number
  message: string  
  data: T[]
  total: number   // 分页相关
  limit: number
  offset: number
}
```

**React Hooks数据管理**:
- `use-dashboard-data.ts` - 仪表板数据获取
- `use-mobile.ts` - 响应式检测
- `use-user-profile.ts` - 用户信息管理

## 开发规范

### 文件组织规范 - 遵循shadcn/ui最佳实践
每个业务模块都遵循shadcn/ui推荐的文件组织结构：

```
[module]/
├── page.tsx              # Next.js App Router页面入口
├── loading.tsx           # 页面级Loading UI
├── components/           # 模块专用组件目录
│   ├── [module]-table.tsx    # 数据表格 (使用DataTable)
│   ├── [module]-dialog.tsx   # 弹窗表单 (Dialog + Form组合)
│   ├── [module]-form.tsx     # 表单组件 (使用React Hook Form)
│   ├── columns.tsx           # 表格列定义 (TanStack Table)
│   └── index.ts             # 统一导出所有组件
├── [sub-module]/        # 子模块 (如subscriptions/plans)
│   ├── page.tsx
│   └── components/
└── types.ts             # 模块类型定义

# shadcn/ui组件导入模式示例:
import { Button, Dialog, DialogContent } from "@/components/ui/*"
import { DataTable } from "@/components/ui/data-table"
import { Form, FormField, FormItem } from "@/components/ui/form"
```

**组件组合原则**:
- **Composition over Configuration**: 优先使用组件组合而非复杂配置
- **统一接口**: 所有组件遵循相同的props接口模式
- **可预测性**: 团队和AI都能快速理解组件API

### API集成规范
**Swagger API文档**: 项目根目录的 `swagger.json` 文件包含完整的API规范
- **后端API**: RESTful API，基于Swagger 2.0规范
- **API Host**: `localhost:8080` (开发环境)
- **API Base Path**: `/api/v1`
- **认证方式**: Bearer Token (BearerAuth)
- **完整接口覆盖**: 
  - 优惠码管理 (`/admin/coupons`)
  - 邀请码管理 (`/admin/invite-codes`) 
  - 发票管理 (`/admin/invoices`)
  - 订单管理 (`/admin/orders`)
  - 支付配置 (`/admin/payments`)
  - 用户管理等其他模块

**标准响应格式**:
- 成功响应: `StandardResponse` 或 `PaginatedResponse`
- 错误响应: 统一的错误状态码和消息格式
- 分页参数: `limit` (1-100), `offset` (>=0)
- 排序参数: `sort_by`, `sort_order` (asc/desc)

### TypeScript规范
- 严格模式启用，完整类型覆盖
- 每个模块有独立的类型文件 (`*-types.ts`)
- API响应类型统一定义
- 组件Props接口规范

### 样式规范 - shadcn/ui设计系统
基于shadcn/ui的完整设计系统规范：

**Tailwind CSS集成**:
- **版本**: Tailwind CSS v4
- **配置**: CSS Variables模式，支持动态主题
- **基础色彩**: "neutral" - 提供平衡的视觉层次
- **响应式**: 移动优先设计，支持所有断点

**shadcn/ui设计原则**:
- **Style**: "new-york" - 现代简洁的视觉风格
- **一致性**: 所有组件遵循统一的设计语言
- **可访问性**: 内置ARIA属性和键盘导航支持
- **主题系统**: CSS Variables实现的明暗主题切换

**组件样式模式**:
```typescript
// 使用cn()工具函数进行样式组合
import { cn } from "@/lib/utils"

// 标准组件样式模式
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
)
```

**CSS Variables主题系统**:
- Light/Dark主题自动切换
- 完整的语义化颜色系统
- 组件级别的主题定制支持

## shadcn/ui最佳实践

### 组件使用模式
**1. 组合模式优先**:
```typescript
// ✅ 推荐: 使用组件组合
<Dialog>
  <DialogTrigger asChild>
    <Button variant="outline">Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>确认操作</DialogTitle>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">取消</Button>
      <Button>确认</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>

// ❌ 避免: 复杂的配置对象
<Dialog config={{ title: "确认操作", buttons: ["取消", "确认"] }} />
```

**2. DataTable标准模式**:
```typescript
// 文件组织: payments/
// ├── columns.tsx     # 列定义
// ├── data-table.tsx  # DataTable组件
// └── page.tsx        # 页面渲染

// columns.tsx - 列定义分离
export const columns: ColumnDef<Payment>[] = [
  {
    accessorKey: "status",
    header: "状态",
    cell: ({ row }) => <Badge variant={getStatusVariant(row.getValue("status"))} />
  }
]

// data-table.tsx - 可复用的表格组件
export function DataTable<TData, TValue>({ columns, data }: DataTableProps<TData, TValue>) {
  // 表格逻辑实现
}
```

**3. Form表单最佳实践**:
```typescript
// 使用React Hook Form + Zod
const formSchema = z.object({
  username: z.string().min(2, "用户名至少2个字符"),
})

function ProfileForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder="输入用户名" {...field} />
              </FormControl>
              <FormDescription>这是您的公开显示名称</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )
}
```

### 组件扩展原则
**1. 不要修改原始组件**: 通过组合创建新组件
**2. 使用cva进行样式变体**: 保持设计系统一致性
**3. 保持组件接口简洁**: 遵循shadcn/ui的API设计模式

### 主题和样式管理
**CSS Variables方式** (推荐，项目当前使用):
- 支持动态主题切换
- 更好的设计系统一致性
- 便于主题定制

**关键配置文件**:
- `components.json` - shadcn/ui配置中心
- `app/globals.css` - 全局样式和CSS Variables
- `lib/utils.ts` - cn()工具函数和样式组合

## 关键架构特点

1. **模块化设计**: 12个业务模块独立开发，统一架构模式
2. **服务层抽象**: 每个模块都有独立的服务层，统一的API调用模式  
3. **shadcn/ui组件复用**: 三层组件架构，基于组合模式的高度复用
4. **类型安全**: 端到端TypeScript，从API到UI的完整类型覆盖
5. **状态管理**: Context + Hooks模式，避免复杂的状态管理库
6. **设计系统**: 基于shadcn/ui的统一视觉语言和交互模式