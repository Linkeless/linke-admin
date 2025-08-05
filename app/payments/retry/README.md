# 支付重试管理模块

## 概述

支付重试管理模块是一个完整的支付失败重试解决方案，提供智能重试策略配置、实时监控和数据分析功能。该模块基于 Next.js 15 + React 19 + TypeScript 构建，采用 shadcn/ui 组件库，遵循三层组件架构设计。

## 功能特性

### 🚀 核心功能

- **智能重试策略管理** - 支持多种重试间隔配置和条件匹配
- **实时重试监控** - 提供重试状态跟踪和进度显示
- **统计分析面板** - 全面的重试成功率和性能分析
- **灵活配置系统** - 全局参数配置和策略个性化设置
- **批量操作支持** - 高效的策略和记录批量管理

### 📊 数据可视化

- 重试趋势图表（基于 Recharts）
- 错误类型分布分析
- 策略性能对比
- 实时监控面板
- 成功率统计仪表板

### 🔧 管理功能

- 策略创建/编辑/删除
- 重试记录查看和过滤
- 手动重试和取消操作
- 系统配置优化建议
- 批量操作和导出功能

## 目录结构

```
app/payments/retry/
├── page.tsx                    # 重试管理总览页面
├── loading.tsx                 # 全局加载状态
├── README.md                   # 模块文档
├── components/                 # 通用组件
│   ├── index.ts
│   ├── retry-overview.tsx      # 重试概览组件
│   ├── retry-chart.tsx         # 重试图表组件
│   └── strategy-form.tsx       # 策略表单组件
├── strategies/                 # 重试策略管理
│   ├── page.tsx               # 策略列表页面
│   ├── new/                   # 新建策略
│   │   └── page.tsx
│   ├── [id]/                  # 策略详情/编辑（待实现）
│   └── components/            # 策略相关组件
│       ├── index.ts
│       ├── strategies-table.tsx
│       ├── strategies-stats.tsx
│       ├── strategies-filters.tsx
│       └── strategies-table-skeleton.tsx
├── records/                    # 重试记录管理
│   ├── page.tsx               # 记录列表页面
│   ├── [id]/                  # 记录详情（待实现）
│   └── components/            # 记录相关组件
│       ├── index.ts
│       ├── records-table.tsx
│       ├── records-stats.tsx
│       ├── records-filters.tsx
│       └── records-table-skeleton.tsx
└── config/                     # 重试配置管理
    ├── page.tsx               # 配置页面
    └── components/            # 配置相关组件（待实现）
        ├── config-form.tsx
        ├── config-stats.tsx
        └── config-recommendations.tsx
```

## 技术架构

### 数据层 (lib/)
- `payment-retry-types.ts` - TypeScript 类型定义
- `payment-retry-service.ts` - API 服务封装

### 状态管理层 (hooks/)
- `use-retry-strategies.ts` - 策略管理 Hook
- `use-retry-records.ts` - 记录管理 Hook  
- `use-retry-config.ts` - 配置管理 Hook

### 组件层 (components/)
- **UI 组件** - shadcn/ui 基础组件
- **Layout 组件** - 布局和导航组件
- **Business 组件** - 业务逻辑组件

## API 接口

### 重试策略 API
- `GET /api/v1/admin/payments/retry/strategies` - 获取策略列表
- `POST /api/v1/admin/payments/retry/strategies` - 创建策略
- `PUT /api/v1/admin/payments/retry/strategies/{id}` - 更新策略

### 重试记录 API
- `GET /api/v1/admin/payments/retry/records` - 获取重试记录
- `POST /api/v1/admin/payments/retry/{payment_id}` - 手动重试
- `GET /api/v1/admin/payments/retry/{payment_id}/history` - 获取重试历史

### 重试配置 API
- `GET /api/v1/admin/payments/retry/config` - 获取重试配置
- `PUT /api/v1/admin/payments/retry/config` - 更新重试配置

## 核心类型定义

### RetryStrategy
```typescript
interface RetryStrategy {
  id: string
  name: string
  description: string
  enabled: boolean
  retry_intervals: number[]  // 重试间隔（秒）
  max_attempts: number
  payment_methods: string[]
  error_conditions: string[]
  created_at: string
  updated_at: string
}
```

### RetryRecord
```typescript
interface RetryRecord {
  id: string
  payment_id: string
  strategy_id: string
  attempt_number: number
  status: RetryStatus
  error_message?: string
  retry_at: string
  completed_at?: string
  next_retry_at?: string
}
```

