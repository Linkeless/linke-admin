'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // 根路径自动跳转到登录页
    router.replace('/login')
  }, [router])

  return null
}
