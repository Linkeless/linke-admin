# 使用量监控模块

这是一个完整的使用量监控系统，提供实时监控、告警管理、分析报告和管理工具功能。

## 功能特性

### 🔍 使用量总览 (`/usage`)
- 全局使用量统计仪表板
- 热门用户排行榜
- 实时告警摘要
- 趋势分析图表

### 🚨 告警管理 (`/usage/alerts`)
- 告警列表（支持筛选、搜索、批量操作）
- 告警详情页面
- 告警配置管理
- 告警历史和统计

### 📊 实时监控 (`/usage/monitoring`)
- 订阅使用量实时监控
- 多维度数据展示
- 预测分析图表
- 性能统计卡片

### 📈 分析报告 (`/usage/analytics`)
- 趋势分析报告
- 数据导出功能
- 热门用户分析
- 自定义报表

### ⚙️ 管理工具 (`/usage/admin`)
- 数据清理工具
- 使用量同步
- 重置功能
- 批量操作

## 技术架构

### API 接口
系统对接了25个API接口，包括：
- **管理功能** (3个): 数据清理、使用量重置、数据同步
- **告警管理** (12个): 告警CRUD、批量操作、配置管理、历史统计
- **使用量数据** (10个): 当前使用量、历史数据、统计分析、实时监控

### 核心组件
- `lib/usage-service.ts` - API服务层
- `lib/usage-types.ts` - 类型定义
- `hooks/use-realtime-usage.ts` - 实时数据Hook
- `hooks/use-alert-polling.ts` - 告警轮询Hook

### 技术特性
- **实时数据更新**: 使用轮询机制更新实时数据
- **图表可视化**: 基于Recharts的响应式图表
- **告警系统**: 完整的告警生命周期管理
- **性能优化**: 虚拟化、分页、防抖节流
- **TypeScript**: 严格类型检查
- **响应式设计**: 支持移动端

## 使用说明

### 开发环境
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
npm start
```

### 依赖项
主要依赖包括：
- Next.js 15 + React 19
- shadcn/ui 组件库
- Recharts 图表库
- date-fns 日期处理
- @tanstack/react-table 表格

## 文件结构

```
app/usage/
├── page.tsx                    # 使用量总览页面
├── loading.tsx                 # 全局加载状态
├── types.ts                    # 类型导出
├── alerts/                     # 告警管理
│   ├── page.tsx               # 告警列表页面
│   ├── loading.tsx            # 告警加载状态
│   ├── [id]/page.tsx          # 告警详情页面
│   ├── configs/               # 告警配置
│   └── components/            # 告警组件
├── monitoring/                 # 实时监控
│   ├── page.tsx               # 监控总览
│   ├── [subscription_id]/     # 详细监控
│   └── components/            # 监控组件
├── analytics/                  # 分析报告
│   ├── page.tsx               # 分析总览
│   ├── export/                # 数据导出
│   └── components/            # 分析组件
├── admin/                      # 管理工具
│   ├── page.tsx               # 管理控制台
│   └── components/            # 管理组件
└── components/                 # 通用组件
    ├── usage-overview.tsx     # 使用量概览
    └── subscription-selector.tsx # 订阅选择器
```

## 扩展开发

### 添加新的使用量类型
1. 在 `lib/usage-types.ts` 中添加新的 `UsageType` 枚举值
2. 更新 `UsageService.getUsageTypeDisplayName()` 方法
3. 在相关组件中添加对新类型的支持

### 添加新的告警类型
1. 在 `lib/usage-types.ts` 中添加新的 `AlertType` 枚举值
2. 更新告警配置表单的选项
3. 在告警列表中添加对新类型的显示支持

### 自定义图表
1. 在 `monitoring/components/` 目录下创建新的图表组件
2. 使用 Recharts 库创建图表
3. 在主页面中引入并使用

## 注意事项

1. **权限控制**: 管理工具模块需要管理员权限
2. **数据安全**: 清理和重置操作不可撤销，请谨慎使用
3. **性能优化**: 大量数据时建议使用分页和虚拟化
4. **实时更新**: 注意轮询频率，避免对服务器造成过大压力
5. **错误处理**: 所有API调用都包含完整的错误处理机制