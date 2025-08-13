'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

import { CreateReferralCampaignRequest } from '../../types'
import { CampaignForm } from '../components'

export default function CreateCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: CreateReferralCampaignRequest) => {
    try {
      setLoading(true)
      
      // 模拟API调用
      console.log('Creating campaign:', data)
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast.success('营销活动创建成功！')
      router.push('/referrals/campaigns')
      
    } catch (error) {
      console.error('创建活动失败:', error)
      toast.error('创建活动失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center gap-4">
        <Button 
          variant="outline" 
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">创建推广活动</h1>
          <p className="text-muted-foreground">
            配置新的推荐营销活动参数和奖励规则
          </p>
        </div>
      </div>

      {/* 创建表单 */}
      <Card>
        <CardHeader>
          <CardTitle>活动配置</CardTitle>
          <CardDescription>
            请填写以下信息来创建新的推荐营销活动
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CampaignForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  )
}