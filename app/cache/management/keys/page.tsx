/**
 * 缓存键详细管理页面
 * 专注于缓存键的详细管理功能
 */

'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Key, Database, Clock, BarChart3, Plus } from 'lucide-react';
import { KeysManagement } from '../components';
import { useCacheKeys } from '@/hooks/use-cache-operations';
import { formatBytes, formatDuration } from '@/lib/cache-service';
import type { CacheKey } from '@/lib/cache-types';

export default function KeysDetailPage() {
  const { keys } = useCacheKeys();
  const [selectedKey, setSelectedKey] = useState<CacheKey | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newKeyForm, setNewKeyForm] = useState({
    key: '',
    type: 'string',
    value: '',
    ttl: -1,
  });

  const handleCreateKey = async () => {
    // 这里调用创建键的API
    console.log('Creating key:', newKeyForm);
    setCreateDialogOpen(false);
    setNewKeyForm({ key: '', type: 'string', value: '', ttl: -1 });
  };

  const getKeyTypeColor = (type: string) => {
    const colors = {
      string: 'bg-blue-100 text-blue-800 border-blue-200',
      hash: 'bg-green-100 text-green-800 border-green-200',
      list: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      set: 'bg-purple-100 text-purple-800 border-purple-200',
      zset: 'bg-pink-100 text-pink-800 border-pink-200',
      stream: 'bg-orange-100 text-orange-800 border-orange-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getKeyStats = () => {
    if (!keys?.keys) return null;
    
    const typeStats = keys.keys.reduce((acc, key) => {
      acc[key.type] = (acc[key.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const totalMemory = keys.keys.reduce((sum, key) => sum + key.memory_usage, 0);
    const avgTtl = keys.keys
      .filter(key => key.ttl > 0)
      .reduce((sum, key) => sum + key.ttl, 0) / 
      keys.keys.filter(key => key.ttl > 0).length || 0;

    return {
      types: typeStats,
      totalMemory,
      avgTtl,
      expiring: keys.keys.filter(key => key.ttl > 0 && key.ttl < 3600).length,
      permanent: keys.keys.filter(key => key.ttl === -1).length,
    };
  };

  const stats = getKeyStats();

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">缓存键管理</h2>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          创建键
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">统计概览</TabsTrigger>
          <TabsTrigger value="management">键管理</TabsTrigger>
          <TabsTrigger value="analytics">分析报告</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* 键统计 */}
          {stats && (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总键数</CardTitle>
                    <Key className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{keys?.total.toLocaleString()}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">总内存</CardTitle>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatBytes(stats.totalMemory)}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">即将过期</CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-orange-600">{stats.expiring}</div>
                    <p className="text-xs text-muted-foreground">1小时内过期</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">永久键</CardTitle>
                    <Clock className="h-4 w-4 text-green-500" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-green-600">{stats.permanent}</div>
                    <p className="text-xs text-muted-foreground">无过期时间</p>
                  </CardContent>
                </Card>
              </div>

              {/* 键类型分布 */}
              <Card>
                <CardHeader>
                  <CardTitle>键类型分布</CardTitle>
                  <CardDescription>各种数据类型的键数量统计</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
                    {Object.entries(stats.types).map(([type, count]) => (
                      <div key={type} className="text-center">
                        <Badge className={getKeyTypeColor(type)} variant="outline">
                          {type.toUpperCase()}
                        </Badge>
                        <div className="text-2xl font-bold mt-2">{count}</div>
                        <p className="text-sm text-muted-foreground">
                          {((count / (keys?.total || 1)) * 100).toFixed(1)}%
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 最大内存使用的键 */}
              <Card>
                <CardHeader>
                  <CardTitle>内存使用排行</CardTitle>
                  <CardDescription>内存使用量最大的缓存键</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {keys?.keys
                      .sort((a, b) => b.memory_usage - a.memory_usage)
                      .slice(0, 10)
                      .map((key, index) => (
                        <div key={key.key} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary">#{index + 1}</Badge>
                            <div>
                              <div className="font-mono text-sm">{key.key}</div>
                              <div className="text-xs text-muted-foreground">
                                {key.type} | {key.encoding}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{formatBytes(key.memory_usage)}</div>
                            <div className="text-xs text-muted-foreground">
                              大小: {key.size.toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="management" className="space-y-4">
          <KeysManagement />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  TTL分析
                </CardTitle>
                <CardDescription>缓存键的生存时间分布</CardDescription>
              </CardHeader>
              <CardContent>
                {keys?.keys && (
                  <div className="space-y-4">
                    {(() => {
                      const ttlRanges = {
                        '永久': keys.keys.filter(k => k.ttl === -1).length,
                        '1小时内': keys.keys.filter(k => k.ttl > 0 && k.ttl <= 3600).length,
                        '1天内': keys.keys.filter(k => k.ttl > 3600 && k.ttl <= 86400).length,
                        '1周内': keys.keys.filter(k => k.ttl > 86400 && k.ttl <= 604800).length,
                        '1周以上': keys.keys.filter(k => k.ttl > 604800).length,
                      };

                      return Object.entries(ttlRanges).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-sm">{range}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full"
                                style={{ width: `${(count / (keys?.total || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>访问模式</CardTitle>
                <CardDescription>缓存键的访问时间分析</CardDescription>
              </CardHeader>
              <CardContent>
                {keys?.keys && (
                  <div className="space-y-4">
                    {(() => {
                      const now = new Date();
                      const accessRanges = {
                        '1小时内': keys.keys.filter(k => 
                          new Date(k.last_access).getTime() > now.getTime() - 3600000
                        ).length,
                        '1天内': keys.keys.filter(k => {
                          const lastAccess = new Date(k.last_access).getTime();
                          return lastAccess <= now.getTime() - 3600000 && 
                                 lastAccess > now.getTime() - 86400000;
                        }).length,
                        '1周内': keys.keys.filter(k => {
                          const lastAccess = new Date(k.last_access).getTime();
                          return lastAccess <= now.getTime() - 86400000 && 
                                 lastAccess > now.getTime() - 604800000;
                        }).length,
                        '1周以上': keys.keys.filter(k => 
                          new Date(k.last_access).getTime() <= now.getTime() - 604800000
                        ).length,
                      };

                      return Object.entries(accessRanges).map(([range, count]) => (
                        <div key={range} className="flex items-center justify-between">
                          <span className="text-sm">{range}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-secondary rounded-full h-2">
                              <div 
                                className="bg-blue-500 h-2 rounded-full"
                                style={{ width: `${(count / (keys?.total || 1)) * 100}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 创建键对话框 */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建缓存键</DialogTitle>
            <DialogDescription>添加新的缓存键值对</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="key">键名</Label>
              <Input
                id="key"
                placeholder="输入键名"
                value={newKeyForm.key}
                onChange={(e) => setNewKeyForm({ ...newKeyForm, key: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">数据类型</Label>
              <Select
                value={newKeyForm.type}
                onValueChange={(value) => setNewKeyForm({ ...newKeyForm, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="string">String</SelectItem>
                  <SelectItem value="hash">Hash</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                  <SelectItem value="set">Set</SelectItem>
                  <SelectItem value="zset">Sorted Set</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">值</Label>
              <Textarea
                id="value"
                placeholder="输入值"
                value={newKeyForm.value}
                onChange={(e) => setNewKeyForm({ ...newKeyForm, value: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="ttl">TTL (秒，-1表示永不过期)</Label>
              <Input
                id="ttl"
                type="number"
                placeholder="-1"
                value={newKeyForm.ttl}
                onChange={(e) => setNewKeyForm({ ...newKeyForm, ttl: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleCreateKey}
              disabled={!newKeyForm.key || !newKeyForm.value}
            >
              创建
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 键详情对话框 */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>键详情</DialogTitle>
            <DialogDescription>
              查看缓存键的详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedKey && (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>键名</Label>
                  <div className="p-2 bg-muted rounded font-mono text-sm">
                    {selectedKey.key}
                  </div>
                </div>
                <div>
                  <Label>类型</Label>
                  <div className="p-2">
                    <Badge className={getKeyTypeColor(selectedKey.type)}>
                      {selectedKey.type.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label>TTL</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedKey.ttl === -1 ? '永不过期' : formatDuration(selectedKey.ttl)}
                  </div>
                </div>
                <div>
                  <Label>内存使用</Label>
                  <div className="p-2 bg-muted rounded">
                    {formatBytes(selectedKey.memory_usage)}
                  </div>
                </div>
                <div>
                  <Label>大小</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedKey.size.toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label>编码</Label>
                  <div className="p-2 bg-muted rounded">
                    {selectedKey.encoding}
                  </div>
                </div>
                <div>
                  <Label>最后访问</Label>
                  <div className="p-2 bg-muted rounded text-sm">
                    {new Date(selectedKey.last_access).toLocaleString()}
                  </div>
                </div>
                <div>
                  <Label>创建时间</Label>
                  <div className="p-2 bg-muted rounded text-sm">
                    {new Date(selectedKey.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}