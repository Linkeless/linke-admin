/**
 * 缓存监控相关Hooks
 * 提供实时监控数据和告警管理功能
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CacheMonitoringService } from '@/lib/cache-service';
import type {
  RealtimeMonitorData,
  CacheAlert,
  CreateAlertRequest,
  QueryParams
} from '@/lib/cache-types';

// 实时监控Hook
export function useRealtimeMonitoring(interval = 5000) {
  const [data, setData] = useState<RealtimeMonitorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [history, setHistory] = useState<RealtimeMonitorData[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const maxHistorySize = 100; // 保持最近100个数据点

  const fetchRealtimeData = useCallback(async () => {
    try {
      const newData = await CacheMonitoringService.getRealtimeData();
      setData(newData);
      setError(null);
      setIsConnected(true);
      
      // 更新历史数据
      setHistory(prev => {
        const updated = [...prev, newData];
        return updated.slice(-maxHistorySize);
      });
      
      if (loading) setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取实时监控数据失败');
      setIsConnected(false);
      if (loading) setLoading(false);
    }
  }, [loading]);

  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    intervalRef.current = setInterval(fetchRealtimeData, interval);
    fetchRealtimeData(); // 立即获取一次数据
  }, [interval, fetchRealtimeData]);

  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsConnected(false);
  }, []);

  useEffect(() => {
    startMonitoring();
    
    return () => {
      stopMonitoring();
    };
  }, [startMonitoring, stopMonitoring]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  // 获取最新的性能趋势
  const getPerformanceTrend = useCallback(() => {
    if (history.length < 2) return null;
    
    const recent = history.slice(-10); // 最近10个数据点
    const first = recent[0];
    const last = recent[recent.length - 1];
    
    return {
      hit_rate: {
        current: last.metrics.hit_rate,
        previous: first.metrics.hit_rate,
        trend: last.metrics.hit_rate > first.metrics.hit_rate ? 'up' : 'down'
      },
      memory_usage: {
        current: last.metrics.memory_usage,
        previous: first.metrics.memory_usage,
        trend: last.metrics.memory_usage > first.metrics.memory_usage ? 'up' : 'down'
      },
      operations_per_second: {
        current: last.metrics.operations_per_second,
        previous: first.metrics.operations_per_second,
        trend: last.metrics.operations_per_second > first.metrics.operations_per_second ? 'up' : 'down'
      },
      response_time: {
        current: last.metrics.response_time,
        previous: first.metrics.response_time,
        trend: last.metrics.response_time < first.metrics.response_time ? 'up' : 'down' // 响应时间越低越好
      }
    };
  }, [history]);

  return {
    data,
    loading,
    error,
    isConnected,
    history,
    startMonitoring,
    stopMonitoring,
    clearHistory,
    performanceTrend: getPerformanceTrend(),
  };
}

// 告警管理Hook
export function useCacheAlerts() {
  const [alerts, setAlerts] = useState<CacheAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchAlerts = useCallback(async (params?: QueryParams) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = {
        page,
        page_size: pageSize,
        ...params,
      };
      
      const response = await CacheMonitoringService.getAlerts(queryParams);
      setAlerts(response.alerts);
      setTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取告警列表失败');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const createAlert = useCallback(async (alertData: CreateAlertRequest) => {
    try {
      const newAlert = await CacheMonitoringService.createAlert(alertData);
      setAlerts(prev => [newAlert, ...prev]);
      setTotal(prev => prev + 1);
      return { success: true, alert: newAlert };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '创建告警失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const deleteAlert = useCallback(async (id: string) => {
    try {
      await CacheMonitoringService.deleteAlert(id);
      setAlerts(prev => prev.filter(alert => alert.id !== id));
      setTotal(prev => prev - 1);
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除告警失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const toggleAlert = useCallback(async (id: string, enabled: boolean) => {
    // 这里需要后端支持更新告警状态的API
    // 目前先在前端模拟
    setAlerts(prev => 
      prev.map(alert => 
        alert.id === id ? { ...alert, enabled } : alert
      )
    );
  }, []);

  const refreshAlerts = useCallback(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  const changePage = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const changePageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1); // 重置到第一页
  }, []);

  // 获取活跃告警
  const activeAlerts = alerts.filter(alert => alert.enabled);
  
  // 获取最近触发的告警
  const recentTriggeredAlerts = alerts
    .filter(alert => alert.last_triggered)
    .sort((a, b) => new Date(b.last_triggered!).getTime() - new Date(a.last_triggered!).getTime())
    .slice(0, 5);

  return {
    alerts,
    loading,
    error,
    total,
    page,
    pageSize,
    activeAlerts,
    recentTriggeredAlerts,
    createAlert,
    deleteAlert,
    toggleAlert,
    refreshAlerts,
    changePage,
    changePageSize,
  };
}

// 告警统计Hook
export function useAlertStats() {
  const { alerts } = useCacheAlerts();

  const stats = {
    total: alerts.length,
    enabled: alerts.filter(alert => alert.enabled).length,
    disabled: alerts.filter(alert => !alert.enabled).length,
    triggered: alerts.filter(alert => alert.last_triggered).length,
    byType: alerts.reduce((acc, alert) => {
      acc[alert.type] = (acc[alert.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    recentTriggerCount: alerts.filter(alert => {
      if (!alert.last_triggered) return false;
      const triggerTime = new Date(alert.last_triggered);
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return triggerTime > oneDayAgo;
    }).length,
  };

  return stats;
}

// 监控面板Hook - 组合实时监控和告警
export function useMonitoringDashboard() {
  const monitoring = useRealtimeMonitoring();
  const alerts = useCacheAlerts();
  const alertStats = useAlertStats();

  const loading = monitoring.loading || alerts.loading;
  const error = monitoring.error || alerts.error;

  // 检查是否有告警被触发
  const checkAlertTriggers = useCallback(() => {
    if (!monitoring.data || !alerts.activeAlerts.length) return [];

    const triggeredAlerts: CacheAlert[] = [];
    const currentMetrics = monitoring.data.metrics;

    alerts.activeAlerts.forEach(alert => {
      let shouldTrigger = false;
      let currentValue = 0;

      // 根据告警类型获取当前值
      switch (alert.type) {
        case 'memory':
          currentValue = currentMetrics.memory_usage;
          break;
        case 'performance':
          currentValue = currentMetrics.response_time;
          break;
        case 'connections':
          currentValue = currentMetrics.connections;
          break;
        case 'latency':
          currentValue = currentMetrics.response_time;
          break;
        default:
          return;
      }

      // 检查是否满足触发条件
      switch (alert.comparison) {
        case 'gt':
          shouldTrigger = currentValue > alert.threshold;
          break;
        case 'gte':
          shouldTrigger = currentValue >= alert.threshold;
          break;
        case 'lt':
          shouldTrigger = currentValue < alert.threshold;
          break;
        case 'lte':
          shouldTrigger = currentValue <= alert.threshold;
          break;
        case 'eq':
          shouldTrigger = currentValue === alert.threshold;
          break;
      }

      if (shouldTrigger) {
        triggeredAlerts.push(alert);
      }
    });

    return triggeredAlerts;
  }, [monitoring.data, alerts.activeAlerts]);

  const refreshAll = useCallback(() => {
    alerts.refreshAlerts();
    // 实时监控会自动刷新
  }, [alerts.refreshAlerts]);

  return {
    monitoring,
    alerts,
    alertStats,
    loading,
    error,
    triggeredAlerts: checkAlertTriggers(),
    refreshAll,
  };
}