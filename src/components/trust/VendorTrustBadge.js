'use client'

import React, { useState } from 'react'
import { ShieldCheck, Star, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'

export default function VendorTrustBadge({
  trustScore = 4.88,
  totalOrders = 1240,
  cancellationRate = 0.012, // 1.2%
  avgDelayMinutes = 3.5,
  isLicenseVerified = true,
  disputeFrequency = 0.004, // 0.4%
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  const scoreNum = parseFloat(trustScore) || 5.0
  const isHighTrust = scoreNum >= 4.5

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition shadow-sm border ${
          isHighTrust
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
        }`}
      >
        <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
        <span>{scoreNum.toFixed(2)}</span>
        <span className="text-[10px] font-normal text-slate-500">/ 5.0 Trust</span>
      </button>

      {/* Popover Breakdown */}
      {showTooltip && (
        <div className="absolute left-0 bottom-full mb-2 w-72 rounded-2xl bg-white dark:bg-slate-900 p-4 shadow-2xl border border-slate-200 dark:border-slate-800 z-50 text-xs text-slate-700 dark:text-slate-300 animate-fade-in">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
              Multi-Factor Trust Score
            </span>
            <span className="font-black text-emerald-600 text-sm">{scoreNum.toFixed(2)}</span>
          </div>

          <div className="space-y-2 mt-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Government License & Hygiene:</span>
              <span className="font-semibold text-emerald-600 flex items-center gap-1">
                {isLicenseVerified ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" /> Verified
                  </>
                ) : (
                  'Pending'
                )}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Order Cancellation Rate:</span>
              <span className="font-semibold">{(cancellationRate * 100).toFixed(1)}%</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Avg Prep / SLA Delay:</span>
              <span className="font-semibold">{avgDelayMinutes.toFixed(1)} mins</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500">Dispute Frequency:</span>
              <span className="font-semibold">{(disputeFrequency * 100).toFixed(2)}%</span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              <span>Orders Evaluated:</span>
              <span>{totalOrders.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
