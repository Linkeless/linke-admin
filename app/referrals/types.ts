// 推荐系统类型定义
// 基于 swagger.json 中的 API 定义

// 基础响应类型
export interface StandardResponse<T = any> {
  code: number
  message: string
  data?: T
}

export interface PaginatedResponse<T = any> {
  code: number
  message: string
  data: T[]
  total: number
  limit: number
  offset: number
}

// 用户基础信息
export interface UserBasic {
  id: number
  username: string
  email: string
  avatar?: string
  full_name?: string
}

// 邀请码响应
export interface InviteCodeResponse {
  id: number
  code: string
  status: 'active' | 'expired' | 'used' | 'disabled'
  created_at: string
  expires_at?: string
  used_at?: string
  user_id: number
  user?: UserBasic
}

// 推荐活动响应
export interface ReferralCampaignResponse {
  id: number
  name: string
  code: string
  description?: string
  campaign_type: 'seasonal' | 'evergreen' | 'limited' | 'special'
  
  // 活动状态
  status: 'draft' | 'active' | 'paused' | 'ended'
  
  // 时间相关
  created_at: string
  updated_at: string
  starts_at?: string
  ends_at?: string
  
  // 推荐人奖励配置
  referrer_reward_type: 'fixed' | 'percentage' | 'tiered'
  referrer_reward_amount: number
  referrer_reward_currency: string
  referrer_reward_cap?: number
  
  // 被推荐人奖励配置
  referee_reward_type?: 'fixed' | 'percentage' | 'discount'
  referee_reward_amount?: number
  referee_reward_currency?: string
  
  // 限制条件
  max_referrals?: number
  min_referrals?: number
  requires_approval: boolean
  
  // 统计数据
  total_referrals: number
  conversion_rate: number
  
  // 关联用户
  created_by_id: number
  created_by?: UserBasic
  
  // 关联推荐记录
  referrals?: ReferralResponse[]
}

// 推荐记录响应
export interface ReferralResponse {
  id: number
  
  // 推荐关系
  referrer_id: number
  referrer?: UserBasic
  referee_id: number
  referee?: UserBasic
  
  // 推荐活动
  campaign_id: number
  campaign?: ReferralCampaignResponse
  
  // 邀请码
  invite_code_id?: number
  invite_code?: InviteCodeResponse
  
  // 推荐状态
  status: 'pending' | 'approved' | 'rejected' | 'paid'
  
  // 推荐来源
  referral_source: string // 'website' | 'app' | 'email' | 'social'
  referral_channel: string // 'organic' | 'paid' | 'social' | 'email'
  referral_code?: string
  
  // 点击和转化数据
  click_count: number
  first_click_at?: string
  last_click_at?: string
  
  // 转化信息
  conversion_type?: 'subscription' | 'purchase' | 'signup'
  conversion_value?: number
  converted_at?: string
  
  // 奖励信息
  reward_amount?: number
  reward_currency?: string
  reward_status?: 'pending' | 'approved' | 'paid' | 'cancelled'
  
  // 审批相关
  approved_at?: string
  approved_by_id?: number
  approved_by?: UserBasic
  rejected_at?: string
  rejected_by_id?: number
  rejected_by?: UserBasic
  rejection_reason?: string
  
  // 支付相关
  paid_at?: string
  paid_by_id?: number
  paid_by?: UserBasic
  payout_reference?: string
  
  // 时间戳
  created_at: string
  updated_at: string
  expires_at?: string
  
  // 关联数据
  referral_events?: ReferralEventResponse[]
  referral_rewards?: ReferralRewardResponse[]
}

// 推荐事件响应
export interface ReferralEventResponse {
  id: number
  referral_id: number
  referral?: ReferralResponse
  
  event_type: 'click' | 'signup' | 'conversion' | 'approval' | 'payment'
  event_data?: Record<string, any>
  
  user_agent?: string
  ip_address?: string
  referrer_url?: string
  
  user_id?: number
  user?: UserBasic
  
  created_at: string
  updated_at: string
}

// 推荐奖励响应
export interface ReferralRewardResponse {
  id: number
  referral_id: number
  referral?: ReferralResponse
  
  campaign_id: number
  campaign?: ReferralCampaignResponse
  
  reward_type: 'referrer' | 'referee'
  amount: number
  currency: string
  
  status: 'pending' | 'approved' | 'paid' | 'cancelled'
  description?: string
  
  approved_at?: string
  approved_by_id?: number
  approved_by?: UserBasic
  
  paid_at?: string
  paid_by_id?: number
  paid_by?: UserBasic
  
  created_at: string
  updated_at: string
}

