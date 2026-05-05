'use client'

import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  Heart,
  ShoppingBag,
  Star,
  Filter,
  Grid,
  List,
  ChevronDown,
  SlidersHorizontal,
  Package,
  Tag,
  X,
  Clock,
  Store,
  ChevronRight,
  RotateCcw,
  Minus,
  Plus,
} from 'lucide-react'

const BRAND = '#D70F64'

/** Safe compare for numeric IDs coming from APIs (number vs string, Prisma/MySQL quirks). */
function idsEqual(a, b) {
  if (a == null || b == null) return false
  const na = Number(a)
  const nb = Number(b)
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb
}

function approximatePriceFromLabel(label) {
  if (!label) return null
  const m = String(label).match(/(\d+[.,]\d+|\d+)/)
  if (!m) return null
  return parseFloat(m[0].replace(',', '.'))
}

function mergeProductRelationIds(p) {
  if (!p || typeof p !== 'object') return p
  return {
    ...p,
    catId: p.catId ?? p.category?.id,
    subCatId: p.subCatId ?? p.subCategory?.subCatId,
  }
}

/** Unit price used for checkout (sale when lower than list). */
function getEffectiveUnitPrice(product) {
  if (!product || product.__isCustomDeal) {
    const n = parseFloat(product?.price) || 0
    return n
  }
  const list = parseFloat(product.price) || 0
  const sale = parseFloat(product.salePrice)
  if (Number.isFinite(sale) && sale < list) return sale
  return list
}

const ProductCatalog = ({ searchQuery, onToggleFavorite, favorites }) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { user, userData } = useAuth()
  const isGuest = !userData || userData.role === 'GUEST'

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [recentOrderProducts, setRecentOrderProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 })
  const [showFilters, setShowFilters] = useState(false)
  const [curatedStorefrontDeals, setCuratedStorefrontDeals] = useState([])
  const [detailProduct, setDetailProduct] = useState(null)
  const [modalQty, setModalQty] = useState(1)

  // Subcategories derived from already-loaded categories (no extra fetch needed)
  const subcategories = selectedCategory != null
    ? (categories.find(c => idsEqual(c.id, selectedCategory))?.subCategories || [])
    : []

  /** Load catalogue once; category / subcategory / search / vendor / sort filter on the client (no refetch → no loading flash). */
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
        ])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (isGuest || !user?.uid) return
    const fetchRecentOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user.uid}&limit=5`)
        if (!res.ok) return
        const data = await res.json()
        if (data.success && data.data?.length) {
          const seen = new Set()
          const items = []
          for (const order of data.data) {
            for (const item of order.orderItems || []) {
              if (item.product && !seen.has(item.product.proId)) {
                seen.add(item.product.proId)
                items.push(item.product)
              }
            }
          }
          setRecentOrderProducts(items.slice(0, 8))
        }
      } catch { /* silent */ }
    }
    fetchRecentOrders()
  }, [isGuest, user?.uid])

  useEffect(() => {
    fetch('/api/deals?scope=storefront')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setCuratedStorefrontDeals(j.data)
        else setCuratedStorefrontDeals([])
      })
      .catch(() => setCuratedStorefrontDeals([]))
  }, [])

  useEffect(() => {
    if (detailProduct) setModalQty(1)
  }, [detailProduct?.proId])

  useEffect(() => {
    if (!detailProduct) return
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setDetailProduct(null)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [detailProduct])

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products?type=products')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success && data.data) {
        const raw = data.data.map(mergeProductRelationIds)
        const active = raw.filter(p => p?.proName && p?.price && p.status === true && p.approvalStatus === 'Approved')
        setProducts(active.length ? active : raw.filter(p => p?.proName && p?.price))
      } else {
        setProducts([])
      }
    } catch {
      setProducts([])
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products?type=categories')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCategories(data.success && data.data?.length ? data.data : [])
    } catch { setCategories([]) }
  }

  const filteredProducts = useMemo(() =>
    products.filter(product => {
      const q = searchQuery.toLowerCase().trim()
      const name = String(product.proName ?? '').toLowerCase()
      const matchesSearch = !q ||
        name.includes(q) ||
        (product.description && String(product.description).toLowerCase().includes(q))

      const productCatId = product.catId ?? product.category?.id
      const productSubId =
        product.subCatId ??
        product.subCategory?.subCatId ??
        product.sub_category_id

      const matchesCategory =
        selectedCategory == null || idsEqual(productCatId, selectedCategory)
      const matchesSubcategory =
        selectedSubcategory == null || idsEqual(productSubId, selectedSubcategory)

      const matchesVendor =
        !selectedVendor || String(product.vendorId ?? '') === String(selectedVendor)
      const price = parseFloat(product.price) || 0
      return matchesSearch && matchesCategory && matchesSubcategory && matchesVendor &&
        price >= priceRange.min && price <= priceRange.max
    }), [products, searchQuery, selectedCategory, selectedSubcategory, selectedVendor, priceRange.min, priceRange.max])

  const sortedProducts = useMemo(() => [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
      case 'price-high': return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
      case 'rating': return (b.reviews?.length || 0) - (a.reviews?.length || 0)
      default: return new Date(b.createdAt) - new Date(a.createdAt)
    }
  }), [filteredProducts, sortBy])

  const catalogResultsKey = `${selectedCategory ?? 'all'}-${selectedSubcategory ?? 'all'}-${selectedVendor || ''}-${searchQuery}-${sortBy}`

  const dealProducts = useMemo(() => {
    if (!curatedStorefrontDeals.length) return []
    return curatedStorefrontDeals.map((row) => {
      if (row.product && row.product.proId != null) {
        const p = mergeProductRelationIds(row.product)
        const d = parseFloat(p.discount || 0)
        return {
          ...p,
          __dealBadge:
            (row.badgeLabel && String(row.badgeLabel).trim()) ||
            (d > 0 ? `${Math.round(d)}% OFF` : 'DEAL'),
        }
      }

      const desc = (row.customItems || []).map((i) => i.name).filter(Boolean).join(' · ')
      const hint = row.customPriceLabel?.trim?.() ?? ''
      const approx = approximatePriceFromLabel(hint)
      const img = row.customImageUrl?.trim?.()
      const vendorLabel = row.ownerUsername?.trim?.() || 'Special offer'

      return mergeProductRelationIds({
        __isCustomDeal: true,
        __dealIdRef: row.dealId,
        dealIdRef: row.dealId,
        customPriceHint: hint || null,
        proId: `cde-${row.dealId}`,
        proName: row.customTitle || 'Special offer',
        description: desc,
        proImages: img ? [img] : null,
        price: approx ?? 0,
        salePrice: null,
        discount: 0,
        reviews: [],
        vendorId: row.vendorUid || '',
        vendor: { username: vendorLabel, businessName: vendorLabel },
        category: { name: 'Deal' },
        sku: '',
        __dealBadge:
          (row.badgeLabel && String(row.badgeLabel).trim()) ||
          (hint ? hint : desc ? 'BUNDLE' : 'DEAL'),
      })
    })
  }, [curatedStorefrontDeals])

  // Top Shops: unique vendors
  const topShops = (() => {
    const seen = new Set()
    const shops = []
    for (const p of products) {
      if (p.vendor && !seen.has(p.vendorId)) {
        seen.add(p.vendorId)
        shops.push(p.vendor)
      }
    }
    return shops.slice(0, 10)
  })()

  const ProductCard = ({ product, index }) => {
    const isFavorite = favorites.find(fav => fav.proId === product.proId)
    const inWishlist = isInWishlist(product.proId)
    const avgRating = product.reviews?.length
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 0
    const disc = parseFloat(product.discount || 0)
    const dealBanner = product.__dealBadge
    const isCustomDeal = Boolean(product.__isCustomDeal)

    return (
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => setDetailProduct(product)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setDetailProduct(product)
          }
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ y: -4 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-transparent hover:border-gray-100 overflow-hidden flex-shrink-0"
      >
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <img
            src={product.proImages?.[0] || '/placeholder-product.jpg'}
            alt={product.proName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {(dealBanner || disc > 0) && (
            <div className="absolute top-3 left-0 bg-[#D70F64] text-white text-xs font-bold px-2 py-1 rounded-r-full shadow-sm z-10">
              {dealBanner || `${disc}% OFF`}
            </div>
          )}
          <button
            onClick={e => {
              e.stopPropagation()
              if (isCustomDeal) {
                toast('Favourites apply to shop items. This tile is a highlighted offer.')
                return
              }
              onToggleFavorite(product)
            }}
            className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'text-[#D70F64] fill-current' : 'text-gray-600'}`} />
          </button>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-[#D70F64] transition-colors mb-1">
            {product.proName}
          </h3>
          {isCustomDeal && product.description ? (
            <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-snug">{product.description}</p>
          ) : null}
          <div className="flex items-center text-xs text-gray-600 mb-2 gap-1.5">
            <div className="flex items-center font-bold text-gray-800">
              <Star className="w-3 h-3 text-[#D70F64] fill-current mr-0.5" />
              {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
            </div>
            <span>•</span>
            <span className="truncate max-w-[120px]">{product.vendor?.businessName || product.vendor?.username || product.category?.name || 'General'}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2">
              {isCustomDeal ? (
                <span className="font-bold text-gray-900 text-sm">
                  {product.customPriceHint?.trim() ? product.customPriceHint.trim() : 'See menu'}
                </span>
              ) : product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price) ? (
                <>
                  <span className="font-bold text-gray-900 text-sm">${parseFloat(product.salePrice).toFixed(2)}</span>
                  <span className="text-xs text-gray-400 line-through">${parseFloat(product.price).toFixed(2)}</span>
                </>
              ) : (
                <span className="font-bold text-gray-900 text-sm">${parseFloat(product.price).toFixed(2)}</span>
              )}
            </div>
            <motion.button
              onClick={e => {
                e.stopPropagation()
                if (isCustomDeal) {
                  toast.error('This offer is not tied to a catalogue SKU. Add the items you want from search or categories.')
                  return
                }
                addToCart(product, 1)
                if (isGuest) toast.success('Item added! Create an account to save your cart.')
                else toast.success('Added to cart')
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-[#D70F64] hover:text-white flex items-center justify-center transition-colors text-[#D70F64]"
            >
              <ShoppingBag className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    )
  }

  const HorizontalSection = ({ title, icon, items, renderItem, emptyMsg }) => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {icon}
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
      </div>
      {items.length === 0 ? (
        <p className="text-gray-500 text-sm">{emptyMsg}</p>
      ) : (
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
            {items.map((item, i) => renderItem(item, i))}
          </div>
          <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading products..." />
      </div>
    )
  }

  const categoryImages = {
    'Electronics': 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=200&q=80',
    'Fashion': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&q=80',
    'Home & Kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=200&q=80',
    'Books': 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=200&q=80',
    'Health & Beauty': 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=200&q=80',
    'Sports': 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200&q=80',
    'Food': 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&q=80',
    'Grocery': 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=200&q=80'
  }
  const defaultCatImages = [
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&q=80',
    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=200&q=80',
    'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=200&q=80',
    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&q=80',
    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=80'
  ]

  const filterPanelBody = (
    <>
      <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
          <Filter className="w-4 h-4" /> Filters
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedVendor(''); setPriceRange({ min: 0, max: 100000 }) }}
            className="text-xs font-bold text-[#D70F64] hover:text-[#C20D5A] uppercase tracking-wide"
          >Reset</button>
          <button type="button" onClick={() => setShowFilters(false)} className="lg:hidden p-1 bg-gray-100 rounded-full hover:bg-gray-200" aria-label="Close filters">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Category</h4>
        <div className="space-y-1">
          {[{ id: null, name: 'All' }, ...categories].map(cat => {
            const active = selectedCategory === cat.id
            return (
              <button key={String(cat.id)} type="button" onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null) }}
                className="w-full flex items-center hover:bg-gray-50 p-2 rounded-lg transition-colors text-left">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${active ? 'border-[#D70F64]' : 'border-gray-300'}`}>
                  {active && <div className="w-2 h-2 bg-[#D70F64] rounded-full" />}
                </div>
                <span className={`text-sm font-medium ${active ? 'text-[#D70F64]' : 'text-gray-600'}`}>{cat.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Shops</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {[{ id: '', name: 'All' }, ...topShops.map(s => ({ id: s.id, name: s.businessName || s.username }))].map(v => (
            <label key={v.id} className="flex items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 ${selectedVendor === v.id ? 'border-[#D70F64] bg-[#D70F64]' : 'border-gray-300'}`}>
                {selectedVendor === v.id && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <input type="radio" name="vendor" value={v.id} checked={selectedVendor === v.id}
                onChange={e => setSelectedVendor(e.target.value)} className="hidden" />
              <span className={`text-sm font-medium truncate flex-1 ${selectedVendor === v.id ? 'text-[#D70F64]' : 'text-gray-600 group-hover:text-gray-900'}`}>{v.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
            <input type="number" value={priceRange.min}
              onChange={e => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
              className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#D70F64] focus:ring-1 focus:ring-[#D70F64] outline-none"
              placeholder="Min" />
          </div>
          <span className="text-gray-400">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
            <input type="number" value={priceRange.max}
              onChange={e => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
              className="w-full pl-6 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:border-[#D70F64] focus:ring-1 focus:ring-[#D70F64] outline-none"
              placeholder="Max" />
          </div>
        </div>
      </div>
    </>
  )

  return (
    <div className="w-full overflow-x-hidden">
      <div className="space-y-2">

        {/* ── 1. CATEGORIES ── */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What's on your mind?</h2>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null) }}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px] ${
                    selectedCategory == null
                      ? 'border-[#D70F64] bg-[#D70F64]/5 shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#D70F64] hover:shadow-sm'
                  }`}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#D70F64] to-[#FF6B5B] rounded-full flex items-center justify-center mb-2 shadow-md">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <span className={`text-xs font-bold text-center ${selectedCategory == null ? 'text-[#D70F64]' : 'text-gray-700'}`}>All</span>
                </button>
                {categories.map((cat, idx) => {
                  const image = categoryImages[cat.name] || defaultCatImages[idx % defaultCatImages.length]
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null) }}
                      className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px] group ${
                        selectedCategory === cat.id
                          ? 'border-[#D70F64] bg-[#D70F64]/5 shadow-md scale-105'
                          : 'border-gray-200 bg-white hover:border-[#D70F64] hover:shadow-sm hover:scale-105'
                      }`}
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden mb-2 shadow-md">
                        <img src={image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <span className={`text-xs font-bold text-center leading-tight ${selectedCategory === cat.id ? 'text-[#D70F64]' : 'text-gray-700'}`}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
            </div>

            {/* Subcategories — swap when category changes without refetch */}
            <AnimatePresence mode="wait">
              {selectedCategory != null && subcategories.length > 0 && (
                <motion.div
                  key={selectedCategory}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="mt-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {categories.find(c => c.id === selectedCategory)?.name} — Sub-categories
                  </h3>
                  <div className="relative">
                    <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {/* All sub-categories — same card layout as sub rows */}
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategory(null)}
                      className={`flex-shrink-0 w-[156px] rounded-2xl bg-white border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
                        selectedSubcategory == null
                          ? 'border-[#D70F64] ring-2 ring-[#D70F64]/20 shadow-md scale-[1.02]'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[#D70F64] to-[#FF6B5B] flex items-center justify-center">
                        <Package className="w-11 h-11 text-white drop-shadow-sm" aria-hidden />
                      </div>
                      <div className="px-3 py-3 min-h-[52px] flex items-center justify-center bg-white">
                        <span
                          className={`text-sm font-bold text-center leading-snug ${
                            selectedSubcategory == null ? 'text-[#D70F64]' : 'text-gray-900'
                          }`}
                        >
                          All
                        </span>
                      </div>
                    </button>

                    {subcategories.map((sub, idx) => {
                      const subColors = [
                        'from-orange-400 to-red-400',
                        'from-purple-400 to-pink-400',
                        'from-blue-400 to-cyan-400',
                        'from-green-400 to-teal-400',
                        'from-yellow-400 to-orange-400',
                        'from-pink-400 to-rose-400',
                        'from-indigo-400 to-purple-400',
                        'from-teal-400 to-green-400',
                      ]
                      const gradient = subColors[idx % subColors.length]
                      const isSelected = selectedSubcategory === sub.subCatId

                      return (
                        <button
                          type="button"
                          key={sub.subCatId}
                          onClick={() => setSelectedSubcategory(sub.subCatId)}
                          className={`flex-shrink-0 w-[156px] rounded-2xl bg-white border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md group ${
                            isSelected
                              ? 'border-[#D70F64] ring-2 ring-[#D70F64]/20 shadow-md scale-[1.02]'
                              : 'border-gray-100 hover:border-gray-200'
                          }`}
                        >
                          <div className="relative w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                            {sub.image ? (
                              <img
                                src={sub.image}
                                alt={sub.subCatName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div
                                className={`absolute inset-0 bg-gradient-to-br ${gradient} flex items-center justify-center`}
                              >
                                <span className="text-white text-3xl font-black drop-shadow-sm">
                                  {sub.subCatName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="px-3 py-3 min-h-[52px] flex items-center justify-center bg-white">
                            <span
                              className={`text-sm font-bold text-center leading-snug line-clamp-2 ${
                                isSelected ? 'text-[#D70F64]' : 'text-gray-900'
                              }`}
                            >
                              {sub.subCatName}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                    <div className="absolute left-0 top-0 bottom-4 w-6 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
                    <div className="absolute right-0 top-0 bottom-4 w-6 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* ── ORDER AGAIN ── */}
        {!isGuest && recentOrderProducts.length > 0 && (
          <HorizontalSection
            title="Order Again"
            icon={<RotateCcw className="w-5 h-5 text-[#D70F64]" />}
            items={recentOrderProducts}
            emptyMsg=""
            renderItem={(p, i) => (
              <div key={p.proId} className="w-44 flex-shrink-0">
                <ProductCard product={p} index={i} />
              </div>
            )}
          />
        )}

        {/* ── ALL PRODUCTS ── */}
        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">All Products</h2>
              <span className="text-sm text-gray-500 font-medium">({filteredProducts.length})</span>
              {(selectedCategory != null || selectedVendor || searchQuery) && (
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedVendor(''); setSelectedSubcategory(null) }}
                  className="text-xs text-[#D70F64] font-semibold flex items-center gap-1 hover:underline"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}>
                  <Grid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('list')} className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>
                  <List className="w-4 h-4" />
                </button>
              </div>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-7 text-sm focus:ring-2 focus:ring-[#D70F64] focus:border-transparent outline-none cursor-pointer"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price ↑</option>
                  <option value="price-high">Price ↓</option>
                  <option value="rating">Top Rated</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 bg-[#D70F64] text-white rounded-lg hover:bg-[#C20D5A] transition-colors text-sm font-medium"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Desktop: filters always visible (previously gated on showFilters default false). */}
            <aside className="hidden lg:block w-[280px] flex-shrink-0">
              <div className="bg-white rounded-xl p-5 sticky top-40 border border-gray-100 shadow-sm">
                {filterPanelBody}
              </div>
            </aside>

            {/* Mobile / tablet: slide-over */}
            <AnimatePresence>
              {showFilters && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 bg-black/50 z-[1200] lg:hidden"
                  />
                  <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -300, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 left-0 z-[1300] w-[280px] max-w-[85vw] bg-white shadow-2xl overflow-y-auto lg:hidden"
                  >
                    <div className="bg-white rounded-none p-5 min-h-full border-r border-gray-100">
                      {filterPanelBody}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* Products grid */}
            <div className="flex-1">
              {sortedProducts.length === 0 ? (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-16">
                  <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Package className="w-10 h-10 text-[#D70F64]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-1">No products found</h3>
                  <p className="text-gray-500">Try adjusting your search or filters</p>
                  <motion.button
                    onClick={() => { setSelectedCategory(null); setSelectedVendor(''); setSelectedSubcategory(null) }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="mt-5 px-6 py-2.5 bg-[#D70F64] text-white font-bold rounded-xl hover:bg-[#C20D5A] transition-all shadow-md"
                  >Clear Filters</motion.button>
                </motion.div>
              ) : (
                <motion.div
                  key={catalogResultsKey}
                  layout
                  initial={{ opacity: 0.92 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.18 }}
                  className={`grid gap-4 ${viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                    : 'grid-cols-1'}`}
                >
                  {sortedProducts.map((product, index) => (
                    <ProductCard key={product.proId} product={product} index={index} />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* ── TODAY'S DEALS & TOP SHOPS (after main product catalogue) ── */}
        <div className="mt-10 pt-8 border-t border-gray-100 space-y-8">
          {dealProducts.length > 0 && (
            <HorizontalSection
              title="Today's Deals"
              icon={<Tag className="w-5 h-5 text-[#D70F64]" />}
              items={dealProducts}
              emptyMsg=""
              renderItem={(p, i) => (
                <div key={p.proId} className="w-44 flex-shrink-0">
                  <ProductCard product={p} index={i} />
                </div>
              )}
            />
          )}

          {topShops.length > 0 && (
            <div className="mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-5 h-5 text-[#D70F64]" />
                <h2 className="text-xl font-bold text-gray-900">Top Shops</h2>
              </div>
              <div className="relative">
                <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
                  {topShops.map((shop, i) => (
                    <motion.button
                      key={shop.id || i}
                      whileHover={{ y: -3 }}
                      onClick={() => setSelectedVendor(shop.id || '')}
                      className={`flex-shrink-0 flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-200 min-w-[130px] bg-white ${
                        selectedVendor === shop.id
                          ? 'border-[#D70F64] shadow-md'
                          : 'border-gray-200 hover:border-[#D70F64] hover:shadow-sm'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-100 to-pink-200 flex items-center justify-center mb-2 overflow-hidden border-2 border-white shadow">
                        {shop.profileImage ? (
                          <img src={shop.profileImage} alt={shop.username} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-2xl font-black text-[#D70F64]">
                            {(shop.businessName || shop.username || '?').charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-bold text-center leading-tight truncate w-full ${selectedVendor === shop.id ? 'text-[#D70F64]' : 'text-gray-800'}`}>
                        {shop.businessName || shop.username}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {products.filter(p => p.vendorId === shop.id).length} items
                      </span>
                    </motion.button>
                  ))}
                </div>
                <div className="absolute left-0 top-0 bottom-3 w-8 bg-gradient-to-r from-gray-50 to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-gray-50 to-transparent pointer-events-none" />
              </div>
            </div>
          )}
        </div>

      </div>

      <AnimatePresence>
        {detailProduct && (
          <motion.div
            key={`pv-${detailProduct.proId}`}
            className="fixed inset-0 z-[1400] flex items-end justify-center sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/50 backdrop-blur-[1px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDetailProduct(null)}
              aria-hidden
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="product-quick-view-title"
              className="relative z-10 flex w-full max-h-[min(92vh,720px)] sm:max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl"
              initial={{ y: 56, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 34 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="absolute right-3 top-3 z-20 rounded-full bg-white/95 p-2 shadow-md hover:bg-gray-100"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-700" />
              </button>
              <div className="relative aspect-[16/10] w-full flex-shrink-0 bg-gray-100 sm:aspect-[2/1]">
                <img
                  src={detailProduct.proImages?.[0] || '/placeholder-product.jpg'}
                  alt={detailProduct.proName}
                  className="h-full w-full object-cover"
                />
                {(detailProduct.__dealBadge || parseFloat(detailProduct.discount || 0) > 0) && (
                  <div className="absolute left-3 top-3 rounded-r-full bg-[#D70F64] px-2 py-1 text-xs font-bold text-white shadow-sm">
                    {detailProduct.__dealBadge || `${Math.round(parseFloat(detailProduct.discount || 0))}% OFF`}
                  </div>
                )}
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 pb-6 pt-4">
                <div>
                  <h2 id="product-quick-view-title" className="pr-10 text-xl font-black text-gray-900">
                    {detailProduct.proName}
                  </h2>
                  <p className="mt-2 text-xs text-gray-500">
                    {detailProduct.vendor?.businessName ||
                      detailProduct.vendor?.username ||
                      detailProduct.category?.name ||
                      'QuickDelivery'}
                  </p>
                </div>
                <div>
                  <p className="text-sm leading-relaxed text-gray-600">
                    {detailProduct.description?.trim?.()
                      ? detailProduct.description
                      : 'No description provided for this item.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-baseline gap-2 border-t border-gray-100 pt-4">
                  {detailProduct.__isCustomDeal ? (
                    <span className="text-lg font-black text-gray-900">
                      {detailProduct.customPriceHint?.trim()
                        ? detailProduct.customPriceHint.trim()
                        : 'See catalogue for pricing'}
                    </span>
                  ) : detailProduct.salePrice &&
                    parseFloat(detailProduct.salePrice) < parseFloat(detailProduct.price || 0) ? (
                    <>
                      <span className="text-lg font-black text-gray-900">
                        ${parseFloat(detailProduct.salePrice).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-400 line-through">
                        ${parseFloat(detailProduct.price || 0).toFixed(2)}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-wide text-[#D70F64]">
                        Sale
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-black text-gray-900">
                      ${parseFloat(detailProduct.price || 0).toFixed(2)}
                    </span>
                  )}
                  {!detailProduct.__isCustomDeal && (
                    <span className="text-xs text-gray-500">per unit</span>
                  )}
                </div>
                {!detailProduct.__isCustomDeal ? (
                  <>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                      <span className="text-sm font-bold text-gray-700">Quantity</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={modalQty <= 1}
                          onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-100 disabled:pointer-events-none disabled:opacity-40"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[2rem] text-center text-lg font-black tabular-nums">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setModalQty((q) => Math.min(99, q + 1))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-800 shadow-sm hover:bg-gray-100"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm font-bold text-gray-800">
                      <span>Line total</span>
                      <span className="text-lg tabular-nums text-[#D70F64]">
                        $
                        {(getEffectiveUnitPrice(detailProduct) * modalQty).toFixed(2)}
                      </span>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        addToCart(detailProduct, modalQty)
                        if (isGuest) {
                          toast.success('Item added! Create an account to save your cart.')
                        } else {
                          toast.success(
                            modalQty > 1
                              ? `Added ${modalQty} items to cart`
                              : 'Added to cart',
                          )
                        }
                        setDetailProduct(null)
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D70F64] py-3.5 text-base font-black text-white shadow-lg shadow-pink-200/50 hover:bg-[#C20D5A]"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Add to cart
                    </motion.button>
                  </>
                ) : (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
                    This is a curated offer. Add individual products from the shop to build your cart.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductCatalog
