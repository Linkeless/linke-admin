# Linke Admin - 完整目录架构设计

基于API接口分析和shadcn/ui最佳实践的完整目录架构规划。

## 🗂️ 完整目录结构

```
linke-admin/
├── app/                        # Next.js 15 App Router
│   ├── layout.tsx              # 根布局
│   ├── page.tsx                # 首页（重定向到dashboard）
│   ├── globals.css             # 全局样式
│   │
│   ├── login/                  # 登录系统 ✅
│   │   └── page.tsx
│   │
│   ├── dashboard/              # 仪表板 ✅
│   │   └── page.tsx
│   │
│   ├── users/                  # 用户管理 ✅
│   │   ├── page.tsx
│   │   ├── columns.tsx
│   │   └── deleted/
│   │       ├── page.tsx
│   │       └── columns.tsx
│   │
│   ├── subscriptions/          # 订阅管理 ✅
│   │   ├── page.tsx
│   │   ├── plans/              # 订阅计划
│   │   │   ├── page.tsx
│   │   │   ├── columns.tsx
│   │   │   ├── create/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   └── users/              # 用户订阅
│   │       ├── page.tsx
│   │       ├── columns.tsx
│   │       ├── create/
│   │       │   └── page.tsx
│   │       └── [id]/
│   │           └── edit/
│   │               └── page.tsx
│   │
│   ├── finance/                # 财务管理
│   │   ├── orders/             # 订单管理 ⚠️ 需完善API对接
│   │   │   ├── page.tsx
│   │   │   └── columns.tsx
│   │   ├── coupons/            # 优惠码管理 ⚠️ 需完善API对接
│   │   │   ├── page.tsx
│   │   │   └── columns.tsx
│   │   └── invoices/           # 发票管理 ✅ 已完成
│   │       ├── page.tsx
│   │       ├── loading.tsx
│   │       ├── columns.tsx
│   │       ├── types.ts
│   │       ├── components/
│   │       │   ├── index.ts
│   │       │   ├── invoice-status-badge.tsx
│   │       │   ├── invoice-actions.tsx
│   │       │   └── invoice-form.tsx
│   │       └── [id]/
│   │           ├── page.tsx
│   │           └── edit/
│   │               └── page.tsx
│   │
│   ├── usage/                  # 使用量监控 🔥 核心功能 - 待实现
│   │   ├── page.tsx            # 使用量总览
│   │   ├── loading.tsx
│   │   ├── alerts/             # 告警管理
│   │   │   ├── page.tsx
│   │   │   ├── loading.tsx
│   │   │   ├── columns.tsx
│   │   │   ├── [id]/
│   │   │   │   └── page.tsx    # 告警详情
│   │   │   ├── configs/        # 告警配置
│   │   │   │   ├── page.tsx
│   │   │   │   ├── columns.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── components/
│   │   │       ├── index.ts
│   │   │       ├── alert-table.tsx
│   │   │       ├── alert-config-form.tsx
│   │   │       ├── alert-status-badge.tsx
│   │   │       └── columns.tsx
│   │   ├── monitoring/         # 实时监控
│   │   │   ├── page.tsx
│   │   │   ├── [subscription_id]/
│   │   │   │   └── page.tsx    # 订阅详细监控
│   │   │   └── components/
│   │   │       ├── index.ts
│   │   │       ├── usage-chart.tsx
│   │   │       ├── realtime-panel.tsx
│   │   │       ├── prediction-chart.tsx
│   │   │       └── statistics-cards.tsx
│   │   ├── analytics/          # 分析报告
│   │   │   ├── page.tsx
│   │   │   ├── export/
│   │   │   │   └── page.tsx    # 数据导出
│   │   │   └── components/
│   │   │       ├── index.ts
│   │   │       ├── trend-analysis.tsx
│   │   │       ├── top-users.tsx
│   │   │       └── export-form.tsx
│   │   ├── admin/              # 管理工具
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── index.ts
│   │   │       ├── cleanup-tools.tsx
│   │   │       ├── sync-tools.tsx
│   │   │       └── admin-actions.tsx
│   │   ├── components/
│   │   │   ├── index.ts
│   │   │   ├── usage-overview.tsx
│   │   │   └── subscription-selector.tsx
│   │   └── types.ts
│   │
│   ├── system/                 # 系统管理 - 待实现
│   │   ├── cache/              # 缓存管理 🔥 系统核心
│   │   │   ├── page.tsx        # 缓存总览
│   │   │   ├── loading.tsx
│   │   │   ├── metrics/        # 缓存指标
│   │   │   │   ├── page.tsx
│   │   │   │   └── [prefix]/
│   │   │   │       └── page.tsx
│   │   │   ├── monitor/        # 缓存监控
│   │   │   │   ├── page.tsx
│   │   │   │   ├── alerts/
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── benchmark/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── health/
│   │   │   │       └── page.tsx
│   │   │   ├── components/
│   │   │   │   ├── index.ts
│   │   │   │   ├── cache-metrics.tsx
│   │   │   │   ├── cache-monitor.tsx
│   │   │   │   ├── cache-actions.tsx
│   │   │   │   └── performance-chart.tsx
│   │   │   └── types.ts
│   │   └── payments/           # 支付系统管理
│   │       ├── retries/        # 支付重试管理 - 待实现
│   │       │   ├── page.tsx
│   │       │   ├── loading.tsx
│   │       │   ├── columns.tsx
│   │       │   ├── [id]/
│   │       │   │   └── page.tsx
│   │       │   ├── components/
│   │       │   │   ├── index.ts
│   │       │   │   ├── retry-table.tsx
│   │       │   │   ├── retry-actions.tsx
│   │       │   │   └── retry-status-badge.tsx
│   │       │   └── types.ts
│   │       └── configs/        # 支付配置 ✅ 已完成
│   │           ├── page.tsx
│   │           └── components/
│   │
│   ├── servers/                # 服务器管理 ✅
│   │   ├── shadowsocks-servers/
│   │   │   ├── page.tsx
│   │   │   └── columns.tsx
│   │   └── server-groups/
│   │       ├── page.tsx
│   │       └── columns.tsx
│   │
│   ├── support/                # 客户支持 ⚠️ 需完善API对接
│   │   └── tickets/
│   │       ├── page.tsx
│   │       └── columns.tsx
│   │
│   ├── settings/               # 系统设置 ✅
│   │   ├── account/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── appearance/
│   │   │   └── page.tsx
│   │   └── notifications/
│   │       └── page.tsx
│   │
│   ├── tasks/                  # 任务管理 ⚠️ 需完善API对接
│   │   └── page.tsx
│   │
│   └── help/                   # 帮助中心 ✅
│       └── page.tsx
│
├── components/                 # 全局组件
│   ├── ui/                     # shadcn/ui 基础组件 ✅
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── card.tsx
│   │   ├── badge.tsx
│   │   ├── form.tsx
│   │   ├── select.tsx
│   │   ├── checkbox.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── sidebar.tsx
│   │   ├── breadcrumb.tsx
│   │   ├── pagination.tsx
│   │   ├── chart.tsx           # Recharts 图表组件
│   │   └── ... (44个基础组件)
│   │
│   └── layout/                 # 布局组件 ✅
│       ├── app-sidebar.tsx     # 主侧边栏
│       ├── page-header.tsx     # 页面标题栏
│       ├── nav-user.tsx        # 用户导航
│       └── theme-toggle.tsx    # 主题切换
│
├── lib/                        # 服务和工具层
│   ├── api.ts                  # 核心API客户端 ✅
│   ├── utils.ts                # 工具函数 ✅
│   │
│   ├── user-service.ts         # 用户服务 ✅
│   ├── user-types.ts           # 用户类型 ✅
│   │
│   ├── subscription-service.ts # 订阅服务 ✅
│   ├── subscription-types.ts   # 订阅类型 ✅
│   │
│   ├── invoice-service.ts      # 发票服务 ✅ 已完成
│   ├── invoice-types.ts        # 发票类型 ✅ 已完成
│   │
│   ├── usage-service.ts        # 使用量服务 - 待实现
│   ├── usage-types.ts          # 使用量类型 - 待实现
│   │
│   ├── cache-service.ts        # 缓存服务 - 待实现
│   ├── cache-types.ts          # 缓存类型 - 待实现
│   │
│   ├── payment-service.ts      # 支付服务 ✅
│   ├── payment-types.ts        # 支付类型 ✅
│   │
│   ├── dashboard-service.ts    # 仪表板服务 ✅
│   ├── dashboard-types.ts      # 仪表板类型 ✅
│   │
│   └── ...                     # 其他服务层
│
├── hooks/                      # 自定义Hooks
│   ├── use-dashboard-data.ts   # 仪表板数据 ✅
│   ├── use-mobile.ts           # 响应式检测 ✅
│   ├── use-user-profile.ts     # 用户信息 ✅
│   ├── use-realtime-usage.ts   # 实时使用量 - 待实现
│   ├── use-cache-metrics.ts    # 缓存指标 - 待实现
│   └── use-alert-polling.ts    # 告警轮询 - 待实现
│
├── contexts/                   # React Context
│   └── AuthContext.tsx         # 认证上下文 ✅
│
├── types/                      # 全局类型定义
│   ├── global.ts               # 全局类型
│   ├── api.ts                  # API响应类型
│   └── common.ts               # 通用类型
│
└── docs/                       # 文档
    ├── admin-module-design.md  # 管理模块设计
    ├── auth-login-design.md    # 认证登录设计
    └── api-integration.md      # API集成指南
```

