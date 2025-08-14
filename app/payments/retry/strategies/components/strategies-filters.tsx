'use client'

/**
 * 策略过滤器组件 - 简化版本
 * 注意：这个组件目前被简化，复杂的过滤功能需要进一步开发
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Search, Filter, Info } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function StrategiesFilters() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    // 基础搜索功能实现
    if (searchTerm.trim()) {
      console.log('搜索策略:', searchTerm)
      // 实际项目中这里会触发父组件的搜索回调或者使用全局状态
    }
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            基础搜索功能已实现，高级筛选功能正在开发中
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索策略名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch()
                }
              }}
            />
          </div>
          <Button onClick={handleSearch} size="sm">
            <Search className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            高级筛选
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}