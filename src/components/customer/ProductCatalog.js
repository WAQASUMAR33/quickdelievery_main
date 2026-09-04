'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import {
  Heart,
  ShoppingBag,
  Star,
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  Clock,
  Store,
  RotateCcw,
  Minus,
  Plus,
  Gift,
  QrCode,
  Smartphone,
  Percent,
  Sparkles,
  Utensils,
} from 'lucide-react'

// QuickDelivery Brand Color Tokens
const BRAND = '#D70F64'
const BRAND_DARK = '#C20E5A'
const BRAND_SOFT = '#FFF0F5'
const BRAND_BORDER = '#FFE0EB'

function idsEqual(a, b) {
  if (a == null || b == null) return false
  const na = Number(a)
  const nb = Number(b)
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb
}

function mergeProductRelationIds(p) {
  if (!p || typeof p !== 'object') return p
  return {
    ...p,
    catId: p.catId ?? p.category?.id,
    subCatId: p.subCatId ?? p.subCategory?.subCatId,
  }
}

function getEffectiveUnitPrice(product) {
  if (!product || product.__isCustomDeal) {
    return parseFloat(product?.price) || 0
  }
  const list = parseFloat(product.price) || 0
  const sale = parseFloat(product.salePrice)
  if (Number.isFinite(sale) && sale < list) return sale
  return list
}

function ShimmerBlock({ className = '' }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
}

