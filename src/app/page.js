'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { getUserRole } from '@/lib/authHelpers'

function HomeContent() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!loading) {
      if (user && user.emailVerified) {
        // Check user role and redirect accordingly
        if (userData) {
          const userRole = getUserRole(userData)

          if (userRole === 'ADMIN') {
            router.push('/dashboard')
          } else if (userRole === 'VENDOR') {
            router.push('/vendor-dashboard')
          } else if (userRole === 'CUSTOMER') {
            router.push('/customer')
          } else {
            router.push('/login')
          }
        } else {
          // Don't redirect immediately, wait for userData to load
        }
      } else {
        router.push('/login')
      }
    }
  }, [user, userData, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return null
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  )
}