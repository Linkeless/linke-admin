'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreateSubscriptionPage() {
  const router = useRouter()
  
  useEffect(() => {
    // 重定向到主列表页面，由主页面的对话框处理创建操作
    router.replace('/subscriptions/users')
  }, [router])

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-muted-foreground">跳转中...</p>
    </div>
  )
}