// 请求类型
export interface CreateReferralRequest {
  referrer_id: number
  referee_id: number
  campaign_id: number
  invite_code_id?: number
  referral_source: string
  referral_channel: string
  referral_code?: string
  referral_reward_amount?: number
  referral_reward_currency?: string
}

export interface UpdateReferralRequest {
  status?: 'pending' | 'approved' | 'rejected' | 'paid'
  reward_amount?: number
  reward_currency?: string
  notes?: string
}

export interface ApproveReferralRequest {
  reward_amount: number
  reward_currency: string
  notes?: string
}

export interface RejectReferralRequest {
  rejection_reason: string
  notes?: string
}

export interface PayoutReferralRequest {
  payout_reference: string
  notes?: string
}

export interface BulkReferralRequest {
  referral_ids: number[]
  action: 'approve' | 'reject' | 'payout'
  reason?: string
  reward_amount?: number
  reward_currency?: string
  payout_reference?: string
}

export interface CreateReferralCampaignRequest {
  name: string
  code: string
  description?: string
  campaign_type: 'seasonal' | 'evergreen' | 'limited' | 'special'
  
  starts_at?: string
  ends_at?: string
  
  referrer_reward_type: 'fixed' | 'percentage' | 'tiered'
  referrer_reward_amount: number
  referrer_reward_currency: string
  referrer_reward_cap?: number
  
  referee_reward_type?: 'fixed' | 'percentage' | 'discount'
  referee_reward_amount?: number
  referee_reward_currency?: string
  
  max_referrals?: number
  min_referrals?: number
  requires_approval: boolean
}

// 查询参数
export interface ReferralQueryParams {
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  
  // 筛选参数
  status?: 'pending' | 'approved' | 'rejected' | 'paid'
  campaign_id?: number
  referrer_id?: number
  referee_id?: number
  reward_status?: 'pending' | 'approved' | 'paid' | 'cancelled'
  
  // 时间筛选
  created_from?: string
  created_to?: string
  converted_from?: string
  converted_to?: string
}

export interface CampaignQueryParams {
  limit?: number
  offset?: number
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  
  status?: 'draft' | 'active' | 'paused' | 'ended'
  campaign_type?: 'seasonal' | 'evergreen' | 'limited' | 'special'
  
  created_from?: string
  created_to?: string
}

// 统计类型
export interface ReferralStatistics {
  total_referrals: number
  pending_referrals: number
  approved_referrals: number
  rejected_referrals: number
  paid_referrals: number
  
  total_clicks: number
  total_conversions: number
  conversion_rate: number
  
  total_reward_amount: number
  pending_reward_amount: number
  paid_reward_amount: number
  
  top_referrers: Array<{
    user: UserBasic
    referral_count: number
    total_reward: number
  }>
  
  campaign_performance: Array<{
    campaign: ReferralCampaignResponse
    referral_count: number
    conversion_rate: number
    total_reward: number
  }>
}

export interface ReferralAnalytics {
  overview: {
    total_referrals: number
    total_conversions: number
    total_revenue: number
    average_conversion_value: number
  }
  
  trends: {
    period: string
    referrals: number
    conversions: number
    revenue: number
  }[]
  
  channels: {
    channel: string
    referrals: number
    conversions: number
    conversion_rate: number
  }[]
  
  campaigns: {
    campaign: ReferralCampaignResponse
    performance: {
      referrals: number
      conversions: number
      revenue: number
      roi: number
    }
  }[]
}

// 推荐系统状态选项
export const REFERRAL_STATUSES = [
  { value: 'pending', label: '待审核', color: 'orange' },
  { value: 'approved', label: '已批准', color: 'green' },
  { value: 'rejected', label: '已拒绝', color: 'red' },
  { value: 'paid', label: '已支付', color: 'blue' }
] as const

export const CAMPAIGN_STATUSES = [
  { value: 'draft', label: '草稿', color: 'gray' },
  { value: 'active', label: '进行中', color: 'green' },
  { value: 'paused', label: '已暂停', color: 'orange' },
  { value: 'ended', label: '已结束', color: 'red' }
] as const

export const CAMPAIGN_TYPES = [
  { value: 'seasonal', label: '季节性', description: '限时季节性推广活动' },
  { value: 'evergreen', label: '常规', description: '长期持续的推广活动' },
  { value: 'limited', label: '限量', description: '限制数量的特殊活动' },
  { value: 'special', label: '特殊', description: '特殊场合或事件活动' }
] as const

export const REWARD_TYPES = [
  { value: 'fixed', label: '固定金额', description: '固定的奖励金额' },
  { value: 'percentage', label: '百分比', description: '按比例计算奖励' },
  { value: 'tiered', label: '阶梯式', description: '根据推荐数量阶梯奖励' }
] as const