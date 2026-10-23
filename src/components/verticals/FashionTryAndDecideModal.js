'use client'

import React, { useState } from 'react'
import { Sparkles, RefreshCw, CheckCircle, Ruler, Shirt, X } from 'lucide-react'

export default function FashionTryAndDecideModal({
  isOpen,
  onClose,
  product = {
    proName: 'Tailored Linen Overshirt',
    price: 68.00,
    fitGuide: [
      { size: 'S', chest: '36-38"', waist: '30-32"', length: '28"' },
      { size: 'M', chest: '39-41"', waist: '32-34"', length: '29"' },
      { size: 'L', chest: '42-44"', waist: '35-37"', length: '30"' },
      { size: 'XL', chest: '45-47"', waist: '38-40"', length: '31"' },
    ],
    availableSizes: ['S', 'M', 'L', 'XL'],
  },
  onSelectDualSizes,
}) {
  const [selectedSizes, setSelectedSizes] = useState(['M', 'L'])
  const [showFitGuide, setShowFitGuide] = useState(false)

  if (!isOpen) return null

  const handleToggleSize = (size) => {
    if (selectedSizes.includes(size)) {
      if (selectedSizes.length > 1) {
        setSelectedSizes(selectedSizes.filter((s) => s !== size))
      }
    } else {
      if (selectedSizes.length < 2) {
        setSelectedSizes([...selectedSizes, size])
      } else {
        // Replace second size
        setSelectedSizes([selectedSizes[0], size])
      }
    }
  }

  const handleConfirm = () => {
    if (onSelectDualSizes) {
      onSelectDualSizes(selectedSizes)
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
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Shirt className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Try & Decide at Home
              </h2>
              <span className="rounded-full bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 text-[10px] font-black uppercase text-purple-700 dark:text-purple-300">
                Zero Risk
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pick 2 sizes. Try both when rider arrives. Return the rejected size on the spot!
            </p>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="rounded-xl bg-purple-50 dark:bg-purple-950/30 p-3.5 space-y-1.5 border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-600 shrink-0" />
            <span>Courier waits up to 10 minutes outside while you try both sizes.</span>
          </div>
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-purple-600 shrink-0" />
            <span>Hand the unneeded size back to courier for an <strong>instant wallet refund</strong>.</span>
          </div>
        </div>

        {/* Size Selection */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Select 2 Sizes to Try ({selectedSizes.length}/2 Selected)
            </label>
            <button
              type="button"
              onClick={() => setShowFitGuide(!showFitGuide)}
              className="flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-700"
            >
              <Ruler className="h-3.5 w-3.5" />
              <span>{showFitGuide ? 'Hide Fit Guide' : 'View Fit Guide'}</span>
            </button>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {product.availableSizes?.map((size) => {
              const isSelected = selectedSizes.includes(size)
              return (
                <button
                  key={size}
                  type="button"
                  onClick={() => handleToggleSize(size)}
                  className={`rounded-xl py-3 text-sm font-bold border transition ${
                    isSelected
                      ? 'border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-500/20'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-purple-400'
                  }`}
                >
                  Size {size}
                </button>
              )
            })}
          </div>
        </div>

        {/* Fit Guide Collapsible */}
        {showFitGuide && product.fitGuide && (
          <div className="mb-4 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
            <table className="w-full text-left">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-2">Size</th>
                  <th className="p-2">Chest</th>
                  <th className="p-2">Waist</th>
                  <th className="p-2">Length</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {product.fitGuide.map((row) => (
                  <tr key={row.size} className="text-slate-700 dark:text-slate-300">
                    <td className="p-2 font-bold">{row.size}</td>
                    <td className="p-2">{row.chest}</td>
                    <td className="p-2">{row.waist}</td>
                    <td className="p-2">{row.length}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Price & Summary */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3 mb-5 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400">Total Charged at Checkout (2 Sizes)</span>
            <p className="text-base font-bold text-slate-900 dark:text-white">
              ${(product.price * selectedSizes.length).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <span className="text-emerald-600 font-semibold">Auto-Refunded on Handback</span>
            <p className="text-sm font-bold text-emerald-600">
              +${product.price.toFixed(2)} to Wallet
            </p>
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={selectedSizes.length < 2}
          className="w-full rounded-xl bg-purple-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-purple-700 disabled:opacity-50 transition"
        >
          Confirm Dual Sizes ({selectedSizes.join(' & ')}) for Try & Decide
        </button>
      </div>
    </div>
  )
}
