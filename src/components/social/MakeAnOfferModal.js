'use client'

import React, { useState } from 'react'
import { Tag, Sparkles, Clock, CheckCircle2, XCircle, ArrowRight, X } from 'lucide-react'

export default function MakeAnOfferModal({
  isOpen,
  onClose,
  product = { proId: 1, proName: 'Wireless Noise-Cancelling Headphones', price: 149.00, vendorId: 'vendor_tech' },
  userId,
  onOfferSubmitted,
}) {
  const original = parseFloat(product.price) || 100.00
  const [offeredPrice, setOfferedPrice] = useState((original * 0.85).toFixed(2))
  const [loading, setLoading] = useState(false)
  const [submittedOffer, setSubmittedOffer] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const offerNum = parseFloat(offeredPrice) || 0
  const discountPct = Math.round(((original - offerNum) / original) * 100)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/social/make-an-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          productId: product.proId,
          vendorId: product.vendorId,
          originalPrice: original,
          offeredPrice: offerNum,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit offer')

      setSubmittedOffer(data.offer)
      if (onOfferSubmitted) onOfferSubmitted(data.offer)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Tag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Bargaining Mode
              </h2>
              <span className="rounded-full bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 text-[10px] font-black uppercase text-amber-700 dark:text-amber-300">
                Make an Offer
              </span>
            </div>
            <p className="text-xs text-slate-500">{product.proName}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</div>
        )}

        {!submittedOffer ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                <span>Original Catalog Price</span>
                <span className="line-through font-bold">${original.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase text-slate-700 dark:text-slate-300">
                  Your Proposed Offer
                </span>
                <span className="text-xs font-extrabold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">
                  {discountPct}% OFF
                </span>
              </div>

              <div className="relative mt-2">
                <span className="absolute left-3 top-2.5 text-lg font-bold text-slate-400">$</span>
                <input
                  type="number"
                  step="0.01"
                  min={(original * 0.5).toFixed(2)}
                  max={(original - 0.5).toFixed(2)}
                  value={offeredPrice}
                  onChange={(e) => setOfferedPrice(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 pl-8 pr-4 py-2.5 text-xl font-black text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {/* Slider helper */}
              <input
                type="range"
                min={original * 0.5}
                max={original * 0.95}
                step="0.5"
                value={offerNum}
                onChange={(e) => setOfferedPrice(parseFloat(e.target.value).toFixed(2))}
                className="w-full mt-3 accent-amber-500 cursor-pointer"
              />
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-4 w-4 text-amber-500 shrink-0" />
              <span>Merchant has 2 hours to accept, counter, or decline your offer.</span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-amber-500 py-3 text-sm font-bold text-slate-950 shadow-lg hover:bg-amber-400 disabled:opacity-50 transition"
            >
              {loading ? 'Sending Offer to Merchant...' : `Submit Offer ($${offerNum.toFixed(2)})`}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Offer Transmitted #${submittedOffer.id}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Proposed Price: <strong className="text-amber-600">${parseFloat(submittedOffer.offeredPrice).toFixed(2)}</strong> (was ${original.toFixed(2)})
              </p>
            </div>
            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
              Status: <span className="font-bold text-amber-600">PENDING MERCHANT ACCEPTANCE</span>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 dark:bg-white py-2.5 text-sm font-bold text-white dark:text-slate-900"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
