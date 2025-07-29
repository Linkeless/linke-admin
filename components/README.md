# 组件目录结构

这个文档描述了项目中组件的目录组织结构。

## 目录结构

```
components/
├── auth/                   # 认证相关组件
│   └── login-form.tsx     # 登录表单组件
├── dashboard/             # 仪表板相关组件
│   ├── dashboard-revenue-chart.tsx  # 收入图表组件
│   ├── dashboard-stats-cards.tsx   # 统计卡片组件
│   └── dashboard-table.tsx         # 仪表板表格组件
├── layout/                # 布局相关组件
│   ├── app-sidebar.tsx    # 侧边栏组件
│   ├── nav-documents.tsx  # 文档导航组件
│   ├── nav-main.tsx       # 主导航组件
│   ├── nav-secondary.tsx  # 二级导航组件
│   ├── nav-user.tsx       # 用户导航组件
│   └── site-header.tsx    # 网站头部组件
├── users/                 # 用户管理相关组件
│   ├── create-user-dialog.tsx  # 创建用户对话框
│   ├── edit-user-dialog.tsx    # 编辑用户对话框
│   └── user-stats-cards.tsx    # 用户统计卡片
├── ui/                    # 基础UI组件 (shadcn/ui)
│   ├── alert.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── button.tsx
│   ├── card.tsx
│   ├── dialog.tsx
│   ├── form.tsx
│   ├── input.tsx
│   ├── select.tsx
│   └── ...                # 其他UI组件
├── chart-area-interactive.tsx  # 通用交互式图表
├── data-table.tsx             # 通用数据表格
└── section-cards.tsx          # 通用卡片组件
```

## 组件分类规则

### 1. **按页面分类**
- `auth/` - 认证和登录相关页面组件
- `dashboard/` - 仪表板页面组件
- `users/` - 用户管理页面组件

### 2. **按功能分类**
- `layout/` - 应用布局和导航组件
- `ui/` - 基础UI组件（来自shadcn/ui）

### 3. **通用组件**
- 根目录下的组件为跨页面使用的通用组件

## 导入规则

根据组件所在目录，使用相应的导入路径：

```typescript
// 认证组件
import { LoginForm } from '@/components/auth/login-form'

// 仪表板组件
import { DashboardStatsCards } from '@/components/dashboard/dashboard-stats-cards'

// 布局组件
import { AppSidebar } from '@/components/layout/app-sidebar'
import { SiteHeader } from '@/components/layout/site-header'

// 用户管理组件
import { CreateUserDialog } from '@/components/users/create-user-dialog'
import { EditUserDialog } from '@/components/users/edit-user-dialog'
import { UserStatsCards } from '@/components/users/user-stats-cards'

// UI组件
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'

// 通用组件
import { DataTable } from '@/components/data-table'
```

## 添加新组件

当添加新组件时，请遵循以下规则：

1. **确定组件类型**：
   - 如果是特定页面专用的组件，放入相应页面目录
   - 如果是布局相关组件，放入 `layout/` 目录
   - 如果是基础UI组件，放入 `ui/` 目录
   - 如果是跨页面使用的通用组件，放在根目录

2. **命名规范**：
   - 使用 kebab-case 命名文件
   - 组件名使用 PascalCase
   - 文件名应该清楚描述组件功能

3. **更新导入**：
   - 更新所有使用该组件的文件的导入路径
   - 运行 `npm run lint` 确保没有导入错误

## 示例

如果要添加一个新的用户详情对话框组件：

1. 创建文件：`components/users/user-detail-dialog.tsx`
2. 在相关页面中导入：`import { UserDetailDialog } from '@/components/users/user-detail-dialog'`
3. 运行 lint 检查：`npm run lint`