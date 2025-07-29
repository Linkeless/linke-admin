'use client'

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Eye, Package, DollarSign, Calendar, Clock, Users, HardDrive, CheckCircle2 } from "lucide-react"

import { SubscriptionPlan, CURRENCY_CONFIG, BILLING_CYCLE_CONFIG } from "@/lib/subscription-types"

interface PlanDetailDialogProps {
  plan: SubscriptionPlan
}

export function PlanDetailDialog({ plan }: PlanDetailDialogProps) {
  const formatDate = (dateString: string): string => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const currencyConfig = CURRENCY_CONFIG[plan.currency]
  const billingCycleConfig = BILLING_CYCLE_CONFIG[plan.billing_cycle]

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Eye className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>订阅计划详情</DialogTitle>
          <DialogDescription>
            查看订阅计划的详细信息和配置
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* 基本信息 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">基本信息</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">计划名称</span>
                </div>
                <div className="ml-6 text-sm">
                  <div>{plan.name}</div>
                  {plan.code && <div className="text-muted-foreground">代码: {plan.code}</div>}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">状态</span>
                </div>
                <div className="ml-6">
                  <Badge variant={plan.status === 'active' ? "default" : "secondary"}>
                    {plan.status === 'active' ? '活跃' : '停用'}
                  </Badge>
                </div>
              </div>

              {plan.description && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">描述</span>
                  </div>
                  <div className="ml-6 text-sm text-muted-foreground">
                    {plan.description}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">定价信息</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">价格</span>
                </div>
                <div className="ml-6 text-sm">
                  <div className="text-lg font-bold">
                    {currencyConfig?.symbol || plan.currency} {plan.price}
                  </div>
                  <div className="text-muted-foreground">
                    每{billingCycleConfig?.text || plan.billing_cycle}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">有效期</span>
                </div>
                <div className="ml-6 text-sm">
                  <div>{plan.duration_days}天</div>
                </div>
              </div>

              {plan.trial_days > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">试用期</span>
                  </div>
                  <div className="ml-6 text-sm">
                    <div>{plan.trial_days}天</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 配额限制 */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">配额限制</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">流量限制</span>
                </div>
                <div className="ml-6 text-muted-foreground">
                  {plan.data_limit_gb ? `${plan.data_limit_gb}GB` : '无限制'}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">设备限制</span>
                </div>
                <div className="ml-6 text-muted-foreground">
                  {plan.device_limit ? `${plan.device_limit}台设备` : '无限制'}
                </div>
              </div>
            </div>
          </div>

          {/* 时间信息 */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">时间信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">创建时间</span>
                </div>
                <div className="ml-6 text-muted-foreground">{formatDate(plan.created_at)}</div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">更新时间</span>
                </div>
                <div className="ml-6 text-muted-foreground">{formatDate(plan.updated_at)}</div>
              </div>
            </div>
          </div>

          {/* 技术信息 */}
          <div>
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">技术信息</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">计划ID</span>
                <div className="mt-1 font-mono text-xs bg-muted p-2 rounded">{plan.id}</div>
              </div>
              {plan.code && (
                <div>
                  <span className="text-muted-foreground">计划代码</span>
                  <div className="mt-1 font-mono text-xs bg-muted p-2 rounded">{plan.code}</div>
                </div>
              )}
            </div>
          </div>

          {/* 排序信息 */}
          {plan.sort_order !== undefined && (
            <div>
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">显示配置</h4>
              <div className="text-sm">
                <span className="text-muted-foreground">排序值</span>
                <div className="mt-1">{plan.sort_order}</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}