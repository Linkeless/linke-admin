'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EditPlanPageProps {
  params: {
    id: string
  }
}

export default function EditPlanPage({ params: _ }: EditPlanPageProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace('/subscriptions/plans')
  }, [router])

  return null
}