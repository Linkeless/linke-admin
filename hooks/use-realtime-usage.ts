import { useState, useEffect, useRef, useCallback } from 'react';
import { UsageService } from '@/lib/usage-service';
import { RealtimeUsage, UsageData, UsageType } from '@/lib/usage-types';

interface UseRealtimeUsageOptions {
  subscriptionId: string;
  pollingInterval?: number; // 轮询间隔（毫秒），默认30秒
  enabled?: boolean; // 是否启用轮询
  onError?: (error: Error) => void;
  onDataUpdate?: (data: RealtimeUsage[]) => void;
}

interface UseRealtimeUsageReturn {
  data: RealtimeUsage[] | null;
  currentUsage: UsageData[] | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isPolling: boolean;
  startPolling: () => void;
  stopPolling: () => void;
  refreshData: () => Promise<void>;
  getUsageByType: (type: UsageType) => RealtimeUsage | null;
}

export function useRealtimeUsage({
  subscriptionId,
  pollingInterval = 30000, // 30秒
  enabled = true,
  onError,
  onDataUpdate
}: UseRealtimeUsageOptions): UseRealtimeUsageReturn {
  const [data, setData] = useState<RealtimeUsage[] | null>(null);
  const [currentUsage, setCurrentUsage] = useState<UsageData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // 获取实时使用量数据
  const fetchRealtimeData = useCallback(async () => {
    if (!subscriptionId || !mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      // 并行获取实时数据和当前使用量
      const [realtimeResponse, currentResponse] = await Promise.all([
        UsageService.getRealtimeUsage(subscriptionId),
        UsageService.getCurrentUsage(subscriptionId)
      ]);

      if (!mountedRef.current) return;

      if (realtimeResponse.success) {
        setData(realtimeResponse.data);
        setLastUpdated(new Date());
        
        // 触发数据更新回调
        if (onDataUpdate) {
          onDataUpdate(realtimeResponse.data);
        }
      } else {
        throw new Error(realtimeResponse.message || '获取实时使用量失败');
      }

      if (currentResponse.success) {
        setCurrentUsage(currentResponse.data);
      }

    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : '获取使用量数据失败';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [subscriptionId, onError, onDataUpdate]);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (intervalRef.current || !enabled) return;

    setIsPolling(true);
    
    // 立即获取一次数据
    fetchRealtimeData();
    
    // 设置定时轮询
    intervalRef.current = setInterval(fetchRealtimeData, pollingInterval);
  }, [fetchRealtimeData, pollingInterval, enabled]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 手动刷新数据
  const refreshData = useCallback(async () => {
    await fetchRealtimeData();
  }, [fetchRealtimeData]);

  // 根据类型获取使用量数据
  const getUsageByType = useCallback((type: UsageType): RealtimeUsage | null => {
    if (!data) return null;
    return data.find(item => item.usage_type === type) || null;
  }, [data]);

  // 初始化和清理
  useEffect(() => {
    if (enabled && subscriptionId) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, subscriptionId, startPolling, stopPolling]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [stopPolling]);

  // 处理页面可见性变化
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时停止轮询
        stopPolling();
      } else if (enabled && subscriptionId) {
        // 页面显示时恢复轮询
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, subscriptionId, startPolling, stopPolling]);

  return {
    data,
    currentUsage,
    loading,
    error,
    lastUpdated,
    isPolling,
    startPolling,
    stopPolling,
    refreshData,
    getUsageByType
  };
}