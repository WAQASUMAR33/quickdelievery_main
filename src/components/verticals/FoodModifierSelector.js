'use client'

import React, { useState } from 'react'
import { Utensils, Clock, Flame, ShieldAlert, Check } from 'lucide-react'

export default function FoodModifierSelector({
  product = {
    proName: 'Gourmet Truffle Smash Burger',
    price: 14.50,
    prepTimeMinutes: 20,
    dietaryBadges: 'HALAL',
    allergens: 'Dairy, Gluten',
    modifiers: [
      {
        id: 'patty_temp',
        name: 'Patty Cook Temp',
        required: true,
        type: 'SINGLE',
        options: [
          { id: 'opt_med', name: 'Medium Well', additionalPrice: 0.00 },
          { id: 'opt_well', name: 'Well Done', additionalPrice: 0.00 },
        ],
      },
      {
        id: 'toppings',
        name: 'Extra Toppings',
        required: false,
        type: 'MULTIPLE',
        options: [
          { id: 'opt_bacon', name: 'Crispy Halal Beef Bacon', additionalPrice: 2.50 },
          { id: 'opt_cheese', name: 'Melted Aged Cheddar', additionalPrice: 1.50 },
          { id: 'opt_truffle', name: 'Extra Black Truffle Mayo', additionalPrice: 1.25 },
        ],
      },
    ],
  },
  onAddToCart,
}) {
  const [selectedSingle, setSelectedSingle] = useState({
    patty_temp: 'opt_well',
  })
  const [selectedMultiple, setSelectedMultiple] = useState({
    opt_cheese: true,
  })
  const [spiceLevel, setSpiceLevel] = useState('Medium')
  const [cookingInstructions, setCookingInstructions] = useState('')

  // Calculate dynamic price
  const basePrice = parseFloat(product.price) || 0
  let extraModifiersCost = 0

  product.modifiers?.forEach((group) => {
    group.options?.forEach((opt) => {
      if (group.type === 'SINGLE' && selectedSingle[group.id] === opt.id) {
        extraModifiersCost += opt.additionalPrice || 0
      } else if (group.type === 'MULTIPLE' && selectedMultiple[opt.id]) {
        extraModifiersCost += opt.additionalPrice || 0
      }
    })
  })

  const totalPrice = (basePrice + extraModifiersCost).toFixed(2)

  const handleToggleMulti = (optId) => {
    setSelectedMultiple((prev) => ({
      ...prev,
      [optId]: !prev[optId],
    }))
  }

  const handleConfirm = () => {
    const selectedMods = []
    product.modifiers?.forEach((group) => {
      group.options?.forEach((opt) => {
        if (group.type === 'SINGLE' && selectedSingle[group.id] === opt.id) {
          selectedMods.push({ group: group.name, ...opt })
        } else if (group.type === 'MULTIPLE' && selectedMultiple[opt.id]) {
          selectedMods.push({ group: group.name, ...opt })
        }
      })
    })

    if (onAddToCart) {
      onAddToCart({
        ...product,
        totalPrice: parseFloat(totalPrice),
        selectedModifiers: selectedMods,
        cookingInstructions,
        spiceLevel,
      })
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-w-lg w-full">
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            {product.dietaryBadges?.split(',').map((badge) => (
              <span
                key={badge}
                className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              >
                ✓ {badge.trim()}
              </span>
            ))}
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
              <Clock className="h-3 w-3" /> {product.prepTimeMinutes || 20}m prep
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{product.proName}</h3>
          <p className="text-sm font-semibold text-teal-600 mt-1">${basePrice.toFixed(2)} base</p>
        </div>
      </div>

      {product.allergens && (
        <div className="my-4 flex items-center gap-2 rounded-xl bg-orange-50 dark:bg-orange-950/30 p-2.5 text-xs text-orange-800 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
          <ShieldAlert className="h-4 w-4 shrink-0 text-orange-600" />
          <span>Allergen Warning: Contains <strong>{product.allergens}</strong></span>
        </div>
      )}

      {/* Modifier Groups */}
      <div className="space-y-4 my-4">
        {product.modifiers?.map((group) => (
          <div key={group.id} className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              {group.name} {group.required && <span className="text-red-500">*</span>}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {group.options?.map((opt) => {
                const isSelected =
                  group.type === 'SINGLE'
                    ? selectedSingle[group.id] === opt.id
                    : selectedMultiple[opt.id]

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() =>
                      group.type === 'SINGLE'
                        ? setSelectedSingle({ ...selectedSingle, [group.id]: opt.id })
                        : handleToggleMulti(opt.id)
                    }
                    className={`flex items-center justify-between rounded-xl p-3 text-sm font-medium transition border ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/40 dark:bg-teal-950/30 text-teal-900 dark:text-teal-200'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-4 w-4 rounded-full flex items-center justify-center border ${
                          isSelected ? 'border-teal-600 bg-teal-600 text-white' : 'border-slate-300'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                      </div>
                      <span>{opt.name}</span>
                    </div>
                    {opt.additionalPrice > 0 && (
                      <span className="text-xs font-semibold text-slate-500">
                        +${opt.additionalPrice.toFixed(2)}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}

        {/* Spice Level */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            <Flame className="h-3.5 w-3.5 text-red-500" /> Spice Level
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Mild', 'Medium', 'Hot'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setSpiceLevel(lvl)}
                className={`rounded-xl py-2 text-xs font-semibold border transition ${
                  spiceLevel === lvl
                    ? 'border-red-500 bg-red-50 dark:bg-red-950/40 text-red-600'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Special Cooking Instructions */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
            Kitchen Cooking Notes
          </label>
          <input
            type="text"
            value={cookingInstructions}
            onChange={(e) => setCookingInstructions(e.target.value)}
            placeholder="e.g. Sauce on the side, extra crispy fries..."
            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Footer with Dynamic Price & Add */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400">Total Price</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white">${totalPrice}</p>
        </div>
        <button
          onClick={handleConfirm}
          className="flex-1 rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-teal-700 transition"
        >
          Add to Cart with Modifiers
        </button>
      </div>
    </div>
  )
}
