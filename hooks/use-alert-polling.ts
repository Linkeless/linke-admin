import { useState, useEffect, useRef, useCallback } from 'react';
import { UsageService } from '@/lib/usage-service';
import { Alert, AlertStatus, AlertSeverity, FilterParams } from '@/lib/usage-types';

interface UseAlertPollingOptions {
  subscriptionId?: string; // 如果不提供则获取所有告警
  pollingInterval?: number; // 轮询间隔（毫秒），默认60秒
  enabled?: boolean; // 是否启用轮询
  statusFilter?: AlertStatus[]; // 状态过滤
  severityFilter?: AlertSeverity[]; // 严重程度过滤
  onNewAlert?: (alert: Alert) => void; // 新告警回调
  onAlertResolved?: (alert: Alert) => void; // 告警解决回调
  onError?: (error: Error) => void; // 错误回调
}

interface UseAlertPollingReturn {
  alerts: Alert[];
  activeAlerts: Alert[];
  criticalAlerts: Alert[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  isPolling: boolean;
  totalCount: number;
  newAlertsCount: number; // 自上次查看以来的新告警数量
  startPolling: () => void;
  stopPolling: () => void;
  refreshAlerts: () => Promise<void>;
  acknowledgeAlert: (alertId: string, notes?: string) => Promise<void>;
  resolveAlert: (alertId: string, notes?: string) => Promise<void>;
  bulkResolveAlerts: (alertIds: string[], notes?: string) => Promise<void>;
  markAlertsAsViewed: () => void; // 标记告警为已查看
  getAlertsByStatus: (status: AlertStatus) => Alert[];
  getAlertsBySeverity: (severity: AlertSeverity) => Alert[];
}

export function useAlertPolling({
  subscriptionId,
  pollingInterval = 60000, // 60秒
  enabled = true,
  statusFilter,
  severityFilter,
  onNewAlert,
  onAlertResolved,
  onError
}: UseAlertPollingOptions = {}): UseAlertPollingReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [newAlertsCount, setNewAlertsCount] = useState(0);
  const [lastViewedTime, setLastViewedTime] = useState<Date>(new Date());

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);
  const previousAlertsRef = useRef<Alert[]>([]);

  // 获取告警数据
  const fetchAlerts = useCallback(async () => {
    if (!mountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      let response;
      if (subscriptionId) {
        // 获取特定订阅的告警
        const filterParams: FilterParams = {};
        if (statusFilter && statusFilter.length > 0) {
          filterParams.status = statusFilter[0]; // API可能只支持单个状态过滤
        }

        response = await UsageService.getAlerts(subscriptionId, {
          page: 1,
          limit: 100, // 获取前100个告警
          ...filterParams
        });
      } else {
        // 获取所有告警 (这里假设有一个获取所有告警的API)
        response = await UsageService.getAlertConfigs({
          page: 1,
          limit: 100
        });
      }

      if (!mountedRef.current) return;

      if (response.success) {
        const newAlerts = Array.isArray(response.data) ? response.data : response.data || [];
        
        // 应用客户端过滤
        let filteredAlerts = newAlerts;
        
        if (statusFilter && statusFilter.length > 0) {
          filteredAlerts = filteredAlerts.filter(alert => 
            statusFilter.includes(alert.status)
          );
        }
        
        if (severityFilter && severityFilter.length > 0) {
          filteredAlerts = filteredAlerts.filter(alert => 
            severityFilter.includes(alert.severity)
          );
        }

        // 检测新告警和已解决告警
        const previousAlerts = previousAlertsRef.current;
        
        if (previousAlerts.length > 0) {
          // 查找新告警
          const newAlertItems = filteredAlerts.filter(alert => 
            !previousAlerts.find(prev => prev.id === alert.id)
          );
          
          // 查找新解决的告警
          const resolvedAlerts = previousAlerts.filter(prev => 
            prev.status !== AlertStatus.RESOLVED &&
            filteredAlerts.find(current => 
              current.id === prev.id && current.status === AlertStatus.RESOLVED
            )
          );

          // 触发回调
          newAlertItems.forEach(alert => {
            if (onNewAlert) onNewAlert(alert);
          });

          resolvedAlerts.forEach(alert => {
            if (onAlertResolved) onAlertResolved(alert);
          });

          // 计算新告警数量
          const newCount = filteredAlerts.filter(alert => 
            new Date(alert.created_at) > lastViewedTime
          ).length;
          setNewAlertsCount(newCount);
        }

        setAlerts(filteredAlerts);
        previousAlertsRef.current = filteredAlerts;
        setLastUpdated(new Date());

      } else {
        throw new Error(response.message || '获取告警列表失败');
      }

    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : '获取告警数据失败';
      setError(errorMessage);
      
      if (onError) {
        onError(err instanceof Error ? err : new Error(errorMessage));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [subscriptionId, statusFilter, severityFilter, onNewAlert, onAlertResolved, onError, lastViewedTime]);

  // 开始轮询
  const startPolling = useCallback(() => {
    if (intervalRef.current || !enabled) return;

    setIsPolling(true);
    
    // 立即获取一次数据
    fetchAlerts();
    
    // 设置定时轮询
    intervalRef.current = setInterval(fetchAlerts, pollingInterval);
  }, [fetchAlerts, pollingInterval, enabled]);

  // 停止轮询
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  // 手动刷新告警
  const refreshAlerts = useCallback(async () => {
    await fetchAlerts();
  }, [fetchAlerts]);

  // 确认告警
  const acknowledgeAlert = useCallback(async (alertId: string, notes?: string) => {
    try {
      const response = await UsageService.acknowledgeAlert(alertId, notes);
      if (response.success) {
        // 更新本地状态
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: AlertStatus.ACKNOWLEDGED, acknowledged_at: new Date().toISOString() }
            : alert
        ));
      } else {
        throw new Error(response.message || '确认告警失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '确认告警失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 解决告警
  const resolveAlert = useCallback(async (alertId: string, notes?: string) => {
    try {
      const response = await UsageService.resolveAlert(alertId, notes);
      if (response.success) {
        // 更新本地状态
        setAlerts(prev => prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: AlertStatus.RESOLVED, resolved_at: new Date().toISOString() }
            : alert
        ));
      } else {
        throw new Error(response.message || '解决告警失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '解决告警失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 批量解决告警
  const bulkResolveAlerts = useCallback(async (alertIds: string[], notes?: string) => {
    try {
      const response = await UsageService.bulkResolveAlerts(alertIds, notes);
      if (response.success) {
        // 更新本地状态
        const resolvedTime = new Date().toISOString();
        setAlerts(prev => prev.map(alert => 
          alertIds.includes(alert.id)
            ? { ...alert, status: AlertStatus.RESOLVED, resolved_at: resolvedTime }
            : alert
        ));
      } else {
        throw new Error(response.message || '批量解决告警失败');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '批量解决告警失败';
      setError(errorMessage);
      throw err;
    }
  }, []);

  // 标记告警为已查看
  const markAlertsAsViewed = useCallback(() => {
    setLastViewedTime(new Date());
    setNewAlertsCount(0);
  }, []);

  // 根据状态获取告警
  const getAlertsByStatus = useCallback((status: AlertStatus): Alert[] => {
    return alerts.filter(alert => alert.status === status);
  }, [alerts]);

  // 根据严重程度获取告警
  const getAlertsBySeverity = useCallback((severity: AlertSeverity): Alert[] => {
    return alerts.filter(alert => alert.severity === severity);
  }, [alerts]);

  // 计算衍生状态
  const activeAlerts = alerts.filter(alert => alert.status === AlertStatus.ACTIVE);
  const criticalAlerts = alerts.filter(alert => alert.severity === AlertSeverity.CRITICAL);
  const totalCount = alerts.length;

  // 初始化和清理
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }

    return () => {
      stopPolling();
    };
  }, [enabled, startPolling, stopPolling]);

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
      } else if (enabled) {
        // 页面显示时恢复轮询
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, startPolling, stopPolling]);

  return {
    alerts,
    activeAlerts,
    criticalAlerts,
    loading,
    error,
    lastUpdated,
    isPolling,
    totalCount,
    newAlertsCount,
    startPolling,
    stopPolling,
    refreshAlerts,
    acknowledgeAlert,
    resolveAlert,
    bulkResolveAlerts,
    markAlertsAsViewed,
    getAlertsByStatus,
    getAlertsBySeverity
  };
}