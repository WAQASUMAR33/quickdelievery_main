'use client'

import React, { useState, useMemo, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Store,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Phone,
  Search,
  ArrowLeft,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Share2,
  CheckCircle2,
  UtensilsCrossed,
  SlidersHorizontal,
  Flame,
  Award,
  Heart,
  Eye,
  Info,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

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

export default function StoreProfileView({
  shop,
  products = [],
  allShops = [],
  onBack,
  onSelectStore,
  onSelectProduct,
  addToCart,
  isInWishlist,
  addToWishlist,
  removeFromWishlist,
  t = (key) => key
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInStoreCat, setSelectedInStoreCat] = useState('ALL')
  const [sortBy, setSortBy] = useState('popular')
  const [showStoreInfoModal, setShowStoreInfoModal] = useState(false)
  const navTabsRef = useRef(null)

  // Derive all products belonging to this store
  const storeProducts = useMemo(() => {
    if (!shop) return []
    const sId = String(shop.id ?? '').toLowerCase()
    const sUid = String(shop.uid ?? '').toLowerCase()
    const sEmail = String(shop.email ?? '').toLowerCase()
    const sBiz = String(shop.businessName ?? '').toLowerCase()

    return products.filter((p) => {
      const pVendor = String(p.vendorId ?? '').toLowerCase()
      const pEmail = String(p.vendor?.email ?? '').toLowerCase()
      const pBiz = String(p.vendor?.businessName ?? '').toLowerCase()

      if (sUid && pVendor && pVendor === sUid) return true
      if (sEmail && pEmail && sEmail === pEmail) return true
      if (sEmail && pVendor && sEmail === pVendor) return true
      if (sId && pVendor && sId === pVendor) return true
      if (sBiz && pBiz && sBiz === pBiz) return true
      return false
    })
  }, [shop, products])

  // Extract in-store categories based on actual items
  const inStoreCategories = useMemo(() => {
    const map = new Map()
    storeProducts.forEach((p) => {
      const catName = p.subCategory?.subCatName || p.category?.name || 'General Menu'
      map.set(catName, (map.get(catName) || 0) + 1)
    })
    return Array.from(map.entries()).map(([name, count]) => ({ name, count }))
  }, [storeProducts])

  // Filter & sort products in store
  const filteredProducts = useMemo(() => {
    let list = [...storeProducts]

    // Category filter
    if (selectedInStoreCat !== 'ALL') {
      list = list.filter((p) => {
        const catName = p.subCategory?.subCatName || p.category?.name || 'General Menu'
        return catName === selectedInStoreCat
      })
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter((p) => {
        return (
          (p.proName || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q) ||
          (p.ingredients || '').toLowerCase().includes(q)
        )
      })
    }

    // Sorting
    if (sortBy === 'price_asc') {
      list.sort((a, b) => (parseFloat(a.salePrice || a.price) || 0) - (parseFloat(b.salePrice || b.price) || 0))
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => (parseFloat(b.salePrice || b.price) || 0) - (parseFloat(a.salePrice || a.price) || 0))
    } else if (sortBy === 'discount') {
      list.sort((a, b) => (parseFloat(b.discount || 0)) - (parseFloat(a.discount || 0)))
    }

    return list
  }, [storeProducts, selectedInStoreCat, searchQuery, sortBy])

  // Store metadata
  const logo = normalizeImg(shop?.urlLogo || shop?.urlCoverPhoto)
  const cover = normalizeImg(shop?.urlCoverPhoto || shop?.urlRestaurantImages)
  const categoryTitle = shop?.businessCategory?.categoryTitle || shop?.category?.name || 'Featured Merchant'
  const isRestaurant = (categoryTitle || '').toLowerCase().includes('restaurant') || (shop?.vertical === 'FOOD')
  const rating = 4.9
  const reviewCount = 184

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href)
      toast.success('Store link copied to clipboard!')
    }
  }

  // Other shops excluding current
  const otherShops = useMemo(() => {
    return allShops.filter((s) => String(s.id) !== String(shop?.id)).slice(0, 8)
  }, [allShops, shop])

  if (!shop) return null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-20 animate-fadeIn">
      {/* ──────────────────────────────────────────────────────────────────
          1. TOP NAVIGATION / BREADCRUMB STRIP
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
              <span>Back</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer" onClick={onBack}>
                Stores Directory
              </span>
              <ChevronRight className="w-3.5 h-3.5" />
              <span className="font-extrabold text-slate-900 dark:text-white truncate max-w-xs">
                {shop.businessName}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              type="button"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs transition-colors"
              title="Share store"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowStoreInfoModal(true)}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Info className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>About Store</span>
            </button>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          2. FLAGSHIP STORE HERO BANNER (Foodpanda / Daraz Flagship Style)
      ────────────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="relative rounded-3xl overflow-hidden shadow-lg border border-slate-200/80 dark:border-slate-800 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
          {/* Cover Photo with Elegant Gradient Backdrop */}
          <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-slate-800">
            {cover ? (
              <Image
                src={cover}
                alt={shop.businessName}
                fill
                priority
                className="object-cover object-center filter brightness-[0.65] contrast-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-indigo-800 to-purple-800 opacity-90" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            {/* Top Status & Verified Badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/90 text-white font-black text-xs shadow-md backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                Open Now
              </span>

              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white font-bold text-xs border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                100% Verified Merchant
              </span>
            </div>
          </div>

          {/* Store Info Content Box */}
          <div className="relative p-5 sm:p-6 md:p-8 -mt-16 sm:-mt-20 z-10 flex flex-col md:flex-row md:items-end justify-between gap-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 sm:gap-5">
              {/* Store Avatar Logo */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white dark:bg-slate-900 p-1.5 shadow-2xl border-2 border-white/80 dark:border-slate-700 flex-shrink-0 overflow-hidden">
                {logo ? (
                  <Image
                    src={logo}
                    alt={shop.businessName}
                    width={112}
                    height={112}
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                    <Store className="w-10 h-10 text-white" />
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                  <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
                </div>
              </div>

              {/* Title & Metadata */}
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[11px] font-black uppercase tracking-wider">
                    {categoryTitle}
                  </span>
                  {shop.city && (
                    <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200 text-[11px] font-semibold flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-400" />
                      {shop.city}
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight flex items-center gap-2">
                  {shop.businessName}
                </h1>

                <p className="text-xs sm:text-sm text-slate-300 font-medium line-clamp-1 max-w-xl">
                  {shop.streetAddress || `${shop.businessName} • Official MartZona Partner Store`}
                </p>
              </div>
            </div>

            {/* Metrics Chips (Rating, Prep Time, Delivery) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="px-3.5 py-2 rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 flex items-center gap-2">
                <div className="p-1 rounded-lg bg-amber-400/20 text-amber-400">
                  <Star className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <div className="text-xs font-black text-white flex items-center gap-1">
                    {rating} <span className="text-[10px] text-slate-300">({reviewCount}+)</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Customer Rating</div>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 flex items-center gap-2">
                <div className="p-1 rounded-lg bg-emerald-400/20 text-emerald-400">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">20-30 mins</div>
                  <div className="text-[10px] text-slate-400 font-medium">Delivery Time</div>
                </div>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-white/10 dark:bg-black/40 backdrop-blur-md border border-white/15 flex items-center gap-2">
                <div className="p-1 rounded-lg bg-blue-400/20 text-blue-400">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-white">{storeProducts.length} Items</div>
                  <div className="text-[10px] text-slate-400 font-medium">In Stock Menu</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          3. STICKY IN-STORE SEARCH & CATEGORY FILTER TABS
      ────────────────────────────────────────────────────────────────── */}
      <div className="sticky top-12 z-30 mt-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-y border-slate-200/80 dark:border-slate-800 shadow-sm py-3 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Horizontally Scrollable In-Store Categories */}
          <div
            ref={navTabsRef}
            className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1 max-w-full md:max-w-2xl"
          >
            <button
              onClick={() => setSelectedInStoreCat('ALL')}
              type="button"
              className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                selectedInStoreCat === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              All Items ({storeProducts.length})
            </button>

            {inStoreCategories.map((cat) => {
              const isSelected = selectedInStoreCat === cat.name
              return (
                <button
                  key={cat.name}
                  onClick={() => setSelectedInStoreCat(cat.name)}
                  type="button"
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600/20'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{cat.name}</span>
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

          {/* Search & Sort Controls */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search in ${shop.businessName}...`}
                className="w-full pl-9 pr-8 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-1.5 px-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="popular">Popular</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="discount">Biggest Discount</option>
            </select>
          </div>
        </div>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          4. STORE PRODUCT CATALOG GRID (Foodpanda / Daraz Standard)
      ────────────────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Section title & count */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              {isRestaurant ? <UtensilsCrossed className="w-5 h-5 text-orange-500" /> : <Store className="w-5 h-5 text-blue-600" />}
              <span>{selectedInStoreCat === 'ALL' ? 'Full Store Menu & Catalog' : selectedInStoreCat}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredProducts.length} of {storeProducts.length} items from {shop.businessName}
            </p>
          </div>
        </div>

        {/* Empty state */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200/80 dark:border-slate-800 shadow-sm max-w-lg mx-auto my-8">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-black text-slate-900 dark:text-white mb-1">
              No Products Found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
              {searchQuery
                ? `No items matching "${searchQuery}" in this store.`
                : 'This store is currently preparing their inventory. Check back soon!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-colors"
              >
                Clear Search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {filteredProducts.map((product) => {
              const listPrice = parseFloat(product.price) || 0
              const salePrice = product.salePrice ? parseFloat(product.salePrice) : null
              const hasDiscount = (salePrice && salePrice < listPrice) || parseFloat(product.discount || 0) > 0
              const discPct = hasDiscount
                ? (salePrice ? Math.round(((listPrice - salePrice) / listPrice) * 100) : Math.round(parseFloat(product.discount)))
                : 0
              const productImg = normalizeImg(
                Array.isArray(product.proImages) ? product.proImages[0] : product.proImages
              )
              const inWish = isInWishlist?.(product.proId)

              return (
                <div
                  key={product.proId}
                  onClick={() => onSelectProduct?.(product)}
                  className="group bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:border-blue-500/50 dark:hover:border-blue-500/50 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
                >
                  {/* Product Image Box */}
                  <div className="relative aspect-square w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    {productImg ? (
                      <Image
                        src={productImg}
                        alt={product.proName}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <ShoppingBag className="w-12 h-12" />
                      </div>
                    )}

                    {/* Discount badge */}
                    {hasDiscount && (
                      <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 text-white font-black text-[10px] shadow-md">
                        -{discPct}% OFF
                      </span>
                    )}

                    {/* Halal / Prep time pill */}
                    {product.prepTimeMinutes && (
                      <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-white font-bold text-[10px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-400" />
                        {product.prepTimeMinutes}m
                      </span>
                    )}

                    {/* Wishlist button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        if (inWish) removeFromWishlist?.(product.proId)
                        else addToWishlist?.(product)
                      }}
                      className={`absolute top-2.5 right-2.5 p-2 rounded-full shadow-md transition-all ${
                        inWish
                          ? 'bg-rose-500 text-white'
                          : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-300 hover:text-rose-500'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${inWish ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  {/* Product Details */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Subcategory or Tag */}
                      <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-wider">
                        {product.subCategory?.subCatName || product.category?.name || categoryTitle}
                      </span>

                      {/* Product Name */}
                      <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 line-clamp-2 mt-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.proName}
                      </h3>

                      {/* Description snippet */}
                      {product.description && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 font-medium">
                          {product.description}
                        </p>
                      )}
                    </div>

                    {/* Price & Add to Cart */}
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-black text-slate-950 dark:text-white tracking-tight">
                            Rs. {(salePrice || listPrice).toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs text-slate-400 line-through">
                              Rs. {listPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                          Instant Dispatch
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          addToCart?.(product, 1)
                          toast.success(`Added ${product.proName} to cart!`)
                        }}
                        className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Add to Basket"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* ──────────────────────────────────────────────────────────────────
            5. "EXPLORE OTHER POPULAR STORES" HORIZONTAL CAROUSEL
        ────────────────────────────────────────────────────────────────── */}
        {otherShops.length > 0 && (
          <div className="mt-16 pt-10 border-t border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Flame className="w-5 h-5 text-amber-500" />
                  <span>Other Popular Stores & Restaurants</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Discover more verified sellers and cuisines on MartZona
                </p>
              </div>

              <button
                onClick={onBack}
                type="button"
                className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                View All Stores →
              </button>
            </div>

            <div className="flex gap-3.5 overflow-x-auto pb-3 scrollbar-hide">
              {otherShops.map((other) => {
                const oLogo = normalizeImg(other.urlLogo || other.urlCoverPhoto)
                const oCount = products.filter((p) => {
                  const pVend = String(p.vendorId || '').toLowerCase()
                  const oUid = String(other.uid || '').toLowerCase()
                  const oBiz = String(other.businessName || '').toLowerCase()
                  const pBiz = String(p.vendor?.businessName || '').toLowerCase()
                  return (oUid && pVend === oUid) || (oBiz && pBiz === oBiz)
                }).length

                return (
                  <button
                    key={other.id}
                    type="button"
                    onClick={() => {
                      onSelectStore?.(other)
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="flex-shrink-0 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-3.5 text-left shadow-sm hover:shadow-md hover:border-blue-400 transition-all group"
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                        {oLogo ? (
                          <Image
                            src={oLogo}
                            alt={other.businessName}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Store className="w-5 h-5 text-blue-600 m-auto mt-2.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-xs text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
                          {other.businessName}
                        </h4>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate">
                          {other.businessCategory?.categoryTitle || other.city || 'Verified Merchant'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-800 font-extrabold">
                      <span className="text-blue-600 dark:text-blue-400">Visit Store →</span>
                      <span className="text-amber-500 flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-current" /> 4.9
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────────────
          6. "ABOUT STORE" MODAL
      ────────────────────────────────────────────────────────────────── */}
      {showStoreInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative space-y-4">
            <button
              onClick={() => setShowStoreInfoModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950 p-1 border border-blue-200 dark:border-blue-800 overflow-hidden">
                {logo ? (
                  <Image src={logo} alt={shop.businessName} width={48} height={48} className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <Store className="w-6 h-6 text-blue-600 m-auto mt-2" />
                )}
              </div>
              <div>
                <h3 className="font-black text-base text-slate-900 dark:text-white">{shop.businessName}</h3>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Verified Official Merchant</span>
              </div>
            </div>

            <div className="space-y-2.5 pt-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Store Address</div>
                  <div>{shop.streetAddress || 'MartZona Partner Store'}</div>
                  <div className="text-[11px] text-slate-400">{shop.city}, Pakistan</div>
                </div>
              </div>

              {shop.phoneNumber1 && (
                <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <Phone className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Customer Support</div>
                    <div>{shop.phoneNumber1}</div>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">Hygiene & Quality Standard</div>
                  <div>100% verified authentic merchant adhering to MartZona quality and packaging guidelines.</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowStoreInfoModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs shadow-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

