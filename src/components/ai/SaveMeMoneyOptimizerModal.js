'use client'

import React, { useState } from 'react'
import { DollarSign, Sparkles, TrendingDown, CheckCircle2, ShoppingBag, X, Zap } from 'lucide-react'

export default function SaveMeMoneyOptimizerModal({
  isOpen,
  onClose,
  onCartApproved,
}) {
  const [budget, setBudget] = useState(30)
  const [categoryIntent, setCategoryIntent] = useState('FOOD')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleOptimize = async () => {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/save-me-money', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budgetLimit: parseFloat(budget),
          categoryIntent,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Optimization failed')

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveCart = () => {
    if (result && onCartApproved) {
      onCartApproved(result.items)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/20">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              "Save Me Money" Optimizer
            </h2>
            <p className="text-xs text-slate-500">
              Greedy Knapsack Algorithm • Flash Sales & Lowest Delivery Combos
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</div>
        )}

        {!result ? (
          <div className="space-y-4">
            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                What are you shopping for?
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['FOOD', 'GROCERY', 'PHARMACY', 'ALL'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategoryIntent(cat)}
                    className={`rounded-xl py-2.5 text-xs font-bold border transition ${
                      categoryIntent === cat
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Budget Limit Slider */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Your Budget Ceiling
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  ${budget}
                </span>
              </div>

              <input
                type="range"
                min="10"
                max="150"
                step="5"
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-400 mt-1">
                <span>$10</span>
                <span>$75</span>
                <span>$150</span>
              </div>
            </div>

            <button
              onClick={handleOptimize}
              disabled={loading}
              className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-3 text-sm font-bold text-white shadow-lg hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 transition"
            >
              {loading ? 'Solving Knapsack Optimization...' : 'Find Maximum Value Cart'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-300">
                  Optimized Cart Total
                </span>
                <span className="text-2xl font-black text-emerald-600">
                  ${result.finalTotal.toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400">
                ✓ Strict ceiling respected (Limit: ${result.budgetLimit.toFixed(2)}) • Saved ${result.totalSavings.toFixed(2)} in discounts
              </p>
            </div>

            {/* Items List */}
            <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
              {result.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-2.5 text-xs"
                >
                  <div>
                    <h5 className="font-bold text-slate-900 dark:text-white">{item.proName}</h5>
                    <span className="text-[10px] text-emerald-600 font-semibold">{item.discountApplied}</span>
                  </div>
                  <span className="font-black text-slate-800 dark:text-slate-200">${item.price.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setResult(null)}
                className="rounded-xl border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Re-adjust Budget
              </button>
              <button
                type="button"
                onClick={handleApproveCart}
                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-emerald-700 transition"
              >
                Approve & Fill Cart
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
