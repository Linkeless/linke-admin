'use client'

import { useState, useCallback } from "react"
import { Search, Filter, X, ChevronDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { UserSearchParams } from "@/lib/user-types"

interface AdvancedSearchFilterProps {
  onSearch: (params: UserSearchParams) => void
  loading?: boolean
}

interface FilterState {
  q?: string
  role?: string
  status?: string
  provider?: string
  date_from?: string
  date_to?: string
}

export function AdvancedSearchFilter({ onSearch, loading = false }: AdvancedSearchFilterProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState<FilterState>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // 角色选项
  const roleOptions = [
    { value: "all", label: "所有角色" },
    { value: "user", label: "普通用户" },
    { value: "admin", label: "管理员" },
    { value: "system", label: "系统用户" },
  ]

  // 状态选项
  const statusOptions = [
    { value: "all", label: "所有状态" },
    { value: "active", label: "活跃" },
    { value: "inactive", label: "未激活" },
    { value: "suspended", label: "暂停" },
    { value: "banned", label: "封禁" },
  ]

  // OAuth提供商选项
  const providerOptions = [
    { value: "all", label: "所有登录方式" },
    { value: "local", label: "本地账号" },
    { value: "google", label: "Google" },
    { value: "github", label: "GitHub" },
    { value: "telegram", label: "Telegram" },
  ]

  // 执行搜索
  const handleSearch = useCallback(() => {
    const searchParams: UserSearchParams = {
      page: 1,
      limit: 50,
    }

    // 关键词搜索
    if (searchQuery.trim()) {
      searchParams.q = searchQuery.trim()
    }

    // 筛选条件
    if (filters.role && filters.role !== "all") {
      searchParams.role = filters.role
    }
    if (filters.status && filters.status !== "all") {
      searchParams.status = filters.status
    }
    if (filters.provider && filters.provider !== "all") {
      searchParams.provider = filters.provider
    }
    if (filters.date_from) {
      searchParams.date_from = filters.date_from
    }
    if (filters.date_to) {
      searchParams.date_to = filters.date_to
    }

    onSearch(searchParams)
  }, [searchQuery, filters, onSearch])

  // 清空所有筛选
  const handleClearAll = useCallback(() => {
    setSearchQuery("")
    setFilters({})
    onSearch({ page: 1, limit: 50 })
  }, [onSearch])

  // 更新筛选器
  const updateFilter = useCallback((key: keyof FilterState, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? undefined : value
    }))
  }, [])

  // 计算活跃筛选器数量
  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* 搜索栏 */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索用户名、邮箱或姓名..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>

        <Button onClick={handleSearch} disabled={loading}>
          {loading ? "搜索中..." : "搜索"}
        </Button>

        {/* 高级筛选弹出框 */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="relative">
              <Filter className="mr-2 h-4 w-4" />
              筛选
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="secondary" 
                  className="ml-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {activeFiltersCount}
                </Badge>
              )}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">高级筛选</h3>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClearAll}
                  className="h-auto p-1 text-xs"
                >
                  清空所有
                </Button>
              </div>

              {/* 角色筛选 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">角色</Label>
                <Select 
                  value={filters.role || "all"} 
                  onValueChange={(value) => updateFilter("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 状态筛选 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">状态</Label>
                <Select 
                  value={filters.status || "all"} 
                  onValueChange={(value) => updateFilter("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* OAuth提供商筛选 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">登录方式</Label>
                <Select 
                  value={filters.provider || "all"} 
                  onValueChange={(value) => updateFilter("provider", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {providerOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* 注册日期筛选 */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">注册日期</Label>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={filters.date_from || ""}
                      onChange={(e) => updateFilter("date_from", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                  <span className="text-muted-foreground self-center">至</span>
                  <div className="flex-1">
                    <Input
                      type="date"
                      value={filters.date_to || ""}
                      onChange={(e) => updateFilter("date_to", e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button 
                  onClick={handleSearch} 
                  className="flex-1" 
                  disabled={loading}
                >
                  应用筛选
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsFilterOpen(false)}
                >
                  取消
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* 清空按钮 */}
        {(searchQuery || activeFiltersCount > 0) && (
          <Button variant="ghost" size="sm" onClick={handleClearAll}>
            <X className="h-4 w-4 mr-1" />
            清空
          </Button>
        )}
      </div>

      {/* 活跃筛选器显示 */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.role && (
            <Badge variant="secondary" className="gap-1">
              角色: {roleOptions.find(r => r.value === filters.role)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter("role", "all")}
              />
            </Badge>
          )}
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              状态: {statusOptions.find(s => s.value === filters.status)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter("status", "all")}
              />
            </Badge>
          )}
          {filters.provider && (
            <Badge variant="secondary" className="gap-1">
              登录: {providerOptions.find(p => p.value === filters.provider)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter("provider", "all")}
              />
            </Badge>
          )}
          {filters.date_from && (
            <Badge variant="secondary" className="gap-1">
              起始: {filters.date_from}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter("date_from", "")}
              />
            </Badge>
          )}
          {filters.date_to && (
            <Badge variant="secondary" className="gap-1">
              截止: {filters.date_to}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => updateFilter("date_to", "")}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  )
}