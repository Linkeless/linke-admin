'use client'

import { useEffect, useState, useCallback } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Server } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

import { shadowsocksServerService } from "@/lib/shadowsocks-service"
import { ShadowsocksServerResponse } from "@/lib/shadowsocks-types"
import { serverGroupService } from "@/lib/server-group-service"
import { ServerGroupResponse } from "@/lib/server-group-types"
import { createColumns } from "./columns"
import { DataTable } from "@/components/ui/data-table"
import { 
  CreateServerDialog
} from "@/components/servers/shadowsocks-servers"
import { Pagination } from "@/components/subscriptions"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useDebouncedCallback } from "@/hooks/use-debounce"
import { useRouter, useSearchParams } from "next/navigation"

export default function ShadowsocksServersPage() {
  const [servers, setServers] = useState<ShadowsocksServerResponse[]>([])
  const [loading, setLoading] = useState(true)
  
  // 分页状态 - 使用基于页码的分页（shadcn/ui标准）
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalItems, setTotalItems] = useState(0)
  // 过滤器
  const [serverGroups, setServerGroups] = useState<ServerGroupResponse[]>([])
  const [groupId, setGroupId] = useState<number | 'all'>('all')
  const [showFilter, setShowFilter] = useState<'all' | 'show' | 'hide'>('all')
  const [nameFilter, setNameFilter] = useState("")
  // 排序由后端默认策略处理，移除前端排序选项
  const [sortBy] = useState<'sort' | 'created_at' | 'updated_at' | 'name' | 'rate'>('sort')
  const [sortOrder] = useState<'asc' | 'desc'>('asc')
  const updateSearchDebounced = useDebouncedCallback((value: string) => {
    setNameFilter(value)
    setCurrentPage(1)
  }, 300, [setNameFilter, setCurrentPage])

  // 从URL初始化筛选
  const searchParams = useSearchParams()
  const router = useRouter()
  useEffect(() => {
    const page = Number(searchParams.get('page') || 1)
    const limit = Number(searchParams.get('limit') || 10)
    const gid = searchParams.get('group_id')
    const show = searchParams.get('show')
    const name = searchParams.get('name')
    const sb = searchParams.get('sort_by') as typeof sortBy | null
    const so = searchParams.get('sort_order') as typeof sortOrder | null
    if (!Number.isNaN(page)) setCurrentPage(page)
    if (!Number.isNaN(limit)) setPageSize(limit)
    if (gid) setGroupId(Number(gid))
    if (show === '0' || show === '1') setShowFilter(show === '1' ? 'show' : 'hide')
    if (name) setNameFilter(name)
    // 排序参数读入但不在UI中暴露
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 将筛选写回URL（无刷新）
  useEffect(() => {
    const params = new URLSearchParams()
    params.set('page', String(currentPage))
    params.set('limit', String(pageSize))
    if (groupId !== 'all') params.set('group_id', String(groupId))
    if (showFilter !== 'all') params.set('show', showFilter === 'show' ? '1' : '0')
    if (nameFilter) params.set('name', nameFilter)
    if (sortBy) params.set('sort_by', sortBy)
    if (sortOrder) params.set('sort_order', sortOrder)
    router.replace(`?${params.toString()}`)
  }, [currentPage, pageSize, groupId, showFilter, nameFilter, sortBy, sortOrder, router])

  const loadData = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setLoading(true)
      
      const response = await shadowsocksServerService.getServers({
        page,
        limit,
        group_id: groupId === 'all' ? undefined : Number(groupId),
        show: showFilter === 'all' ? undefined : (showFilter === 'show' ? 1 : 0),
        name: nameFilter ? nameFilter : undefined,
        sort_by: sortBy,
        sort_order: sortOrder,
      })
      
      if (response.code === 0 && response.data) {
        // API返回的数据结构：data.items 是服务器数组
        setServers(response.data.items || [])
        // 分页信息在 data.pagination 中
        setTotalItems(response.data.pagination.total || 0)
        setCurrentPage((response as any).data.pagination.page || page)
      }
    } catch (error) {
      // 可以添加错误提示
    } finally {
      setLoading(false)
    }
  }, [groupId, showFilter, nameFilter, sortBy, sortOrder])

  const handleServerCreated = useCallback(() => {
    // 重新加载服务器列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  const handleServerUpdated = useCallback(() => {
    // 重新加载服务器列表
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize])

  useEffect(() => {
    loadData(currentPage, pageSize)
  }, [loadData, currentPage, pageSize, groupId, showFilter, nameFilter, sortBy, sortOrder])

  useEffect(() => {
    ;(async () => {
      try {
        const res = await serverGroupService.getServerGroups({ page: 1, limit: 100 })
        if (res.code === 0 && res.data?.items) {
          setServerGroups(res.data.items)
        }
      } catch {}
    })()
  }, [])

  return (
    <div className="flex flex-col">
      <PageHeader 
        title="Shadowsocks 服务器管理" 
        description="管理 Shadowsocks 服务器配置"
      >
        <CreateServerDialog onServerCreated={handleServerCreated} />
      </PageHeader>
      
      <main className="flex-1 p-6">
        <div className="space-y-6">

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  服务器列表
                </CardTitle>
                <CardDescription>
                  共 {totalItems} 台服务器
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-muted-foreground">加载中...</p>
                  </div>
                ) : (
                  <>
                    {/* 过滤器 */}
                    <div className="flex flex-col gap-3 pb-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">服务器组</span>
                          <Select
                            value={String(groupId)}
                            onValueChange={(v) => {
                              setCurrentPage(1)
                              setGroupId(v === 'all' ? 'all' : Number(v))
                            }}
                          >
                            <SelectTrigger className="h-8 w-40">
                              <SelectValue placeholder="全部组" />
                            </SelectTrigger>
                            <SelectContent side="top">
                              <SelectItem value="all">全部组</SelectItem>
                              {serverGroups.map(g => (
                                <SelectItem key={g.id} value={String(g.id)}>{g.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">显示状态</span>
                          <Select
                            value={showFilter}
                            onValueChange={(v: 'all' | 'show' | 'hide') => {
                              setCurrentPage(1)
                              setShowFilter(v)
                            }}
                          >
                            <SelectTrigger className="h-8 w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent side="top">
                              <SelectItem value="all">全部</SelectItem>
                              <SelectItem value="show">显示</SelectItem>
                              <SelectItem value="hide">隐藏</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* 名称筛选交给表格搜索框（避免重复UI） */}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => { setGroupId('all'); setShowFilter('all'); setNameFilter(""); setCurrentPage(1) }}>重置</Button>
                      </div>
                    </div>

                    {/* 排序选项已移除，默认使用接口约定顺序 */}

                    {/* 数据表格（支持服务端分页） */}
                    <DataTable 
                      columns={createColumns({ 
                        onServerUpdated: handleServerUpdated
                      })} 
                      data={servers}
                      searchKey="name"
                      searchPlaceholder="搜索服务器名称..."
                      searchMode="manual"
                      searchDefaultValue={nameFilter}
                      onSearchSubmit={(value) => { setNameFilter(value); setCurrentPage(1) }}
                      hideInternalPagination
                    />

                    {/* 分页（服务端分页）*/}
                    <Pagination
                      currentPage={currentPage}
                      totalItems={totalItems}
                      itemsPerPage={pageSize}
                      onPageChange={(page) => {
                        if (page !== currentPage) {
                          setCurrentPage(page)
                          loadData(page, pageSize)
                        }
                      }}
                      onPageSizeChange={(size) => {
                        if (size !== pageSize) {
                          setPageSize(size)
                          setCurrentPage(1)
                          // 依赖项变更将触发 useEffect -> loadData(1, size)
                        }
                      }}
                      className="pt-4"
                    />
                  </>
                )}
              </CardContent>
            </Card>
        </div>
      </main>
    </div>
  )
}