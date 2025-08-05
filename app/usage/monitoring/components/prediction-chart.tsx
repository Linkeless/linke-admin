/**
 * 使用量预测图表组件
 */

'use client'

import React, { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  ComposedChart
} from 'recharts'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  RefreshCw,
  Calendar,
  Target,
  Zap
} from 'lucide-react'

interface PredictionDataPoint {
  timestamp: string
  actual?: number
  predicted: number
  upperBound: number
  lowerBound: number
  confidence: number
}

interface PredictionChartProps {
  data: PredictionDataPoint[]
  loading?: boolean
  timeRange?: string
  onTimeRangeChange?: (range: string) => void
  onRefresh?: () => void
}

const PredictionChart: React.FC<PredictionChartProps> = ({
  data = [],
  loading = false,
  timeRange = '7d',
  onTimeRangeChange,
  onRefresh
}) => {
  const chartData = useMemo(() => {
    return data.map(point => ({
      ...point,
      date: new Date(point.timestamp).toLocaleDateString(),
      time: new Date(point.timestamp).toLocaleTimeString(),
    }))
  }, [data])

  const trend = useMemo(() => {
    if (chartData.length < 2) return { direction: 'stable', percentage: 0 }
    
    const recent = chartData.slice(-7).map(d => d.predicted)
    const earlier = chartData.slice(-14, -7).map(d => d.predicted)
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const earlierAvg = earlier.reduce((a, b) => a + b, 0) / earlier.length
    
    const change = ((recentAvg - earlierAvg) / earlierAvg) * 100
    
    return {
      direction: change > 5 ? 'up' : change < -5 ? 'down' : 'stable',
      percentage: Math.abs(change)
    }
  }, [chartData])

  const averageConfidence = useMemo(() => {
    if (chartData.length === 0) return 0
    return chartData.reduce((sum, point) => sum + point.confidence, 0) / chartData.length
  }, [chartData])

  const getPredictionAccuracy = useMemo(() => {
    const actualData = chartData.filter(point => point.actual !== undefined)
    if (actualData.length === 0) return 0
    
    const accuracy = actualData.reduce((sum, point) => {
      const error = Math.abs((point.actual! - point.predicted) / point.actual!)
      return sum + (1 - error)
    }, 0) / actualData.length
    
    return Math.max(0, Math.min(1, accuracy)) * 100
  }, [chartData])

  const timeRangeOptions = [
    { value: '24h', label: '24小时' },
    { value: '7d', label: '7天' },
    { value: '30d', label: '30天' },
    { value: '90d', label: '90天' }
  ]

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-gray-200 rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              使用量预测分析
            </CardTitle>
            <CardDescription>
              基于历史数据的使用量趋势预测和容量规划
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Select value={timeRange} onValueChange={onTimeRangeChange}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timeRangeOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* 预测概览 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-1">
              {trend.direction === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : trend.direction === 'down' ? (
                <TrendingDown className="h-4 w-4 text-red-600" />
              ) : (
                <Target className="h-4 w-4 text-gray-600" />
              )}
              <span className="text-2xl font-bold">{trend.percentage.toFixed(1)}%</span>
            </div>
            <p className="text-sm text-muted-foreground">趋势变化</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {averageConfidence.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">预测置信度</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {getPredictionAccuracy.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">历史准确率</p>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {chartData.length}
            </div>
            <p className="text-sm text-muted-foreground">预测天数</p>
          </div>
        </div>

        {/* 预测状态提醒 */}
        {averageConfidence < 70 && (
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              当前预测置信度较低({averageConfidence.toFixed(1)}%)，建议增加历史数据样本或调整预测模型参数。
            </AlertDescription>
          </Alert>
        )}

        {/* 预测图表 */}
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-white p-3 border rounded-lg shadow-lg">
                        <p className="font-medium mb-2">{label}</p>
                        {payload.map((entry, index) => (
                          <div key={index} className="flex items-center space-x-2 text-sm">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: entry.color }}
                            />
                            <span>{entry.name}: {entry.value?.toLocaleString()}</span>
                            {entry.dataKey === 'predicted' && entry.payload?.confidence && (
                              <Badge variant="outline" className="ml-2">
                                {entry.payload.confidence.toFixed(1)}% 置信度
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )
                  }
                  return null
                }}
              />
              <Legend />
              
              {/* 置信区间 */}
              <Area
                type="monotone"
                dataKey="upperBound"
                stackId="confidence"
                stroke="none"
                fill="#3B82F6"
                fillOpacity={0.1}
                name="置信上界"
              />
              <Area
                type="monotone"
                dataKey="lowerBound"
                stackId="confidence"
                stroke="none"
                fill="#ffffff"
                fillOpacity={1}
                name="置信下界"
              />
              
              {/* 实际使用量 */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ r: 3 }}
                name="实际使用量"
                connectNulls={false}
              />
              
              {/* 预测使用量 */}
              <Line
                type="monotone"
                dataKey="predicted"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeDasharray="5,5"
                dot={{ r: 3 }}
                name="预测使用量"
              />
              
              {/* 当前时间线 */}
              <ReferenceLine 
                x={new Date().toLocaleDateString()} 
                stroke="#EF4444" 
                strokeDasharray="2,2"
                label={{ value: "当前", position: "top" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* 预测说明 */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <h4 className="font-medium flex items-center">
              <Calendar className="mr-2 h-4 w-4" />
              预测方法说明
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 基于历史使用模式的时间序列分析</li>
              <li>• 考虑季节性和周期性变化</li>
              <li>• 使用机器学习算法优化预测精度</li>
              <li>• 实时调整预测模型参数</li>
            </ul>
          </div>
          <div className="space-y-2">
            <h4 className="font-medium flex items-center">
              <Zap className="mr-2 h-4 w-4" />
              应用建议
            </h4>
            <ul className="space-y-1 text-muted-foreground">
              <li>• 根据预测趋势调整资源配置</li>
              <li>• 提前规划容量升级计划</li>
              <li>• 设置基于预测的自动告警</li>
              <li>• 定期验证和调整预测模型</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default PredictionChart