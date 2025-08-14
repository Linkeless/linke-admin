'use client'

/**
 * 记录过滤器组件 - 简化版本
 */

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Search, Filter, Info } from 'lucide-react'

export function RecordsFiltersSimple() {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSearch = () => {
    // TODO: 实现搜索功能
    console.log('搜索记录:', searchTerm)
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <Alert className="mb-4">
          <Info className="h-4 w-4" />
          <AlertDescription>
            记录过滤功能开发中，当前仅支持基础搜索
          </AlertDescription>
        </Alert>
        
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索记录ID或支付ID..."
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