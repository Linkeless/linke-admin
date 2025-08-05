/**
 * 缓存指标相关Hooks
 * 提供缓存指标数据获取和状态管理
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { CacheMetricsService } from '@/lib/cache-service';
import type {
  CacheMetrics,
  MetricsHistory,
  CacheStats,
  CachePerformance,
  CacheHealth,
  TimeRange
} from '@/lib/cache-types';

// 缓存指标Hook
export function useCacheMetrics(autoRefresh = true, interval = 30000) {
  const [metrics, setMetrics] = useState<CacheMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    if (!loading) setLoading(true);
    setError(null);

    try {
      const data = await CacheMetricsService.getMetrics();
      setMetrics(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缓存指标失败');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  const startAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    if (autoRefresh && interval > 0) {
      intervalRef.current = setInterval(fetchMetrics, interval);
    }
  }, [autoRefresh, interval, fetchMetrics]);

  const stopAutoRefresh = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
    startAutoRefresh();

    return () => {
      stopAutoRefresh();
    };
  }, [fetchMetrics, startAutoRefresh, stopAutoRefresh]);

  const refresh = useCallback(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return {
    metrics,
    loading,
    error,
    lastUpdated,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
  };
}

// 历史指标Hook
export function useMetricsHistory(timeRange: TimeRange, dependencies: any[] = []) {
  const [history, setHistory] = useState<MetricsHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await CacheMetricsService.getMetricsHistory(timeRange);
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取历史指标失败');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory, ...dependencies]);

  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refresh,
  };
}

// 缓存统计Hook
export function useCacheStats(autoRefresh = true, interval = 60000) {
  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchStats = useCallback(async () => {
    if (!loading) setLoading(true);
    setError(null);

    try {
      const data = await CacheMetricsService.getStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缓存统计失败');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchStats();

    if (autoRefresh && interval > 0) {
      intervalRef.current = setInterval(fetchStats, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchStats, autoRefresh, interval]);

  const refresh = useCallback(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refresh,
  };
}

// 性能指标Hook
export function useCachePerformance(autoRefresh = true, interval = 15000) {
  const [performance, setPerformance] = useState<CachePerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchPerformance = useCallback(async () => {
    if (!loading) setLoading(true);
    setError(null);

    try {
      const data = await CacheMetricsService.getPerformance();
      setPerformance(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取性能指标失败');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchPerformance();

    if (autoRefresh && interval > 0) {
      intervalRef.current = setInterval(fetchPerformance, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchPerformance, autoRefresh, interval]);

  const refresh = useCallback(() => {
    fetchPerformance();
  }, [fetchPerformance]);

  return {
    performance,
    loading,
    error,
    refresh,
  };
}

// 健康状态Hook
export function useCacheHealth(autoRefresh = true, interval = 10000) {
  const [health, setHealth] = useState<CacheHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchHealth = useCallback(async () => {
    if (!loading) setLoading(true);
    setError(null);

    try {
      const data = await CacheMetricsService.getHealth();
      setHealth(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取健康状态失败');
    } finally {
      setLoading(false);
    }
  }, [loading]);

  useEffect(() => {
    fetchHealth();

    if (autoRefresh && interval > 0) {
      intervalRef.current = setInterval(fetchHealth, interval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchHealth, autoRefresh, interval]);

  const refresh = useCallback(() => {
    fetchHealth();
  }, [fetchHealth]);

  // 计算健康得分
  const healthScore = useCallback(() => {
    if (!health) return 0;
    
    let score = 100;
    
    // 状态扣分
    if (health.status === 'warning') score -= 20;
    if (health.status === 'critical') score -= 50;
    
    // 内存状态扣分
    if (health.memory_status === 'high') score -= 10;
    if (health.memory_status === 'critical') score -= 30;
    
    // CPU状态扣分
    if (health.cpu_status === 'high') score -= 10;
    if (health.cpu_status === 'critical') score -= 30;
    
    // 检查项扣分
    const failedChecks = Object.values(health.checks).filter(check => !check).length;
    score -= failedChecks * 10;
    
    // 错误扣分
    score -= health.errors.length * 5;
    
    return Math.max(0, score);
  }, [health]);

  return {
    health,
    loading,
    error,
    refresh,
    healthScore: healthScore(),
    isHealthy: health?.status === 'healthy',
    hasWarnings: health?.warnings.length > 0,
    hasErrors: health?.errors.length > 0,
  };
}

// 组合Hook：获取所有指标
export function useAllCacheMetrics(autoRefresh = true) {
  const metrics = useCacheMetrics(autoRefresh, 30000);
  const stats = useCacheStats(autoRefresh, 60000);
  const performance = useCachePerformance(autoRefresh, 15000);
  const health = useCacheHealth(autoRefresh, 10000);

  const loading = metrics.loading || stats.loading || performance.loading || health.loading;
  const error = metrics.error || stats.error || performance.error || health.error;

  const refreshAll = useCallback(() => {
    metrics.refresh();
    stats.refresh();
    performance.refresh();
    health.refresh();
  }, [metrics.refresh, stats.refresh, performance.refresh, health.refresh]);

  return {
    metrics: metrics.metrics,
    stats: stats.stats,
    performance: performance.performance,
    health: health.health,
    loading,
    error,
    lastUpdated: metrics.lastUpdated,
    healthScore: health.healthScore,
    isHealthy: health.isHealthy,
    refreshAll,
  };
}