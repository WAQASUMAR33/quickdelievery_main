'use client'

import React, { useState, useEffect } from 'react'
import {
  Layers,
  MapPin,
  Clock,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Navigation,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function DriverBatchDispatches({ driverId, onBatchAccepted }) {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [acceptingIdx, setAcceptingIdx] = useState(null)

  const fetchBatches = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/driver/dispatch/batching')
      const data = await res.json()
      if (data.success) {
        setBatches(data.batch_assignment || [])
      }
    } catch (err) {
      console.error('Failed to load batch dispatches:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
    const timer = setInterval(fetchBatches, 45000) // 45-second polling window from SKILL.md
    return () => clearInterval(timer)
  }, [])

  const handleAcceptBatch = async (batch, idx) => {
    setAcceptingIdx(idx)
    try {
      // Assign both target orders to driver
      for (const step of batch.routing_steps) {
        if (step.action === 'PICKUP') {
          const rawId = step.target_order_id.replace('ORD-', '')
          await fetch('/api/driver/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderId: rawId,
              driverId,
              status: 'SHIPPED',
            }),
          })
        }
      }

      toast.success('🎉 Batched Multiple Order Stack Accepted! +2x Earnings')
      fetchBatches()
      if (onBatchAccepted) onBatchAccepted()
    } catch (err) {
      toast.error('Failed to accept batched orders')
    } finally {
      setAcceptingIdx(null)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-500 dark:text-slate-400 gap-3">
        <RefreshCw className="h-7 w-7 animate-spin text-emerald-500" />
        <p className="text-sm font-medium">Running spatial grid filter & route path sequencing...</p>
      </div>
    )
  }

  if (batches.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 mb-3">
          <Layers className="h-7 w-7" />
        </div>
        <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
          No Batched Trips Available in Your Zone Right Now
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-4">
          Automated multi-order stacking checks incoming orders every 45s. Orders with kitchen prep diff &le; 7m and detour &le; 3.5km are combined here.
        </p>
        <button
          onClick={fetchBatches}
          className="rounded-xl border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Refresh Dispatch Pool
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            Smart Multi-Order Stacked Trips ({batches.length})
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Combined delivery routes with minimal detour distance for maximum rider earnings per hour
          </p>
        </div>
        <button
          onClick={fetchBatches}
          className="rounded-lg p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {batches.map((batch, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-emerald-200 dark:border-emerald-900/60 bg-gradient-to-br from-white via-white to-emerald-50/40 dark:from-[#0F172A] dark:via-[#0F172A] dark:to-emerald-950/20 p-5 shadow-lg space-y-4"
          >
            {/* Header Badge */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-2.5 py-0.5 text-xs font-black text-emerald-800 dark:text-emerald-200 uppercase">
                  ⚡ 2-Order Stack
                </span>
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  Zone: #{batch.geo_cell?.slice(0, 5)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="h-4 w-4" />
                <span>Double Trip Fare</span>
              </div>
            </div>

            {/* Quality Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Detour Distance</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{batch.detour_km} km (Limit: &le;3.5km)</span>
              </div>
              <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-2.5 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 dark:text-slate-400 block text-[10px] uppercase font-bold">Kitchen Prep Gap</span>
                <span className="font-extrabold text-slate-800 dark:text-slate-100">{batch.prep_time_diff_min} mins (Limit: &le;7m)</span>
              </div>
            </div>

            {/* 4-Step Route Sequence */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                Optimized Delivery Route Sequence
              </span>
              <div className="space-y-1.5 text-xs">
                {batch.routing_steps?.map((step) => (
                  <div
                    key={step.step_index}
                    className="flex items-center justify-between rounded-xl bg-white dark:bg-slate-800 p-2.5 border border-slate-200 dark:border-slate-700"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-black ${
                          step.action === 'PICKUP'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                        }`}
                      >
                        {step.step_index}
                      </span>
                      <strong className={step.action === 'PICKUP' ? 'text-amber-700 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}>
                        {step.action}:
                      </strong>
                      <span className="text-slate-800 dark:text-slate-100 truncate max-w-[180px]">
                        {step.location_name}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {step.target_order_id}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleAcceptBatch(batch, idx)}
              disabled={acceptingIdx === idx}
              className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 disabled:opacity-50 transition"
            >
              {acceptingIdx === idx ? 'Assigning Stacked Route...' : 'Accept 2-Order Stack & Start Route'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
