'use client'

import React, { useState } from 'react'
import { Bot, Send, Sparkles, ShoppingCart, Tag, Check, X } from 'lucide-react'

export default function AiShoppingAssistantDrawer({
  isOpen,
  onClose,
  onAddProposalToCart,
}) {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const suggestions = [
    'Family dinner for 4 under $25',
    'Outfit for summer wedding under $70',
    'Vegan grocery essentials under $30',
  ]

  const handleSearch = async (textToSearch) => {
    const q = textToSearch || query
    if (!q.trim()) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/ai/shopping-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process AI query')

      setResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Bot className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              AI Shopping Assistant
            </h2>
            <p className="text-xs text-slate-500">Natural language inventory search & cart proposals</p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="e.g. Dinner for 4 under $25..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-4 pr-10 py-3 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            className="absolute right-2 top-2.5 rounded-lg bg-purple-600 p-1.5 text-white hover:bg-purple-700 transition"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {suggestions.map((sug) => (
            <button
              key={sug}
              type="button"
              onClick={() => {
                setQuery(sug)
                handleSearch(sug)
              }}
              className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-600 transition"
            >
              ✨ {sug}
            </button>
          ))}
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</div>
        )}

        {/* Structured Results */}
        <div className="flex-1 overflow-y-auto space-y-4">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
              <Sparkles className="h-8 w-8 animate-spin text-purple-600" />
              <p className="text-xs font-semibold">Parsing intent & querying merchant inventory...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Intent Summary Badges */}
              <div className="rounded-xl bg-purple-50 dark:bg-purple-950/40 p-3.5 border border-purple-200 dark:border-purple-800 text-xs space-y-1">
                <span className="font-bold text-purple-900 dark:text-purple-200 block">
                  Extracted Shopping Parameters:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="rounded-md bg-white dark:bg-slate-900 px-2 py-0.5 font-bold text-slate-800 dark:text-slate-200">
                    Budget: ${result.parsedIntent.budget}
                  </span>
                  <span className="rounded-md bg-white dark:bg-slate-900 px-2 py-0.5 font-bold text-slate-800 dark:text-slate-200">
                    Category: {result.parsedIntent.category}
                  </span>
                  {result.parsedIntent.quantity > 1 && (
                    <span className="rounded-md bg-white dark:bg-slate-900 px-2 py-0.5 font-bold text-slate-800 dark:text-slate-200">
                      Serves: {result.parsedIntent.quantity}
                    </span>
                  )}
                  {result.parsedIntent.size && (
                    <span className="rounded-md bg-white dark:bg-slate-900 px-2 py-0.5 font-bold text-slate-800 dark:text-slate-200">
                      Size: {result.parsedIntent.size}
                    </span>
                  )}
                </div>
              </div>

              {/* Product Matches */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Curated Catalog Matches ({result.suggestedProducts.length})
                </h4>

                {result.suggestedProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 p-3 text-xs"
                  >
                    <div>
                      <h5 className="font-bold text-slate-900 dark:text-white">{p.name}</h5>
                      <span className="text-[10px] text-slate-400 uppercase">{p.vertical}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-800 dark:text-slate-200">${p.price.toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => onAddProposalToCart && onAddProposalToCart([p])}
                        className="rounded-lg bg-purple-600 p-1.5 text-white hover:bg-purple-700 transition"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