## 📊 模块优先级与实现状态

### ✅ 已完成模块
- **用户管理** - 完整的CRUD + 权限控制
- **订阅管理** - 计划和用户订阅管理
- **支付配置** - 完整的支付网关配置
- **发票管理** - 完整的发票生命周期管理
- **服务器管理** - Shadowsocks服务器配置
- **认证系统** - 多提供商OAuth + JWT

### 🔥 高优先级 - 待实现
1. **使用量监控模块** (20+ API)
   - 实时监控、告警管理、数据分析
   - 系统核心业务功能

2. **缓存管理模块** (15 API)
   - 系统性能监控、缓存优化
   - 运维必备功能

### 🟡 中优先级 - 待完善
3. **支付重试管理** (8 API)
   - 支付可靠性保障
   - 财务系统完善

4. **现有页面API对接完善**
   - 优惠码管理API对接
   - 订单管理API对接
   - 客户支持API对接

## 🎯 架构设计原则

### 1. shadcn/ui最佳实践
- **组合模式优先**: 所有组件使用组合而非配置
- **统一设计语言**: New York风格 + neutral基色
- **三层组件架构**: 基础组件 → 布局组件 → 业务组件

### 2. 文件组织规范
```
[module]/
├── page.tsx              # 页面入口
├── loading.tsx           # 加载状态
├── columns.tsx           # 表格列定义
├── types.ts              # 模块类型
├── components/
│   ├── index.ts          # 统一导出
│   ├── [module]-table.tsx
│   ├── [module]-form.tsx
│   └── [module]-actions.tsx
└── [sub-module]/         # 子模块
```

