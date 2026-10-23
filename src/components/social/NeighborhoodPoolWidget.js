'use client'

import React, { useState, useEffect } from 'react'
import { Users, Sparkles, MapPin, Clock, CheckCircle2 } from 'lucide-react'

export default function NeighborhoodPoolWidget({
  activeCount = 2,
  windowExpiresInMinutes = 18,
  geoHash = 'tkp4x9u',
  onPoolUnlocked,
}) {
  const [count, setCount] = useState(activeCount)
  const isUnlocked = count >= 3

  useEffect(() => {
    if (isUnlocked && onPoolUnlocked) {
      onPoolUnlocked()
    }
  }, [isUnlocked, onPoolUnlocked])

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200 dark:border-indigo-900 bg-gradient-to-br from-indigo-50/70 via-white to-purple-50/70 dark:from-indigo-950/40 dark:via-slate-900 dark:to-purple-950/30 p-5 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Neighborhood Group Pooling
              </h3>
              <span className="rounded-full bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.5 text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                Zone #{geoHash.slice(0, 5)}
              </span>
            </div>
            <p className="text-xs text-slate-500">Share courier trips with nearby neighbors</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800">
          <Clock className="h-3.5 w-3.5 animate-spin" />
          <span>{windowExpiresInMinutes}m left</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5 my-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            {isUnlocked ? 'Pool Goal Achieved!' : `${count}/3 Neighbor Orders Placed`}
          </span>
          <span className="font-black text-indigo-600">
            {isUnlocked ? 'FREE DELIVERY UNLOCKED' : `${3 - count} more needed`}
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isUnlocked
                ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                : 'bg-gradient-to-r from-indigo-500 to-purple-500'
            }`}
            style={{ width: `${Math.min(100, (count / 3) * 100)}%` }}
          />
        </div>
      </div>

      {/* Benefits Banner */}
      <div className="flex items-center justify-between rounded-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-3 border border-indigo-100 dark:border-indigo-950/60 text-xs">
        <div className="flex items-center gap-2">
          {isUnlocked ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          ) : (
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          )}
          <span className="text-slate-700 dark:text-slate-300">
            {isUnlocked
              ? 'Group Discount Active: 100% Delivery Surcharge Waived + 10% Bulk Discount Applied!'
              : 'Join this 30-minute pool to eliminate delivery fee and unlock 10% group discount.'}
          </span>
        </div>

        {!isUnlocked && (
          <button
            type="button"
            onClick={() => setCount((c) => Math.min(3, c + 1))}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 font-bold text-white shadow hover:bg-indigo-700 transition shrink-0"
          >
            Pool Order
          </button>
        )}
      </div>
    </div>
  )
}
