'use client'

import { DataTable } from '@/components/ui/data-table'
import { ReferralCampaignResponse } from '../../types'
import { createColumns } from '../columns'

interface CampaignTableProps {
  data: ReferralCampaignResponse[]
  loading?: boolean
  onViewDetail?: (campaignId: number) => void
  onEdit?: (campaignId: number) => void
  onToggleStatus?: (campaignId: number, status: 'active' | 'paused') => void
  onEndCampaign?: (campaignId: number) => void
  onCampaignUpdated?: () => void
}

export function CampaignTable({
  data,
  loading = false,
  onViewDetail,
  onEdit,
  onToggleStatus,
  onEndCampaign,
  onCampaignUpdated,
}: CampaignTableProps) {
  const columns = createColumns({
    onViewDetail,
    onEdit,
    onToggleStatus,
    onEndCampaign,
    onCampaignUpdated,
  })

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-gray-100 rounded animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <DataTable
      columns={columns}
      data={data}
      searchKey="name"
      searchPlaceholder="搜索活动名称或代码..."
    />
  )
}