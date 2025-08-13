'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, Play, Pause, Square, ChevronsUpDown, Copy } from 'lucide-react'
import { ReferralCampaignResponse } from '../types'
import { toast } from 'sonner'

interface ColumnsProps {
  onViewDetail?: (campaignId: number) => void
  onEdit?: (campaignId: number) => void
  onToggleStatus?: (campaignId: number, status: 'active' | 'paused') => void
  onEndCampaign?: (campaignId: number) => void
  onCampaignUpdated?: () => void
}

export function createColumns({
  onViewDetail,
  onEdit,
  onToggleStatus,
  onEndCampaign,
  onCampaignUpdated,
}: ColumnsProps): ColumnDef<ReferralCampaignResponse>[] {
  
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">进行中</Badge>
      case 'paused':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">已暂停</Badge>
      case 'ended':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">已结束</Badge>
      case 'draft':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">草稿</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'seasonal':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">季节性</Badge>
      case 'evergreen':
        return <Badge variant="default" className="bg-green-100 text-green-800">常规</Badge>
      case 'limited':
        return <Badge variant="destructive" className="bg-purple-100 text-purple-800">限量</Badge>
      case 'special':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">特殊</Badge>
      default:
        return <Badge variant="outline">{type}</Badge>
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('已复制到剪贴板')
  }

  return [
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            活动名称
            <ChevronsUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{campaign.name}</div>
            <div className="text-xs text-muted-foreground">
              代码: {campaign.code}
              <Button
                variant="ghost"
                size="sm"
                className="h-auto p-1 ml-1"
                onClick={() => copyToClipboard(campaign.code)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            {campaign.description && (
              <div className="text-xs text-muted-foreground max-w-xs truncate">
                {campaign.description}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'status',
      header: '状态',
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <div className="space-y-1">
            {getStatusBadge(campaign.status)}
            {getTypeBadge(campaign.campaign_type)}
          </div>
        )
      },
    },
    {
      accessorKey: 'referrer_reward_amount',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            推荐人奖励
            <ChevronsUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const campaign = row.original
        const formatReward = () => {
          if (campaign.referrer_reward_type === 'percentage') {
            return `${campaign.referrer_reward_amount}%`
          } else {
            return `${campaign.referrer_reward_currency} ${campaign.referrer_reward_amount}`
          }
        }
        
        return (
          <div className="space-y-1">
            <div className="font-medium">{formatReward()}</div>
            <div className="text-xs text-muted-foreground">
              类型: {campaign.referrer_reward_type === 'fixed' ? '固定' : 
                    campaign.referrer_reward_type === 'percentage' ? '百分比' : '阶梯'}
            </div>
            {campaign.referrer_reward_cap && (
              <div className="text-xs text-muted-foreground">
                上限: {campaign.referrer_reward_currency} {campaign.referrer_reward_cap}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'total_referrals',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            推荐数据
            <ChevronsUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <div className="space-y-1">
            <div className="font-medium">{campaign.total_referrals} 个推荐</div>
            <div className="text-xs text-muted-foreground">
              转化率: {(campaign.conversion_rate * 100).toFixed(1)}%
            </div>
            {campaign.max_referrals && (
              <div className="text-xs text-muted-foreground">
                限制: {campaign.max_referrals} 个
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
            className="h-auto p-0 font-medium hover:bg-transparent"
          >
            时间信息
            <ChevronsUpDown className="ml-2 h-3 w-3" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const campaign = row.original
        const formatDate = (dateString: string) => {
          return new Date(dateString).toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })
        }
        
        return (
          <div className="space-y-1">
            <div className="font-medium">创建: {formatDate(campaign.created_at)}</div>
            {campaign.starts_at && (
              <div className="text-xs text-muted-foreground">
                开始: {formatDate(campaign.starts_at)}
              </div>
            )}
            {campaign.ends_at && (
              <div className="text-xs text-muted-foreground">
                结束: {formatDate(campaign.ends_at)}
              </div>
            )}
          </div>
        )
      },
    },
    {
      accessorKey: 'created_by',
      header: '创建者',
      cell: ({ row }) => {
        const campaign = row.original
        return (
          <div className="space-y-1">
            {campaign.created_by ? (
              <>
                <div className="font-medium">{campaign.created_by.username}</div>
                <div className="text-xs text-muted-foreground">{campaign.created_by.email}</div>
              </>
            ) : (
              <div className="text-xs text-muted-foreground">未知用户</div>
            )}
          </div>
        )
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const campaign = row.original
        
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">打开菜单</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>操作</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => onViewDetail?.(campaign.id)}>
                <Eye className="mr-2 h-4 w-4" />
                查看详情
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => onEdit?.(campaign.id)}>
                <Edit className="mr-2 h-4 w-4" />
                编辑活动
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              {campaign.status === 'active' && (
                <DropdownMenuItem onClick={() => onToggleStatus?.(campaign.id, 'paused')}>
                  <Pause className="mr-2 h-4 w-4" />
                  暂停活动
                </DropdownMenuItem>
              )}
              
              {campaign.status === 'paused' && (
                <DropdownMenuItem onClick={() => onToggleStatus?.(campaign.id, 'active')}>
                  <Play className="mr-2 h-4 w-4" />
                  恢复活动
                </DropdownMenuItem>
              )}
              
              {(campaign.status === 'active' || campaign.status === 'paused') && (
                <DropdownMenuItem 
                  onClick={() => onEndCampaign?.(campaign.id)}
                  className="text-red-600"
                >
                  <Square className="mr-2 h-4 w-4" />
                  结束活动
                </DropdownMenuItem>
              )}
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem onClick={() => copyToClipboard(campaign.code)}>
                <Copy className="mr-2 h-4 w-4" />
                复制代码
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]
}