'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const WhatsAppWidget = dynamic(() => import('@/components/customer/WhatsAppWidget'), { ssr: false })
const AIAssistantWidget = dynamic(() => import('@/components/customer/AIAssistantWidget'), { ssr: false })

export default function FloatingWidgets() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Defer heavy floating chat widgets until browser is idle,
    // keeping framer-motion and chat listeners out of critical first paint & TBT.
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = requestIdleCallback(() => setMounted(true), { timeout: 3500 })
      return () => cancelIdleCallback(id)
    }
    const timer = setTimeout(() => setMounted(true), 2000)
    return () => clearTimeout(timer)
  }, [])

  if (!mounted) return null

  return (
    <>
      <WhatsAppWidget />
      <AIAssistantWidget />
    </>
  )
}

