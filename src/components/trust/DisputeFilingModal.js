'use client'

import React, { useState } from 'react'
import { AlertOctagon, Camera, Video, ShieldAlert, CheckCircle, X, Lock } from 'lucide-react'

export default function DisputeFilingModal({
  isOpen,
  onClose,
  subOrder = { id: 1, subOrderNumber: 'MO-889921-S1', subtotal: 34.50 },
  userId,
  onDisputeFiled,
}) {
  const [reason, setReason] = useState('DAMAGED')
  const [evidenceUrl, setEvidenceUrl] = useState('')
  const [isVideo, setIsVideo] = useState(false)
  const [loading, setLoading] = useState(false)
  const [filedDispute, setFiledDispute] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSimulateEvidence = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const isVid = file.type.startsWith('video')
      setIsVideo(isVid)
      setEvidenceUrl(`https://s3.ap-southeast-2.amazonaws.com/quickdelivery-disputes/${Date.now()}_${file.name}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/orders/disputes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subOrderId: subOrder.id,
          userId,
          reason,
          evidencePhotoUrl: !isVideo ? (evidenceUrl || 'https://s3.ap-southeast-2.amazonaws.com/quickdelivery-disputes/sample_damage.jpg') : null,
          evidenceVideoUrl: isVideo ? evidenceUrl : null,
          refundAmount: subOrder.subtotal,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to file dispute')

      setFiledDispute(data.dispute)
      if (onDisputeFiled) onDisputeFiled(data.dispute)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertOctagon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              File Service Guarantee Dispute
            </h2>
            <p className="text-xs text-slate-500">
              Order #{subOrder.subOrderNumber} • Claim: ${parseFloat(subOrder.subtotal).toFixed(2)}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 border border-red-200 dark:border-red-900">
            {error}
          </div>
        )}

        {!filedDispute ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Automatic Escrow Hold Guarantee Badge */}
            <div className="rounded-xl bg-blue-50 dark:bg-blue-950/40 p-3.5 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 flex items-start gap-2.5">
              <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Instant Merchant Escrow Hold:</strong>
                Filing a dispute instantly locks the merchant's payout in platform escrow until inspection is complete.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Dispute Reason *
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-red-500"
              >
                <option value="DAMAGED">Damaged / Leaked Item</option>
                <option value="EXPIRED">Expired / Stale Food</option>
                <option value="MISSING_ITEMS">Missing Items from Package</option>
                <option value="WRONG_ITEM">Incorrect Item Received</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Attach Photographic or Video Proof *
              </label>
              <div className="flex justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 pt-5 pb-6 hover:border-red-500 transition">
                <div className="space-y-1 text-center">
                  <div className="flex justify-center gap-2 text-slate-400">
                    <Camera className="h-6 w-6" />
                    <Video className="h-6 w-6" />
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-400">
                    <label className="relative cursor-pointer font-bold text-red-600 hover:text-red-500">
                      <span>Upload photos/videos</span>
                      <input type="file" className="sr-only" onChange={handleSimulateEvidence} accept="image/*,video/*" />
                    </label>
                  </div>
                  <p className="text-[11px] text-slate-400">High-resolution images or short video proof</p>
                  {evidenceUrl && (
                    <p className="text-xs text-emerald-600 font-bold mt-1">✓ Evidence uploaded</p>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-red-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-red-700 disabled:opacity-50 transition"
            >
              {loading ? 'Submitting & Applying Escrow Hold...' : 'Submit Dispute & Lock Merchant Payout'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600">
              <CheckCircle className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Dispute Registered #{filedDispute.id}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Merchant payout of ${parseFloat(filedDispute.refundAmount).toFixed(2)} has been placed on <strong>escrow hold</strong>.
              </p>
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