const ProductCatalog = ({
  searchQuery = '',
  onToggleFavorite,
  favorites = [],
  serviceMode = 'delivery',
  onServiceModeChange,
  heroFirstName = '',
}) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { user, userData } = useAuth()
  const isGuest = !userData || userData.role === 'GUEST'

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [recentOrderProducts, setRecentOrderProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('relevance')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 })
  const [onlyFreeDelivery, setOnlyFreeDelivery] = useState(false)
  const [onlyDeals, setOnlyDeals] = useState(false)
  const [onlyHighRating, setOnlyHighRating] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [curatedStorefrontDeals, setCuratedStorefrontDeals] = useState([])
  const [topShops, setTopShops] = useState([])

  // Modal detail states
  const [detailProduct, setDetailProduct] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [parsedVariations, setParsedVariations] = useState([])

  // Scroll references
  const cuisinesScrollRef = useRef(null)
  const orderAgainScrollRef = useRef(null)
  const dealsScrollRef = useRef(null)
  const topShopsScrollRef = useRef(null)

  // Subcategories derived from real loaded categories
  const subcategories = useMemo(() => {
    if (selectedCategory != null) {
      return categories.find(c => idsEqual(c.id, selectedCategory))?.subCategories || []
    }
    const all = []
    const seen = new Set()
    for (const cat of categories) {
      for (const sub of cat.subCategories || []) {
        if (!seen.has(sub.subCatId)) {
          seen.add(sub.subCatId)
          all.push(sub)
        }
      }
    }
    return all
  }, [selectedCategory, categories])

  // Products with actual discounts
  const discountedProducts = useMemo(() => {
    return products.filter(p => parseFloat(p.discount || 0) > 0 || (p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price)))
  }, [products])

  // Max discount found in database for banner display
  const maxDiscountValue = useMemo(() => {
    let max = 0
    discountedProducts.forEach(p => {
      const disc = parseFloat(p.discount || 0)
      if (disc > max) max = disc
      if (p.price && p.salePrice) {
        const pct = Math.round(((parseFloat(p.price) - parseFloat(p.salePrice)) / parseFloat(p.price)) * 100)
        if (pct > max) max = pct
      }
    })
    return max > 0 ? max : null
  }, [discountedProducts])

  // Featured deal from DB
  const featuredDeal = useMemo(() => {
    if (curatedStorefrontDeals.length > 0) return curatedStorefrontDeals[0]
    if (discountedProducts.length > 0) return discountedProducts[0]
    return null
  }, [curatedStorefrontDeals, discountedProducts])

  // Initial Data Loading from APIs
  useEffect(() => {
    let cancelled = false
    const boot = async () => {
      setLoading(true)
      try {
        await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchShops(),
        ])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    boot()
    return () => { cancelled = true }
  }, [])

  // Load Recent Orders for Logged-in User
  useEffect(() => {
    if (isGuest || !user?.uid) return
    const fetchRecentOrders = async () => {
      try {
        const res = await fetch(`/api/orders?userId=${user.uid}&limit=6`)
        if (!res.ok) return
        const data = await res.json()
        if (data.success && data.data?.length) {
          const seen = new Set()
          const items = []
          for (const order of data.data) {
            for (const item of order.orderItems || []) {
              if (item.product && !seen.has(item.product.proId)) {
                seen.add(item.product.proId)
                let parsedImages = item.product.proImages
                if (typeof parsedImages === 'string') {
                  try {
                    parsedImages = JSON.parse(parsedImages)
                  } catch {
                    parsedImages = [parsedImages]
                  }
                }
                items.push({ ...item.product, proImages: parsedImages })
              }
            }
          }
          setRecentOrderProducts(items.slice(0, 8))
        }
      } catch { /* silent */ }
    }
    fetchRecentOrders()
  }, [isGuest, user?.uid])

  // Load Curated Storefront Deals
  useEffect(() => {
    fetch('/api/deals?scope=storefront')
      .then((r) => r.json())
      .then((j) => {
        if (j.success && Array.isArray(j.data)) setCuratedStorefrontDeals(j.data)
        else setCuratedStorefrontDeals([])
      })
      .catch(() => setCuratedStorefrontDeals([]))
  }, [])

  // Handle detail product variations
  useEffect(() => {
    if (detailProduct) {
      setModalQty(1)
      try {
        const v = detailProduct.variations
          ? (typeof detailProduct.variations === 'string' ? JSON.parse(detailProduct.variations) : detailProduct.variations)
          : []
        setParsedVariations(Array.isArray(v) ? v : [])
        setSelectedVariation(Array.isArray(v) && v.length > 0 ? v[0] : null)
      } catch {
        setParsedVariations([])
        setSelectedVariation(null)
      }
    }
  }, [detailProduct?.proId])

  // Modal keyboard listeners
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
        setProducts(raw)
      }
    } catch (e) {
      console.error('Error loading products:', e)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products?type=categories')
      const data = await res.json()
      setCategories(data.success && data.data ? data.data : [])
    } catch { setCategories([]) }
  }

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/products?type=vendors')
      const data = await res.json()
      setTopShops(data.success && data.data?.length ? data.data : [])
    } catch { setTopShops([]) }
  }

  const scrollCarousel = (ref, offset) => {
    if (ref.current) {
      ref.current.scrollBy({ left: offset, behavior: 'smooth' })
    }
  }

  // Filter products strictly by user criteria
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const q = searchQuery.toLowerCase().trim()
      const name = String(product.proName ?? '').toLowerCase()
      const desc = String(product.description ?? '').toLowerCase()
      const matchesSearch = !q || name.includes(q) || desc.includes(q)

      const productCatId = product.catId ?? product.category?.id
      const productSubId = product.subCatId ?? product.subCategory?.subCatId ?? product.sub_category_id

      const matchesCategory = selectedCategory == null || idsEqual(productCatId, selectedCategory)
      const matchesSubcategory = selectedSubcategory == null || idsEqual(productSubId, selectedSubcategory)
      const matchesVendor = !selectedVendor || String(product.vendorId ?? '') === String(selectedVendor)

      const price = parseFloat(product.price) || 0
      const matchesPrice = price >= priceRange.min && price <= priceRange.max

      const matchesFreeDelivery = !onlyFreeDelivery || (product.deliveryFee === 0 || product.freeDelivery)
      const matchesDeals = !onlyDeals || (parseFloat(product.discount || 0) > 0 || product.salePrice)

      const hasReviews = product.reviews && product.reviews.length > 0
      const avgRating = hasReviews
        ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
        : 0
      const matchesRating = !onlyHighRating || avgRating >= 4.0

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSubcategory &&
        matchesVendor &&
        matchesPrice &&
        matchesFreeDelivery &&
        matchesDeals &&
        matchesRating
      )
    })
  }, [
    products,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedVendor,
    priceRange.min,
    priceRange.max,
    onlyFreeDelivery,
    onlyDeals,
    onlyHighRating,
  ])

  // Sort products
  const sortedProducts = useMemo(() => {
    return [...filteredProducts].sort((a, b) => {
      switch (sortBy) {
        case 'fastest':
          return (a.estimatedMinutes || 999) - (b.estimatedMinutes || 999)
        case 'price-low':
          return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
        case 'price-high':
          return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
        case 'rating': {
          const rA = a.reviews?.length ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0
          const rB = b.reviews?.length ? b.reviews.reduce((s, r) => s + r.rating, 0) / b.reviews.length : 0
          return rB - rA
        }
        case 'relevance':
        default:
          return new Date(b.createdAt) - new Date(a.createdAt)
      }
    })
  }, [filteredProducts, sortBy])

  // Clear all active filters
  const handleClearFilters = () => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setSelectedVendor('')
    setPriceRange({ min: 0, max: 100000 })
    setOnlyFreeDelivery(false)
    setOnlyDeals(false)
    setOnlyHighRating(false)
    setSortBy('relevance')
  }

  // Restaurant / Product Card
  const RestaurantCard = ({ product, index }) => {
    const inWishlist = isInWishlist(product.proId)
    const hasReviews = product.reviews && product.reviews.length > 0
    const avgRating = hasReviews
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : null
    const disc = parseFloat(product.discount || 0)
    const etaMinutes = product.estimatedMinutes || product.vendor?.estimatedDelivery || null
    const deliveryFee = product.deliveryFee != null
      ? (parseFloat(product.deliveryFee) === 0 ? 'Free delivery' : `Rs. ${parseFloat(product.deliveryFee)}`)
      : (product.freeDelivery ? 'Free delivery' : null)

    const coverImg = product.proImages?.[0] || null

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
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: Math.min(index * 0.03, 0.3), duration: 0.25 }}
        whileHover={{ y: -3 }}
        className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer text-left"
      >
        {/* Card Cover Image */}
        <div className="relative aspect-[16/10] w-full bg-gray-50 overflow-hidden flex items-center justify-center">
          {coverImg ? (
            <img
              src={coverImg}
              alt={product.proName || 'Product'}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-pink-50/50 text-[#D70F64]/40">
              <Utensils className="w-12 h-12 stroke-[1.5]" />
            </div>
          )}

          {/* Real Promo Tag Overlay */}
          {(disc > 0 || (product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price))) && (
            <div className="absolute top-2.5 left-2.5 rounded-md bg-[#D70F64] px-2 py-0.5 text-[11px] font-extrabold text-white shadow-sm z-10">
              {disc > 0 ? `${disc}% OFF` : 'DEAL'}
            </div>
          )}

          {/* Delivery ETA Badge (Only if available in database) */}
          {etaMinutes && (
            <div className="absolute bottom-2.5 right-2.5 rounded-full bg-white/95 backdrop-blur-md px-2.5 py-0.5 text-[11px] font-bold text-gray-800 shadow-sm z-10 flex items-center gap-1">
              <Clock className="w-3 h-3 text-gray-500" />
              <span>{etaMinutes} min</span>
            </div>
          )}

          {/* Wishlist Heart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (inWishlist) {
                removeFromWishlist(product.proId)
                toast.success('Removed from favourites')
              } else {
                addToWishlist(product)
                toast.success('Added to favourites!')
              }
            }}
            title="Add to Favourites"
            className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-md rounded-full hover:bg-white hover:scale-110 transition-all shadow-sm z-10"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'text-[#D70F64] fill-current' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Card Information */}
        <div className="p-3 flex flex-col flex-1 justify-between">
          <div>
            <div className="flex items-start justify-between gap-1 mb-0.5">
              <h3 className="font-extrabold text-gray-900 text-[15px] leading-snug group-hover:text-[#D70F64] transition-colors line-clamp-1">
                {product.proName}
              </h3>
            </div>

            {/* Rating and Vendor Name */}
            <div className="flex items-center text-xs text-gray-600 mb-1 gap-1 flex-wrap">
              {avgRating !== null ? (
                <div className="flex items-center font-bold text-gray-900">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-current mr-0.5" />
                  <span>{avgRating.toFixed(1)}</span>
                  <span className="text-gray-400 ml-0.5">({product.reviews.length})</span>
                </div>
              ) : null}

              {(product.vendor?.businessName || product.vendor?.username) && (
                <>
                  {avgRating !== null && <span className="text-gray-300">•</span>}
                  <span className="truncate text-gray-600 font-medium max-w-[150px]">
                    {product.vendor.businessName || product.vendor.username}
                  </span>
                </>
              )}
            </div>

            {/* Real Category tags from DB */}
            {(product.category?.name || product.subCategory?.subCatName) && (
              <p className="text-[12px] text-gray-500 line-clamp-1">
                {[product.category?.name, product.subCategory?.subCatName].filter(Boolean).join(' • ')}
              </p>
            )}
          </div>

          {/* Price & Delivery Details */}
          <div className="pt-2 border-t border-gray-100 mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              {deliveryFee && (
                <>
                  <span className="font-bold text-[#D70F64]">{deliveryFee}</span>
                  <span className="text-gray-300">•</span>
                </>
              )}
              <span className="text-gray-600 font-medium">
                {product.salePrice ? (
                  <strong className="text-gray-900 font-extrabold text-sm">Rs. {parseFloat(product.salePrice).toLocaleString()}</strong>
                ) : (
                  <strong className="text-gray-900 font-extrabold text-sm">Rs. {parseFloat(product.price || 0).toLocaleString()}</strong>
                )}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                let variations = []
                try {
                  variations = product.variations ? (typeof product.variations === 'string' ? JSON.parse(product.variations) : product.variations) : []
                } catch {}
                if (variations && variations.length > 0) {
                  setDetailProduct(product)
                  return
                }
                addToCart(product, 1)
                toast.success('Added to basket!')
              }}
              className="p-1.5 rounded-full bg-[#FFF0F5] hover:bg-[#D70F64] hover:text-white text-[#D70F64] transition-colors"
              title="Add to basket"
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-[1440px] mx-auto px-4 py-4 animate-pulse">
        <div className="flex gap-6">
          <div className="hidden lg:block w-[260px] space-y-4">
            <ShimmerBlock className="h-44 w-full rounded-2xl" />
            <ShimmerBlock className="h-96 w-full rounded-2xl" />
          </div>
          <div className="flex-1 space-y-6">
            <ShimmerBlock className="h-48 w-full rounded-2xl" />
            <div className="flex gap-4 overflow-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="min-w-[100px] text-center">
                  <ShimmerBlock className="h-20 w-20 rounded-full mx-auto mb-2" />
                  <ShimmerBlock className="h-3.5 w-16 mx-auto" />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ShimmerBlock key={i} className="h-56 rounded-2xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Left Sidebar Filter Component Body
  const SidebarFilterPanel = (
    <div className="space-y-6 text-sm">
      {/* Filters Title + Reset */}
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#D70F64]" /> Filters
        </h3>
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs font-bold text-[#D70F64] hover:text-[#C20E5A] transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* ── Sort by ── */}
      <div>
        <h4 className="font-extrabold text-gray-800 mb-2.5 text-xs uppercase tracking-wider">
          Sort by
        </h4>
        <div className="space-y-2">
          {[
            { id: 'relevance', label: 'Relevance' },
            { id: 'fastest', label: 'Fastest delivery' },
            { id: 'rating', label: 'Top rated' },
            { id: 'price-low', label: 'Price: Low to High' },
          ].map((item) => (
            <label
              key={item.id}
              className="flex items-center gap-2.5 cursor-pointer group py-0.5 text-gray-700 hover:text-gray-900"
            >
              <input
                type="radio"
                name="sortByRadio"
                value={item.id}
                checked={sortBy === item.id}
                onChange={() => setSortBy(item.id)}
                className="w-4 h-4 accent-[#D70F64] cursor-pointer"
              />
              <span className={`text-[13px] ${sortBy === item.id ? 'font-bold text-[#D70F64]' : 'font-medium'}`}>
                {item.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* ── Quick Filters Checkboxes ── */}
      <div>
        <h4 className="font-extrabold text-gray-800 mb-2.5 text-xs uppercase tracking-wider">
          Offers & Perks
        </h4>
        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={onlyFreeDelivery}
              onChange={(e) => setOnlyFreeDelivery(e.target.checked)}
              className="w-4 h-4 accent-[#D70F64] rounded cursor-pointer"
            />
            <span className={`text-[13px] ${onlyFreeDelivery ? 'font-bold text-[#D70F64]' : 'font-medium text-gray-700'}`}>
              Free delivery
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={onlyDeals}
              onChange={(e) => setOnlyDeals(e.target.checked)}
              className="w-4 h-4 accent-[#D70F64] rounded cursor-pointer"
            />
            <span className={`text-[13px] ${onlyDeals ? 'font-bold text-[#D70F64]' : 'font-medium text-gray-700'}`}>
              Deals & discounts
            </span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={onlyHighRating}
              onChange={(e) => setOnlyHighRating(e.target.checked)}
              className="w-4 h-4 accent-[#D70F64] rounded cursor-pointer"
            />
            <span className={`text-[13px] ${onlyHighRating ? 'font-bold text-[#D70F64]' : 'font-medium text-gray-700'}`}>
              Rating 4.0+
            </span>
          </label>
        </div>
      </div>

      <hr className="border-gray-100" />

      {/* ── Price Range ── */}
      <div>
        <h4 className="font-extrabold text-gray-800 mb-2.5 text-xs uppercase tracking-wider">
          Price Range
        </h4>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rs.</span>
            <input
              type="number"
              value={priceRange.min || ''}
              onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) || 0 })}
              className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#D70F64] outline-none"
              placeholder="Min"
            />
          </div>
          <span className="text-gray-400 text-xs font-bold">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rs.</span>
            <input
              type="number"
              value={priceRange.max === 100000 ? '' : priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) || 100000 })}
              className="w-full pl-8 pr-2 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:border-[#D70F64] outline-none"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      {/* ── Real Database Cuisines / Categories ── */}
      {categories.length > 0 && (
        <>
          <hr className="border-gray-100" />
          <div>
            <h4 className="font-extrabold text-gray-800 mb-2.5 text-xs uppercase tracking-wider">
              Categories
            </h4>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null) }}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  selectedCategory == null ? 'bg-[#FFF0F5] text-[#D70F64] font-bold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>All Categories</span>
                <span className="text-xs text-gray-400">{products.length}</span>
              </button>
              {categories.map((cat) => {
                const active = selectedCategory === cat.id
                const count = products.filter(p => idsEqual(p.catId ?? p.category?.id, cat.id)).length
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null) }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      active ? 'bg-[#FFF0F5] text-[#D70F64] font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="truncate">{cat.name}</span>
                    <span className="text-xs text-gray-400">{count}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Real Database Vendors / Shops Filter ── */}
      {topShops.length > 0 && (
        <>
          <hr className="border-gray-100" />
          <div>
            <h4 className="font-extrabold text-gray-800 mb-2.5 text-xs uppercase tracking-wider">
              Stores
            </h4>
            <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
              <button
                type="button"
                onClick={() => setSelectedVendor('')}
                className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                  !selectedVendor ? 'bg-[#FFF0F5] text-[#D70F64] font-bold' : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span>All Stores</span>
              </button>
              {topShops.map((shop) => {
                const sId = String(shop.id)
                const active = selectedVendor === sId
                return (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => setSelectedVendor(active ? '' : sId)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                      active ? 'bg-[#FFF0F5] text-[#D70F64] font-bold' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <span className="truncate">{shop.businessName || shop.username}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="max-w-[1440px] mx-auto px-4 md:px-6">
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4 flex items-center justify-between">
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 bg-white text-xs font-bold text-gray-800 shadow-sm"
        >
          <Filter className="w-3.5 h-3.5 text-[#D70F64]" /> Filters & Sort
        </button>
        <span className="text-xs font-semibold text-gray-500">
          {sortedProducts.length} items
        </span>
      </div>

      {/* Mobile Filters Drawer */}
      {showMobileFilters && (
        <div className="lg:hidden mb-6 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          {SidebarFilterPanel}
        </div>
      )}

      {/* ── MAIN 2-COLUMN LAYOUT (Desktop Sidebar + Right Content) ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* ══════════════ LEFT COLUMN: SIDEBAR ══════════════ */}
        <aside className="hidden lg:block w-[260px] flex-shrink-0 sticky top-36 space-y-4">
          {/* Dynamic Filters & Sort Card */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
            {SidebarFilterPanel}
          </div>
        </aside>

        {/* ══════════════ RIGHT COLUMN: MAIN STREAM ══════════════ */}
        <main className="flex-1 min-w-0 space-y-7">
          {/* ── 1. HERO GREETING BANNER ── */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#D70F64] via-[#E21B70] to-[#FF2E93] p-6 text-white shadow-md">
            <div className="absolute -right-8 -bottom-10 w-48 h-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute right-32 top-0 w-32 h-32 rounded-full bg-pink-300/15 blur-lg pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="max-w-xl">
                <div className="flex items-center gap-1.5 text-pink-100 text-xs font-bold uppercase tracking-wider mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  <span>Welcome</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-1">
                  Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 18 ? 'Afternoon' : 'Evening'}{heroFirstName ? `, ${heroFirstName}` : ''}
                </h1>
                <p className="text-pink-100 text-sm font-medium mb-4">
                  Ready for something you&apos;ll love?
                </p>

                {/* Dynamic Category Pill Chips from Real Categories */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {categories.slice(0, 8).map((cat) => {
                      const isSelected = selectedCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 shadow-sm ${
                            isSelected
                              ? 'bg-white text-[#D70F64]'
                              : 'bg-white/20 hover:bg-white text-white hover:text-[#D70F64]'
                          }`}
                        >
                          {cat.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Cloche Cover Illustration */}
              <div className="hidden md:flex items-center justify-center pr-4">
                <div className="w-24 h-24 rounded-full bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-inner">
                  <svg className="w-14 h-14 text-white drop-shadow-md" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <path d="M12 4V2" />
                    <circle cx="12" cy="2" r="1" fill="currentColor" />
                    <path d="M4 17h16" strokeLinecap="round" />
                    <path d="M4 17a8 8 0 0 1 16 0" />
                    <path d="M2 20h20" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* ── 2. PROMO TIP STRIP (Only if deals exist in DB) ── */}
          {(discountedProducts.length > 0 || curatedStorefrontDeals.length > 0) && (
            <div className="flex items-center justify-between gap-3 bg-[#FFF0F5] border border-[#FFE0EB] rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-[#D70F64] text-white rounded-lg">
                  <Gift className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-[#D70F64] block leading-tight">
                    Special Offers Available
                  </span>
                  <span className="text-xs text-gray-700 font-medium">
                    Explore our active discounts and deals!
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setOnlyDeals(true)}
                className="px-3 py-1 rounded-full bg-[#D70F64] text-white text-xs font-bold hover:bg-[#C20E5A] transition-colors whitespace-nowrap"
              >
                View deals
              </button>
            </div>
          )}

          {/* ── 3. REAL CATEGORIES HORIZONTAL CAROUSEL ── */}
          {categories.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-gray-900 tracking-tight">Categories</h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => scrollCarousel(cuisinesScrollRef, -240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-colors"
                    aria-label="Scroll categories left"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(cuisinesScrollRef, 240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm transition-colors"
                    aria-label="Scroll categories right"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              <div
                ref={cuisinesScrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
              >
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                      className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
                    >
                      <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-full overflow-hidden p-0.5 border-2 transition-all duration-200 shadow-sm bg-pink-50 flex items-center justify-center ${
                        isSelected ? 'border-[#D70F64] scale-105' : 'border-gray-100 group-hover:border-[#D70F64]'
                      }`}>
                        {cat.image ? (
                          <img
                            src={cat.image}
                            alt={cat.name}
                            className="w-full h-full object-cover rounded-full group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-[#D70F64] font-black text-xl">
                            {cat.name?.charAt(0)?.toUpperCase() || 'C'}
                          </span>
                        )}
                      </div>
                      <span className={`mt-1.5 text-xs font-extrabold text-center truncate max-w-[84px] ${
                        isSelected ? 'text-[#D70F64]' : 'text-gray-800'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 4. FEATURED DAILY DEAL (Only if actual deal exists in DB) ── */}
          {featuredDeal && (
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 tracking-tight mb-3">Featured Deal</h2>
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-pink-500 to-[#D70F64] p-5 text-white shadow-sm flex items-center justify-between">
                <div className="max-w-md">
                  {maxDiscountValue && (
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-[#D70F64] text-[11px] font-black uppercase mb-2">
                      Up to {maxDiscountValue}% OFF
                    </span>
                  )}
                  <h3 className="text-xl font-extrabold leading-tight mb-1">
                    {featuredDeal.customTitle || featuredDeal.proName}
                  </h3>
                  {featuredDeal.description && (
                    <p className="text-xs text-pink-100 mb-3 line-clamp-2">
                      {featuredDeal.description}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (featuredDeal.proId) setDetailProduct(featuredDeal)
                      else setOnlyDeals(true)
                    }}
                    className="px-4 py-1.5 rounded-full bg-white text-[#D70F64] text-xs font-black hover:bg-pink-50 transition-colors shadow-sm"
                  >
                    View Offer
                  </button>
                </div>
                {(featuredDeal.customImageUrl || featuredDeal.proImages?.[0]) && (
                  <div className="hidden sm:block">
                    <img
                      src={featuredDeal.customImageUrl || featuredDeal.proImages?.[0]}
                      alt="Deal"
                      className="w-32 h-24 object-cover rounded-xl shadow-lg border-2 border-white/20"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── 5. ORDER AGAIN (Real recent orders from DB) ── */}
          {!isGuest && recentOrderProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-[#D70F64]" /> Order again
                </h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => scrollCarousel(orderAgainScrollRef, -240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(orderAgainScrollRef, 240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              <div
                ref={orderAgainScrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
              >
                {recentOrderProducts.map((p, idx) => (
                  <div key={p.proId || idx} className="w-48 flex-shrink-0">
                    <RestaurantCard product={p} index={idx} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 6. REAL TOP SHOPS / VENDORS FROM DATABASE ── */}
          {topShops.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                  <Store className="w-4 h-4 text-[#D70F64]" /> Popular stores
                </h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => scrollCarousel(topShopsScrollRef, -240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(topShopsScrollRef, 240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              <div
                ref={topShopsScrollRef}
                className="flex gap-3.5 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
              >
                {topShops.map((shop, idx) => {
                  const sId = String(shop.id)
                  const isSelected = selectedVendor === sId
                  const logo = shop.urlLogo || shop.urlCoverPhoto || null
                  return (
                    <button
                      key={shop.id || idx}
                      type="button"
                      onClick={() => setSelectedVendor(isSelected ? '' : sId)}
                      className={`flex-shrink-0 w-44 rounded-2xl border p-3.5 text-left shadow-sm hover:shadow-md transition-all group ${
                        isSelected ? 'border-[#D70F64] bg-[#FFF0F5]' : 'border-gray-100 bg-white'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-xl bg-gray-50 p-1 mb-2.5 flex items-center justify-center overflow-hidden border border-gray-100">
                        {logo ? (
                          <img
                            src={logo}
                            alt={shop.businessName || 'Shop'}
                            className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Store className="w-6 h-6 text-[#D70F64]" />
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm text-gray-900 truncate group-hover:text-[#D70F64] transition-colors">
                        {shop.businessName || shop.username || 'Store'}
                      </h4>
                      {shop.city && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {shop.city}
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 7. DISCOUNTED OFFERS (Only products with actual discounts from DB) ── */}
          {discountedProducts.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                  <Percent className="w-4 h-4 text-[#D70F64]" />
                  {maxDiscountValue ? `Up to ${maxDiscountValue}% off!` : 'Special Deals'}
                </h2>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => scrollCarousel(dealsScrollRef, -240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-700" />
                  </button>
                  <button
                    onClick={() => scrollCarousel(dealsScrollRef, 240)}
                    className="p-1.5 rounded-full border border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-700" />
                  </button>
                </div>
              </div>

              <div
                ref={dealsScrollRef}
                className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
              >
                {discountedProducts.map((p, idx) => (
                  <div key={p.proId || idx} className="w-52 flex-shrink-0">
                    <RestaurantCard product={p} index={idx} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 8. ALL RESTAURANTS & PRODUCTS GRID ── */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
                  All items
                </h2>
                <p className="text-xs text-gray-500 font-medium">
                  Showing {sortedProducts.length} items
                </p>
              </div>

              {/* Active Filter Indicators */}
              {(selectedCategory || selectedVendor || onlyFreeDelivery || onlyDeals || onlyHighRating) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-xs font-extrabold text-[#D70F64] hover:underline"
                >
                  Reset filters
                </button>
              )}
            </div>

            {sortedProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-6">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-800 mb-1">No items found</h3>
                <p className="text-xs text-gray-500 mb-4">Try adjusting your filters or search query.</p>
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 rounded-full bg-[#D70F64] text-white text-xs font-bold"
                >
                  Reset All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {sortedProducts.map((product, index) => (
                  <RestaurantCard key={product.proId || index} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ══════════════ PRODUCT DETAIL MODAL ══════════════ */}
      <AnimatePresence>
        {detailProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => setDetailProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-lg rounded-2xl bg-white overflow-hidden shadow-2xl border border-gray-100 max-h-[90vh] flex flex-col"
            >
              {/* Image Banner */}
              <div className="relative aspect-[16/9] w-full bg-gray-50 flex items-center justify-center">
                {detailProduct.proImages?.[0] ? (
                  <img
                    src={detailProduct.proImages[0]}
                    alt={detailProduct.proName || 'Product'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Utensils className="w-16 h-16 text-[#D70F64]/30" />
                )}
                <button
                  onClick={() => setDetailProduct(null)}
                  className="absolute top-3 right-3 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4">
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">{detailProduct.proName}</h3>
                  {detailProduct.description && (
                    <p className="text-xs text-gray-500 leading-relaxed">
                      {detailProduct.description}
                    </p>
                  )}
                </div>

                {/* Variations from DB */}
                {parsedVariations.length > 0 && (
                  <div>
                    <h4 className="font-extrabold text-xs text-gray-700 uppercase mb-2">Choose Variation</h4>
                    <div className="space-y-1.5">
                      {parsedVariations.map((v, i) => (
                        <label
                          key={i}
                          className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition-colors ${
                            selectedVariation?.name === v.name ? 'border-[#D70F64] bg-[#FFF0F5]' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="radio"
                              name="variation"
                              checked={selectedVariation?.name === v.name}
                              onChange={() => setSelectedVariation(v)}
                              className="accent-[#D70F64]"
                            />
                            <span className="text-xs font-bold text-gray-800">{v.name}</span>
                          </div>
                          <span className="text-xs font-black text-[#D70F64]">Rs. {parseFloat(v.price).toLocaleString()}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-extrabold text-gray-700 uppercase">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      disabled={modalQty <= 1}
                      onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                      className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100 disabled:opacity-40"
                    >
                      <Minus className="w-4 h-4 text-gray-700" />
                    </button>
                    <span className="text-sm font-black w-6 text-center">{modalQty}</span>
                    <button
                      type="button"
                      onClick={() => setModalQty(modalQty + 1)}
                      className="p-1.5 rounded-full border border-gray-200 hover:bg-gray-100"
                    >
                      <Plus className="w-4 h-4 text-gray-700" />
                    </button>
                  </div>
                </div>

                {/* Add to Basket Action */}
                <div className="pt-3 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      const itemToAdd = selectedVariation
                        ? { ...detailProduct, selectedVariation, price: selectedVariation.price }
                        : detailProduct
                      addToCart(itemToAdd, modalQty)
                      toast.success(`Added ${modalQty} to basket!`)
                      setDetailProduct(null)
                    }}
                    className="w-full py-3.5 rounded-2xl bg-[#D70F64] hover:bg-[#C20E5A] text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-all"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add to Basket — Rs. {(((selectedVariation ? parseFloat(selectedVariation.price) : getEffectiveUnitPrice(detailProduct)) * modalQty) || 0).toLocaleString()}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductCatalog
