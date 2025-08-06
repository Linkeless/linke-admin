'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { TicketCheck, Filter, Plus } from "lucide-react"
import { PageHeader } from "@/components/layout/page-header"

export default function TicketsPageLoading() {
  return (
    <div className="flex flex-col">
      <PageHeader 
        title="工单管理" 
        description="管理系统工单和客户支持请求"
        action={
          <Button disabled className="gap-2">
            <Plus className="h-4 w-4" />
            创建工单
          </Button>
        }
      />
      
      <main className="flex-1 p-6">
        <div className="space-y-6">
          {/* 统计卡片骨架 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-12" />
                </CardContent>
              </Card>
            ))}
          </div>

          {/* 搜索和筛选骨架 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                搜索和筛选
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Skeleton className="h-10 w-full" />
                  </div>
                  <Skeleton className="h-10 w-20" />
                </div>
                
                <div className="flex gap-4 flex-wrap">
                  <Skeleton className="h-10 w-[150px]" />
                  <Skeleton className="h-10 w-[150px]" />
                  <Skeleton className="h-10 w-[150px]" />
                  <Skeleton className="h-10 w-20" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 工单列表骨架 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TicketCheck className="h-5 w-5" />
                工单列表
              </CardTitle>
              <CardDescription>
                <Skeleton className="h-4 w-32" />
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* 表格头部 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>

                {/* 表格骨架 */}
                <div className="border rounded-lg">
                  {/* 表头 */}
                  <div className="grid grid-cols-8 gap-4 p-4 border-b bg-muted/50">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-10" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-8" />
                  </div>

                  {/* 表格行骨架 */}
                  {Array.from({ length: 10 }).map((_, index) => (
                    <div key={index} className="grid grid-cols-8 gap-4 p-4 border-b last:border-b-0">
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-32" />
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <div className="space-y-1">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-5 w-16 mx-auto" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-5 w-12 mx-auto" />
                      </div>
                      <div className="text-center">
                        <Skeleton className="h-5 w-16 mx-auto" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                      <Skeleton className="h-8 w-8" />
                    </div>
                  ))}
                </div>

                {/* 分页骨架 */}
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32" />
                  <div className="flex items-center space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-8" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}