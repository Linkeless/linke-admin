# Linke 管理端模块设计文档

## 概述

Linke 是一个基于订阅的综合服务管理平台，包含用户管理、订阅账单管理和服务端管理功能。该管理端系统提供了 OAuth2 认证、流量订阅管理、多网关支付、推荐计划和客户支持系统等核心功能。

## 架构概览

管理端系统分为 12 个主要功能模块，每个模块负责特定的业务领域，共提供 46 个管理接口。

## 认证授权系统

### 认证架构

系统采用 **JWT (JSON Web Token)** 基于 Bearer Token 的认证机制，所有管理端接口都需要在请求头中携带有效的 Bearer Token。

#### 认证类型
- **本地账户认证**: 邮箱 + 密码
- **OAuth 第三方认证**: Google、GitHub、Telegram
- **统一认证入口**: 普通用户和管理员使用相同的认证接口，通过用户角色区分权限

#### Token 类型
- **Access Token**: 用于API访问的短期令牌  
- **Refresh Token**: 用于刷新访问令牌的长期令牌

### 核心认证接口

#### 基础认证接口
- `POST /api/v1/auth/login` - 用户登录（邮箱+密码）
  - 请求体: `{"email": "string", "password": "string"}`
  - 响应格式: **StandardResponse** (data: AuthResponse)
  
- `POST /api/v1/auth/register` - 用户注册
  - 请求体: `{"email": "string", "password": "string", "invite_code": "string?"}`
  - 响应格式: **StandardResponse** (data: AuthResponse)
  
- `POST /api/v1/auth/logout` - 用户登出
  - 需要认证: Bearer Token
  - 响应格式: **StandardResponse**
  
- `POST /api/v1/auth/refresh` - 刷新JWT令牌
  - 需要认证: Bearer Token
  - 响应格式: **StandardResponse** (data: TokenResponse)

#### OAuth 第三方登录
- `GET /api/v1/auth/providers` - 获取支持的OAuth提供商
- `POST /api/v1/auth/url` - 生成OAuth授权URL
- `GET /api/v1/auth/{provider}` - 发起OAuth登录 (google/github/telegram)
- `GET /api/v1/auth/{provider}/callback` - OAuth回调处理
- `POST /api/v1/auth/token` - 交换授权码获取令牌

#### 用户管理接口
- `GET /api/v1/auth/profile` - 获取当前用户信息
  - 需要认证: Bearer Token  
  - 响应格式: **StandardResponse** (data: UserResponse)
  
- `POST /api/v1/auth/change-password` - 修改密码
  - 需要认证: Bearer Token
  - 响应格式: **StandardResponse**

#### Telegram 特殊支持
- `GET /api/v1/auth/telegram/widget` - 获取Telegram登录组件HTML

### 数据模型