### RetryConfig
```typescript
interface RetryConfig {
  enabled: boolean
  default_strategy_id: string
  max_daily_retries: number
  notification_enabled: boolean
  notification_email: string
  retry_window_hours: number
}
```

## 使用示例

### 创建重试策略
```typescript
import { useRetryStrategyOperations } from '@/hooks/use-retry-strategies'

const { createStrategy } = useRetryStrategyOperations()

const newStrategy = {
  name: "快速重试策略",
  description: "适用于网络临时故障",
  enabled: true,
  max_attempts: 3,
  retry_intervals: [30, 60, 120], // 30秒、1分钟、2分钟
  payment_methods: ["alipay", "wechat_pay"],
  error_conditions: ["network_error", "timeout"]
}

const result = await createStrategy(newStrategy)
```

### 获取重试记录
```typescript
import { useRetryRecords } from '@/hooks/use-retry-records'

const { 
  records, 
  loading, 
  changeFilters 
} = useRetryRecords()

// 按状态筛选
changeFilters({ status: 'failed' })
```

### 更新重试配置
```typescript
import { useRetryConfig } from '@/hooks/use-retry-config'

const { updateConfig } = useRetryConfig()

const newConfig = {
  max_daily_retries: 1000,
  notification_enabled: true,
  notification_email: "admin@example.com"
}

await updateConfig(newConfig)
```

## 组件使用

### 策略表单组件
```tsx
import { StrategyForm } from './components/strategy-form'

<StrategyForm
  strategy={existingStrategy}
  onSubmit={handleSubmit}
  onCancel={handleCancel}
  loading={loading}
/>
```

### 重试概览组件
```tsx
import { RetryOverview } from './components/retry-overview'

<RetryOverview />
```

### 重试图表组件
```tsx
import { RetryChart } from './components/retry-chart'

<RetryChart />
```

## 配置说明

### 重试间隔配置
支持多种预设策略：
- **快速重试** - [30, 60, 120, 300] 秒
- **标准重试** - [300, 900, 1800, 3600] 秒  
- **延迟重试** - [1800, 3600, 7200, 14400] 秒
- **长期重试** - [3600, 7200, 14400, 28800, 86400] 秒

### 错误条件匹配
支持的错误类型：
- `network_error` - 网络错误
- `timeout` - 超时
- `gateway_error` - 网关错误
- `insufficient_funds` - 余额不足
- `card_declined` - 卡片被拒
- `authentication_failed` - 认证失败
- `rate_limit` - 频率限制
- `system_error` - 系统错误

## 最佳实践

### 1. 策略设计原则
- 针对不同错误类型设计专门策略
- 避免对永久性错误设置重试
- 合理设置重试间隔，避免对网关造成压力
- 定期评估策略效果并优化

### 2. 监控和告警
- 设置合理的成功率阈值告警
- 监控重试队列大小和处理能力
- 跟踪高频错误类型和原因
- 定期分析策略性能并调整

### 3. 性能优化
- 控制并发重试数量
- 设置合理的重试窗口时间
- 及时清理过期重试记录
- 优化数据库查询和索引

## 开发指南

### 添加新功能
1. 在 `payment-retry-types.ts` 中定义相关类型
2. 在 `payment-retry-service.ts` 中添加 API 调用
3. 创建相应的 Hook 处理状态管理
4. 开发组件实现 UI 交互
5. 添加单元测试和集成测试

### 样式规范
- 使用 shadcn/ui 组件库
- 遵循 Tailwind CSS 类名规范
- 保持组件样式的一致性
- 支持响应式设计

### 错误处理
- 统一的错误边界处理
- 友好的错误提示信息
- 网络错误重试机制
- 降级方案设计

## 待实现功能

- [ ] 策略详情页面和编辑功能
- [ ] 重试记录详情页面
- [ ] 配置表单组件完善
- [ ] 导出功能实现
- [ ] 单元测试补充
- [ ] 国际化支持
- [ ] 移动端优化

## 更新日志

### v1.0.0 (2024-01-XX)
- ✅ 完成基础架构搭建
- ✅ 实现策略管理功能
- ✅ 实现记录查看功能
- ✅ 实现配置管理功能
- ✅ 完成数据可视化
- ✅ 实现实时监控

## 许可证

MIT License

## 贡献指南

欢迎提交 Issue 和 Pull Request 来改进这个模块。在提交代码前，请确保：

1. 代码符合 ESLint 规则
2. 组件有适当的 TypeScript 类型定义
3. 重要功能有单元测试覆盖
4. 更新相关文档

## 联系方式

如有问题或建议，请联系开发团队或提交 GitHub Issue。