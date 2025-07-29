'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface EditSubscriptionPageProps {
  params: {
    id: string
  }
}

export default function EditSubscriptionPage({ params: _ }: EditSubscriptionPageProps) {
  const router = useRouter()

  useEffect(() => {
    router.replace('/subscriptions/users')
  }, [router])

  return null
}