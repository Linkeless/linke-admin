/**
 * 缓存键管理组件
 * 提供缓存键的查看、搜索、删除等管理功能
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DataTable } from '@/components/ui/data-table';
import { Search, Trash2, RefreshCw, Download, Filter, Key, Clock, Database } from 'lucide-react';
import { useCacheKeys } from '@/hooks/use-cache-operations';
import { formatBytes, formatDuration } from '@/lib/cache-service';
import type { CacheKey, CacheKeysQuery } from '@/lib/cache-types';
import { ColumnDef } from '@tanstack/react-table';

interface KeysManagementProps {
  className?: string;
}

export function KeysManagement({ className }: KeysManagementProps) {
  const {
    keys,
    loading,
    error,
    deleting,
    fetchKeys,
    deleteKey,
    batchDeleteKeys,
    searchKeys,
    changePage,
    changePageSize,
  } = useCacheKeys();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDatabase, setFilterDatabase] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('key');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [keyToDelete, setKeyToDelete] = useState<string | null>(null);

  useEffect(() => {
    const query: CacheKeysQuery = {};
    
    if (searchTerm) query.pattern = `*${searchTerm}*`;
    if (filterType !== 'all') query.type = filterType as any;
    if (filterDatabase !== 'all') query.database = parseInt(filterDatabase);
    if (sortBy) query.sort_by = sortBy as any;
    if (sortOrder) query.sort_order = sortOrder;

    fetchKeys(query);
  }, [searchTerm, filterType, filterDatabase, sortBy, sortOrder, fetchKeys]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleDeleteKey = async (key: string) => {
    setKeyToDelete(key);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteKey = async () => {
    if (!keyToDelete) return;
    
    const result = await deleteKey(keyToDelete);
    if (result.success) {
      setSelectedKeys(prev => prev.filter(k => k !== keyToDelete));
    }
    
    setDeleteDialogOpen(false);
    setKeyToDelete(null);
  };

  const handleBatchDelete = async () => {
    if (selectedKeys.length === 0) return;
    
    await batchDeleteKeys(selectedKeys);
    setSelectedKeys([]);
  };

  const exportKeys = () => {
    if (!keys?.keys) return;

    const csvContent = [
      ['键名', '类型', 'TTL(秒)', '内存使用(字节)', '大小', '编码', '最后访问', '创建时间'],
      ...keys.keys.map(key => [
        key.key,
        key.type,
        key.ttl.toString(),
        key.memory_usage.toString(),
        key.size.toString(),
        key.encoding,
        key.last_access,
        key.created_at,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `cache-keys-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const keyTypes = [
    { value: 'all', label: '全部类型' },
    { value: 'string', label: 'String' },
    { value: 'hash', label: 'Hash' },
    { value: 'list', label: 'List' },
    { value: 'set', label: 'Set' },
    { value: 'zset', label: 'Sorted Set' },
    { value: 'stream', label: 'Stream' },
  ];

  const sortOptions = [
    { value: 'key', label: '键名' },
    { value: 'memory_usage', label: '内存使用' },
    { value: 'ttl', label: 'TTL' },
    { value: 'last_access', label: '最后访问' },
  ];

  const columns: ColumnDef<CacheKey>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => {
            table.toggleAllPageRowsSelected(!!value);
            if (value) {
              setSelectedKeys(keys?.keys.map(k => k.key) || []);
            } else {
              setSelectedKeys([]);
            }
          }}
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={selectedKeys.includes(row.original.key)}
          onCheckedChange={(value) => {
            if (value) {
              setSelectedKeys(prev => [...prev, row.original.key]);
            } else {
              setSelectedKeys(prev => prev.filter(k => k !== row.original.key));
            }
          }}
        />
      ),
      enableSorting: false,
    },
    {
      accessorKey: 'key',
      header: '键名',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-muted-foreground" />
          <div className="max-w-[200px]">
            <div className="truncate font-mono text-sm">{row.original.key}</div>
            <div className="text-xs text-muted-foreground">
              {row.original.encoding}
            </div>
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'type',
      header: '类型',
      cell: ({ row }) => {
        const typeColors = {
          string: 'bg-blue-100 text-blue-800',
          hash: 'bg-green-100 text-green-800',
          list: 'bg-yellow-100 text-yellow-800',
          set: 'bg-purple-100 text-purple-800',
          zset: 'bg-pink-100 text-pink-800',
          stream: 'bg-orange-100 text-orange-800',
        };
        return (
          <Badge className={typeColors[row.original.type as keyof typeof typeColors]}>
            {row.original.type.toUpperCase()}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'ttl',
      header: 'TTL',
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span>
            {row.original.ttl === -1 
              ? '永久' 
              : `${formatDuration(row.original.ttl)}`
            }
          </span>
        </div>
      ),
    },
    {
      accessorKey: 'memory_usage',
      header: '内存使用',
      cell: ({ row }) => (
        <div className="text-right">
          {formatBytes(row.original.memory_usage)}
        </div>
      ),
    },
    {
      accessorKey: 'size',
      header: '大小',
      cell: ({ row }) => (
        <div className="text-right">
          {row.original.size.toLocaleString()}
        </div>
      ),
    },
    {
      accessorKey: 'last_access',
      header: '最后访问',
      cell: ({ row }) => (
        <div className="text-sm">
          {new Date(row.original.last_access).toLocaleString()}
        </div>
      ),
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteKey(row.original.key)}
          disabled={deleting.has(row.original.key)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      ),
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 统计信息 */}
      {keys && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总键数</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keys.total.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">当前页</CardTitle>
              <Key className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{keys.keys.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">已选择</CardTitle>
              <Checkbox className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{selectedKeys.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">总内存</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatBytes(keys.keys.reduce((sum, key) => sum + key.memory_usage, 0))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索和筛选</CardTitle>
          <CardDescription>查找和筛选缓存键</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索键名..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {keyTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDatabase} onValueChange={setFilterDatabase}>
              <SelectTrigger>
                <Database className="h-4 w-4 mr-2" />
                <SelectValue placeholder="数据库" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部数据库</SelectItem>
                {[...Array(16)].map((_, i) => (
                  <SelectItem key={i} value={i.toString()}>
                    数据库 {i}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortOrder} onValueChange={(value: 'asc' | 'desc') => setSortOrder(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">升序</SelectItem>
                <SelectItem value="desc">降序</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 操作工具栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                onClick={handleBatchDelete}
                variant="destructive"
                size="sm"
                disabled={selectedKeys.length === 0}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除选中 ({selectedKeys.length})
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={exportKeys} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button onClick={() => fetchKeys()} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 键列表 */}
      <Card>
        <CardHeader>
          <CardTitle>缓存键列表</CardTitle>
          <CardDescription>
            {keys && `显示 ${keys.keys.length} / ${keys.total} 个键`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={keys?.keys || []}
            loading={loading}
            pagination={keys ? {
              page: keys.page,
              pageSize: keys.page_size,
              total: keys.total,
              onPageChange: changePage,
              onPageSizeChange: (size) => {
                changePageSize(size);
              },
            } : undefined}
          />
        </CardContent>
      </Card>

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              您确定要删除键 &ldquo;{keyToDelete}&rdquo; 吗？此操作无法撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDeleteKey}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 错误提示 */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}