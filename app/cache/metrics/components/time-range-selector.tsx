/**
 * 时间范围选择器组件
 * 用于选择历史指标的时间范围
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import type { TimeRange } from '@/lib/cache-types';

interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (timeRange: TimeRange) => void;
  className?: string;
}

const presetRanges = [
  {
    label: '最近1小时',
    value: '1h',
    getRange: () => ({
      start: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      interval: '1m' as const,
    }),
  },
  {
    label: '最近6小时',
    value: '6h',
    getRange: () => ({
      start: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      interval: '5m' as const,
    }),
  },
  {
    label: '最近24小时',
    value: '24h',
    getRange: () => ({
      start: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      interval: '15m' as const,
    }),
  },
  {
    label: '最近3天',
    value: '3d',
    getRange: () => ({
      start: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      interval: '1h' as const,
    }),
  },
  {
    label: '最近7天',
    value: '7d',
    getRange: () => ({
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      interval: '6h' as const,
    }),
  },
  {
    label: '最近30天',
    value: '30d',
    getRange: () => ({
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      end: new Date().toISOString(),
      interval: '24h' as const,
    }),
  },
];

const intervals = [
  { label: '1分钟', value: '1m' },
  { label: '5分钟', value: '5m' },
  { label: '15分钟', value: '15m' },
  { label: '1小时', value: '1h' },
  { label: '6小时', value: '6h' },
  { label: '24小时', value: '24h' },
];

export function TimeRangeSelector({ value, onChange, className }: TimeRangeSelectorProps) {
  const [startDate, setStartDate] = useState<Date | undefined>(
    value.start ? new Date(value.start) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    value.end ? new Date(value.end) : undefined
  );
  const [showCustomRange, setShowCustomRange] = useState(false);

  const handlePresetSelect = (preset: typeof presetRanges[0]) => {
    const range = preset.getRange();
    onChange(range);
    setStartDate(new Date(range.start));
    setEndDate(new Date(range.end));
    setShowCustomRange(false);
  };

  const handleCustomRangeApply = () => {
    if (startDate && endDate) {
      const range: TimeRange = {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        interval: value.interval || '1h',
      };
      onChange(range);
      setShowCustomRange(false);
    }
  };

  const handleIntervalChange = (interval: TimeRange['interval']) => {
    onChange({
      ...value,
      interval,
    });
  };

  const getCurrentPreset = () => {
    const currentTime = new Date().getTime();
    const startTime = new Date(value.start).getTime();
    const duration = currentTime - startTime;
    
    return presetRanges.find(preset => {
      const presetRange = preset.getRange();
      const presetDuration = new Date(presetRange.end).getTime() - new Date(presetRange.start).getTime();
      return Math.abs(duration - presetDuration) < 60000; // 1分钟误差范围
    });
  };

  const currentPreset = getCurrentPreset();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          时间范围
        </CardTitle>
        <CardDescription>选择要查看的时间范围和数据间隔</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 预设范围 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">快速选择</label>
          <div className="flex flex-wrap gap-2">
            {presetRanges.map((preset) => (
              <Button
                key={preset.value}
                variant={currentPreset?.value === preset.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {/* 自定义范围 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">自定义范围</label>
          <div className="flex gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, 'PPP', { locale: zhCN }) : '开始日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate}
                  onSelect={setStartDate}
                  disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="justify-start text-left font-normal">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? format(endDate, 'PPP', { locale: zhCN }) : '结束日期'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate}
                  onSelect={setEndDate}
                  disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              onClick={handleCustomRangeApply}
              disabled={!startDate || !endDate}
              size="sm"
            >
              应用
            </Button>
          </div>
        </div>

        {/* 数据间隔 */}
        <div className="space-y-2">
          <label className="text-sm font-medium">数据间隔</label>
          <Select
            value={value.interval}
            onValueChange={handleIntervalChange}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {intervals.map((interval) => (
                <SelectItem key={interval.value} value={interval.value}>
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 当前选择信息 */}
        <div className="pt-2 border-t">
          <div className="flex flex-wrap gap-2 text-sm">
            <Badge variant="secondary">
              {format(new Date(value.start), 'MM/dd HH:mm', { locale: zhCN })}
              {' - '}
              {format(new Date(value.end), 'MM/dd HH:mm', { locale: zhCN })}
            </Badge>
            <Badge variant="outline">
              间隔: {intervals.find(i => i.value === value.interval)?.label}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}