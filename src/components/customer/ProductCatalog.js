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

const BRAND = '#6366f1'

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

function ShimmerBlock({ className = '' }) {
  return (
    <div
      className={`rounded-md bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
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
  const [topShops, setTopShops] = useState([])
  const [detailProduct, setDetailProduct] = useState(null)
  const [modalQty, setModalQty] = useState(1)
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [parsedVariations, setParsedVariations] = useState([])
  const dealsCarouselRef = useRef(null)
  const [visibleCatCount, setVisibleCatCount] = useState(5)
  const [visibleSubcatCount, setVisibleSubcatCount] = useState(10)
  const [sidebarVisibleCats, setSidebarVisibleCats] = useState(5)
  const [sidebarVisibleSubs, setSidebarVisibleSubs] = useState(5)

  // Reset sidebar sub-category count when category changes
  useEffect(() => {
    setSidebarVisibleSubs(5)
  }, [selectedCategory])

  // Subcategories derived from already-loaded categories
  // When "All" is selected (selectedCategory == null), show subcategories from every category
  const subcategories = useMemo(() => {
    if (selectedCategory != null) {
      return categories.find(c => idsEqual(c.id, selectedCategory))?.subCategories || []
    }
    // "All" selected — gather every subcategory across all categories
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

  // Reset show-more counters when category/subcategory selection changes
  useEffect(() => {
    setVisibleSubcatCount(10)
  }, [selectedCategory])

  useEffect(() => {
    setVisibleCatCount(5)
  }, [categories.length])

  /** Load catalogue once; category / subcategory / search / vendor / sort filter on the client (no refetch → no loading flash). */
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
                
                // Parse proImages since it is stored as JSON string in Prisma
                let parsedImages = item.product.proImages
                if (typeof parsedImages === 'string') {
                  try {
                    parsedImages = JSON.parse(parsedImages)
                  } catch {
                    parsedImages = [parsedImages]
                  }
                }

                items.push({
                  ...item.product,
                  proImages: parsedImages
                })
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

  // Lock body scroll when product detail modal is open
  useEffect(() => {
    if (detailProduct) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [detailProduct])

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

  const fetchShops = async () => {
    try {
      const res = await fetch('/api/products?type=vendors')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setTopShops(data.success && data.data?.length ? data.data : [])
    } catch { setTopShops([]) }
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



  const scrollDealsCarousel = (direction = 1) => {
    if (!dealsCarouselRef.current) return
    dealsCarouselRef.current.scrollBy({
      left: direction * 360,
      behavior: 'smooth',
    })
  }

  const DealCarouselCard = ({ product, index }) => {
    const inWishlist = isInWishlist(product.proId)
    const avgRating = product.reviews?.length
      ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
      : 4.8
    const reviewsCount = product.reviews?.length || 5000
    const isCustomDeal = Boolean(product.__isCustomDeal)
    const dealBanner = product.__dealBadge || 'DEAL'
    const itemCount = product.description
      ? product.description.split('·').map((s) => s.trim()).filter(Boolean).length
      : 0
    const etaLabel = `From ${Math.max(15, 20 + ((index * 3) % 12))} min`
    const cuisineLabel = isCustomDeal
      ? itemCount > 0
        ? `${itemCount} items`
        : 'Combo'
      : (product.category?.name || 'Food')
    const rawPriceLabel = product.customPriceHint?.trim()
    const numeric = parseFloat(product.price || 0)
    const priceLabel = rawPriceLabel || (Number.isFinite(numeric) && numeric > 0 ? `Rs.${Math.round(numeric)}` : 'See price')

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
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.04, duration: 0.25 }}
        className="w-[280px] flex-shrink-0 rounded-2xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
      >
        <div className="relative h-36 w-full overflow-hidden bg-gray-100">
          <img
            src={product.proImages?.[0] || '/placeholder-product.jpg'}
            alt={product.proName}
            className="w-full h-full object-cover"
          />
          <div className="absolute left-0 top-2 rounded-r-full bg-gradient-to-r from-[#6366f1] to-[#7c3aed] text-white text-[10px] font-extrabold px-2.5 py-1 tracking-wide shadow-sm">
            {dealBanner}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (inWishlist) {
                removeFromWishlist(product.proId)
                toast.success('Removed from wishlist')
              } else {
                addToWishlist(product)
                toast.success('Added to wishlist')
              }
            }}
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm border border-gray-200 flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Toggle wishlist"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'text-[#6366f1] fill-current' : 'text-gray-600'}`} />
          </button>
        </div>

        <div className="p-3.5">
          <h3 className="text-lg leading-tight font-extrabold text-gray-900 line-clamp-1 mb-1">
            {product.proName}
          </h3>
          <div className="flex items-center gap-1 text-sm text-gray-700 mb-1.5">
            <Star className="w-4 h-4 text-[#F59E0B] fill-current" />
            <span className="font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-gray-500">({reviewsCount}+)</span>
          </div>
          <p className="text-[13px] text-gray-600 line-clamp-1">
            {etaLabel} · {cuisineLabel} · In-Store Price
          </p>
          <p className="mt-1.5 text-[14px] font-semibold text-gray-700">
            From {priceLabel} with Saver
          </p>
        </div>
      </motion.div>
    )
  }

  const ProductCard = ({ product, index }) => {
    const isFavorite = favorites?.some(fav => {
      const fKey = fav.uid ? String(fav.uid) : (fav.vendorUid ? String(fav.vendorUid) : `biz_${fav.id}`)
      const pVendorId = product.vendorId || product.vendor_id || product.vendor?.id
      const pVendorUid = product.vendor?.uid
      const pKey = pVendorUid ? String(pVendorUid) : (pVendorId ? `biz_${pVendorId}` : '')
      return fKey && pKey && fKey === pKey
    })
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
        className="group relative flex flex-col rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md hover:border-indigo-100 transition-all duration-200 overflow-hidden cursor-pointer text-left"
      >
        <div className="relative aspect-[4/3] w-full bg-gray-100 overflow-hidden">
          <img
            src={product.proImages?.[0] || '/placeholder-product.jpg'}
            alt={product.proName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {(dealBanner || disc > 0) && (
            <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-[#6366f1] to-[#7c3aed] px-2.5 py-0.5 text-[10px] font-bold text-white shadow-sm z-10">
              {dealBanner || `${disc}% OFF`}
            </div>
          )}
          <div className="absolute top-2 right-2 flex gap-1 z-10">
            {/* Wishlist Button */}
            <button
              onClick={e => {
                e.stopPropagation()
                if (inWishlist) {
                  removeFromWishlist(product.proId)
                  toast.success('Removed from wishlist')
                } else {
                  addToWishlist(product)
                  toast.success('Added to wishlist')
                }
              }}
              title="Add to Wishlist"
              className="p-1.5 bg-white/85 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
            >
              <Heart className={`w-4 h-4 ${inWishlist ? 'text-[#6366f1] fill-current' : 'text-gray-600'}`} />
            </button>
            {/* Favorites (Vendor) Button */}
            <button
              onClick={e => {
                e.stopPropagation()
                if (isCustomDeal) {
                  toast('Favourites apply to shop items.')
                  return
                }
                const vendorObj = { id: product.vendorId || product.vendor_id || product.vendor?.id, uid: product.vendor?.uid }
                if (!vendorObj.id && !vendorObj.uid) {
                  toast.error('Store information not available for this item.')
                  return
                }
                onToggleFavorite(vendorObj)
              }}
              title="Save Store to Favorites"
              className="p-1.5 bg-white/85 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>
        <div className="p-3.5 flex flex-col flex-1 justify-between">
          <div>
            <h3 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-[#6366f1] transition-colors mb-1">
              {product.proName}
            </h3>
            {isCustomDeal && product.description ? (
              <p className="text-[11px] text-gray-500 line-clamp-2 mb-2 leading-snug">{product.description}</p>
            ) : null}
            <div className="flex items-center text-xs text-gray-600 mb-2 gap-1.5">
              <div className="flex items-center font-bold text-gray-800">
                <Star className="w-3 h-3 text-amber-500 fill-current mr-0.5" />
                {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
              </div>
              <span>•</span>
              <span className="truncate max-w-[120px]">{product.vendor?.businessName || product.vendor?.username || product.category?.name || 'General'}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 mt-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {isCustomDeal ? (
                <span className="font-bold text-gray-900 text-sm">
                  {product.customPriceHint?.trim() ? product.customPriceHint.trim() : 'See menu'}
                </span>
              ) : product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price) ? (
                <>
                  <span className="font-extrabold text-gray-900 text-sm">Rs. {parseFloat(product.salePrice).toLocaleString()}</span>
                  <span className="text-xs text-gray-400 line-through">Rs. {parseFloat(product.price).toLocaleString()}</span>
                </>
              ) : (
                <span className="font-extrabold text-gray-900 text-sm">Rs. {parseFloat(product.price || 0).toLocaleString()}</span>
              )}
            </div>
            <motion.button
              onClick={e => {
                e.stopPropagation()
                if (isCustomDeal) {
                  toast.error('This offer is not tied to a catalogue SKU. Add the items you want from search or categories.')
                  return
                }
                let parsedVariations = []
                try {
                  parsedVariations = product.variations ? (typeof product.variations === 'string' ? JSON.parse(product.variations) : product.variations) : []
                } catch (e) {}

                if (parsedVariations && parsedVariations.length > 0) {
                  setDetailProduct(product)
                  return
                }

                addToCart(product, 1)
                if (isGuest) toast.success('Item added! Create an account to save your cart.')
                else toast.success('Added to cart')
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-indigo-50 hover:bg-[#6366f1] hover:text-white flex items-center justify-center transition-colors text-[#6366f1]"
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
      <div className="w-full overflow-x-hidden animate-pulse">
        <div className="space-y-8">
          <div>
            <ShimmerBlock className="h-7 w-56 mb-4" />
            <div className="flex gap-4 overflow-x-hidden">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={`cat-skel-${i}`} className="min-w-[100px] rounded-2xl border border-gray-100 bg-white p-3">
                  <ShimmerBlock className="mx-auto h-14 w-14 rounded-full mb-2" />
                  <ShimmerBlock className="h-3.5 w-16 mx-auto" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <ShimmerBlock className="h-7 w-40 mb-4" />
            <div className="flex gap-4 overflow-x-hidden">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={`deal-skel-${i}`} className="w-44 flex-shrink-0 rounded-xl border border-gray-100 bg-white p-3">
                  <ShimmerBlock className="h-28 w-full rounded-lg mb-3" />
                  <ShimmerBlock className="h-4 w-4/5 mb-2" />
                  <ShimmerBlock className="h-3 w-2/3 mb-3" />
                  <ShimmerBlock className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-3 mb-4 pt-2 border-t border-gray-100">
              <ShimmerBlock className="h-7 w-40" />
              <div className="flex gap-2">
                <ShimmerBlock className="h-8 w-20" />
                <ShimmerBlock className="h-8 w-24" />
              </div>
            </div>
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={`prod-skel-${i}`} className="rounded-xl border border-gray-100 bg-white p-3">
                  <ShimmerBlock className="h-32 w-full rounded-lg mb-3" />
                  <ShimmerBlock className="h-4 w-4/5 mb-2" />
                  <ShimmerBlock className="h-3 w-2/3 mb-3" />
                  <ShimmerBlock className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          </div>

          <div>
            <ShimmerBlock className="h-7 w-36 mb-4" />
            <div className="flex gap-4 overflow-x-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={`shop-skel-${i}`} className="min-w-[130px] rounded-2xl border border-gray-100 bg-white p-4">
                  <ShimmerBlock className="mx-auto h-14 w-14 rounded-full mb-2" />
                  <ShimmerBlock className="h-3.5 w-20 mx-auto mb-1" />
                  <ShimmerBlock className="h-3 w-12 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>
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
          <Filter className="w-4 h-4 text-[#6366f1]" /> Filters
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null); setSelectedVendor(''); setPriceRange({ min: 0, max: 100000 }); setSidebarVisibleCats(5); setSidebarVisibleSubs(5) }}
            className="text-xs font-bold text-[#6366f1] hover:text-[#4f46e5] uppercase tracking-wide"
          >Reset</button>
          <button type="button" onClick={() => setShowFilters(false)} className="lg:hidden p-1 bg-gray-100 rounded-full hover:bg-gray-200" aria-label="Close filters">
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      {/* ── PRICE RANGE (on top) ── */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Price Range</h4>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">Rs.</span>
            <input type="number" value={priceRange.min}
              onChange={e => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
              className="w-full pl-9 pr-2 py-1.5 border border-gray-200 rounded-xl text-sm focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none"
              placeholder="Min" />
          </div>
          <span className="text-gray-400">–</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-semibold">Rs.</span>
            <input type="number" value={priceRange.max}
              onChange={e => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
              className="w-full pl-9 pr-2 py-1.5 border border-gray-200 rounded-xl text-sm focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1] outline-none"
              placeholder="Max" />
          </div>
        </div>
      </div>

      {/* ── CATEGORY (show 5 at a time) ── */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Category</h4>
        <div className="space-y-1">
          {[{ id: null, name: 'All' }, ...categories.slice(0, sidebarVisibleCats)].map(cat => {
            const active = selectedCategory === cat.id
            return (
              <button key={String(cat.id)} type="button" onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null) }}
                className="w-full flex items-center hover:bg-violet-50/50 p-2 rounded-xl transition-colors text-left">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${active ? 'border-[#6366f1]' : 'border-gray-300'}`}>
                  {active && <div className="w-2 h-2 bg-[#6366f1] rounded-full" />}
                </div>
                <span className={`text-sm font-medium ${active ? 'text-[#6366f1] font-bold' : 'text-gray-600'}`}>{cat.name}</span>
              </button>
            )
          })}
          {categories.length > sidebarVisibleCats && (
            <button
              type="button"
              onClick={() => setSidebarVisibleCats(prev => prev + 5)}
              className="w-full text-center text-xs font-bold text-[#6366f1] hover:text-[#4f46e5] py-2 hover:bg-[#6366f1]/5 rounded-xl transition-colors"
            >
              Show More ({categories.length - sidebarVisibleCats} more)
            </button>
          )}
        </div>
      </div>

      {/* ── SUBCATEGORY (show 5 at a time, reactive to selected category) ── */}
      {subcategories.length > 0 && (
        <div className="mb-6">
          <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">
            {selectedCategory != null
              ? `${categories.find(c => idsEqual(c.id, selectedCategory))?.name || ''} Sub-categories`
              : 'All Sub-categories'}
          </h4>
          <div className="space-y-1">
            <button type="button" onClick={() => setSelectedSubcategory(null)}
              className="w-full flex items-center hover:bg-violet-50/50 p-2 rounded-xl transition-colors text-left">
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${selectedSubcategory == null ? 'border-[#6366f1]' : 'border-gray-300'}`}>
                {selectedSubcategory == null && <div className="w-2 h-2 bg-[#6366f1] rounded-full" />}
              </div>
              <span className={`text-sm font-medium ${selectedSubcategory == null ? 'text-[#6366f1] font-bold' : 'text-gray-600'}`}>All</span>
            </button>
            {subcategories.slice(0, sidebarVisibleSubs).map(sub => {
              const active = selectedSubcategory === sub.subCatId
              return (
                <button key={sub.subCatId} type="button" onClick={() => setSelectedSubcategory(sub.subCatId)}
                  className="w-full flex items-center hover:bg-violet-50/50 p-2 rounded-xl transition-colors text-left">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 flex-shrink-0 ${active ? 'border-[#6366f1]' : 'border-gray-300'}`}>
                    {active && <div className="w-2 h-2 bg-[#6366f1] rounded-full" />}
                  </div>
                  <span className={`text-sm font-medium ${active ? 'text-[#6366f1] font-bold' : 'text-gray-600'}`}>{sub.subCatName}</span>
                </button>
              )
            })}
            {subcategories.length > sidebarVisibleSubs && (
              <button
                type="button"
                onClick={() => setSidebarVisibleSubs(prev => prev + 5)}
                className="w-full text-center text-xs font-bold text-[#6366f1] hover:text-[#4f46e5] py-2 hover:bg-[#6366f1]/5 rounded-xl transition-colors"
              >
                Show More ({subcategories.length - sidebarVisibleSubs} more)
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── SHOPS ── */}
      <div className="mb-6">
        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Shops</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {[{ id: '', name: 'All' }, ...topShops.map(s => ({ id: s.uid || String(s.id), name: s.businessName || s.username }))].map(v => (
            <label key={v.id} className="flex items-center group cursor-pointer hover:bg-violet-50/50 p-2 rounded-xl transition-colors">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 ${selectedVendor === v.id ? 'border-[#6366f1] bg-[#6366f1]' : 'border-gray-300'}`}>
                {selectedVendor === v.id && <div className="w-2 h-2 bg-white rounded-sm" />}
              </div>
              <input type="radio" name="vendor" value={v.id} checked={selectedVendor === v.id}
                onChange={e => setSelectedVendor(e.target.value)} className="hidden" />
              <span className={`text-sm font-medium truncate flex-1 ${selectedVendor === v.id ? 'text-[#6366f1] font-bold' : 'text-gray-600 group-hover:text-gray-900'}`}>{v.name}</span>
            </label>
          ))}
        </div>
      </div>
    </>
  )

  return (
    <div className="w-full overflow-x-hidden">
      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="hidden lg:block w-[280px] flex-shrink-0 self-start">
          <div className="bg-white rounded-xl p-5 sticky top-28 border border-gray-100 shadow-sm">
            {filterPanelBody}
          </div>
        </aside>

        <div className="flex-1 min-w-0 space-y-2">

        {/* ── 1. CATEGORIES (show 5 at a time with Show More) ── */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What&apos;s on your mind?</h2>
            <div className="relative">
              <div className="flex gap-3 sm:gap-4 overflow-x-auto sm:flex-wrap pb-3 scrollbar-hide">
                <button
                  onClick={() => { setSelectedCategory(null); setSelectedSubcategory(null) }}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 min-w-[100px] ${
                    selectedCategory == null
                      ? 'border-[#7c3aed] bg-[#7c3aed]/10 shadow-md shadow-[#7c3aed]/20 scale-105'
                      : 'border-gray-200/80 bg-white/90 hover:border-[#7c3aed]/50 hover:shadow-md hover:scale-105'
                  }`}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#6366f1] to-[#a855f7] rounded-full flex items-center justify-center mb-2 shadow-md shadow-indigo-200">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <span className={`text-xs font-bold text-center ${selectedCategory == null ? 'text-[#7c3aed]' : 'text-gray-700'}`}>All</span>
                </button>
                {categories.slice(0, visibleCatCount).map((cat, idx) => {
                  const imageSrc = cat.image || categoryImages[cat.name] || defaultCatImages[idx % defaultCatImages.length]
                  return (
                    <button
                      key={cat.id}
                      onClick={() => { setSelectedCategory(cat.id); setSelectedSubcategory(null) }}
                      className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border transition-all duration-300 min-w-[100px] group ${
                        selectedCategory === cat.id
                          ? 'border-[#7c3aed] bg-[#7c3aed]/10 shadow-md shadow-[#7c3aed]/20 scale-105'
                          : 'border-gray-200/80 bg-white/90 hover:border-[#7c3aed]/50 hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <div className="relative w-14 h-14 rounded-full overflow-hidden mb-2 shadow-sm bg-gradient-to-br from-violet-100 to-purple-50 flex items-center justify-center border border-purple-100">
                        {imageSrc ? (
                          <img
                            src={imageSrc}
                            alt={cat.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'
                              if (e.currentTarget.nextElementSibling) {
                                e.currentTarget.nextElementSibling.style.display = 'flex'
                              }
                            }}
                          />
                        ) : null}
                        <div
                          style={{ display: imageSrc ? 'none' : 'flex' }}
                          className="w-full h-full items-center justify-center font-bold text-violet-700 text-lg bg-gradient-to-br from-violet-200 to-indigo-100"
                        >
                          {cat.name?.charAt(0) || 'C'}
                        </div>
                      </div>
                      <span className={`text-xs font-bold text-center leading-tight truncate max-w-[90px] ${selectedCategory === cat.id ? 'text-[#7c3aed]' : 'text-gray-700'}`}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>
              {categories.length > visibleCatCount && (
                <div className="flex justify-center mt-1 mb-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCatCount(prev => prev + 5)}
                    className="flex items-center gap-1.5 text-sm font-bold text-[#7c3aed] hover:text-[#4f46e5] px-5 py-2 rounded-full border-2 border-[#7c3aed]/20 hover:border-[#7c3aed]/40 bg-white hover:bg-[#7c3aed]/5 transition-all duration-200"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Show More Categories ({categories.length - visibleCatCount} more)
                  </button>
                </div>
              )}
            </div>

            {/* Subcategories — always shown (both for All and specific category), with show-more */}
            <AnimatePresence mode="wait">
              {subcategories.length > 0 && (
                <motion.div
                  key={selectedCategory ?? 'all'}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="mt-6"
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-3">
                    {selectedCategory != null
                      ? `${categories.find(c => idsEqual(c.id, selectedCategory))?.name} — Sub-categories`
                      : 'All Sub-categories'}
                  </h3>
                  <div className="relative">
                    <div className="flex gap-3 sm:gap-4 overflow-x-auto sm:flex-wrap pb-3 scrollbar-hide">
                    {/* All sub-categories option */}
                    <button
                      type="button"
                      onClick={() => setSelectedSubcategory(null)}
                      className={`flex-shrink-0 w-[156px] rounded-2xl bg-white border overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md ${
                        selectedSubcategory == null
                          ? 'border-[#6366f1] ring-2 ring-[#6366f1]/20 shadow-md scale-[1.02]'
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-[#6366f1] to-[#a855f7] flex items-center justify-center">
                        <Package className="w-11 h-11 text-white drop-shadow-sm" aria-hidden />
                      </div>
                      <div className="px-3 py-3 min-h-[52px] flex items-center justify-center bg-white">
                        <span
                          className={`text-sm font-bold text-center leading-snug ${
                            selectedSubcategory == null ? 'text-[#6366f1]' : 'text-gray-900'
                          }`}
                        >
                          All
                        </span>
                      </div>
                    </button>

                    {subcategories.slice(0, visibleSubcatCount).map((sub, idx) => {
                      const subColors = [
                        'from-indigo-400 to-violet-500',
                        'from-purple-400 to-pink-400',
                        'from-blue-400 to-indigo-500',
                        'from-emerald-400 to-teal-500',
                        'from-amber-400 to-orange-400',
                        'from-violet-400 to-purple-500',
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
                              ? 'border-[#6366f1] ring-2 ring-[#6366f1]/20 shadow-md scale-[1.02]'
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
                                isSelected ? 'text-[#6366f1]' : 'text-gray-900'
                              }`}
                            >
                              {sub.subCatName}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {subcategories.length > visibleSubcatCount && (
                    <div className="flex justify-center mt-1 mb-2">
                      <button
                        type="button"
                        onClick={() => setVisibleSubcatCount(prev => prev + 5)}
                        className="flex items-center gap-1.5 text-sm font-bold text-[#6366f1] hover:text-[#4f46e5] px-5 py-2 rounded-full border-2 border-[#6366f1]/20 hover:border-[#6366f1]/40 bg-white hover:bg-[#6366f1]/5 transition-all duration-200"
                      >
                        <ChevronDown className="w-4 h-4" />
                        Show More Sub-categories ({subcategories.length - visibleSubcatCount} more)
                      </button>
                    </div>
                  )}
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
            icon={<RotateCcw className="w-5 h-5 text-[#6366f1]" />}
            items={recentOrderProducts}
            emptyMsg=""
            renderItem={(p, i) => (
              <div key={p.proId} className="w-44 flex-shrink-0">
                <ProductCard product={p} index={i} />
              </div>
            )}
          />
        )}

        {/* ── MAIN CONTENT COLUMN ── */}
        <div className="space-y-10">
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
                      className="text-xs text-[#6366f1] font-semibold flex items-center gap-1 hover:underline"
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
                      className="appearance-none bg-white border border-gray-200 rounded-lg px-3 py-1.5 pr-7 text-sm focus:ring-2 focus:ring-[#6366f1] focus:border-transparent outline-none cursor-pointer"
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
                    className="flex lg:hidden items-center gap-1.5 px-3 py-1.5 bg-[#6366f1] text-white rounded-lg hover:bg-[#4f46e5] transition-colors text-sm font-medium shadow-sm"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>Filters</span>
                  </button>
                </div>
              </div>

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
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Package className="w-10 h-10 text-[#6366f1]" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-1">No products found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                    <motion.button
                      onClick={() => { setSelectedCategory(null); setSelectedVendor(''); setSelectedSubcategory(null) }}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                      className="mt-5 px-6 py-2.5 bg-[#6366f1] text-white font-bold rounded-xl hover:bg-[#4f46e5] transition-all shadow-md"
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

            {/* ── TODAY'S DEALS & TOP SHOPS (aligned with right content column) ── */}
            <div className="pt-8 border-t border-gray-100 space-y-8">
          {dealProducts.length > 0 && (
            <div className="mb-0">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-[#6366f1]" />
                  <h2 className="text-xl font-bold text-gray-900">Today&apos;s Deals</h2>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => scrollDealsCarousel(-1)}
                    className="h-9 w-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                    aria-label="Scroll deals left"
                  >
                    <ChevronRight className="w-4 h-4 rotate-180" />
                  </button>
                  <button
                    type="button"
                    onClick={() => scrollDealsCarousel(1)}
                    className="h-9 w-9 rounded-full border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 flex items-center justify-center"
                    aria-label="Scroll deals right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div ref={dealsCarouselRef} className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                {dealProducts.map((p, i) => (
                  <div key={p.proId} className="snap-start">
                    <DealCarouselCard product={p} index={i} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {topShops.length > 0 && (
            <div className="mb-0">
              <div className="flex items-center gap-2 mb-4">
                <Store className="w-5 h-5 text-[#6366f1]" />
                <h2 className="text-xl font-bold text-gray-900">Top Restaurent</h2>
              </div>
              <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                {topShops.map((shop, i) => {
                  const shopKey = String(shop.uid || shop.id || '')
                  const shopProducts = products.filter((p) => String(p.vendorId ?? p.vendor?.id ?? p.vendor?.uid ?? '') === shopKey)
                  const coverImage = shop.urlCoverPhoto || shop.urlLogo || (shopProducts.find((p) => p.proImages?.[0])?.proImages?.[0]) || '/placeholder-product.jpg'
                  const minPrice = shopProducts.length
                    ? Math.min(...shopProducts.map((p) => Number.parseFloat(p.price) || 0).filter((n) => n > 0))
                    : 0
                  const avgShopRating = (() => {
                    const rated = shopProducts
                      .map((p) => {
                        const arr = p.reviews || []
                        if (!arr.length) return null
                        return arr.reduce((s, r) => s + r.rating, 0) / arr.length
                      })
                      .filter((n) => Number.isFinite(n))
                    if (!rated.length) return 4.8
                    return rated.reduce((s, n) => s + n, 0) / rated.length
                  })()
                  const offerPct = Math.max(
                    ...shopProducts.map((p) => Math.round(Number.parseFloat(p.discount || 0))).filter((n) => n > 0),
                    20,
                  )

                  return (
                    <motion.button
                      key={shopKey || i}
                      whileHover={{ y: -2 }}
                      onClick={() => setSelectedVendor(shopKey || '')}
                      className={`text-left rounded-2xl border overflow-hidden bg-white transition-all ${
                        selectedVendor === shopKey
                          ? 'border-[#6366f1] ring-2 ring-[#6366f1]/20 shadow-md'
                          : 'border-gray-200 hover:border-[#6366f1] hover:shadow-sm'
                      }`}
                    >
                      <div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden">
                        <img src={coverImage} alt={shop.businessName || shop.username} className="h-full w-full object-cover" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (onToggleFavorite) onToggleFavorite(shop)
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full hover:bg-white transition-colors"
                        >
                          <Star className={`w-4 h-4 ${favorites?.find(f => {
                            const getKey = (v) => {
                              if (v.uid && v.uid !== 'null') return String(v.uid)
                              if (v.vendorUid) return String(v.vendorUid)
                              if (v.id) return `biz_${v.id}`
                              return ''
                            }
                            return getKey(f) === getKey(shop)
                          }) ? 'text-yellow-400 fill-current' : 'text-gray-600'}`} />
                        </button>
                        <div className="absolute bottom-2 right-2 rounded-full bg-black/65 px-2 py-0.5 text-[10px] font-bold text-white">
                          Ad
                        </div>
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-2xl font-extrabold text-gray-900 line-clamp-1">
                            {shop.businessName || shop.username}
                          </h3>
                          <div className="flex items-center text-sm text-gray-600 whitespace-nowrap">
                            <Star className="w-3.5 h-3.5 text-[#F59E0B] fill-current mr-1" />
                            <span className="font-bold text-gray-800">{avgShopRating.toFixed(1)}</span>
                            <span className="text-gray-500">(1000+)</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                          From {20 + ((i * 5) % 15)} min · Rs. · {shop.businessCategory?.categoryTitle || shopProducts[0]?.category?.name || 'Burgers'}
                        </p>
                        <p className="text-sm text-gray-700 mt-1">
                          From {minPrice > 0 ? `Rs.${Math.round(minPrice)}` : 'Rs.99'} with Saver
                        </p>
                        <span className="mt-2 inline-flex items-center rounded-full bg-violet-50 px-2.5 py-1 text-xs font-bold text-[#6366f1]">
                          <Tag className="w-3 h-3 mr-1" />
                          Up to {offerPct}% off
                        </span>
                      </div>
                    </motion.button>
                  )
                })}
              </div>
            </div>
          )}
            </div>
        </div>
        </div>

      </div>

      <AnimatePresence>
        {detailProduct && (() => {
          const avgRatingModal = detailProduct.reviews?.length
            ? detailProduct.reviews.reduce((s, r) => s + r.rating, 0) / detailProduct.reviews.length
            : 0
          const discModal = parseFloat(detailProduct.discount || 0)
          const vendorName = detailProduct.vendor?.businessName || detailProduct.vendor?.username || detailProduct.category?.name || 'QuickDelivery'

          return (
          <motion.div
            key={`pv-${detailProduct.proId}`}
            className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
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
              className="relative z-10 flex w-full max-h-[min(92vh,780px)] sm:max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-2xl ring-1 ring-black/5"
              initial={{ y: 80, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 60, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 340, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setDetailProduct(null)}
                className="absolute right-3 top-3 z-20 rounded-full bg-white/90 backdrop-blur-sm p-2.5 shadow-lg hover:bg-white hover:scale-110 transition-all duration-200"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-gray-700" />
              </button>

              {/* Product image with gradient overlay */}
              <div className="relative aspect-[16/10] w-full flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 sm:aspect-[2/1] overflow-hidden">
                <img
                  src={detailProduct.proImages?.[0] || '/placeholder-product.jpg'}
                  alt={detailProduct.proName}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
                {(detailProduct.__dealBadge || discModal > 0) && (
                  <motion.div
                    initial={{ x: -30, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.15 }}
                    className="absolute left-0 top-4 bg-gradient-to-r from-[#6366f1] to-[#7c3aed] px-4 py-1.5 text-xs font-extrabold text-white shadow-lg rounded-r-full"
                  >
                    {detailProduct.__dealBadge || `${Math.round(discModal)}% OFF`}
                  </motion.div>
                )}
                {/* Vendor chip on image */}
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <span className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">
                    {vendorName}
                  </span>
                </div>
              </div>

              {/* Content area - scrollable */}
              <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto px-5 pb-6 pt-5">
                {/* Title & Rating row */}
                <div>
                  <h2 id="product-quick-view-title" className="pr-10 text-2xl font-black text-gray-900 leading-tight">
                    {detailProduct.proName}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${s <= Math.round(avgRatingModal) ? 'text-amber-400 fill-current' : 'text-gray-200 fill-current'}`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-gray-500">
                      {avgRatingModal > 0 ? `${avgRatingModal.toFixed(1)} rating` : 'New arrival'}
                    </span>
                    {detailProduct.stock > 0 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gray-50 rounded-2xl px-4 py-3 border border-gray-100">
                  <p className="text-sm leading-relaxed text-gray-600">
                    {detailProduct.description?.trim?.()
                      ? detailProduct.description
                      : 'No description provided for this item.'}
                  </p>
                </div>

                {/* Price section */}
                <div className="flex flex-wrap items-center gap-3 border-t border-gray-100 pt-4">
                  {detailProduct.__isCustomDeal ? (
                    <span className="text-2xl font-black text-gray-900">
                      {detailProduct.customPriceHint?.trim()
                        ? detailProduct.customPriceHint.trim()
                        : 'See catalogue for pricing'}
                    </span>
                  ) : detailProduct.salePrice &&
                    parseFloat(detailProduct.salePrice) < parseFloat(detailProduct.price || 0) ? (
                    <>
                      <span className="text-2xl font-black text-gray-900">
                        Rs. {parseFloat(detailProduct.salePrice).toLocaleString()}
                      </span>
                      <span className="text-base text-gray-400 line-through">
                        Rs. {parseFloat(detailProduct.price || 0).toLocaleString()}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-white bg-gradient-to-r from-[#6366f1] to-[#7c3aed] px-2.5 py-1 rounded-full shadow-sm">
                        Sale
                      </span>
                    </>
                  ) : (
                    <span className="text-2xl font-black text-gray-900">
                      Rs. {parseFloat(detailProduct.price || 0).toLocaleString()}
                    </span>
                  )}
                  {!detailProduct.__isCustomDeal && !selectedVariation && (
                    <span className="text-xs text-gray-400 font-medium">per unit</span>
                  )}
                </div>

                {/* Variations UI */}
                {parsedVariations.length > 0 && (
                  <div className="flex flex-col gap-2 mt-4">
                    <span className="text-sm font-bold text-gray-700">Select Variation</span>
                    <div className="grid gap-2">
                      {parsedVariations.map((v, i) => (
                        <label
                          key={i}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-colors ${
                            selectedVariation?.name === v.name
                              ? 'border-[#6366f1] bg-violet-50'
                              : 'border-gray-200 hover:border-violet-200'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="variation"
                              value={v.name}
                              checked={selectedVariation?.name === v.name}
                              onChange={() => setSelectedVariation(v)}
                              className="h-4 w-4 text-[#6366f1] focus:ring-[#6366f1]"
                            />
                            <span className="font-medium text-gray-800">{v.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[#6366f1]">Rs. {parseFloat(v.price).toLocaleString()}</span>
                            {parseFloat(v.discount) > 0 && (
                              <span className="text-xs text-gray-400 line-through">
                                Rs. {(parseFloat(v.price) + parseFloat(v.discount)).toLocaleString()}
                              </span>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity & Add to cart */}
                {!detailProduct.__isCustomDeal ? (
                  <>
                    <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-gray-50/70 px-5 py-4">
                      <span className="text-sm font-bold text-gray-700">Quantity</span>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          disabled={modalQty <= 1}
                          onClick={() => setModalQty((q) => Math.max(1, q - 1))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-800 shadow-sm hover:border-[#6366f1] hover:text-[#6366f1] transition-colors disabled:pointer-events-none disabled:opacity-30"
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="min-w-[2.5rem] text-center text-xl font-black tabular-nums">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setModalQty((q) => Math.min(99, q + 1))}
                          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-gray-200 bg-white text-gray-800 shadow-sm hover:border-[#6366f1] hover:text-[#6366f1] transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <span className="text-sm font-bold text-gray-600">Line total</span>
                      <span className="text-xl font-black tabular-nums text-[#6366f1]">
                        Rs. {(((selectedVariation ? parseFloat(selectedVariation.price) : getEffectiveUnitPrice(detailProduct)) * modalQty) || 0).toLocaleString()}
                      </span>
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const productToAdd = selectedVariation
                          ? { 
                              ...detailProduct, 
                              selectedVariation,
                              price: selectedVariation.price,
                              salePrice: parseFloat(selectedVariation.discount) > 0 ? (parseFloat(selectedVariation.price) - parseFloat(selectedVariation.discount)) : null
                            }
                          : detailProduct

                        addToCart(productToAdd, modalQty)
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
                      className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#6366f1] via-[#7c3aed] to-[#9333ea] py-4 text-base font-black text-white shadow-xl shadow-indigo-300/30 hover:shadow-indigo-400/40 transition-shadow"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      Add to Cart — Rs. {(((getEffectiveUnitPrice(detailProduct) * modalQty)) || 0).toLocaleString()}
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
          )
        })()}
      </AnimatePresence>
    </div>
  )
}

export default ProductCatalog
