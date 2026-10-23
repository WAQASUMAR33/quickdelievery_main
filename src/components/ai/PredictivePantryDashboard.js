'use client'

import React, { useState } from 'react'
import { Repeat, Calendar, PackageCheck, AlertCircle, Play, Pause, Plus } from 'lucide-react'

export default function PredictivePantryDashboard({
  subscriptions = [
    {
      id: 1,
      productName: 'Organic Whole Milk 1 Gallon',
      frequencyDays: 7,
      quantity: 2,
      price: 4.50,
      nextReplenishDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      autoApprove: true,
    },
    {
      id: 2,
      productName: 'Premium Dry Cat Food (Salmon & Tuna, 5kg)',
      frequencyDays: 21,
      quantity: 1,
      price: 24.99,
      nextReplenishDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      autoApprove: false,
    },
    {
      id: 3,
      productName: 'Eco-Friendly Laundry Pods 48ct',
      frequencyDays: 30,
      quantity: 1,
      price: 18.50,
      nextReplenishDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'ACTIVE',
      autoApprove: true,
    },
  ],
  onTriggerInstantRestock,
}) {
  const [items, setItems] = useState(subscriptions)

  const toggleStatus = (id) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
          : item
      )
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-w-xl w-full">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Repeat className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Predictive Pantry Replenishment
            </h3>
            <p className="text-xs text-slate-500">Automated cycle restocks for household essentials</p>
          </div>
        </div>
      </div>

      <div className="space-y-3 my-4">
        {items.map((sub) => {
          const daysAway = Math.round(
            (new Date(sub.nextReplenishDate) - new Date()) / (24 * 60 * 60 * 1000)
          )

          return (
            <div
              key={sub.id}
              className={`rounded-2xl border p-4 transition ${
                sub.status === 'ACTIVE'
                  ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30'
                  : 'border-slate-100 dark:border-slate-800/40 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        sub.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {sub.productName}
                    </h4>
                  </div>
                  <p className="text-xs text-slate-500">
                    Cycle: Every <strong>{sub.frequencyDays} days</strong> • Qty: {sub.quantity} (${(sub.price * sub.quantity).toFixed(2)})
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleStatus(sub.id)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                >
                  {sub.status === 'ACTIVE' ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </button>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-teal-600 font-semibold">
                  <Calendar className="h-3.5 w-3.5" />
                  Next delivery in {daysAway} days ({new Date(sub.nextReplenishDate).toLocaleDateString()})
                </span>

                <button
                  type="button"
                  onClick={() => onTriggerInstantRestock && onTriggerInstantRestock(sub)}
                  className="rounded-lg bg-teal-600 px-3 py-1 font-bold text-white hover:bg-teal-700 transition"
                >
                  Restock Now
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
