'use client'

import React, { useState } from 'react'
import { Camera, CheckCircle2, ShieldCheck, Upload, X } from 'lucide-react'

export default function LiveQualityCheckModal({
  isOpen,
  onClose,
  subOrder = { id: 1, subOrderNumber: 'MO-889921-S1' },
  onVerified,
}) {
  const [photoUrl, setPhotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [verifiedSubOrder, setVerifiedSubOrder] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSimulateCapture = () => {
    setPhotoUrl(`https://s3.ap-southeast-2.amazonaws.com/quickdelivery-quality/${Date.now()}_quality_check.jpg`)
  }

  const handleUpload = async () => {
    if (!photoUrl) {
      setError('Please take a verification photo or upload a clip')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/orders/quality-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subOrderId: subOrder.id,
          photoUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to submit quality check')

      setVerifiedSubOrder(data.subOrder)
      if (onVerified) onVerified(data.subOrder)
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Camera className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Live In-Store Quality Check
            </h2>
            <p className="text-xs text-slate-500">Order #{subOrder.subOrderNumber}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-600">{error}</div>
        )}

        {!verifiedSubOrder ? (
          <div className="space-y-4">
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Take a short photo or video clip of fresh produce, custom bakery cakes, or high-ticket items before courier dispatch to ensure quality guarantee.
            </p>

            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 p-8 text-center">
              <Camera className="h-10 w-10 text-slate-400 mb-2" />
              <button
                type="button"
                onClick={handleSimulateCapture}
                className="rounded-xl bg-teal-50 dark:bg-teal-950/40 px-4 py-2 text-xs font-bold text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 hover:bg-teal-100"
              >
                📸 Capture Verification Photo
              </button>
              {photoUrl && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Quality photo captured & ready for verification</span>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={loading || !photoUrl}
              className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {loading ? 'Submitting Verification...' : 'Verify Item & Mark Ready for Dispatch'}
            </button>
          </div>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Item Quality Verified!
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Order is cleared for express courier handover with full quality guarantee.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 dark:bg-white py-2.5 text-sm font-bold text-white dark:text-slate-900"
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