### 3. API服务层模式
```typescript
// 每个模块独立服务
class ModuleService {
  private apiClient = new ApiClient()
  
  // 标准CRUD操作
  async list(params: QueryParams): Promise<ApiResponse<T[]>>
  async get(id: string): Promise<ApiResponse<T>>
  async create(data: CreateRequest): Promise<ApiResponse<T>>
  async update(id: string, data: UpdateRequest): Promise<ApiResponse<T>>
  async delete(id: string): Promise<ApiResponse<void>>
  
  // 业务特定操作
  async customAction(params: ActionParams): Promise<ApiResponse<any>>
}
```

### 4. 类型安全保障
- 每个模块有独立的类型文件
- API响应类型统一定义
- 组件Props接口规范
- 严格的TypeScript检查

## 🚀 下一步实施计划

1. **使用Agent批量创建使用量监控模块**
2. **使用Agent批量创建缓存管理模块**
3. **使用Agent批量创建支付重试管理模块**
4. **使用Agent完善现有页面的API对接**
5. **验证所有功能的完整性和一致性**

这个架构设计确保了：
- 🏗️ **可扩展性**: 清晰的模块边界和统一的设计模式
- 🔒 **类型安全**: 完整的TypeScript覆盖
- 🎨 **一致性**: 统一的shadcn/ui设计语言
- ⚡ **性能**: 优化的组件架构和数据管理
- 🛠️ **可维护性**: 清晰的文件组织和服务抽象