'use client'

import React, { useState } from 'react'
import { Play, Pause, ShoppingBag, Heart, Eye, ChevronRight } from 'lucide-react'

export default function ShoppableVideoFeed({
  videos = [
    {
      id: 1,
      title: 'Truffle Burger ASMR & Kitchen Sizzle',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-serving-a-hamburger-with-french-fries-41604-large.mp4',
      vendorName: 'Gourmet Truffle Burger Co.',
      product: {
        id: 101,
        name: 'Black Truffle Smash Burger',
        price: 16.50,
        image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500',
      },
      likes: 1420,
      views: 18400,
    },
    {
      id: 2,
      title: 'Summer Linen Outfit Try-On & Fit Check',
      videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-modelling-in-a-studio-setting-42777-large.mp4',
      vendorName: 'Urban Chic Studio',
      product: {
        id: 102,
        name: 'Oversized Pastel Linen Shirt',
        price: 49.99,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
      },
      likes: 2890,
      views: 34100,
    },
  ],
  onAddToCart,
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [likedMap, setLikedMap] = useState({})

  const current = videos[activeIdx] || videos[0]

  const handleLike = (id) => {
    setLikedMap((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  return (
    <div className="relative mx-auto max-w-sm h-[600px] rounded-3xl overflow-hidden bg-black shadow-2xl border border-slate-800">
      {/* Background Video */}
      <video
        key={current.videoUrl}
        src={current.videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover"
      />

      {/* Floating Header */}
      <div className="absolute top-4 inset-x-4 flex items-center justify-between text-white z-10">
        <span className="rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-xs font-bold uppercase tracking-wider">
          Shoppable Live Feed
        </span>
        <div className="flex items-center gap-1.5 rounded-full bg-black/40 backdrop-blur-md px-3 py-1 text-xs font-semibold">
          <Eye className="h-3.5 w-3.5 text-teal-400" />
          <span>{current.views.toLocaleString()}</span>
        </div>
      </div>

      {/* Side Action Buttons */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center gap-4 text-white z-10">
        <button
          type="button"
          onClick={() => handleLike(current.id)}
          className="flex flex-col items-center gap-1"
        >
          <div
            className={`h-11 w-11 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              likedMap[current.id] ? 'bg-red-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}
          >
            <Heart className={`h-5 w-5 ${likedMap[current.id] ? 'fill-white' : ''}`} />
          </div>
          <span className="text-[10px] font-bold">
            {(current.likes + (likedMap[current.id] ? 1 : 0)).toLocaleString()}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveIdx((prev) => (prev + 1) % videos.length)}
          className="h-11 w-11 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center hover:bg-black/70 transition"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Shoppable Product Card Overlay */}
      {current.product && (
        <div className="absolute bottom-4 inset-x-4 z-10">
          <div className="rounded-2xl bg-black/70 backdrop-blur-xl border border-white/20 p-3 shadow-2xl flex items-center justify-between gap-3">
            <img
              src={current.product.image}
              alt={current.product.name}
              className="h-14 w-14 rounded-xl object-cover shrink-0 border border-white/10"
            />
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-teal-400 uppercase tracking-wider block truncate">
                {current.vendorName}
              </span>
              <h4 className="text-xs font-bold text-white truncate">{current.product.name}</h4>
              <p className="text-sm font-black text-white mt-0.5">${current.product.price.toFixed(2)}</p>
            </div>
            <button
              type="button"
              onClick={() => onAddToCart && onAddToCart(current.product)}
              className="rounded-xl bg-teal-500 hover:bg-teal-400 p-2.5 text-slate-950 font-bold shadow-lg transition shrink-0 flex items-center gap-1.5 text-xs"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Buy</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
