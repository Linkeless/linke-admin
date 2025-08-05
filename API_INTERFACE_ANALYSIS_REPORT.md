# API接口分析报告 - linke-admin

## 项目概述

基于Swagger 2.0规范的企业级管理后台API系统，包含120个接口端点，支持完整的业务管理功能。

**API基础信息:**
- **API版本**: 1.0
- **Base URL**: `http://localhost:8080/api/v1`
- **认证方式**: Bearer Token (JWT)
- **接口总数**: 120个
- **管理员接口**: 40个 (`/admin/*`)
- **用户接口**: 80个

## 认证要求说明

- 🔒 **需要认证**: 需要Bearer Token认证的接口
- 🔓 **公开接口**: 不需要认证或公开访问的接口

## API接口分类

### 1. 认证授权 (Authentication) - 11个接口

**核心功能**: 多重认证支持，JWT令牌管理

| 方法 | 路径 | 认证 | 功能描述 |
|------|------|------|----------|
| POST | `/auth/login` | 🔓 | 邮箱/密码登录 |
| POST | `/auth/register` | 🔓 | 用户注册 |
| POST | `/auth/refresh` | 🔒 | 刷新JWT令牌 |
| POST | `/auth/logout` | 🔒 | 用户登出 |
| GET | `/auth/providers` | 🔓 | 获取OAuth提供商列表 |
| GET | `/auth/{provider}` | 🔓 | OAuth登录初始化 |
| GET | `/auth/{provider}/callback` | 🔓 | OAuth回调处理 |
| POST | `/auth/url` | 🔓 | 生成OAuth授权URL |
| POST | `/auth/token` | 🔓 | 授权码换取令牌 |
| GET | `/auth/telegram/widget` | 🔓 | Telegram登录组件 |
| POST | `/auth/change-password` | 🔒 | 修改密码 |

**支持的OAuth提供商**: Google, GitHub, Telegram
**令牌机制**: Access Token + Refresh Token

### 2. 用户管理 (User Administration) - 13个管理员接口

**核心功能**: 完整的用户CRUD操作，批量管理，角色权限控制

| 方法 | 路径 | 功能描述 | 参数数量 |
|------|------|----------|----------|
| GET | `/admin/users` | 用户列表(分页) | 2 |
| POST | `/admin/users` | 创建新用户 | 1 |
| GET | `/admin/users/{id}` | 获取用户详情 | 1 |
| PUT | `/admin/users/{id}` | 更新用户信息 | 2 |
| DELETE | `/admin/users/{id}` | 软删除用户 | 1 |
| PATCH | `/admin/users/{id}` | 部分更新用户 | 2 |
| DELETE | `/admin/users/{id}/hard-delete` | 永久删除用户 | 1 |
| POST | `/admin/users/{id}/restore` | 恢复已删除用户 | 1 |
| PUT | `/admin/users/{id}/role` | 更新用户角色 | 2 |
| PUT | `/admin/users/{id}/status` | 更新用户状态 | 2 |
| POST | `/admin/users/{id}/reset-password` | 重置用户密码 | 2 |
| GET | `/admin/users/search` | 用户搜索 | 3 |
| GET | `/admin/users/statistics` | 用户统计信息 | 0 |

**批量操作接口:**
- `POST /admin/users/bulk/delete` - 批量软删除
- `POST /admin/users/bulk/restore` - 批量恢复

**特殊查询接口:**
- `GET /admin/users/deleted` - 已删除用户列表
- `GET /admin/users/provider` - 按OAuth提供商筛选用户

### 3. 订阅管理 (Subscription Management) - 11个接口

**核心功能**: 订阅生命周期管理，流量统计，订单处理

**用户订阅操作 (9个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/subscriptions/my` | 我的订阅列表 |
| GET | `/subscriptions/my/active` | 我的活跃订阅 |
| GET | `/subscriptions/{id}` | 订阅详情 |
| POST | `/subscriptions/{id}/cancel` | 取消订阅 |
| GET | `/subscriptions/{id}/traffic-stats` | 订阅流量统计 |
| POST | `/subscription/orders` | 创建订阅订单 |
| GET | `/subscription/orders/my` | 我的订阅订单 |
| GET | `/subscription/orders/{id}` | 订阅订单详情 |
| POST | `/subscription/quick-purchase` | 快速购买订阅 |

**管理员订阅操作 (2个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| POST | `/admin/subscriptions/{id}/pause` | 暂停用户订阅 |
| POST | `/admin/subscriptions/{id}/resume` | 恢复用户订阅 |

### 4. 财务管理 (Invoice Management) - 15个接口

**核心功能**: 发票生成、下载、状态管理，多语言支持

**发票CRUD操作:**
| 方法 | 路径 | 功能描述 | 用户类型 |
|------|------|----------|----------|
| GET | `/invoice` | 发票列表(管理员) | Admin |
| POST | `/invoice` | 创建新发票 | Admin |
| GET | `/invoice/{id}` | 发票详情 | User/Admin |
| PUT | `/invoice/{id}` | 更新发票 | Admin |
| DELETE | `/invoice/{id}` | 删除发票 | Admin |

**发票操作:**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/invoice/{id}/download` | 下载PDF发票 |
| GET | `/invoice/{id}/pdf` | 生成PDF发票 |
| POST | `/invoice/{id}/send` | 邮件发送发票 |
| PUT | `/invoice/{id}/mark-paid` | 标记为已支付 |
| PUT | `/invoice/{id}/mark-void` | 标记为作废 |

**批量操作和统计:**
- `POST /invoice/bulk-download` - 批量下载ZIP
- `GET /invoice/statistics` - 发票统计
- `GET /invoice/languages` - 支持的语言列表
- `GET /invoice/templates` - PDF模板列表

### 5. 支付管理 (Payment Operations) - 22个接口

**支付方式管理 (9个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/payment-methods` | 支付方式列表 |
| POST | `/payment-methods` | 添加支付方式 |
| PUT | `/payment-methods/{id}` | 更新支付方式 |
| DELETE | `/payment-methods/{id}` | 删除支付方式 |
| PUT | `/payment-methods/{id}/default` | 设为默认支付方式 |
| POST | `/payment-methods/{id}/validate` | 验证支付方式 |
| GET | `/payment-methods/{id}/statistics` | 支付方式统计 |

**支付订单处理 (6个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| POST | `/payment/orders` | 创建支付订单 |
| GET | `/payment/orders/my` | 我的支付订单 |
| GET | `/payment/orders/{payment_no}` | 支付订单详情 |
| GET | `/payment/configs` | 支付配置(公开) |
| GET | `/payment/methods` | 可用支付方式(公开) |
| POST | `/payment/notify/{gateway}` | 支付通知回调 |

**支付管理后台 (10个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/admin/payment/configs` | 支付配置管理 |
| POST | `/admin/payment/configs` | 创建支付配置 |
| PUT | `/admin/payment/configs/{id}` | 更新支付配置 |
| DELETE | `/admin/payment/configs/{id}` | 删除支付配置 |
| GET | `/admin/payment/retries` | 支付重试列表 |
| GET | `/admin/payment/retries/{id}` | 支付重试详情 |
| POST | `/admin/payment/retries/{id}/cancel` | 取消支付重试 |
| POST | `/admin/payment/retries/{id}/reset` | 重置支付重试 |
| POST | `/admin/payment/retries/bulk/cancel` | 批量取消重试 |
| GET | `/admin/payment/retries/health` | 重试系统健康状态 |

### 6. 使用量管理 (Usage Management) - 25个接口

**核心功能**: 实时使用量监控，预测分析，告警系统

**使用量查询 (9个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/usage/{subscription_id}/current` | 当前使用量 |
| GET | `/usage/{subscription_id}/current/{usage_type}` | 特定类型使用量 |
| GET | `/usage/{subscription_id}/history` | 历史使用量 |
| GET | `/usage/{subscription_id}/statistics` | 使用量统计 |
| GET | `/usage/{subscription_id}/summary` | 使用量摘要 |
| GET | `/usage/{subscription_id}/trends` | 使用量趋势 |
| GET | `/usage/{subscription_id}/predictions` | 使用量预测 |
| GET | `/usage/{subscription_id}/realtime` | 实时使用量数据 |
| POST | `/usage/export` | 导出使用量数据 |

**告警系统 (13个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/usage-alerts/subscription/{subscription_id}` | 订阅告警列表 |
| GET | `/usage-alerts/subscription/{subscription_id}/configurations` | 告警配置 |
| GET | `/usage-alerts/subscription/{subscription_id}/history` | 告警历史 |
| GET | `/usage-alerts/subscription/{subscription_id}/statistics` | 告警统计 |
| POST | `/usage-alerts/configurations` | 创建告警配置 |
| PUT | `/usage-alerts/config/{config_id}` | 更新告警配置 |
| DELETE | `/usage-alerts/config/{config_id}` | 删除告警配置 |
| POST | `/usage-alerts/alert/{alert_id}/acknowledge` | 确认告警 |
| POST | `/usage-alerts/alert/{alert_id}/resolve` | 解决告警 |
| POST | `/usage-alerts/alert/{alert_id}/suppress` | 抑制告警 |
| POST | `/usage-alerts/bulk-resolve` | 批量解决告警 |
| POST | `/usage-alerts/test-notification` | 测试通知渠道 |

**管理员操作 (3个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| POST | `/usage/admin/reset/{subscription_id}` | 重置使用量 |
| POST | `/usage/admin/sync/{subscription_id}` | 同步订阅限制 |
| POST | `/usage/admin/cleanup` | 清理旧数据 |

### 7. 缓存管理 (Cache Management) - 15个管理员接口

**核心功能**: 多级缓存监控，性能分析，智能预热

**缓存操作 (5个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/admin/cache/metrics` | 缓存性能指标 |
| GET | `/admin/cache/statistics` | 缓存统计信息 |
| DELETE | `/admin/cache/flush` | 刷新所有缓存 |
| DELETE | `/admin/cache/pattern/{pattern}` | 按模式删除缓存 |
| POST | `/admin/cache/reset-metrics` | 重置性能指标 |

**缓存监控 (10个接口):**
| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/admin/cache/monitor/dashboard` | 监控仪表板 |
| GET | `/admin/cache/monitor/health` | 健康状态检查 |
| GET | `/admin/cache/monitor/metrics` | 多级缓存指标 |
| GET | `/admin/cache/monitor/performance` | 性能分析 |
| GET | `/admin/cache/monitor/alerts` | 系统告警 |
| GET | `/admin/cache/monitor/invalidation/metrics` | 失效指标 |
| GET | `/admin/cache/monitor/warming/status` | 预热状态 |
| POST | `/admin/cache/monitor/warming/trigger` | 触发预热 |
| POST | `/admin/cache/monitor/benchmark` | 性能基准测试 |

### 8. 服务器管理 (Server Management) - 4个接口

**核心功能**: UniProxy节点管理，配置分发，数据收集

| 方法 | 路径 | 认证 | 功能描述 |
|------|------|------|----------|
| GET | `/server/UniProxy/config` | 🔓 | 获取节点配置 |
| GET | `/server/UniProxy/user` | 🔓 | 获取节点用户列表 |
| POST | `/server/UniProxy/push` | 🔓 | 节点数据推送 |
| GET | `/server/UniProxy/health` | 🔓 | 服务器健康检查 |

### 9. 任务系统 (Task Management) - 2个接口

**核心功能**: 异步任务管理，队列状态监控

| 方法 | 路径 | 功能描述 |
|------|------|----------|
| POST | `/tasks` | 创建新任务 |
| GET | `/tasks/status` | 获取队列状态 |

### 10. 用户资料 (User Operations) - 2个接口

**核心功能**: 用户个人资料管理

| 方法 | 路径 | 功能描述 |
|------|------|----------|
| GET | `/user/profile` | 获取用户资料 |
| PUT | `/user/profile` | 更新用户资料 |

### 11. 系统健康 (Application Health) - 1个接口

**核心功能**: 系统健康检查

| 方法 | 路径 | 认证 | 功能描述 |
|------|------|------|----------|
| GET | `/app/system/health` | 🔓 | 系统健康检查 |

## 标准响应格式

### StandardResponse格式
```json
{
  "code": 0,          // 响应码 (0=成功, 非0=错误)
  "message": "string", // 响应消息
  "data": {}          // 响应数据 (可选)
}
```

### 分页响应格式
```json
{
  "code": 0,
  "message": "success",
  "data": [...],      // 数据数组
  "total": 100,       // 总记录数
  "limit": 20,        // 每页限制
  "offset": 0         // 偏移量
}
```

## 需要创建前端页面的管理员接口

### 1. 用户管理模块 ✅ (已实现)
- **列表页面**: `/admin/users` (用户列表、搜索、筛选)
- **详情页面**: `/admin/users/{id}` (用户信息、编辑、删除)
- **统计页面**: `/admin/users/statistics` (用户统计仪表板)

### 2. 缓存管理模块 ❌ (需要创建)
**建议页面结构:**
- **监控仪表板**: `/admin/cache` - 整合多个监控接口
- **性能分析页**: `/admin/cache/performance` - 性能指标和图表
- **告警管理页**: `/admin/cache/alerts` - 告警列表和处理

**关键接口:**
- `GET /admin/cache/monitor/dashboard` - 仪表板数据
- `GET /admin/cache/monitor/performance` - 性能指标
- `GET /admin/cache/monitor/alerts` - 告警列表
- `DELETE /admin/cache/flush` - 缓存清理操作

### 3. 支付管理模块 ❌ (需要创建)
**建议页面结构:**
- **支付配置页**: `/admin/payments/configs` - 支付网关配置
- **重试管理页**: `/admin/payments/retries` - 支付重试监控
- **统计分析页**: `/admin/payments/statistics` - 支付数据分析

**关键接口:**
- `GET /admin/payment/configs` - 配置列表
- `GET /admin/payment/retries` - 重试列表
- `GET /admin/payment/retries/health` - 系统健康状态

### 4. 发票管理模块 ❌ (需要创建)
**建议页面结构:**
- **发票列表页**: `/admin/invoices` - 发票管理和搜索
- **发票详情页**: `/admin/invoices/{id}` - 发票详情和操作
- **统计报表页**: `/admin/invoices/statistics` - 发票统计分析

**关键接口:**
- `GET /invoice` - 发票列表 (管理员)
- `GET /invoice/statistics` - 发票统计
- `PUT /invoice/{id}/mark-paid` - 标记支付状态

### 5. 使用量监控模块 ❌ (需要创建)
**建议页面结构:**
- **使用量仪表板**: `/admin/usage` - 全局使用量监控
- **告警管理页**: `/admin/usage/alerts` - 告警配置和历史
- **统计分析页**: `/admin/usage/analytics` - 使用量趋势分析

**关键接口:**
- `GET /usage/top` - 高使用量用户
- `GET /usage-alerts/subscription/{id}/statistics` - 告警统计
- `POST /usage/admin/cleanup` - 数据清理

## API集成建议

### 1. 服务层设计
根据CLAUDE.md的架构指导，每个业务模块应创建对应的服务文件:

```typescript
// 需要创建的服务文件
lib/cache-service.ts      // 缓存管理接口
lib/payment-admin-service.ts // 支付管理接口  
lib/invoice-service.ts    // 发票管理接口 (已存在)
lib/usage-service.ts      // 使用量监控接口 (已存在)
```

### 2. 类型定义
根据Swagger定义创建对应的TypeScript类型:

```typescript
// 需要创建的类型文件
lib/cache-types.ts        // 缓存相关类型
lib/payment-admin-types.ts // 支付管理类型
lib/invoice-types.ts      // 发票类型 (已存在)
lib/usage-types.ts        // 使用量类型 (已存在)
```

### 3. 组件架构
遵循shadcn/ui三层组件架构:

```
components/
├── ui/                   // 第一层: 基础UI组件
├── layout/               // 第二层: 布局组合组件  
└── [module]/            // 第三层: 业务复合组件
    ├── [module]-table.tsx
    ├── [module]-dialog.tsx
    └── columns.tsx
```

## 总结

linke-admin项目拥有完整的API接口体系，涵盖企业级管理后台的所有核心功能。当前已实现用户管理模块的前端页面，建议按优先级依次实现:

1. **缓存管理模块** - 系统性能监控核心
2. **支付管理模块** - 财务运营关键功能  
3. **发票管理模块** - 财务管理完整闭环
4. **使用量监控模块** - 业务运营数据分析

所有接口都严格遵循RESTful设计原则，使用统一的认证机制和响应格式，为前端开发提供了稳定可靠的API基础。