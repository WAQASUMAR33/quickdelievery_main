'use client'

import OrderHistory from '@/components/customer/OrderHistory'
import Link from 'next/link'
import { ArrowLeft, ShoppingBag } from 'lucide-react'

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/customer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Store
          </Link>
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Customer Orders</span>
          </div>
        </div>
        <OrderHistory />
      </div>
    </div>
  )
}
