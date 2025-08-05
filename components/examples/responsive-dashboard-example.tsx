'use client'

/**
 * 响应式仪表板示例组件
 * 展示如何使用所有新的响应式和无障碍功能
 */

import * as React from "react"
import { DashboardLayout, createDashboardWidget } from "../dashboard/dashboard-layout"
import { ResponsiveAreaChart, ResponsiveBarChart, ResponsivePieChart } from "../dashboard/responsive-chart"
import { MobileDataTable } from "../ui/mobile-data-table"
import { EmptyState, EmptyChart, ErrorState } from "../ui/empty-state"
import { Loading, LoadingSkeleton, ProgressiveLoading } from "../ui/loading"
import { VirtualList, InfiniteScroll, LazyLoad } from "../ui/virtual-list"
import { AccessibilityProvider, KeyboardShortcuts } from "../ui/accessibility"
import { useResponsiveBreakpoints, useResponsiveValue } from "../../hooks/use-responsive-breakpoints"
import { useDashboardPreferences } from "../../hooks/use-dashboard-preferences"
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card"
import { Button } from "../ui/button"
import { Badge } from "../ui/badge"

// 示例数据
const sampleChartData = [
  { name: "1月", value: 400, growth: 240 },
  { name: "2月", value: 300, growth: 139 },
  { name: "3月", value: 200, growth: 980 },
  { name: "4月", value: 278, growth: 390 },
  { name: "5月", value: 189, growth: 480 },
  { name: "6月", value: 239, growth: 380 },
]

const sampleTableData = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `用户 ${i + 1}`,
  email: `user${i + 1}@example.com`,
  status: i % 3 === 0 ? "active" : i % 3 === 1 ? "inactive" : "pending",
  lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
  orders: Math.floor(Math.random() * 50)
}))

const chartConfig = {
  value: {
    label: "销售额",
    color: "hsl(var(--primary))"
  },
  growth: {
    label: "增长",
    color: "hsl(var(--chart-2))"
  }
}

