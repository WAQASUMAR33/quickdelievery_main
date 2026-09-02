'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function BusinessTypesPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/admin/dashboard/productcategories')
  }, [router])
  return null
}
