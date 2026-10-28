'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
const CustomerLiveTracking = dynamic(() => import('@/components/tracking/CustomerLiveTracking'), { ssr: false })
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { Package, Search, ArrowLeft, Truck, Clock } from 'lucide-react'

function TrackOrderContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { userData } = useAuth()
  const orderIdParam = searchParams.get('orderId') || searchParams.get('id')

  const [orderIdInput, setOrderIdInput] = useState(orderIdParam || '')
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [trackingOpen, setTrackingOpen] = useState(true)

  useEffect(() => {
    if (orderIdParam) {
      loadOrder(orderIdParam)
    }
  }, [orderIdParam])

  const loadOrder = async (id) => {
    if (!id) return
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/orders/${id}`)
      const json = await res.json()
      if (json.success && json.data) {
        setOrder(json.data)
        setTrackingOpen(true)
      } else {
        setError(json.error || 'Order not found')
      }
    } catch (err) {
      setError(err.message || 'Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (orderIdInput.trim()) {
      router.push(`/track?orderId=${encodeURIComponent(orderIdInput.trim())}`)
      loadOrder(orderIdInput.trim())
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4">
      {order && trackingOpen ? (
        <CustomerLiveTracking
          open={trackingOpen}
          onClose={() => setTrackingOpen(false)}
          order={order}
          currentUser={userData}
        />
      ) : null}

      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto mb-4">
          <Truck className="w-8 h-8" />
        </div>

        <h1 className="text-2xl font-black mb-2 tracking-tight">Live Order Tracking</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
          Enter your Order ID to track real-time rider GPS coordinates and estimated arrival time.
        </p>

        <form onSubmit={handleSearch} className="space-y-3 mb-6">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. 1 or ORD-1004"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 font-bold"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !orderIdInput.trim()}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
          >
            {loading ? 'Locating Order…' : 'Track Live Delivery'}
          </button>
        </form>

        {error && (
          <div className="p-3 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold">
            {error}
          </div>
        )}

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-slate-500">
          <Link href="/customer" className="hover:text-emerald-600 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Store
          </Link>
          <Link href="/orders" className="hover:text-emerald-600">
            View My Orders →
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading tracker…</div>}>
      <TrackOrderContent />
    </Suspense>
  )
}
