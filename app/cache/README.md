# 缓存管理模块

完整的缓存管理系统，提供缓存指标监控、实时监控、告警管理和缓存操作等功能。

## 📁 模块结构

```
app/cache/
├── page.tsx                    # 缓存总览页面
├── loading.tsx                 # 全局加载状态
├── types.ts                    # 类型导出
├── metrics/                    # 缓存指标模块
│   ├── page.tsx               # 指标概览
│   ├── history/               # 历史指标
│   │   └── page.tsx          # 历史指标详情
│   └── components/            # 指标组件
│       ├── time-range-selector.tsx
│       └── index.ts
├── monitoring/                 # 缓存监控模块
│   ├── page.tsx               # 监控总览
│   ├── realtime/              # 实时监控
│   │   └── page.tsx
│   ├── alerts/                # 监控告警
│   │   └── page.tsx
│   └── components/            # 监控组件
│       ├── realtime-panel.tsx
│       ├── alert-management.tsx
│       └── index.ts
├── management/                 # 缓存管理模块
│   ├── page.tsx               # 管理控制台
│   ├── keys/                  # 缓存键管理
│   │   └── page.tsx
│   └── components/            # 管理组件
│       ├── keys-management.tsx
│       └── index.ts
└── components/                 # 通用组件
    ├── cache-overview.tsx     # 缓存概览
    ├── metrics-chart.tsx      # 指标图表
    ├── cache-operations.tsx   # 缓存操作
    └── index.ts
```

## 🚀 功能特性

### 1. 缓存总览 (`/cache`)
- ✅ 全局缓存状态仪表板
- ✅ 关键性能指标展示（命中率、内存使用、操作速率等）
- ✅ 健康状态监控
- ✅ 快速操作入口
- ✅ 实时数据更新

### 2. 缓存指标 (`/cache/metrics`)
- ✅ 实时性能指标监控
- ✅ 历史趋势分析（支持自定义时间范围）
- ✅ 命中率统计和趋势图表
- ✅ 内存使用情况分析
- ✅ 性能指标对比和分析
- ✅ 数据导出功能

### 3. 缓存监控 (`/cache/monitoring`)
- ✅ 实时监控面板（5秒刷新）
- ✅ 告警管理系统
- ✅ 性能警报配置
- ✅ 监控历史记录
- ✅ 热门缓存键监控
- ✅ 慢查询记录

### 4. 缓存管理 (`/cache/management`)
- ✅ 缓存清理工具（支持全部、过期、模式匹配）
- ✅ 缓存刷新功能
- ✅ 预热策略管理
- ✅ 缓存键管理（搜索、筛选、删除）
- ✅ 系统维护工具
- ✅ 批量操作支持

## 🔧 技术实现

### API 服务层
- **位置**: `lib/cache-service.ts`
- **功能**: 实现15个后端API接口的调用
- **特性**: 统一错误处理、响应数据标准化、TypeScript类型安全

### 类型定义
- **位置**: `lib/cache-types.ts`
- **内容**: 完整的TypeScript类型定义
- **覆盖**: 所有API响应、请求参数、组件Props等

### 自定义Hooks
- **缓存指标**: `hooks/use-cache-metrics.ts`
- **缓存监控**: `hooks/use-cache-monitoring.ts`
- **缓存操作**: `hooks/use-cache-operations.ts`

### 核心组件
- **CacheOverview**: 缓存概览组件
- **MetricsChart**: 指标图表组件
- **CacheOperations**: 缓存操作组件
- **RealtimePanel**: 实时监控面板
- **AlertManagement**: 告警管理组件
- **KeysManagement**: 缓存键管理组件

## 📊 支持的API接口

### 缓存指标 (5个)
- `GET /api/v1/admin/cache/metrics` - 获取缓存指标
- `GET /api/v1/admin/cache/metrics/history` - 获取历史指标
- `GET /api/v1/admin/cache/stats` - 获取缓存统计
- `GET /api/v1/admin/cache/performance` - 获取性能指标
- `GET /api/v1/admin/cache/health` - 获取健康状态

### 缓存监控 (4个)
- `GET /api/v1/admin/cache/monitor/realtime` - 实时监控
- `GET /api/v1/admin/cache/monitor/alerts` - 监控告警
- `POST /api/v1/admin/cache/monitor/alerts` - 创建监控告警
- `DELETE /api/v1/admin/cache/monitor/alerts/{id}` - 删除监控告警

