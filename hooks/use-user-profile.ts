'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

export interface UserProfile {
  id: number
  email: string
  name?: string
  username?: string
  avatar?: string
  role: 'user' | 'admin' | 'system'
  status: 'active' | 'inactive' | 'suspended' | 'banned'
  created_at: string
  updated_at: string
}

interface UserProfileResponse {
  code: number
  message: string
  data: UserProfile
}

export function useUserProfile() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUserProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response: UserProfileResponse = await api.get('/user/profile')
      
      if (response.code === 0 && response.data) {
        setUser(response.data)
      } else {
        setError(response.message || '获取用户信息失败')
      }
    } catch (err) {
      console.error('获取用户信息失败:', err)
      setError('获取用户信息失败')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const refetch = () => {
    fetchUserProfile()
  }

  return {
    user,
    loading,
    error,
    refetch
  }
}