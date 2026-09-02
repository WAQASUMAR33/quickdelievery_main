'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessCategoriesPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/dashboard/categories')
  }, [router])
  return null
}
