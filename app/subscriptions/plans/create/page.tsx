'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function CreatePlanPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/subscriptions/plans')
  }, [router])

  return null
}