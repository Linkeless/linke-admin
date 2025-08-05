/**
 * 缓存操作相关Hooks
 * 提供缓存管理操作功能
 */

import { useState, useCallback } from 'react';
import { CacheManagementService } from '@/lib/cache-service';
import type {
  CacheOperationRequest,
  CacheOperationResponse,
  CacheKeysResponse,
  CacheKeysQuery,
  CacheMaintenanceRequest,
  CacheMaintenanceResponse,
  CacheOperation
} from '@/lib/cache-types';

// 缓存操作Hook
export function useCacheOperations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastOperation, setLastOperation] = useState<{
    operation: CacheOperation;
    result: CacheOperationResponse;
    timestamp: Date;
  } | null>(null);

  const executeOperation = useCallback(async (
    operation: CacheOperation,
    options: Partial<CacheOperationRequest> = {}
  ): Promise<{ success: boolean; result?: CacheOperationResponse; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const request: CacheOperationRequest = {
        operation,
        target: options.target || 'all',
        pattern: options.pattern,
        database: options.database,
        confirm: options.confirm !== false, // 默认为true
      };

      let result: CacheOperationResponse;

      switch (operation) {
        case CacheOperation.CLEAR:
          result = await CacheManagementService.clearCache(request);
          break;
        case CacheOperation.REFRESH:
          result = await CacheManagementService.refreshCache(request);
          break;
        case CacheOperation.WARMUP:
          result = await CacheManagementService.warmupCache(request);
          break;
        default:
          throw new Error(`不支持的操作类型: ${operation}`);
      }

      setLastOperation({
        operation,
        result,
        timestamp: new Date(),
      });

      return { success: true, result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '操作执行失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 清理缓存
  const clearCache = useCallback(async (options: {
    target?: 'all' | 'expired' | 'pattern';
    pattern?: string;
    database?: number;
  } = {}) => {
    return executeOperation(CacheOperation.CLEAR, options);
  }, [executeOperation]);

  // 刷新缓存
  const refreshCache = useCallback(async (options: {
    target?: 'all' | 'expired' | 'pattern';
    pattern?: string;
    database?: number;
  } = {}) => {
    return executeOperation(CacheOperation.REFRESH, options);
  }, [executeOperation]);

  // 预热缓存
  const warmupCache = useCallback(async (options: {
    target?: 'all' | 'expired' | 'pattern';
    pattern?: string;
    database?: number;
  } = {}) => {
    return executeOperation(CacheOperation.WARMUP, options);
  }, [executeOperation]);

  // 清除错误状态
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    lastOperation,
    clearCache,
    refreshCache,
    warmupCache,
    clearError,
  };
}

// 缓存键管理Hook
export function useCacheKeys() {
  const [keys, setKeys] = useState<CacheKeysResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Set<string>>(new Set());

  const fetchKeys = useCallback(async (query: CacheKeysQuery = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await CacheManagementService.getKeys(query);
      setKeys(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取缓存键失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteKey = useCallback(async (key: string) => {
    setDeleting(prev => new Set(prev).add(key));
    
    try {
      await CacheManagementService.deleteKey(key);
      
      // 从本地状态中移除已删除的键
      setKeys(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          keys: prev.keys.filter(k => k.key !== key),
          total: prev.total - 1,
        };
      });
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '删除缓存键失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setDeleting(prev => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, []);

  const batchDeleteKeys = useCallback(async (keyPatterns: string[]) => {
    const results: Array<{ key: string; success: boolean; error?: string }> = [];
    
    for (const pattern of keyPatterns) {
      setDeleting(prev => new Set(prev).add(pattern));
      
      try {
        await CacheManagementService.deleteKey(pattern);
        results.push({ key: pattern, success: true });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : '删除失败';
        results.push({ key: pattern, success: false, error: errorMessage });
      } finally {
        setDeleting(prev => {
          const next = new Set(prev);
          next.delete(pattern);
          return next;
        });
      }
    }

    // 刷新键列表
    if (keys) {
      fetchKeys({
        pattern: keys.pattern,
        database: keys.database,
        page: keys.page,
        page_size: keys.page_size,
      });
    }

    return results;
  }, [keys, fetchKeys]);

  const refreshKeys = useCallback(() => {
    if (keys) {
      fetchKeys({
        pattern: keys.pattern,
        database: keys.database,
        page: keys.page,
        page_size: keys.page_size,
      });
    }
  }, [keys, fetchKeys]);

  const searchKeys = useCallback((pattern: string, options?: Partial<CacheKeysQuery>) => {
    fetchKeys({
      pattern,
      page: 1, // 搜索时重置到第一页
      ...options,
    });
  }, [fetchKeys]);

  const changePage = useCallback((page: number) => {
    if (keys) {
      fetchKeys({
        pattern: keys.pattern,
        database: keys.database,
        page,
        page_size: keys.page_size,
      });
    }
  }, [keys, fetchKeys]);

  const changePageSize = useCallback((pageSize: number) => {
    if (keys) {
      fetchKeys({
        pattern: keys.pattern,
        database: keys.database,
        page: 1, // 改变页面大小时重置到第一页
        page_size: pageSize,
      });
    }
  }, [keys, fetchKeys]);

  return {
    keys,
    loading,
    error,
    deleting,
    fetchKeys,
    deleteKey,
    batchDeleteKeys,
    refreshKeys,
    searchKeys,
    changePage,
    changePageSize,
  };
}

// 缓存维护Hook
export function useCacheMaintenance() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    result: CacheMaintenanceResponse;
    timestamp: Date;
  } | null>(null);

  const performMaintenance = useCallback(async (
    request: CacheMaintenanceRequest
  ): Promise<{ success: boolean; result?: CacheMaintenanceResponse; error?: string }> => {
    setLoading(true);
    setError(null);

    try {
      const result = await CacheManagementService.performMaintenance(request);
      
      setLastResult({
        result,
        timestamp: new Date(),
      });

      return { success: true, result };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '维护操作失败';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 清理过期键
  const cleanupExpired = useCallback(async () => {
    return performMaintenance({
      tasks: ['cleanup_expired'],
    });
  }, [performMaintenance]);

  // 内存碎片整理
  const defragmentMemory = useCallback(async () => {
    return performMaintenance({
      tasks: ['defragment'],
    });
  }, [performMaintenance]);

  // 优化内存
  const optimizeMemory = useCallback(async () => {
    return performMaintenance({
      tasks: ['optimize_memory'],
    });
  }, [performMaintenance]);

  // 重建索引
  const rebuildIndex = useCallback(async () => {
    return performMaintenance({
      tasks: ['rebuild_index'],
    });
  }, [performMaintenance]);

  // 执行完整维护
  const fullMaintenance = useCallback(async (force = false) => {
    return performMaintenance({
      tasks: ['cleanup_expired', 'defragment', 'optimize_memory', 'rebuild_index'],
      force,
    });
  }, [performMaintenance]);

  // 计划维护
  const scheduleMaintenance = useCallback(async (
    tasks: CacheMaintenanceRequest['tasks'],
    schedule: string
  ) => {
    return performMaintenance({
      tasks,
      schedule,
    });
  }, [performMaintenance]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    lastResult,
    performMaintenance,
    cleanupExpired,
    defragmentMemory,
    optimizeMemory,
    rebuildIndex,
    fullMaintenance,
    scheduleMaintenance,
    clearError,
  };
}

// 综合缓存管理Hook
export function useCacheManagement() {
  const operations = useCacheOperations();
  const keys = useCacheKeys();
  const maintenance = useCacheMaintenance();

  const loading = operations.loading || keys.loading || maintenance.loading;
  const error = operations.error || keys.error || maintenance.error;

  const clearAllErrors = useCallback(() => {
    operations.clearError();
    maintenance.clearError();
  }, [operations.clearError, maintenance.clearError]);

  // 快速操作：清理所有过期键
  const quickCleanup = useCallback(async () => {
    const result = await operations.clearCache({ target: 'expired' });
    if (result.success) {
      keys.refreshKeys();
    }
    return result;
  }, [operations.clearCache, keys.refreshKeys]);

  // 快速操作：内存优化
  const quickOptimize = useCallback(async () => {
    const result = await maintenance.optimizeMemory();
    if (result.success) {
      keys.refreshKeys();
    }
    return result;
  }, [maintenance.optimizeMemory, keys.refreshKeys]);

  return {
    operations,
    keys,
    maintenance,
    loading,
    error,
    clearAllErrors,
    quickCleanup,
    quickOptimize,
  };
}