### 缓存管理 (6个)
- `POST /api/v1/admin/cache/clear` - 清理缓存
- `POST /api/v1/admin/cache/refresh` - 刷新缓存
- `POST /api/v1/admin/cache/warmup` - 预热缓存
- `GET /api/v1/admin/cache/keys` - 获取缓存键列表
- `DELETE /api/v1/admin/cache/keys/{key}` - 删除指定缓存
- `POST /api/v1/admin/cache/maintenance` - 缓存维护

## 🎨 界面特性

### 响应式设计
- 移动端友好的响应式布局
- 自适应屏幕尺寸
- 触控优化的交互体验

### 可视化图表
- 基于Recharts的交互式图表
- 实时数据更新
- 多种图表类型（线形图、面积图、柱状图）

### 用户体验
- 统一的Loading状态
- 友好的错误提示
- 确认对话框防误操作
- 快捷键支持

## 🔒 安全特性

### 权限控制
- API请求需要Bearer Token认证
- 操作确认机制
- 敏感操作二次确认

### 数据保护
- 自动错误处理
- 数据格式验证
- XSS防护

## 📈 性能优化

### 数据获取
- 智能轮询机制（可配置间隔）
- 数据缓存优化
- 请求去重

### 渲染优化
- 组件懒加载
- 虚拟滚动（大列表）
- React.memo优化

## 🛠️ 开发指南

### 环境要求
- Next.js 15+
- React 19+
- TypeScript 5+
- TailwindCSS v4

### 安装依赖
```bash
npm install @tanstack/react-table
npm install recharts
npm install date-fns
npm install lucide-react
```

### 配置环境变量
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3000/api/v1
```

### 运行开发服务器
```bash
npm run dev
```

## 📝 使用示例

### 获取缓存指标
```typescript
import { useCacheMetrics } from '@/hooks/use-cache-metrics';

function MyComponent() {
  const { metrics, loading, error, refresh } = useCacheMetrics(true, 30000);
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>命中率: {(metrics.hit_rate * 100).toFixed(1)}%</p>
      <p>内存使用: {formatBytes(metrics.memory_usage)}</p>
      <button onClick={refresh}>刷新</button>
    </div>
  );
}
```

### 执行缓存操作
```typescript
import { useCacheOperations } from '@/hooks/use-cache-operations';

function CacheControls() {
  const { clearCache, loading, error } = useCacheOperations();
  
  const handleClearExpired = async () => {
    const result = await clearCache({ target: 'expired' });
    if (result.success) {
      console.log('清理完成:', result.result);
    }
  };
  
  return (
    <button onClick={handleClearExpired} disabled={loading}>
      清理过期缓存
    </button>
  );
}
```

### 实时监控
```typescript
import { useRealtimeMonitoring } from '@/hooks/use-cache-monitoring';

function RealtimeMonitor() {
  const { data, isConnected, startMonitoring, stopMonitoring } = useRealtimeMonitoring(5000);
  
  return (
    <div>
      <p>连接状态: {isConnected ? '已连接' : '已断开'}</p>
      {data && (
        <div>
          <p>命中率: {(data.metrics.hit_rate * 100).toFixed(1)}%</p>
          <p>操作/秒: {data.metrics.operations_per_second}</p>
        </div>
      )}
      <button onClick={startMonitoring}>开始监控</button>
      <button onClick={stopMonitoring}>停止监控</button>
    </div>
  );
}
```

## 🐛 故障排除

### 常见问题

1. **API连接失败**
   - 检查环境变量配置
   - 确认后端服务正在运行
   - 验证认证Token是否有效

2. **实时监控断开**
   - 检查网络连接
   - 确认WebSocket连接正常
   - 调整轮询间隔

3. **图表不显示**
   - 检查数据格式是否正确
   - 确认时间范围设置
   - 验证图表组件依赖

### 调试模式
```typescript
// 启用详细日志
localStorage.setItem('cache-debug', 'true');

// 模拟数据
localStorage.setItem('cache-mock', 'true');
```

## 🔄 更新日志

### v1.0.0 (2024-01-01)
- ✅ 初始版本发布
- ✅ 完整的15个API接口支持
- ✅ 4个主要功能模块
- ✅ 响应式设计
- ✅ TypeScript类型安全
- ✅ 完整的错误处理
- ✅ 实时数据更新
- ✅ 可视化图表
- ✅ 导出功能

## 📞 技术支持

如有问题或建议，请：
1. 查看本文档
2. 检查控制台错误信息
3. 联系开发团队

---

*本模块严格遵循项目架构规范，使用shadcn/ui组件库，支持深色模式，完全响应式设计。*