// 响应式图表组件示例
function ResponsiveChartExample() {
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [timeRange, setTimeRange] = React.useState("6m")

  const timeRangeOptions = [
    { value: "1m", label: "1个月" },
    { value: "3m", label: "3个月" },
    { value: "6m", label: "6个月" },
    { value: "1y", label: "1年" }
  ]

  const trend = {
    value: 12.5,
    isPositive: true,
    period: "上月"
  }

  return (
    <div className="space-y-6">
      <ResponsiveAreaChart
        title="销售趋势"
        description="过去6个月的销售数据分析"
        data={sampleChartData}
        config={chartConfig}
        dataKey="value"
        loading={loading}
        error={error}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        timeRangeOptions={timeRangeOptions}
        trend={trend}
        onRefresh={() => {
          setLoading(true)
          setTimeout(() => setLoading(false), 2000)
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ResponsiveBarChart
          title="月度对比"
          data={sampleChartData}
          config={chartConfig}
          dataKey={["value", "growth"]}
          showLegend
        />

        <ResponsivePieChart
          title="分类占比"
          data={[
            { name: "桌面端", value: 60 },
            { name: "移动端", value: 30 },
            { name: "平板", value: 10 }
          ]}
          config={{
            value: { label: "访问量", color: "hsl(var(--primary))" }
          }}
          dataKey="value"
          innerRadius={50}
        />
      </div>
    </div>
  )
}

// 移动端数据表格示例
function MobileTableExample() {
  const [data, setData] = React.useState(sampleTableData)
  const [loading, setLoading] = React.useState(false)

  const columns = [
    {
      id: "name",
      label: "用户名",
      accessorKey: "name" as keyof typeof sampleTableData[0],
      priority: "high" as const,
      sortable: true
    },
    {
      id: "email", 
      label: "邮箱",
      accessorKey: "email" as keyof typeof sampleTableData[0],
      priority: "medium" as const
    },
    {
      id: "status",
      label: "状态",
      priority: "high" as const,
      accessor: (item: typeof sampleTableData[0]) => (
        <Badge 
          variant={
            item.status === "active" ? "default" : 
            item.status === "inactive" ? "secondary" : 
            "outline"
          }
        >
          {item.status === "active" ? "活跃" : 
           item.status === "inactive" ? "非活跃" : 
           "待审核"}
        </Badge>
      )
    },
    {
      id: "lastLogin",
      label: "最后登录",
      accessorKey: "lastLogin" as keyof typeof sampleTableData[0],
      priority: "low" as const
    },
    {
      id: "orders",
      label: "订单数",
      accessorKey: "orders" as keyof typeof sampleTableData[0],
      priority: "medium" as const
    }
  ]

  const itemActions = (item: typeof sampleTableData[0]) => [
    {
      label: "编辑",
      onClick: () => console.log("编辑", item.id)
    },
    {
      label: "删除",
      onClick: () => console.log("删除", item.id),
      variant: "destructive" as const
    }
  ]

  return (
    <MobileDataTable
      data={data}
      columns={columns}
      loading={loading}
      searchable
      filterable
      selectable
      itemActions={itemActions}
      onRefresh={() => {
        setLoading(true)
        setTimeout(() => setLoading(false), 1000)
      }}
      expandableContent={(item) => (
        <div className="space-y-2 text-sm">
          <p><strong>用户ID:</strong> {item.id}</p>
          <p><strong>注册时间:</strong> {new Date().toLocaleDateString()}</p>
          <p><strong>总消费:</strong> ¥{(item.orders * 99).toLocaleString()}</p>
        </div>
      )}
    />
  )
}

// 虚拟滚动示例
function VirtualScrollExample() {
  const largeDataset = React.useMemo(() => 
    Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      title: `项目 ${i + 1}`,
      description: `这是第 ${i + 1} 个项目的描述信息`
    })), []
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>虚拟滚动示例 (10,000 项)</CardTitle>
      </CardHeader>
      <CardContent>
        <VirtualList
          items={largeDataset}
          itemHeight={60}
          containerHeight={400}
          renderItem={(item, index) => (
            <div className="flex items-center p-4 border-b hover:bg-muted/50">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                {index + 1}
              </div>
              <div>
                <h4 className="font-medium">{item.title}</h4>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            </div>
          )}
          getItemKey={(item) => item.id}
        />
      </CardContent>
    </Card>
  )
}

