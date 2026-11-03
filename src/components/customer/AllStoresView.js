'use client'

import React, { useState, useMemo } from 'react'
import Image from 'next/image'
import {
  Store,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Search,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
  SlidersHorizontal,
  Flame,
  CheckCircle2,
  X,
  Filter
} from 'lucide-react'

// Helper to normalize image URLs
function normalizeImg(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (trimmed.startsWith('[')) {
    try {
      const arr = JSON.parse(trimmed)
      if (Array.isArray(arr) && arr.length > 0) return arr[0]
    } catch {}
  }
  if (trimmed.includes('rapidtechpro.s3') || (trimmed.includes('s3.') && trimmed.includes('rapidtechpro'))) {
    try {
      const u = new URL(trimmed)
      let p = u.pathname.replace(/^\/+/, '')
      if (p.startsWith('rapidtechpro/')) p = p.substring('rapidtechpro/'.length)
      return `https://d1nvnelpyr43e7.cloudfront.net/${p}`
    } catch {
      return trimmed.replace(/https:\/\/[^/]*s3[^/]*\/rapidtechpro\//, 'https://d1nvnelpyr43e7.cloudfront.net/')
    }
  }
  return trimmed
}

export default function AllStoresView({
  shops = [],
  products = [],
  onBack,
  onSelectStore,
  t = (key) => key
}) {
  const [selectedCategory, setSelectedCategory] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCity, setSelectedCity] = useState('ALL')
  const [sortBy, setSortBy] = useState('rating')

  // Calculate product counts for each shop
  const shopProductCounts = useMemo(() => {
    const map = new Map()
    shops.forEach((shop) => {
      const sId = String(shop.id ?? '').toLowerCase()
      const sUid = String(shop.uid ?? '').toLowerCase()
      const sEmail = String(shop.email ?? '').toLowerCase()
      const sBiz = String(shop.businessName ?? '').toLowerCase()

      const count = products.filter((p) => {
        const pVendor = String(p.vendorId ?? '').toLowerCase()
        const pEmail = String(p.vendor?.email ?? '').toLowerCase()
        const pBiz = String(p.vendor?.businessName ?? '').toLowerCase()

        if (sUid && pVendor && pVendor === sUid) return true
        if (sEmail && pEmail && sEmail === pEmail) return true
        if (sEmail && pVendor && sEmail === pVendor) return true
        if (sId && pVendor && sId === pVendor) return true
        if (sBiz && pBiz && sBiz === pBiz) return true
        return false
      }).length

      map.set(shop.id, count)
    })
    return map
  }, [shops, products])

  // Extract all distinct business categories
  const businessCategories = useMemo(() => {
    const map = new Map()
    shops.forEach((s) => {
      const cat = s.businessCategory?.categoryTitle || s.category?.name || 'Other'
      map.set(cat, (map.get(cat) || 0) + 1)
    })
    return Array.from(map.entries()).map(([title, count]) => ({ title, count }))
  }, [shops])

  // Extract distinct cities
  const cities = useMemo(() => {
    const set = new Set()
    shops.forEach((s) => {
      if (s.city) set.add(s.city.trim())
    })
    return Array.from(set)
  }, [shops])

  // Category Icon helper
  const getCatIcon = (catTitle) => {
    const lower = (catTitle || '').toLowerCase()
    if (lower.includes('restaurant') || lower.includes('dining') || lower.includes('food')) {
      return <UtensilsCrossed className="w-3.5 h-3.5" />
    }
    if (lower.includes('grocer') || lower.includes('supermarket')) {
      return <ShoppingBag className="w-3.5 h-3.5" />
    }
    if (lower.includes('baker') || lower.includes('patisserie') || lower.includes('dessert')) {
      return <Sparkles className="w-3.5 h-3.5" />
    }
    if (lower.includes('electron') || lower.includes('tech') || lower.includes('computer')) {
      return <SlidersHorizontal className="w-3.5 h-3.5" />
    }
    return <Store className="w-3.5 h-3.5" />
  }

  // Filtered & Sorted Shops
  const filteredShops = useMemo(() => {
    let list = [...shops]

    // Business Category filter
    if (selectedCategory !== 'ALL') {
      list = list.filter((s) => {
        const cat = s.businessCategory?.categoryTitle || s.category?.name || 'Other'
        return cat.toLowerCase() === selectedCategory.toLowerCase()
      })
    }

    // City filter
    if (selectedCity !== 'ALL') {
      list = list.filter((s) => (s.city || '').toLowerCase() === selectedCity.toLowerCase())
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((s) => {
        const name = (s.businessName || s.username || '').toLowerCase()
        const cat = (s.businessCategory?.categoryTitle || s.category?.name || '').toLowerCase()
        const city = (s.city || '').toLowerCase()
        const address = (s.streetAddress || '').toLowerCase()
        return name.includes(q) || cat.includes(q) || city.includes(q) || address.includes(q)
      })
    }

    // Sorting
    if (sortBy === 'products') {
      list.sort((a, b) => (shopProductCounts.get(b.id) || 0) - (shopProductCounts.get(a.id) || 0))
    } else if (sortBy === 'name') {
      list.sort((a, b) => (a.businessName || '').localeCompare(b.businessName || ''))
    }

    return list
  }, [shops, selectedCategory, selectedCity, searchQuery, sortBy, shopProductCounts])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 animate-fadeIn">
      {/* ──────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / BREADCRUMB
      ────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all shadow-sm group"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Shopping</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={onBack}>
                Home
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-extrabold text-slate-900 dark:text-white">
                All Stores & Restaurants
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-extrabold">
              {shops.length} Verified Stores
            </span>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          2. DIRECTORY HERO HEADER
      ────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 pb-2">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-blue-800/40">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/20 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/30 text-blue-200 border border-blue-400/30 text-xs font-black uppercase tracking-wider">
              <Store className="w-3.5 h-3.5" /> Official Merchants Directory
            </span>

            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
              All Stores & Restaurants
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              Browse top-rated restaurants, supermarkets, electronics flagship stores, and bakeries. Click any store to view full menu and live inventory.
            </p>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          3. BUSINESS CATEGORY FILTER TABS (Foodpanda / Daraz Style)
      ────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-12 z-30 mt-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-y border-slate-200/80 dark:border-slate-800 shadow-sm py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-3">
          {/* Horizontally Scrollable Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              type="button"
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 ${
                selectedCategory === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>All Stores</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === 'ALL'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {shops.length}
              </span>
            </button>

            {businessCategories.map((cat) => {
              const isSelected = selectedCategory.toLowerCase() === cat.title.toLowerCase()
              return (
                <button
                  key={cat.title}
                  onClick={() => setSelectedCategory(cat.title)}
                  type="button"
                  className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-black transition-all flex items-center gap-2 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {getCatIcon(cat.title)}
                  <span>{cat.title}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {cat.count}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Search & Secondary Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search store name, specialty, or city..."
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* City Selector & Sort */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              {cities.length > 0 && (
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="ALL">All Cities</option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="rating">Top Rated (4.9 ⭐)</option>
                <option value="products">Most Products</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          4. ALL STORES GRID (Foodpanda / Daraz Flagship Store Cards)
      ────────────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
            Showing {filteredShops.length} stores {selectedCategory !== 'ALL' && `in ${selectedCategory}`}
          </p>
        </div>

        {filteredShops.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              No Stores Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              No stores match your selected filters. Try choosing "All Stores" or clearing your search.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('ALL')
                setSelectedCity('ALL')
                setSearchQuery('')
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition-colors"
            >
              Reset All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredShops.map((shop) => {
              const logo = normalizeImg(shop.urlLogo || shop.urlCoverPhoto)
              const cover = normalizeImg(shop.urlCoverPhoto || shop.urlRestaurantImages)
              const count = shopProductCounts.get(shop.id) || 0
              const catTitle = shop.businessCategory?.categoryTitle || shop.category?.name || 'Verified Store'
              const isFood = (catTitle || '').toLowerCase().includes('restaurant') || (shop.vertical === 'FOOD')

              return (
                <div
                  key={shop.id}
                  onClick={() => onSelectStore?.(shop)}
                  className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-2xl hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Store Cover Image Banner */}
                  <div className="relative h-32 w-full bg-slate-800 overflow-hidden">
                    {cover ? (
                      <Image
                        src={cover}
                        alt={shop.businessName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 opacity-90" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

                    {/* Category pill on cover */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-white font-black text-[10px] uppercase tracking-wider border border-white/20 flex items-center gap-1">
                        {getCatIcon(catTitle)}
                        <span>{catTitle}</span>
                      </span>
                    </div>

                    {/* Delivery Time Badge */}
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/90 text-white font-black text-[10px] shadow-sm flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        20-30 min
                      </span>
                    </div>
                  </div>

                  {/* Store Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between -mt-6 relative z-10">
                    <div>
                      {/* Logo Avatar & Verification */}
                      <div className="flex items-end justify-between mb-2.5">
                        <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-900 p-1 shadow-xl border-2 border-white dark:border-slate-700 overflow-hidden flex-shrink-0">
                          {logo ? (
                            <Image
                              src={logo}
                              alt={shop.businessName}
                              width={56}
                              height={56}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            <div className="w-full h-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center rounded-xl">
                              <Store className="w-6 h-6 text-blue-600" />
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                          <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">
                            Verified
                          </span>
                        </div>
                      </div>

                      {/* Store Business Name */}
                      <h3 className="font-black text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {shop.businessName || shop.username}
                      </h3>

                      {/* Location & Street */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span>{shop.streetAddress || shop.city || 'Express Doorstep Delivery'}</span>
                      </p>
                    </div>

                    {/* Rating, Products count & Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="text-amber-500 font-black flex items-center gap-0.5">
                          <Star className="w-3.5 h-3.5 fill-current" /> 4.9
                        </span>
                        <span className="text-slate-400 font-medium">
                          • {count} {count === 1 ? 'Product' : 'Products'}
                        </span>
                      </div>

                      <span className="font-extrabold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                        Visit Store →
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