#### AuthResponse 完整数据格式
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "token_type": "Bearer",
      "expires_in": 3600,
      "expires_at": "2025-01-28T01:00:00Z"
    },
    "user": {
      "id": 1,
      "email": "admin@example.com",
      "username": "admin",
      "name": "管理员",
      "avatar": "https://example.com/avatar.jpg",
      "role": "admin",
      "status": "active",
      "provider": "local",
      "google_id": "",
      "github_id": "",
      "telegram_id": "",
      "provider_data": "",
      "invite_code_id": 0,
      "invite_code_used": "",
      "created_at": "2025-01-01T00:00:00Z",
      "updated_at": "2025-01-01T00:00:00Z",
      "deleted_at": ""
    }
  }
}
```

#### UserResponse 完整字段说明
- **id**: 用户唯一标识（整数）
- **email**: 用户邮箱（字符串）
- **username**: 用户名（字符串）
- **name**: 用户显示名称（字符串）
- **avatar**: 用户头像URL（字符串）
- **role**: 用户角色（字符串）- "user", "admin", "system"
- **status**: 用户状态（字符串）- "active", "inactive", "suspended", "banned"
- **provider**: 认证提供商（字符串）- "local", "google", "github", "telegram"
- **google_id**: Google账户ID（字符串，可为空）
- **github_id**: GitHub账户ID（字符串，可为空）
- **telegram_id**: Telegram账户ID（字符串，可为空）
- **provider_data**: 第三方提供商额外数据（字符串JSON）
- **invite_code_id**: 使用的邀请码ID（整数）
- **invite_code_used**: 使用的邀请码（字符串）
- **created_at**: 创建时间（ISO 8601格式）
- **updated_at**: 更新时间（ISO 8601格式）
- **deleted_at**: 删除时间（ISO 8601格式，软删除时使用）

#### TokenResponse 完整字段说明
- **access_token**: JWT访问令牌（用于API调用）
- **refresh_token**: JWT刷新令牌（用于令牌续期）
- **token_type**: 令牌类型（固定为"Bearer"）
- **expires_in**: 访问令牌有效期（秒数）
- **expires_at**: 访问令牌过期时间（ISO 8601格式）

#### 用户角色类型
- **user**: 普通用户
- **admin**: 管理员
- **system**: 系统账户

#### 认证状态
- **active**: 正常激活
- **inactive**: 未激活
- **suspended**: 暂停使用
- **banned**: 封禁

### 核心模块结构

```
Admin Management System
├── 认证授权系统 (Authentication & Authorization)
├── 邀请码管理 (Admin-Invitation-Management)
├── 发票管理 (Admin-Invoice-Management)  
├── 订单管理 (Admin-Order-Management)
├── 支付配置管理 (Admin-Payment-Management)
├── 推荐活动管理 (Admin-Referral-Campaign-Management)
├── 推荐记录管理 (Admin-Referral-Management)
├── 服务器组管理 (Admin-ServerGroup-Management)
├── Shadowsocks服务器管理 (Admin-ShadowsocksServers)
├── 订阅管理 (Admin-Subscription-Management)
│   ├── 订阅计划管理 (Subscription Plans)
│   └── 用户订阅管理 (User Subscriptions)
├── 工单管理 (Admin-Ticket-Management)
└── 用户管理 (Admin-User-Management)
```

## 详细模块规范

> **注**: 认证授权系统的详细规范已在前面的"认证授权系统"章节中详细说明。

### 1. 邀请码管理模块 (Admin-Invitation-Management)

**功能范围：** 管理邀请码的生成、分发和使用统计

#### API 接口
- `GET /api/v1/admin/invite-codes` - 获取邀请码列表
  - 支持分页：`page`, `limit` 参数
  - 响应格式：**StandardListResponse**
  
- `GET /api/v1/admin/invite-codes/stats` - 获取邀请码统计
  - 响应格式：**StandardResponse**

#### 核心功能
- 邀请码批量管理
- 使用情况实时监控
- 转化率统计分析

---

### 2. 发票管理模块 (Admin-Invoice-Management)

**功能范围：** 完整的发票生命周期管理，包括创建、发送、支付和作废

#### API 接口
- `GET /api/v1/admin/invoices` - 发票列表查询
  - 高级筛选：用户ID、状态、类型、货币、日期范围
  - 搜索功能：发票号、账单名称、邮箱
  - 排序支持：创建时间、开票时间、到期时间、支付时间、金额、状态
  - 响应格式：**PaginatedResponse**
  
- `POST /api/v1/admin/invoices` - 创建新发票
  - 响应格式：**StandardResponse** (data: InvoiceResponse)
- `POST /api/v1/admin/invoices/from-order` - 从订单创建发票
  - 响应格式：**StandardResponse** (data: InvoiceResponse)
- `GET /api/v1/admin/invoices/{id}` - 获取发票详情
  - 响应格式：**StandardResponse** (data: InvoiceResponse)
- `PUT /api/v1/admin/invoices/{id}` - 更新发票
  - 响应格式：**StandardResponse** (data: InvoiceResponse)
- `DELETE /api/v1/admin/invoices/{id}` - 删除发票
  - 响应格式：**StandardResponse**
- `POST /api/v1/admin/invoices/{id}/mark-paid` - 标记为已支付
  - 响应格式：**StandardResponse**
- `POST /api/v1/admin/invoices/{id}/send` - 发送发票给客户
  - 响应格式：**StandardResponse**
- `POST /api/v1/admin/invoices/{id}/void` - 作废发票
  - 响应格式：**StandardResponse**

#### 发票状态管理
- **draft** - 草稿
- **sent** - 已发送
- **paid** - 已支付
- **overdue** - 逾期
- **cancelled** - 已取消
- **voided** - 已作废

#### 发票类型
- **standard** - 标准发票
- **proforma** - 形式发票
- **credit_note** - 贷方票据

---

### 3. 订单管理模块 (Admin-Order-Management)

**功能范围：** 订阅订单的全生命周期管理，包括批量操作和退款处理

#### API 接口
- `GET /api/v1/admin/orders` - 订单列表查询
  - 高级筛选：用户ID、状态、订单类型、支付方式、支付网关、金额范围、日期范围、优惠券代码
  - 搜索功能：订单号、交易ID、用户邮箱
  - 排序支持：创建时间、支付时间、订单金额、总金额
  - 响应格式：**PaginatedResponse**
  
- `POST /api/v1/admin/orders/bulk` - 批量操作订单
  - 响应格式：**StandardResponse**
- `GET /api/v1/admin/orders/stats` - 订单统计分析
  - 统计周期：today, week, month, quarter, year, all
  - 自定义日期范围支持
  - 响应格式：**StandardResponse** (data: GetOrderStatsResponse)
  
- `GET /api/v1/admin/orders/{id}` - 订单详情
  - 响应格式：**StandardResponse** (data: SubscriptionOrderResponse)
- `POST /api/v1/admin/orders/{id}/refund` - 处理退款
  - 响应格式：**StandardResponse** (data: SubscriptionOrderResponse)
- `PATCH /api/v1/admin/orders/{id}/status` - 更新订单状态
  - 响应格式：**StandardResponse** (data: SubscriptionOrderResponse)

#### 订单状态
- **pending** - 待处理
- **paid** - 已支付
- **failed** - 失败
- **cancelled** - 已取消
- **refunded** - 已退款

#### 订单类型
- **new** - 新订单
- **renewal** - 续费
- **upgrade** - 升级
- **downgrade** - 降级

---

### 4. 支付配置管理模块 (Admin-Payment-Management)

**功能范围：** 支付网关和支付方式的配置管理

#### API 接口
- `GET /api/v1/admin/payments/configs` - 支付配置列表
  - 筛选：网关类型、支付方式、启用状态、环境
  
- `POST /api/v1/admin/payments/configs` - 创建支付配置
- `PUT /api/v1/admin/payments/configs/{id}` - 更新支付配置
- `DELETE /api/v1/admin/payments/configs/{id}` - 删除支付配置

#### 核心功能
- 多支付网关配置（如：易支付等）
- 支付方式管理（如：支付宝、微信等）
- 环境配置（生产/测试）
- 启用/禁用状态管理

---

### 5. 推荐活动管理模块 (Admin-Referral-Campaign-Management)

**功能范围：** 推荐活动的创建、配置和效果追踪

#### API 接口
- `GET /api/v1/admin/referral-campaigns` - 推荐活动列表
  - 筛选：状态、活动类型、公开可见性
  
- `POST /api/v1/admin/referral-campaigns` - 创建推荐活动
- `GET /api/v1/admin/referral-campaigns/{id}` - 活动详情
- `PUT /api/v1/admin/referral-campaigns/{id}` - 更新推荐活动
- `DELETE /api/v1/admin/referral-campaigns/{id}` - 删除推荐活动
- `GET /api/v1/admin/referral-campaigns/{id}/stats` - 活动统计

#### 核心功能
- 推荐活动创建和配置
- 活动参数设置（奖励规则、有效期等）
- 活动效果统计和分析
- 活动生命周期管理

---

### 6. 推荐记录管理模块 (Admin-Referral-Management)

**功能范围：** 推荐记录的查看和管理

#### API 接口
- `GET /api/v1/admin/referrals` - 推荐记录列表
  - 支持按活动、用户、时间等筛选
  
- `GET /api/v1/admin/referrals/{id}` - 推荐详情

#### 核心功能
- 推荐记录查询和统计
- 推荐关系链追踪
- 推荐奖励发放状态监控

---

### 7. 服务器组管理模块 (Admin-ServerGroup-Management)

**功能范围：** 服务器基础设施的组织和管理

#### API 接口
- `GET /api/v1/admin/server-groups` - 服务器组列表
- `GET /api/v1/admin/server-groups/all` - 获取所有服务器组
- `POST /api/v1/admin/server-groups` - 创建服务器组
- `GET /api/v1/admin/server-groups/{id}` - 服务器组详情
- `PUT /api/v1/admin/server-groups/{id}` - 更新服务器组
- `DELETE /api/v1/admin/server-groups/{id}` - 删除服务器组

#### 核心功能
- 服务器逻辑分组
- 服务器组属性配置
- 服务器组关联管理

---

### 8. Shadowsocks服务器管理模块 (Admin-ShadowsocksServers)

**功能范围：** Shadowsocks服务器的配置和管理

#### API 接口
- `GET /api/v1/admin/shadowsocks-servers` - 服务器列表
- `POST /api/v1/admin/shadowsocks-servers` - 添加服务器
- `GET /api/v1/admin/shadowsocks-servers/{id}` - 服务器详情
- `PUT /api/v1/admin/shadowsocks-servers/{id}` - 更新服务器
- `PATCH /api/v1/admin/shadowsocks-servers/{id}` - 部分更新服务器
- `DELETE /api/v1/admin/shadowsocks-servers/{id}` - 删除服务器

#### 核心功能
- 服务器节点管理
- 连接配置管理
- 服务器状态监控
- 服务器性能优化

---

### 9. 订阅管理模块 (Admin-Subscription-Management)

**功能范围：** 包含订阅计划管理和用户订阅管理的完整订阅业务系统

该模块是一个完整的SaaS订阅业务管理系统，支持多种计费周期、流量限制、试用期管理等企业级功能。

#### 9.1 订阅计划管理 (Subscription Plans)

##### API 接口详细规范

**`GET /api/v1/admin/subscriptions/plans` - 订阅计划列表**
- **描述**: 获取所有订阅计划，支持高级筛选
- **请求参数**:
  - `status` (query, string): 按状态筛选 - "active", "inactive", "archived"
  - `currency` (query, string): 按货币筛选，例如 "USD"
  - `limit` (query, integer): 每页数量 (1-100，默认: 10)
  - `offset` (query, integer): 偏移量 (默认: 0)
- **响应格式**: **PaginatedResponse** (data: SubscriptionPlanResponse[])

**`POST /api/v1/admin/subscriptions/plans` - 创建订阅计划**
- **描述**: 创建新的订阅计划
- **请求体结构**:
  ```json
  {
    "name": "Premium Plan",
    "code": "premium-monthly",
    "description": "Premium features",
    "price": 29.99,
    "currency": "USD",
    "billing_cycle": "monthly",
    "billing_interval": 1,
    "traffic_limit": 107374182400,
    "traffic_reset_cycle": "monthly",
    "trial_period_days": 7,
    "setup_fee": 0,
    "cancellation_fee": 0,
    "status": "active",
    "is_visible": true,
    "is_popular": false,
    "is_recommended": true,
    "sort_order": 1,
    "features": "{}",
    "limits": "{}"
  }
  ```
- **响应格式**: **StandardResponse** (data: SubscriptionPlanResponse)

**`GET /api/v1/admin/subscriptions/plans/{id}` - 获取计划详情**
- **描述**: 获取指定订阅计划的完整信息
- **路径参数**: `id` (integer, 必填): 订阅计划ID
- **响应格式**: **StandardResponse** (data: SubscriptionPlanResponse)

**`PUT /api/v1/admin/subscriptions/plans/{id}` - 更新订阅计划**
- **描述**: 完整更新订阅计划信息
- **路径参数**: `id` (integer, 必填): 订阅计划ID
- **请求体结构**: 与创建请求相同
- **响应格式**: **StandardResponse** (data: SubscriptionPlanResponse)

**`PATCH /api/v1/admin/subscriptions/plans/{id}` - 部分更新计划**
- **描述**: 部分更新订阅计划（只更新提供的字段）
- **路径参数**: `id` (integer, 必填): 订阅计划ID
- **请求体结构**: SubscriptionPlanResponse字段的任意子集
- **响应格式**: **StandardResponse** (data: SubscriptionPlanResponse)

**`DELETE /api/v1/admin/subscriptions/plans/{id}` - 删除订阅计划**
- **描述**: 软删除订阅计划
- **路径参数**: `id` (integer, 必填): 订阅计划ID
- **响应格式**: **StandardResponse**

##### SubscriptionPlanResponse 数据模型
```json
{
  "id": 1,
  "name": "Premium Plan",
  "code": "premium-monthly",
  "description": "Premium features",
  "price": 29.99,
  "currency": "USD",
  "billing_cycle": "monthly",
  "billing_interval": 1,
  "traffic_limit": 107374182400,
  "traffic_limit_gb": 100.0,
  "traffic_limit_text": "100.0 GB",
  "traffic_reset_cycle": "monthly",
  "trial_period_days": 7,
  "setup_fee": 0,
  "cancellation_fee": 0,
  "status": "active",
  "is_visible": true,
  "is_popular": false,
  "is_recommended": true,
  "sort_order": 1,
  "features": "{}",
  "limits": "{}",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z"
}
```

##### 字段说明
- **基础信息**: id, name, code, description
- **价格配置**: price, currency, setup_fee, cancellation_fee
- **计费配置**: billing_cycle, billing_interval
- **流量配置**: traffic_limit, traffic_limit_gb, traffic_limit_text, traffic_reset_cycle
- **试用配置**: trial_period_days
- **状态管理**: status, is_visible, is_popular, is_recommended
- **功能配置**: features, limits (JSON格式)
- **显示配置**: sort_order

#### 9.2 用户订阅管理 (User Subscriptions)

##### API 接口详细规范

**`GET /api/v1/admin/subscriptions/users` - 用户订阅列表**
- **描述**: 获取所有用户订阅，包含用户和订阅计划完整信息
- **请求参数**:
  - `user_id` (query, integer): 按用户ID筛选
  - `status` (query, string): 按状态筛选 - "active", "inactive", "cancelled", "expired", "trialing", "past_due"
  - `plan_id` (query, integer): 按订阅计划ID筛选
  - `limit` (query, integer): 每页数量 (1-100，默认: 10)
  - `offset` (query, integer): 偏移量 (默认: 0)
- **响应格式**: **PaginatedResponse** (data: UserSubscriptionResponse[])

**`POST /api/v1/admin/subscriptions/users` - 创建用户订阅**
- **描述**: 直接为用户创建新订阅
- **请求体结构**:
  ```json
  {
    "user_id": 1,
    "subscription_plan_id": 1,
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-12-31T23:59:59Z",
    "price": 29.99,
    "currency": "USD",
    "auto_renew": true,
    "status": "active"
  }
  ```
- **响应格式**: **StandardResponse** (data: UserSubscriptionResponse)

**`GET /api/v1/admin/subscriptions/users/{id}` - 用户订阅详情**
- **描述**: 获取指定用户订阅的完整信息
- **路径参数**: `id` (integer, 必填): 用户订阅ID
- **响应格式**: **StandardResponse** (data: UserSubscriptionResponse)

**`PUT /api/v1/admin/subscriptions/users/{id}` - 更新用户订阅**
- **描述**: 完整更新用户订阅信息
- **路径参数**: `id` (integer, 必填): 用户订阅ID
- **请求体结构**: 与创建请求类似
- **响应格式**: **StandardResponse** (data: UserSubscriptionResponse)

**`PATCH /api/v1/admin/subscriptions/users/{id}` - 部分更新订阅**
- **描述**: 部分更新用户订阅（只更新提供的字段）
- **路径参数**: `id` (integer, 必填): 用户订阅ID
- **请求体结构**: UserSubscriptionResponse字段的任意子集
- **响应格式**: **StandardResponse** (data: UserSubscriptionResponse)

**`DELETE /api/v1/admin/subscriptions/users/{id}` - 删除用户订阅**
- **描述**: 软删除用户订阅
- **路径参数**: `id` (integer, 必填): 用户订阅ID
- **响应格式**: **StandardResponse**

**`POST /api/v1/admin/subscriptions/users/{id}/renew` - 续费订阅**
- **描述**: 手动续费用户订阅
- **路径参数**: `id` (integer, 必填): 用户订阅ID
- **响应格式**: **StandardResponse** (data: UserSubscriptionResponse)

##### UserSubscriptionResponse 数据模型
```json
{
  "id": 1,
  "user_id": 1,
  "subscription_plan_id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "active",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "current_period_start": "2024-01-01T00:00:00Z",
  "current_period_end": "2024-02-01T00:00:00Z",
  "trial_end_date": "2024-01-08T00:00:00Z",
  "next_billing_date": "2024-02-01T00:00:00Z",
  "price": 29.99,
  "currency": "USD",
  "billing_cycle": "monthly",
  "billing_interval": 1,
  "auto_renew": true,
  "cancel_at_period_end": false,
  "cancelled_at": "2024-06-01T00:00:00Z",
  "cancellation_reason": "User request",
  "renewal_attempts": 0,
  "renewal_fail_reason": "Payment failed",
  "last_renewal_failed": "2024-01-10T10:30:00Z",
  "last_used_at": "2024-01-15T10:30:00Z",
  "is_in_trial": false,
  "is_expired": false,
  "days_left": 30,
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:00:00Z",
  "user": {
    // UserResponse 对象
  },
  "subscription_plan": {
    // SubscriptionPlanResponse 对象
  }
}
```

##### 字段说明
- **用户关联**: user_id, user (关联用户信息)
- **订阅关联**: subscription_plan_id, subscription_plan (关联计划信息)
- **唯一标识**: id, uuid
- **状态管理**: status, auto_renew, cancel_at_period_end
- **时间管理**: start_date, end_date, current_period_start, current_period_end
- **试用信息**: is_in_trial, trial_end_date
- **计费信息**: price, currency, billing_cycle, billing_interval, next_billing_date
- **取消信息**: cancelled_at, cancellation_reason
- **续费管理**: renewal_attempts, renewal_fail_reason, last_renewal_failed
- **计算字段**: is_expired, days_left

#### 9.3 前端实现设计

##### 页面架构
```
订阅管理 (Subscription Management)
├── 订阅计划 (Subscription Plans)
│   ├── 计划列表页面
│   ├── 创建计划页面
│   ├── 编辑计划页面
│   └── 计划详情页面
└── 用户订阅 (User Subscriptions)
    ├── 订阅列表页面
    ├── 创建订阅页面
    ├── 编辑订阅页面
    └── 订阅详情页面
```

##### 核心组件设计

**订阅计划列表组件 (SubscriptionPlansTable)**
```tsx
interface SubscriptionPlansTableProps {
  plans: SubscriptionPlan[]
  loading: boolean
  onEdit: (plan: SubscriptionPlan) => void
  onDelete: (id: number) => void
  onToggleStatus: (id: number, status: string) => void
}

// 表格列定义
const columns = [
  { key: 'name', title: '计划名称' },
  { key: 'code', title: '计划代码' },
  { key: 'price', title: '价格', render: (value, record) => `${record.currency} ${value}` },
  { key: 'billing_cycle', title: '计费周期' },
  { key: 'traffic_limit_text', title: '流量限制' },
  { key: 'status', title: '状态', render: (value) => <StatusBadge status={value} /> },
  { key: 'actions', title: '操作', render: (_, record) => <ActionButtons plan={record} /> }
]
```

**用户订阅列表组件 (UserSubscriptionsTable)**
```tsx
interface UserSubscriptionsTableProps {
  subscriptions: UserSubscription[]
  loading: boolean
  onEdit: (subscription: UserSubscription) => void
  onRenew: (id: number) => void
  onCancel: (id: number) => void
}

// 表格列定义
const columns = [
  { key: 'user.email', title: '用户邮箱' },
  { key: 'subscription_plan.name', title: '订阅计划' },
  { key: 'status', title: '状态', render: (value) => <StatusBadge status={value} /> },
  { key: 'end_date', title: '到期时间', render: (value) => formatDate(value) },
  { key: 'days_left', title: '剩余天数' },
  { key: 'auto_renew', title: '自动续费', render: (value) => value ? '是' : '否' },
  { key: 'actions', title: '操作', render: (_, record) => <SubscriptionActions subscription={record} /> }
]
```

**状态标签组件 (StatusBadge)**
```tsx
interface StatusBadgeProps {
  status: 'active' | 'inactive' | 'expired' | 'cancelled' | 'trialing' | 'past_due'
  variant?: 'default' | 'outline'
}

const statusConfig = {
  active: { color: 'green', text: '活跃' },
  inactive: { color: 'gray', text: '未激活' },
  expired: { color: 'red', text: '已过期' },
  cancelled: { color: 'orange', text: '已取消' },
  trialing: { color: 'blue', text: '试用中' },
  past_due: { color: 'yellow', text: '逾期' }
}
```

**计划表单组件 (PlanForm)**
```tsx
interface PlanFormData {
  name: string
  code: string
  description: string
  price: number
  currency: string
  billing_cycle: 'monthly' | 'yearly' | 'quarterly'
  billing_interval: number
  traffic_limit: number
  traffic_reset_cycle: string
  trial_period_days: number
  setup_fee: number
  cancellation_fee: number
  status: 'active' | 'inactive'
  is_visible: boolean
  is_popular: boolean
  is_recommended: boolean
  sort_order: number
  features: Record<string, any>
  limits: Record<string, any>
}

const PlanForm = ({ initialData, onSubmit, loading }: PlanFormProps) => {
  // 表单实现
}
```

**订阅表单组件 (SubscriptionForm)**
```tsx
interface SubscriptionFormData {
  user_id: number
  subscription_plan_id: number
  start_date: string
  end_date?: string
  price?: number
  currency?: string
  auto_renew: boolean
  status: string
}

const SubscriptionForm = ({ initialData, onSubmit, loading }: SubscriptionFormProps) => {
  // 表单实现
}
```

##### API服务封装
```tsx
// services/subscriptionService.ts
class SubscriptionService {
  // 订阅计划相关
  async getPlans(filters: PlanFilters): Promise<PaginatedResponse<SubscriptionPlan>>
  async createPlan(data: CreatePlanRequest): Promise<SubscriptionPlan>
  async updatePlan(id: number, data: UpdatePlanRequest): Promise<SubscriptionPlan>
  async deletePlan(id: number): Promise<void>
  
  // 用户订阅相关
  async getUserSubscriptions(filters: SubscriptionFilters): Promise<PaginatedResponse<UserSubscription>>
  async createUserSubscription(data: CreateSubscriptionRequest): Promise<UserSubscription>
  async renewSubscription(id: number): Promise<UserSubscription>
  async cancelSubscription(id: number): Promise<UserSubscription>
}
```

##### 状态管理
```tsx
// hooks/useSubscriptionPlans.ts
export function useSubscriptionPlans() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<PlanFilters>({})
  
  const createPlan = useCallback(async (data: CreatePlanRequest) => {
    // 实现创建逻辑
  }, [])
  
  return {
    plans,
    loading,
    filters,
    setFilters,
    createPlan,
    updatePlan,
    deletePlan,
    refreshPlans
  }
}

// hooks/useUserSubscriptions.ts
export function useUserSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<SubscriptionFilters>({})
  
  const renewSubscription = useCallback(async (id: number) => {
    // 实现续费逻辑
  }, [])
  
  return {
    subscriptions,
    loading,
    filters,
    setFilters,
    createSubscription,
    renewSubscription,
    cancelSubscription,
    refreshSubscriptions
  }
}
```

#### 9.4 核心功能特性

##### 订阅计划管理功能
- 订阅套餐配置（流量、时长、价格）
- 多货币支持（USD、EUR、CNY等）
- 灵活的计费周期（月付、年付、季付）
- 试用期配置和管理
- 套餐功能特性设置（JSON配置）
- 套餐定价策略管理
- 套餐生命周期管理（创建、激活、停用、删除）
- 套餐排序和推荐标记

##### 用户订阅管理功能
- 用户订阅状态管理（激活、过期、取消等）
- 自动续费设置和管理
- 手动续费操作
- 订阅时间管理（开始、结束、当前周期）
- 试用期状态跟踪
- 续费失败处理和重试
- 订阅取消和恢复
- 订阅统计分析
- 订阅服务监控

##### 业务流程支持
- 订阅生命周期完整管理
- 计费周期自动处理
- 试用期到期自动转换
- 续费失败自动重试机制
- 订阅过期自动处理
- 用户订阅升级/降级支持

---

### 11. 工单管理模块 (Admin-Ticket-Management)

**功能范围：** 客户支持工单的完整生命周期管理

#### API 接口
- `GET /api/v1/admin/tickets` - 工单列表
- `GET /api/v1/admin/tickets/number/{ticket_no}` - 根据工单号查询
- `GET /api/v1/admin/tickets/stats` - 工单统计
- `GET /api/v1/admin/tickets/{id}` - 工单详情
- `PUT /api/v1/admin/tickets/{id}` - 更新工单信息
- `DELETE /api/v1/admin/tickets/{id}` - 删除工单
- `POST /api/v1/admin/tickets/{id}/assign` - 分配工单
- `POST /api/v1/admin/tickets/{id}/close` - 关闭工单
- `POST /api/v1/admin/tickets/{id}/resolve` - 解决工单
- `GET /api/v1/admin/tickets/{id}/messages` - 工单消息记录
- `POST /api/v1/admin/tickets/{id}/messages` - 发送消息回复

#### 核心功能
- 工单分配和流转
- 多轮对话支持
- 工单优先级管理
- 响应时间统计
- 客服绩效分析

---

### 12. 用户管理模块 (Admin-User-Management)

**功能范围：** 用户账户的全面管理，包括批量操作和角色管理

#### API 接口详细规范

##### 基础用户管理
**`GET /api/v1/admin/users` - 用户列表查询**
- **描述**: 获取系统中所有用户的分页列表，支持高级筛选
- **请求参数**:
  - `email` (query, string): 按邮箱筛选
  - `username` (query, string): 按用户名筛选  
  - `name` (query, string): 按显示名称筛选
  - `role` (query, string): 按角色筛选 - "user", "admin", "system"
  - `status` (query, string): 按状态筛选 - "active", "inactive", "suspended", "banned"
  - `provider` (query, string): 按认证提供商筛选 - "local", "google", "github", "telegram"
  - `start_date` (query, string): 创建时间起始日期 (YYYY-MM-DD)
  - `end_date` (query, string): 创建时间结束日期 (YYYY-MM-DD)
  - `search` (query, string): 全文搜索（邮箱、用户名、显示名称）
  - `sort_by` (query, string): 排序字段 - "created_at", "updated_at", "email", "username", "name"
  - `sort_order` (query, string): 排序方向 - "asc", "desc" (默认: "desc")
  - `limit` (query, integer): 每页数量 (1-100, 默认: 10)
  - `offset` (query, integer): 偏移量 (默认: 0)
- **响应格式**: **PaginatedResponse** (data: UserResponse[])

**`POST /api/v1/admin/users` - 创建新用户**
- **描述**: 管理员创建新用户账户
- **请求体结构**:
  ```json
  {
    "email": "string", // 必填
    "username": "string", // 必填
    "name": "string", // 必填
    "password": "string", // 必填，最少6位
    "role": "string", // 可选，默认"user"
    "status": "string", // 可选，默认"active"
    "avatar": "string" // 可选
  }
  ```
- **响应格式**: **StandardResponse** (data: UserResponse)

##### 专项查询接口
**`GET /api/v1/admin/users/deleted` - 已删除用户列表**
- **描述**: 获取所有被软删除的用户列表
- **请求参数**: 
  - `limit` (query, integer): 每页数量 (默认: 10)
  - `offset` (query, integer): 偏移量 (默认: 0)
- **响应格式**: **PaginatedResponse** (data: UserResponse[])

**`GET /api/v1/admin/users/provider` - 按提供商查询用户**
- **描述**: 按认证提供商筛选用户
- **请求参数**:
  - `provider` (query, string): 认证提供商 - "local", "google", "github", "telegram"
  - `limit` (query, integer): 每页数量 (默认: 10)
  - `offset` (query, integer): 偏移量 (默认: 0)
- **响应格式**: **PaginatedResponse** (data: UserResponse[])

**`GET /api/v1/admin/users/search` - 用户搜索**
- **描述**: 高级用户搜索功能
- **请求参数**:
  - `q` (query, string, 必填): 搜索关键词
  - `fields` (query, string): 搜索字段 - "email,username,name" (默认: 所有字段)
  - `limit` (query, integer): 每页数量 (默认: 10)
  - `offset` (query, integer): 偏移量 (默认: 0)
- **响应格式**: **PaginatedResponse** (data: UserResponse[])

**`GET /api/v1/admin/users/stats` - 用户统计**
- **描述**: 获取用户统计数据
- **请求参数**:
  - `period` (query, string): 统计周期 - "today", "week", "month", "year", "all" (默认: "month")
  - `start_date` (query, string): 自定义开始日期 (YYYY-MM-DD)
  - `end_date` (query, string): 自定义结束日期 (YYYY-MM-DD)
- **响应格式**: **StandardResponse** (data: UserStatsResponse)
- **UserStatsResponse 结构**:
  ```json
  {
    "total_users": 1000,
    "active_users": 850,
    "new_users_today": 5,
    "new_users_this_week": 32,
    "new_users_this_month": 128,
    "users_by_role": {
      "user": 950,
      "admin": 45,
      "system": 5
    },
    "users_by_provider": {
      "local": 600,
      "google": 300,
      "github": 80,
      "telegram": 20
    },
    "users_by_status": {
      "active": 850,
      "inactive": 100,
      "suspended": 40,
      "banned": 10
    }
  }
  ```

##### 批量操作接口
**`POST /api/v1/admin/users/batch/delete` - 批量删除用户**
- **描述**: 批量软删除多个用户
- **请求体结构**:
  ```json
  {
    "user_ids": [1, 2, 3, 4, 5], // 必填，用户ID数组
    "reason": "string" // 可选，删除原因
  }
  ```
- **响应格式**: **StandardResponse** (data: BatchOperationResult)

**`POST /api/v1/admin/users/batch/restore` - 批量恢复用户**
- **描述**: 批量恢复被软删除的用户
- **请求体结构**:
  ```json
  {
    "user_ids": [1, 2, 3, 4, 5], // 必填，用户ID数组
    "reason": "string" // 可选，恢复原因
  }
  ```
- **响应格式**: **StandardResponse** (data: BatchOperationResult)

##### 单用户操作接口
**`GET /api/v1/admin/users/{id}` - 获取用户详情**
- **描述**: 获取指定用户的完整信息
- **路径参数**: `id` (integer, 必填): 用户ID
- **响应格式**: **StandardResponse** (data: UserResponse)

**`PUT /api/v1/admin/users/{id}` - 完整更新用户**
- **描述**: 完整更新用户信息（所有字段）
- **路径参数**: `id` (integer, 必填): 用户ID
- **请求体结构**:
  ```json
  {
    "email": "string", // 必填
    "username": "string", // 必填
    "name": "string", // 必填  
    "avatar": "string", // 可选
    "role": "string", // 可选
    "status": "string" // 可选
  }
  ```
- **响应格式**: **StandardResponse** (data: UserResponse)

**`PATCH /api/v1/admin/users/{id}` - 部分更新用户**
- **描述**: 部分更新用户信息（只更新提供的字段）
- **路径参数**: `id` (integer, 必填): 用户ID
- **请求体结构**: 任意UserResponse字段的子集
- **响应格式**: **StandardResponse** (data: UserResponse)

**`DELETE /api/v1/admin/users/{id}` - 软删除用户**
- **描述**: 软删除用户（可恢复）
- **路径参数**: `id` (integer, 必填): 用户ID
- **请求体结构**:
  ```json
  {
    "reason": "string" // 可选，删除原因
  }
  ```
- **响应格式**: **StandardResponse**

**`DELETE /api/v1/admin/users/{id}/hard-delete` - 永久删除用户**
- **描述**: 永久删除用户（不可恢复）
- **路径参数**: `id` (integer, 必填): 用户ID
- **请求体结构**:
  ```json
  {
    "confirmation": "PERMANENT_DELETE", // 必填，确认删除
    "reason": "string" // 可选，删除原因
  }
  ```
- **响应格式**: **StandardResponse**

**`POST /api/v1/admin/users/{id}/restore` - 恢复用户**
- **描述**: 恢复被软删除的用户
- **路径参数**: `id` (integer, 必填): 用户ID
- **请求体结构**:
  ```json
  {
    "reason": "string" // 可选，恢复原因
  }
  ```
- **响应格式**: **StandardResponse** (data: UserResponse)

##### 专项更新接口
**`PUT /api/v1/admin/users/{id}/role` - 更新用户角色**
- **描述**: 单独更新用户角色
- **路径参数**: `id` (integer, 必填): 用户ID
- **请求体结构**:
  ```json
  {
    "role": "admin", // 必填，新角色 - "user", "admin", "system"
    "reason": "string" // 可选，变更原因
  }
  ```
- **响应格式**: **StandardResponse** (data: UserResponse)

**`PUT /api/v1/admin/users/{id}/status` - 更新用户状态**
- **描述**: 单独更新用户状态
- **路径参数**: `id` (integer, 必填): 用户ID
- **请求体结构**:
  ```json
  {
    "status": "suspended", // 必填，新状态 - "active", "inactive", "suspended", "banned"
    "reason": "string" // 可选，变更原因
  }
  ```
- **响应格式**: **StandardResponse** (data: UserResponse)

#### 数据模型

##### UserResponse 完整结构
```json
{
  "id": 1,
  "email": "user@example.com", 
  "username": "user123",
  "name": "用户名称",
  "avatar": "https://example.com/avatar.jpg",
  "role": "user",
  "status": "active", 
  "provider": "local",
  "google_id": "",
  "github_id": "",
  "telegram_id": "",
  "provider_data": "",
  "invite_code_id": 0,
  "invite_code_used": "",
  "created_at": "2025-01-01T00:00:00Z",
  "updated_at": "2025-01-01T00:00:00Z", 
  "deleted_at": ""
}
```

##### BatchOperationResult 结构
```json
{
  "success_count": 5,
  "failed_count": 0,
  "total_count": 5,
  "failed_ids": [],
  "errors": []
}
```

#### 核心功能
- 用户账户生命周期管理（创建、更新、删除、恢复）
- 高级搜索和多维度筛选
- 批量操作支持（批量删除、恢复）
- 角色权限管理（用户、管理员、系统）
- 用户状态管理（激活、暂停、封禁）
- 多认证提供商支持（本地、Google、GitHub、Telegram）
- 用户行为统计和分析
- 软删除机制（可恢复删除）

## 通用功能模式

### 1. 认证和安全

#### JWT Bearer Token 认证
- **Token 携带方式**: 请求头 `Authorization: Bearer <token>`
- **Token 类型**: 
  - Access Token（访问令牌）- 用于API调用
  - Refresh Token（刷新令牌）- 用于令牌续期
- **Token 有效期**: Access Token 通常为 1 小时
- **自动刷新**: 前端应实现 Token 自动刷新机制

#### 基于角色的访问控制 (RBAC)
- **角色验证**: 通过用户 `role` 字段判断权限
- **管理员角色**: `role: "admin"` 才能访问管理端接口  
- **权限检查**: 每个管理端接口都验证用户角色
- **跨模块权限**: 所有管理模块使用统一的权限控制

#### 安全最佳实践
- **HTTPS 强制**: 生产环境必须使用 HTTPS
- **Token 安全存储**: 建议使用 httpOnly Cookie 或安全的本地存储
- **敏感操作验证**: 删除、批量操作等需要二次确认
- **登录状态监控**: 实现登录过期自动跳转

#### 统一错误响应
- `4001 Unauthorized` - Token 无效或已过期
- `4003 Forbidden` - 权限不足（非管理员角色）
- `4004 Not Found` - 资源不存在
- `5000 Internal Server Error` - 服务器内部错误

### 2. 数据处理模式
- **分页**：大多数列表接口支持 `limit`/`offset` 分页
- **筛选**：支持多维度筛选（日期范围、状态、类型等）
- **搜索**：文本搜索功能（支持模糊匹配）
- **排序**：可配置的多字段排序
- **统计**：专门的统计接口提供数据分析

### 3. 响应数据结构

#### 标准响应格式 (StandardResponse)
```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

#### 分页响应格式 (PaginatedResponse)
```json
{
  "code": 0,
  "message": "success", 
  "data": [],
  "total": 100,
  "limit": 10,
  "offset": 0
}
```

#### 标准列表响应格式 (StandardListResponse)
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "items": [],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10
    }
  }
}
```

#### 错误响应格式
```json
{
  "code": 4000,
  "message": "Invalid request parameters"
}
```

#### 响应代码说明
- **0**: 成功 (Success)
- **4000**: 请求参数错误 (Bad Request)
- **4001**: 认证失败 (Unauthorized)  
- **4003**: 权限不足 (Forbidden)
- **4004**: 资源不存在 (Not Found)
- **5000**: 服务器内部错误 (Internal Server Error)

#### 分页格式说明
系统使用两种分页响应格式：

1. **PaginatedResponse**: 扁平结构，分页信息直接在根级别
   - 使用 `offset` + `limit` 方式
   - 适用于大多数列表查询接口（如发票、订单、用户等）

2. **StandardListResponse**: 嵌套结构，分页信息在 `data.pagination` 中
   - 使用 `page` + `limit` 方式  
   - 适用于特定的列表查询（如邀请码、推荐活动等）

#### 响应格式使用规则
- **GET** 列表接口：使用 `PaginatedResponse` 或 `StandardListResponse`
- **GET** 详情接口：使用 `StandardResponse` 包装具体数据模型
- **POST** 创建接口：使用 `StandardResponse` 包装创建的资源
- **PUT/PATCH** 更新接口：使用 `StandardResponse` 包装更新后的资源  
- **DELETE** 删除接口：使用 `StandardResponse`，通常 data 为空
- **统计类接口**：使用 `StandardResponse` 包装统计数据

## 前端实现建议

### 1. 模块化架构
- 每个管理模块对应独立的前端模块
- 共享通用组件（表格、筛选器、分页器等）
- 统一的 API 调用层

### 2. 数据管理
- 使用状态管理库（如 Zustand/Redux）
- 实现数据缓存和同步机制
- 支持乐观更新和错误回滚
- **响应处理**：
  - 成功判断：`response.code === 0`
  - 错误处理：根据不同的 `code` 值显示相应错误信息
  - 分页处理：适配两种分页格式（offset/limit 和 page/limit）

### 3. 用户体验
- 响应式设计支持移动端
- 实时数据更新（WebSocket 或轮询）
- 批量操作的进度反馈
- 丰富的筛选和搜索体验

### 4. 权限控制与认证集成

#### 认证状态管理
```typescript
// 认证状态接口
interface AuthState {
  user: UserResponse | null
  token: string | null
  isAuthenticated: boolean
  isAdmin: boolean
}

// Token 刷新逻辑
const refreshToken = async () => {
  try {
    const response = await api.post('/auth/refresh')
    if (response.code === 0) {
      setToken(response.data.access_token)
      return true
    }
  } catch (error) {
    // 刷新失败，跳转登录页
    redirectToLogin()
    return false
  }
}
```

#### API 请求拦截器
```typescript
// 请求拦截器 - 自动添加 Bearer Token
axios.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理认证错误
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token 过期，尝试刷新
      const refreshed = await refreshToken()
      if (refreshed) {
        // 重试原请求
        return axios.request(error.config)
      }
    }
    return Promise.reject(error)
  }
)
```

#### 路由权限控制
```typescript
// 管理员路由保护
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }
  
  if (!isAdmin) {
    return <Navigate to="/unauthorized" />
  }
  
  return children
}
```

#### 权限检查组件
```typescript
// 权限控制组件
const PermissionGuard = ({ 
  requiredRole = 'admin', 
  children, 
  fallback = null 
}) => {
  const { user } = useAuth()
  
  if (user?.role !== requiredRole) {
    return fallback
  }
  
  return children
}
```

#### 登录流程实现
```typescript
// 登录请求格式
interface LoginRequest {
  email: string
  password: string
}

// 登录响应接口定义
interface LoginResponse {
  code: number
  message: string
  data: {
    token: {
      access_token: string
      refresh_token: string
      token_type: string
      expires_in: number
      expires_at: string
    }
    user: {
      id: number
      email: string
      username: string
      name: string
      avatar: string
      role: string
      status: string
      provider: string
      google_id: string
      github_id: string
      telegram_id: string
      provider_data: string
      invite_code_id: number
      invite_code_used: string
      created_at: string
      updated_at: string
      deleted_at: string
    }
  }
}

// 登录处理函数
const handleLogin = async (credentials: LoginRequest) => {
  try {
    const response: LoginResponse = await api.post('/auth/login', credentials)
    
    if (response.code === 0) {
      const { token, user } = response.data
      
      // 存储认证信息
      setToken(token.access_token)
      setRefreshToken(token.refresh_token)
      setUser(user)
      
      // 根据用户角色跳转
      if (user.role === 'admin') {
        navigate('/admin')
      } else {
        showError('权限不足，需要管理员角色')
      }
    } else {
      showError(response.message || '登录失败')
    }
  } catch (error) {
    showError('登录失败: ' + error.message)
  }
}

// Token 刷新响应格式
interface RefreshTokenResponse {
  code: number
  message: string
  data: {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
    expires_at: string
  }
}
```

#### 操作日志记录
- 基于角色的界面权限控制
- 敏感操作二次确认
- 用户操作行为记录
- 登录日志和安全审计

## 接口统计总览

### 按HTTP方法统计
- **GET 接口**: 37个（查询和列表功能）
- **POST 接口**: 19个（创建和动作操作）  
- **PUT 接口**: 3个（完整更新操作）
- **PATCH 接口**: 3个（部分更新操作）
- **DELETE 接口**: 1个（删除操作）

### 按模块统计
0. **认证授权系统**: 12个接口（完整认证功能）
1. **邀请码管理**: 2个接口（仅查询功能）
2. **发票管理**: 8个接口（完整CRUD + 业务操作）
3. **订单管理**: 6个接口（查询 + 业务操作）
4. **支付配置管理**: 4个接口（完整CRUD）
5. **推荐活动管理**: 5个接口（完整CRUD + 统计）
6. **推荐记录管理**: 2个接口（仅查询功能）
7. **服务器组管理**: 6个接口（完整CRUD）
8. **Shadowsocks服务器管理**: 6个接口（完整CRUD + PATCH）
9. **订阅管理**: 13个接口（订阅计划6个 + 用户订阅7个，完整CRUD + 业务操作）
10. **工单管理**: 11个接口（完整CRUD + 工作流操作）
11. **用户管理**: 17个接口（完整CRUD + 批量操作 + 特殊操作）

## 总结

Linke 管理端系统提供了完整的业务管理能力，通过 **12个功能模块**（包括认证授权系统）和 **92个API接口** 涵盖了认证授权、用户管理、订单处理、支付配置、服务器管理、订阅管理等各个方面。

### 系统特点
- **完整的认证体系**：支持本地登录和OAuth第三方登录，JWT Token机制
- **模块化架构**：每个业务域独立管理，职责清晰
- **完整的CRUD支持**：核心业务实体都支持完整的增删改查操作
- **丰富的业务操作**：除基础CRUD外，还提供专门的业务流程操作
- **统一的安全认证**：所有管理端接口都采用Bearer Token认证
- **基于角色的权限控制**：通过用户角色实现精细化权限管理
- **标准化的API设计**：统一的请求响应格式和错误处理
- **多种登录方式**：支持邮箱密码、Google、GitHub、Telegram等登录方式

该设计文档为前端开发团队提供了详细的接口规范和实现指导，有助于构建功能完整、用户体验良好的管理端界面。