// 无限滚动示例
function InfiniteScrollExample() {
  const [items, setItems] = React.useState(Array.from({ length: 20 }, (_, i) => ({
    id: i,
    content: `内容项 ${i + 1}`
  })))
  const [hasMore, setHasMore] = React.useState(true)

  const loadMore = async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    const newItems = Array.from({ length: 20 }, (_, i) => ({
      id: items.length + i,
      content: `内容项 ${items.length + i + 1}`
    }))
    
    setItems(prev => [...prev, ...newItems])
    
    if (items.length + newItems.length >= 100) {
      setHasMore(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>无限滚动示例</CardTitle>
      </CardHeader>
      <CardContent>
        <InfiniteScroll
          items={items}
          renderItem={(item) => (
            <div className="p-4 border-b hover:bg-muted/50">
              <p>{item.content}</p>
            </div>
          )}
          loadMore={loadMore}
          hasMore={hasMore}
          className="h-96"
          getItemKey={(item) => item.id}
        />
      </CardContent>
    </Card>
  )
}

// 响应式布局示例
function ResponsiveDashboardExample() {
  const { preferences } = useDashboardPreferences()
  const { isMobile, isTablet, isDesktop } = useResponsiveBreakpoints()

  // 响应式值示例
  const columns = useResponsiveValue({
    xs: 1,
    sm: 2,
    md: 2, 
    lg: 3,
    xl: 4
  })

  const widgets = [
    createDashboardWidget(
      "chart-example",
      "响应式图表",
      ResponsiveChartExample,
      {
        span: { mobile: 2, tablet: 4, desktop: 6 },
        height: { mobile: 3, tablet: 2, desktop: 2 },
        category: "charts"
      }
    ),
    createDashboardWidget(
      "table-example", 
      "移动端表格",
      MobileTableExample,
      {
        span: { mobile: 2, tablet: 4, desktop: 6 },
        height: { mobile: 4, tablet: 3, desktop: 2 },
        category: "tables"
      }
    ),
    createDashboardWidget(
      "virtual-scroll",
      "虚拟滚动",
      VirtualScrollExample,
      {
        span: { mobile: 2, tablet: 2, desktop: 3 },
        height: { mobile: 3, tablet: 2, desktop: 2 },
        category: "system"
      }
    ),
    createDashboardWidget(
      "infinite-scroll",
      "无限滚动", 
      InfiniteScrollExample,
      {
        span: { mobile: 2, tablet: 2, desktop: 3 },
        height: { mobile: 3, tablet: 2, desktop: 2 },
        category: "system"
      }
    )
  ]

  return (
    <AccessibilityProvider>
      <div className="p-6 space-y-6">
        {/* 设备信息显示 */}
        <Card>
          <CardHeader>
            <CardTitle>当前设备信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="font-medium">设备类型</p>
                <Badge variant={isMobile ? "default" : "outline"}>
                  {isMobile ? "移动端" : isTablet ? "平板" : "桌面"}
                </Badge>
              </div>
              <div>
                <p className="font-medium">网格列数</p>
                <Badge variant="secondary">{columns}</Badge>
              </div>
              <div>
                <p className="font-medium">布局预设</p>
                <Badge variant="outline">{preferences.layout.preset}</Badge>
              </div>
              <div>
                <p className="font-medium">密度</p>
                <Badge variant="outline">{preferences.appearance.density}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 键盘快捷键 */}
        <Card>
          <CardContent className="pt-6">
            <KeyboardShortcuts
              shortcuts={[
                { key: "Ctrl+R", description: "刷新数据" },
                { key: "Ctrl+S", description: "保存设置" },
                { key: "Escape", description: "关闭对话框" },
                { key: "Tab", description: "下一个元素" },
                { key: "Shift+Tab", description: "上一个元素" }
              ]}
            />
          </CardContent>
        </Card>

        {/* 响应式仪表板布局 */}
        <DashboardLayout
          widgets={widgets}
          enableCustomization
          className="min-h-screen"
        />

        {/* 懒加载示例 */}
        <LazyLoad
          threshold={0.3}
          fallback={<LoadingSkeleton variant="card" lines={5} />}
        >
          <Card>
            <CardHeader>
              <CardTitle>懒加载内容</CardTitle>
            </CardHeader>
            <CardContent>
              <p>这个内容只有在滚动到视窗内时才会加载。</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-20 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            </CardContent>
          </Card>
        </LazyLoad>

        {/* 各种状态示例 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <EmptyState
            variant="no-data"
            title="空状态示例"
            action={{
              label: "添加数据",
              onClick: () => console.log("添加数据")
            }}
            asCard
          />

          <ErrorState
            title="错误状态示例"
            onRetry={() => console.log("重试")}
            asCard
          />

          <Card>
            <CardContent className="pt-6">
              <Loading variant="bars" size="lg" text="加载中..." />
            </CardContent>
          </Card>
        </div>

        {/* 渐进式加载示例 */}
        <Card>
          <CardHeader>
            <CardTitle>渐进式加载示例</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressiveLoading
              steps={[
                "初始化系统",
                "加载用户数据", 
                "获取权限信息",
                "准备界面",
                "完成"
              ]}
              currentStep={2}
            />
          </CardContent>
        </Card>
      </div>
    </AccessibilityProvider>
  )
}

export default ResponsiveDashboardExample