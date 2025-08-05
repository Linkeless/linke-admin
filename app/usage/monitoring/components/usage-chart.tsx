'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar, BarChart3, Maximize2 } from 'lucide-react';
import { UsageChartData, TimePeriod, UsageType } from '@/lib/usage-types';
import { UsageService } from '@/lib/usage-service';
import { cn } from '@/lib/utils';

interface UsageChartProps {
  data: UsageChartData[];
  loading?: boolean;
  className?: string;
  showControls?: boolean;
  onPeriodChange?: (period: TimePeriod) => void;
  onTypeChange?: (type: UsageType) => void;
}

// 模拟图表数据
const generateMockData = (type: UsageType, period: TimePeriod) => {
  const now = new Date();
  const data = [];
  
  let intervalCount = 24; // 默认24小时
  let intervalMs = 60 * 60 * 1000; // 1小时
  
  switch (period) {
    case TimePeriod.HOUR:
      intervalCount = 60;
      intervalMs = 60 * 1000; // 1分钟
      break;
    case TimePeriod.DAY:
      intervalCount = 24;
      intervalMs = 60 * 60 * 1000; // 1小时
      break;
    case TimePeriod.WEEK:
      intervalCount = 7;
      intervalMs = 24 * 60 * 60 * 1000; // 1天
      break;
    case TimePeriod.MONTH:
      intervalCount = 30;
      intervalMs = 24 * 60 * 60 * 1000; // 1天
      break;
  }

  for (let i = intervalCount - 1; i >= 0; i--) {
    const date = new Date(now.getTime() - i * intervalMs);
    const baseValue = Math.random() * 80 + 10; // 10-90之间
    const trend = Math.sin((i / intervalCount) * Math.PI * 2) * 10;
    
    data.push({
      date: date.toISOString(),
      value: Math.max(0, Math.min(100, baseValue + trend)),
      label: period === TimePeriod.HOUR ? 
        date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) :
        period === TimePeriod.DAY ?
        date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) :
        date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
    });
  }
  
  return data;
};

const periodOptions = [
  { value: TimePeriod.HOUR, label: '1小时' },
  { value: TimePeriod.DAY, label: '24小时' },
  { value: TimePeriod.WEEK, label: '7天' },
  { value: TimePeriod.MONTH, label: '30天' },
];

const usageTypeOptions = [
  { value: UsageType.BANDWIDTH, label: '带宽', color: '#3b82f6' },
  { value: UsageType.STORAGE, label: '存储', color: '#10b981' },
  { value: UsageType.REQUESTS, label: '请求数', color: '#f59e0b' },
  { value: UsageType.CPU_TIME, label: 'CPU时间', color: '#ef4444' },
  { value: UsageType.MEMORY, label: '内存', color: '#8b5cf6' },
  { value: UsageType.CONNECTIONS, label: '连接数', color: '#06b6d4' },
  { value: UsageType.TRANSFER, label: '传输量', color: '#84cc16' },
];

export default function UsageChart({
  data,
  loading = false,
  className,
  showControls = true,
  onPeriodChange,
  onTypeChange
}: UsageChartProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>(TimePeriod.DAY);
  const [selectedType, setSelectedType] = useState<UsageType>(UsageType.BANDWIDTH);
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 使用模拟数据或传入的数据
  const chartData = data?.find(d => d.usage_type === selectedType)?.data_points || 
    generateMockData(selectedType, selectedPeriod);

  const handlePeriodChange = (period: TimePeriod) => {
    setSelectedPeriod(period);
    onPeriodChange?.(period);
  };

  const handleTypeChange = (type: UsageType) => {
    setSelectedType(type);
    onTypeChange?.(type);
  };

  // 计算统计信息
  const currentValue = chartData[chartData.length - 1]?.value || 0;
  const previousValue = chartData[chartData.length - 2]?.value || 0;
  const trend = currentValue - previousValue;
  const avgValue = chartData.reduce((sum, item) => sum + item.value, 0) / chartData.length;
  const maxValue = Math.max(...chartData.map(item => item.value));
  const minValue = Math.min(...chartData.map(item => item.value));

  const selectedTypeOption = usageTypeOptions.find(opt => opt.value === selectedType);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-medium">{label}</p>
          <div className="flex items-center gap-2 mt-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: selectedTypeOption?.color }}
            />
            <span className="text-sm">
              {UsageService.getUsageTypeDisplayName(selectedType)}: {payload[0].value.toFixed(1)}%
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const renderChart = () => {
    const commonProps = {
      data: chartData,
      margin: { top: 10, right: 30, left: 0, bottom: 0 }
    };

    if (chartType === 'area') {
      return (
        <AreaChart {...commonProps}>
          <defs>
            <linearGradient id={`gradient-${selectedType}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={selectedTypeOption?.color} stopOpacity={0.3}/>
              <stop offset="95%" stopColor={selectedTypeOption?.color} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="label" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={selectedTypeOption?.color}
            fillOpacity={1}
            fill={`url(#gradient-${selectedType})`}
            strokeWidth={2}
          />
        </AreaChart>
      );
    } else {
      return (
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="label" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
          />
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="value"
            stroke={selectedTypeOption?.color}
            strokeWidth={2}
            dot={{ fill: selectedTypeOption?.color, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: selectedTypeOption?.color, strokeWidth: 2 }}
          />
        </LineChart>
      );
    }
  };

  return (
    <Card className={cn(className, isFullscreen && "fixed inset-4 z-50")}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              使用量趋势图
            </CardTitle>
            <CardDescription>
              {UsageService.getUsageTypeDisplayName(selectedType)} · {periodOptions.find(p => p.value === selectedPeriod)?.label}
            </CardDescription>
          </div>
          
          {showControls && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChartType(chartType === 'area' ? 'line' : 'area')}
              >
                {chartType === 'area' ? '线图' : '面积图'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFullscreen(!isFullscreen)}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {showControls && (
          <div className="flex items-center gap-4 pt-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Select value={selectedType} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {usageTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: option.color }}
                      />
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="h-80 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* 统计信息 */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold" style={{ color: selectedTypeOption?.color }}>
                  {currentValue.toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">当前值</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold flex items-center justify-center gap-1">
                  {trend >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-red-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-green-500" />
                  )}
                  {Math.abs(trend).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">变化</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{avgValue.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">平均值</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{maxValue.toFixed(1)}%</div>
                <div className="text-xs text-muted-foreground">峰值</div>
              </div>
            </div>

            {/* 图表 */}
            <div className={cn("h-80", isFullscreen && "h-96")}>
              <ResponsiveContainer width="100%" height="100%">
                {renderChart()}
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}