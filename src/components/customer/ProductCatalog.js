'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getProductUrl } from '@/lib/productSlug'
import { normalizeImageUrl } from '@/lib/imageUtils'
import { BentoCountdown, PillCountdown } from '@/components/customer/FlashCountdown'
import { DEFAULT_HERO_SLIDES } from '@/lib/heroSlideDefaults'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useRealtimeEvent } from '@/contexts/RealtimeContext'
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
  Smartphone,
  Percent,
  Sparkles,
  Utensils,
  Laptop,
  CheckCircle2,
  Truck,
  ShieldCheck,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Eye,
  Check,
  LayoutGrid,
  List,
  Search,
} from 'lucide-react'

// Bespoke Luxe Sapphire & Champagne Gold Palette Tokens
const BRAND_PRIMARY = '#2563EB' // Royal Sapphire
const BRAND_PRIMARY_DARK = '#1D4ED8'
const BRAND_GOLD = '#F59E0B'    // Champagne Gold
const BRAND_GOLD_LIGHT = '#FBBF24'
const BRAND_CYAN = '#06B6D4'
const BRAND_EMERALD = '#10B981'
const BRAND_ROSE = '#F43F5E'
const BRAND_OBSIDIAN = '#0A0F1D'

function idsEqual(a, b) {
  if (a == null || b == null) return false
  const na = Number(a)
  const nb = Number(b)
  return Number.isFinite(na) && Number.isFinite(nb) && na === nb
}

function productMatchesShop(product, shop) {
  if (!product || !shop) return false
  const pVendor = String(product.vendorId ?? '').trim().toLowerCase()
  if (!pVendor) return false
  if (shop.uid && pVendor === String(shop.uid).trim().toLowerCase()) return true
  if (shop.email && pVendor === String(shop.email).trim().toLowerCase()) return true
  if (shop.id && pVendor === String(shop.id).trim().toLowerCase()) return true
  return false
}

function mergeProductRelationIds(p) {
  if (!p || typeof p !== 'object') return p
  return {
    ...p,
    catId: p.catId ?? p.category?.id,
    subCatId: p.subCatId ?? p.subCategory?.subCatId,
  }
}

function scrollCarousel(ref, delta) {
  if (ref && ref.current) {
    ref.current.scrollBy({ left: delta, behavior: 'smooth' })
  }
}

function ShimmerBlock({ className = '' }) {
  return (
    <div
      className={`rounded-lg bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse ${className}`}
      aria-hidden="true"
    />
  )
}

const ProductCatalog = ({
  searchQuery = '',
  searchCategory = 'all',
  selectedDepartment = null,
  onSelectDepartment,
  onToggleFavorite,
  favorites = [],
  serviceMode = 'delivery',
  onServiceModeChange,
  heroFirstName = '',
  externalSubcategory = null,
  externalFilter = null,
  initialSlides = null,
}) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { user, userData } = useAuth()
  const router = useRouter()
  const { t, isRTL } = useLanguage()
  const { isDark } = useTheme()
  const isGuest = !userData || userData.role === 'GUEST'

  // Data State
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [topShops, setTopShops] = useState([])
  const [recentOrderProducts, setRecentOrderProducts] = useState([])
  const [curatedStorefrontDeals, setCuratedStorefrontDeals] = useState([])
  const [loading, setLoading] = useState(true)

  // Filtering & Sorting State
  const [sortBy, setSortBy] = useState('relevance')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [selectedVendor, setSelectedVendor] = useState('')
  const [selectedBrands, setSelectedBrands] = useState([])
  const [selectedColors, setSelectedColors] = useState([])
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [aiSearchPayload, setAiSearchPayload] = useState(null)
  const [priceRange, setPriceRange] = useState({ min: 0, max: 200000 })
  const [onlyFreeDelivery, setOnlyFreeDelivery] = useState(false)
  const [onlyDeals, setOnlyDeals] = useState(false)
  const [onlyHighRating, setOnlyHighRating] = useState(false)
  const [onlyHalal, setOnlyHalal] = useState(false)
  const [onlyVeg, setOnlyVeg] = useState(false)
  const [onlyFastPrep, setOnlyFastPrep] = useState(false)
  const [onlyBrandWarranty, setOnlyBrandWarranty] = useState(false)
  const [categorySearch, setCategorySearch] = useState('')
  const [storeSearch, setStoreSearch] = useState('')
  const [brandSearch, setBrandSearch] = useState('')
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const [activeSlideIndex, setActiveSlideIndex] = useState(0)
  // Seed with server-provided slides (or static defaults) so the very first
  // render — including SSR — already contains the final LCP hero image.
  const [dynamicSlides, setDynamicSlides] = useState(() =>
    Array.isArray(initialSlides) && initialSlides.length > 0 ? initialSlides : DEFAULT_HERO_SLIDES
  )
  // Only mount non-active slide images after the page has settled, so they
  // don't compete with the LCP image for bandwidth on slow mobile networks.
  const [heroWarm, setHeroWarm] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setHeroWarm(true), 3500)
    return () => clearTimeout(id)
  }, [])
  const [promoWidgets, setPromoWidgets] = useState(null)
  const [viewMode, setViewMode] = useState('grid') // 'grid' | 'list'
  const [visibleCount, setVisibleCount] = useState(24)

  // Reset visibleCount on filter change
  useEffect(() => {
    setVisibleCount(24)
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedVendor, selectedBrands, selectedColors, priceRange, onlyFreeDelivery, onlyDeals, onlyHighRating])

  // Listen for AI Search and Faceted Filter Events from Global Header
  useEffect(() => {
    const handleAiResults = (e) => {
      if (e.detail && e.detail.products) {
        setAiSearchPayload(e.detail)
      }
    }
    const handleClearAi = () => {
      setAiSearchPayload(null)
    }
    const handleFaceted = (e) => {
      const f = e.detail || {}
      if (f.minPrice !== undefined || f.maxPrice !== undefined) {
        setPriceRange({ min: f.minPrice ?? 0, max: f.maxPrice ?? 200000 })
      }
      if (Array.isArray(f.brands)) setSelectedBrands(f.brands)
      if (Array.isArray(f.colors)) setSelectedColors(f.colors)
      if (f.inStock !== undefined) setOnlyInStock(f.inStock)
      if (f.freeDelivery !== undefined) setOnlyFreeDelivery(f.freeDelivery)
      if (f.minRating !== undefined) setOnlyHighRating(f.minRating >= 4.0)
    }
    const handleClearFaceted = () => {
      setSelectedBrands([])
      setSelectedColors([])
      setOnlyInStock(false)
      setPriceRange({ min: 0, max: 200000 })
    }

    window.addEventListener('aiSearchResults', handleAiResults)
    window.addEventListener('clearAiSearch', handleClearAi)
    window.addEventListener('applyFacetedFilters', handleFaceted)
    window.addEventListener('clearFacetedFilters', handleClearFaceted)

    return () => {
      window.removeEventListener('aiSearchResults', handleAiResults)
      window.removeEventListener('clearAiSearch', handleClearAi)
      window.removeEventListener('applyFacetedFilters', handleFaceted)
      window.removeEventListener('clearFacetedFilters', handleClearFaceted)
    }
  }, [])

  // Countdown timer state for Flash Sale (ticks every second)

  // Modal detail states
  const [detailProduct, setDetailProduct] = useState(null)
  const [activeModalImage, setActiveModalImage] = useState(0)
  const [modalQty, setModalQty] = useState(1)
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [parsedVariations, setParsedVariations] = useState([])

  const handleNavigateToProduct = (e, prod) => {
    e?.stopPropagation?.()
    const targetProduct = prod || detailProduct
    if (!targetProduct) return
    setDetailProduct(null)
    const url = getProductUrl(targetProduct)
    router.push(url)
  }

  // Scroll references
  const heroSliderRef = useRef(null)
  const departmentStripRef = useRef(null)
  const flashDealsScrollRef = useRef(null)
  const topShopsScrollRef = useRef(null)
  const orderAgainScrollRef = useRef(null)

  // Live Flash Sale countdown now lives in <BentoCountdown/> / <PillCountdown/>
  // so the 1s tick no longer re-renders this entire component.

  // Dynamic Hero Slides derived from database hero_slides or fallback to categories
  const heroSlides = useMemo(() => {
    if (dynamicSlides && dynamicSlides.length > 0) {
      return dynamicSlides.map(s => ({
        id: s.id,
        badge: s.badge || '',
        title: s.title,
        subtitle: s.subtitle || '',
        ctaText: s.ctaText || 'Explore Now',
        ctaLink: s.ctaLink || null,
        discount: s.discount || '',
        deptId: s.deptId || null,
        bgGradient: s.bgGradient || 'from-[#0B0F19] via-[#1E1B4B] to-[#312E81]',
        accentColor: s.accentColor || '#818CF8',
        image: s.image,
      }))
    }

    const categoryVisuals = {
      restaurant: {
        badge: t('slide4Badge') || 'GOURMET DINING & RESTAURANTS',
        title: t('slide4Title') || 'Handcrafted Burgers, Artisan Pizza & Chef Specials',
        subtitle: t('slide4Subtitle') || 'Sizzling burgers, wood-fired pizzas, gourmet cuisine & chef-prepared meals delivered hot',
        ctaText: t('slide4Cta') || 'Explore Restaurant',
        bgGradient: 'from-[#1A0B16] via-[#4C0519] to-[#3B0764]',
        accentColor: '#F43F5E',
        defaultImage: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80',
      },
      groceries: {
        badge: t('slide3Badge') || 'FARM DIRECT & ORGANIC PANTRY',
        title: t('slide3Title') || 'Everyday Fresh Groceries at Fair Prices',
        subtitle: t('slide3Subtitle') || 'Farm-fresh organic produce, dairy essentials, cold-pressed oils & pantry staples',
        ctaText: t('slide3Cta') || 'Shop Fresh Groceries',
        bgGradient: 'from-[#061A14] via-[#064E3B] to-[#042F2C]',
        accentColor: '#10B981',
        defaultImage: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80',
      },
      bakery: {
        badge: t('slide4Badge') || 'ARTISAN PATISSERIE & DESSERTS',
        title: t('slide4Title') || 'Freshly Baked Pastries, Cakes & Delights',
        subtitle: t('slide4Subtitle') || 'Authentic French butter croissants, celebration cakes, chocolate treats & sweet pastries',
        ctaText: t('slide4Cta') || 'Taste Bakery Specials',
        bgGradient: 'from-[#1F1300] via-[#78350F] to-[#451A03]',
        accentColor: '#F59E0B',
        defaultImage: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=800&q=80',
      },
      electronics: {
        badge: t('slide1Badge') || 'TECH & NEXT-GEN MOBILITY',
        title: t('slide1Title') || 'Power Up with Official Mobile & Tech Gear',
        subtitle: t('slide1Subtitle') || 'GaN 100W Fast Chargers, Braided Type-C Cables, ANC Earbuds & Smartwatch Gear',
        ctaText: t('slide1Cta') || 'Explore Electronics & Tech',
        bgGradient: 'from-[#0B0F19] via-[#1E1B4B] to-[#312E81]',
        accentColor: '#818CF8',
        defaultImage: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=800&q=80',
      },
    }

    if (!categories || categories.length === 0) {
      return [
        {
          id: 'default-1',
          badge: categoryVisuals.restaurant.badge,
          title: categoryVisuals.restaurant.title,
          subtitle: categoryVisuals.restaurant.subtitle,
          ctaText: categoryVisuals.restaurant.ctaText,
          discount: t('verifiedMenus') || 'VERIFIED MENUS',
          deptId: null,
          bgGradient: categoryVisuals.restaurant.bgGradient,
          accentColor: categoryVisuals.restaurant.accentColor,
          image: categoryVisuals.restaurant.defaultImage,
        }
      ]
    }

    return categories.map((cat) => {
      const lower = `${cat.name || ''} ${cat.code || ''} ${cat.vertical || ''}`.toLowerCase()
      let visual = categoryVisuals.restaurant
      if (lower.includes('grocer') || lower.includes('produce') || lower.includes('supermarket')) visual = categoryVisuals.groceries
      else if (lower.includes('baker') || lower.includes('dessert') || lower.includes('cake') || lower.includes('pastr')) visual = categoryVisuals.bakery
      else if (lower.includes('tech') || lower.includes('electron') || lower.includes('gadget') || lower.includes('mobile') || lower.includes('computer')) visual = categoryVisuals.electronics
      else if (lower.includes('restaurant') || lower.includes('food') || lower.includes('dining')) visual = categoryVisuals.restaurant
      else {
        const catTranslated = t(cat.name) || cat.name
        visual = {
          badge: `${catTranslated.toUpperCase()} SPECIALS`,
          title: `Discover Premium ${catTranslated}`,
          subtitle: `Browse top-rated products and verified merchant offerings in ${catTranslated}`,
          ctaText: `Explore ${catTranslated}`,
          bgGradient: 'from-[#0B0F19] via-[#1E293B] to-[#334155]',
          accentColor: '#38BDF8',
          defaultImage: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=800&q=80',
        }
      }

      // Compute dynamic discount from real database products in this category
      const catProducts = products.filter(p => idsEqual(p.catId ?? p.category?.id, cat.id))
      const discounts = catProducts.map(p => Number(p.discount || 0)).filter(d => d > 0)
      const maxDiscount = discounts.length > 0 ? Math.max(...discounts) : 0
      const discountText = maxDiscount > 0 ? `${t('upToOff') || 'UP TO'} ${maxDiscount}% OFF` : `${catProducts.length} ${t('productsInStock') || 'PRODUCTS IN STOCK'}`

      return {
        id: cat.id,
        badge: visual.badge,
        title: visual.title,
        subtitle: visual.subtitle,
        ctaText: visual.ctaText,
        discount: discountText,
        deptId: cat.id,
        bgGradient: visual.bgGradient,
        accentColor: visual.accentColor,
        image: cat.image || visual.defaultImage,
      }
    })
  }, [dynamicSlides, categories, products, t, isRTL])

  // Auto-advance hero slides every 5 seconds
  useEffect(() => {
    if (!heroSlides.length) return
    const slideTimer = setInterval(() => {
      setActiveSlideIndex(prev => (prev + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(slideTimer)
  }, [heroSlides.length])

  // Initial Data Fetching with Progressive Hydration & Session Cache
  useEffect(() => {
    let active = true

    // Fast-path: Hydrate instantly from session cache if available (0ms paint)
    try {
      const cachedProds = typeof window !== 'undefined' ? sessionStorage.getItem('martzona_cache_prods') : null
      const cachedCats = typeof window !== 'undefined' ? sessionStorage.getItem('martzona_cache_cats') : null
      const cachedShops = typeof window !== 'undefined' ? sessionStorage.getItem('martzona_cache_shops') : null
      const cachedSliders = typeof window !== 'undefined' ? sessionStorage.getItem('martzona_cache_sliders') : null
      const cachedWidgets = typeof window !== 'undefined' ? sessionStorage.getItem('martzona_cache_widgets') : null

      if (cachedProds) {
        const parsed = JSON.parse(cachedProds)
        if (Array.isArray(parsed) && parsed.length > 0) {
          setProducts(parsed)
          setLoading(false)
        }
      }
      if (cachedCats) {
        const parsed = JSON.parse(cachedCats)
        if (Array.isArray(parsed) && parsed.length > 0) setCategories(parsed)
      }
      if (cachedShops) {
        const parsed = JSON.parse(cachedShops)
        if (Array.isArray(parsed) && parsed.length > 0) setTopShops(parsed)
      }
      if (cachedSliders) {
        const parsed = JSON.parse(cachedSliders)
        if (Array.isArray(parsed) && parsed.length > 0) setDynamicSlides(parsed)
      }
      if (cachedWidgets) {
        const parsed = JSON.parse(cachedWidgets)
        if (parsed) setPromoWidgets(parsed)
      }
    } catch {}

    const boot = async () => {
      // 1. Fetch sliders, categories, vendors in parallel (lightweight & progressive)
      fetch('/api/sliders')
        .then(r => r.json())
        .then(d => {
          if (active && d.success && Array.isArray(d.data) && d.data.length > 0) {
            setDynamicSlides(d.data)
            try { sessionStorage.setItem('martzona_cache_sliders', JSON.stringify(d.data)) } catch {}
          }
        })
        .catch(() => {})

      fetch('/api/promo-widgets')
        .then(r => r.json())
        .then(d => {
          if (active && d.success && d.data) {
            setPromoWidgets(d.data)
            try { sessionStorage.setItem('martzona_cache_widgets', JSON.stringify(d.data)) } catch {}
          }
        })
        .catch(() => {})

      fetch('/api/products?type=categories')
        .then(r => r.json())
        .then(d => {
          if (active && d.success && Array.isArray(d.data)) {
            setCategories(d.data)
            try { sessionStorage.setItem('martzona_cache_cats', JSON.stringify(d.data)) } catch {}
          }
        })
        .catch(() => {})

      fetch('/api/products?type=vendors')
        .then(r => r.json())
        .then(d => {
          if (active && d.success && Array.isArray(d.data)) {
            setTopShops(d.data)
            try { sessionStorage.setItem('martzona_cache_shops', JSON.stringify(d.data)) } catch {}
          }
        })
        .catch(() => {})

      // 2. Fetch full product catalog
      try {
        const prodRes = await fetch('/api/products?type=products').then(r => r.json()).catch(() => ({ success: false }))
        if (!active) return
        if (prodRes.success && Array.isArray(prodRes.data)) {
          const mapped = prodRes.data.map(mergeProductRelationIds)
          setProducts(mapped)
          try { sessionStorage.setItem('martzona_cache_prods', JSON.stringify(mapped)) } catch {}
        }
      } catch (e) {
        console.error('Storefront boot error:', e)
      } finally {
        if (active) setLoading(false)
      }
    }

    boot()
    return () => { active = false }
  }, [])

  // Sync external searchCategory prop from Top Navbar
  useEffect(() => {
    if (searchCategory && searchCategory !== 'all') {
      setSelectedCategory(Number(searchCategory))
    } else if (searchCategory === 'all') {
      setSelectedCategory(null)
    }
  }, [searchCategory])

  // Sync external subcategory from Mega Menu
  useEffect(() => {
    if (externalSubcategory) {
      setSelectedSubcategory(Number(externalSubcategory))
    }
  }, [externalSubcategory])

  // Sync external filter presets (freeDelivery, highRating, deals, reset)
  useEffect(() => {
    if (!externalFilter) return
    if (externalFilter === 'freeDelivery') {
      setOnlyFreeDelivery(true)
    } else if (externalFilter === 'highRating') {
      setOnlyHighRating(true)
    } else if (externalFilter === 'deals') {
      setOnlyDeals(true)
    } else if (externalFilter.startsWith('vendor:')) {
      const vName = externalFilter.replace('vendor:', '').toLowerCase()
      const found = topShops.find(s => (s.businessName || '').toLowerCase().includes(vName))
      if (found) setSelectedVendor(found.uid || found.id)
    } else if (externalFilter === 'reset') {
      setOnlyFreeDelivery(false)
      setOnlyHighRating(false)
      setOnlyDeals(false)
      setSelectedCategory(null)
      setSelectedSubcategory(null)
      setSelectedVendor('')
    }
  }, [externalFilter, topShops])

  // Sync external selectedDepartment prop from Top Departments Strip
  useEffect(() => {
    if (!selectedDepartment) {
      setSelectedCategory(null)
      setOnlyDeals(false)
      return
    }

    if (selectedDepartment === 'deals') {
      setOnlyDeals(true)
      setSelectedCategory(null)
      setSelectedVendor('')
    } else if (selectedDepartment === 'stores') {
      setSelectedVendor('')
      topShopsScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      setOnlyDeals(false)
      // 1. Direct ID or Code match from database
      const directMatch = categories.find(c =>
        String(c.id) === String(selectedDepartment) ||
        (c.code && c.code.toLowerCase() === selectedDepartment.toLowerCase())
      )
      if (directMatch) {
        setSelectedCategory(directMatch.id)
        return
      }

      // 2. Keyword fallback match
      const kw = selectedDepartment.toLowerCase()
      const matched = categories.find(c => {
        const n = c.name?.toLowerCase() || ''
        const code = c.code?.toLowerCase() || ''
        if (kw === 'restaurant' || kw === 'dining' || kw === 'food') return n.includes('restaurant') || n.includes('food') || n.includes('dining') || code.includes('restaurant')
        if (kw === 'mobile' || kw === 'tech') return n.includes('mobile') || n.includes('tech') || n.includes('electron')
        if (kw === 'computers') return n.includes('computer') || n.includes('laptop')
        if (kw === 'grocery') return n.includes('grocer') || n.includes('supermarket') || n.includes('produce')
        if (kw === 'bakery') return n.includes('baker') || n.includes('patisserie') || n.includes('dessert')
        return n.toLowerCase() === kw
      })
      if (matched) {
        setSelectedCategory(matched.id)
      }
    }
  }, [selectedDepartment, categories])

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

  // Handle Detail Product Variations & Image Reset
  useEffect(() => {
    if (detailProduct) {
      setModalQty(1)
      setActiveModalImage(0)
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

  // Modal keyboard listeners (Escape key)
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

  // Instant Realtime Event Listener: auto-refresh catalog when products, stock, or prices change
  useRealtimeEvent('PRODUCT_UPDATED', () => {
    fetchProducts()
  })

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

  // Derive Subcategories from loaded categories
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

  // Products with actual discounts for Flash Sale section
  const discountedProducts = useMemo(() => {
    return products.filter(p => parseFloat(p.discount || 0) > 0 || (p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price)))
  }, [products])

  // Max discount value for banners
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
    return max > 0 ? max : 45
  }, [discountedProducts])

  // Derive dynamic brand facets with live product counts
  const availableBrands = useMemo(() => {
    const map = {}
    products.forEach(p => {
      if (p.brandName && p.brandName.trim()) {
        const b = p.brandName.trim()
        map[b] = (map[b] || 0) + 1
      }
    })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [products])

  // Derive dynamic color facets with live product counts
  const availableColors = useMemo(() => {
    const map = {}
    products.forEach(p => {
      if (p.color && p.color.trim()) {
        const c = p.color.trim()
        map[c] = (map[c] || 0) + 1
      }
    })
    return Object.entries(map).map(([name, count]) => ({ name, count }))
  }, [products])

  // Derive filtered lists for sidebar filters based on inline searches
  const filteredSidebarCategories = useMemo(() => {
    if (!categorySearch.trim()) return categories
    const q = categorySearch.toLowerCase().trim()
    return categories.filter(c => c.name?.toLowerCase().includes(q))
  }, [categories, categorySearch])

  const filteredSidebarShops = useMemo(() => {
    if (!storeSearch.trim()) return topShops
    const q = storeSearch.toLowerCase().trim()
    return topShops.filter(s => (s.businessName || s.username || '').toLowerCase().includes(q))
  }, [topShops, storeSearch])

  const filteredSidebarBrands = useMemo(() => {
    if (!brandSearch.trim()) return availableBrands
    const q = brandSearch.toLowerCase().trim()
    return availableBrands.filter(b => b.name?.toLowerCase().includes(q))
  }, [availableBrands, brandSearch])

  // Filter products by all selected criteria (multi-faceted + AI)
  const filteredProducts = useMemo(() => {
    const baseList = aiSearchPayload?.products?.length ? aiSearchPayload.products : products

    return baseList.filter(product => {
      const q = searchQuery.toLowerCase().trim()
      const name = String(product.proName ?? '').toLowerCase()
      const desc = String(product.description ?? '').toLowerCase()
      const brand = String(product.brandName ?? '').toLowerCase()
      const color = String(product.color ?? '').toLowerCase()
      const vendorName = String(product.vendor?.businessName ?? '').toLowerCase()
      const catName = String(product.category?.name ?? '').toLowerCase()
      const subCatName = String(product.subCategory?.subCatName ?? '').toLowerCase()

      const matchesSearch = aiSearchPayload
        ? true
        : (!q || name.includes(q) || desc.includes(q) || brand.includes(q) || vendorName.includes(q) || catName.includes(q) || subCatName.includes(q))

      const productCatId = product.catId ?? product.category?.id
      const productSubId = product.subCatId ?? product.subCategory?.subCatId ?? product.sub_category_id

      const matchesCategory = selectedCategory == null || idsEqual(productCatId, selectedCategory)
      const matchesSubcategory = selectedSubcategory == null || idsEqual(productSubId, selectedSubcategory)
      let matchesVendor = true
      if (selectedVendor) {
        const targetShop = topShops.find(s => String(s.id) === String(selectedVendor) || String(s.uid) === String(selectedVendor))
        if (targetShop) {
          matchesVendor = productMatchesShop(product, targetShop)
        } else {
          matchesVendor = String(product.vendorId ?? '') === String(selectedVendor)
        }
      }

      const price = parseFloat(product.salePrice || product.price) || 0
      const matchesPrice = price >= priceRange.min && price <= priceRange.max

      const matchesFreeDelivery = !onlyFreeDelivery || product.freeDelivery === true
      const matchesDeals = !onlyDeals || (parseFloat(product.discount || 0) > 0 || (product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price)))

      const matchesBrands = selectedBrands.length === 0 || (product.brandName && selectedBrands.includes(product.brandName))
      const matchesColors = selectedColors.length === 0 || (product.color && selectedColors.includes(product.color))
      const matchesStock = !onlyInStock || (product.stock > 0 || product.qnty > 0)

      let avgRating = 0
      if (Array.isArray(product.reviews) && product.reviews.length > 0) {
        avgRating = product.reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0) / product.reviews.length
      }
      const matchesRating = !onlyHighRating || avgRating >= 4.0

      // Food / Restaurant item detection
      const isFoodItem = (() => {
        const v = String(product.vertical || '').toUpperCase()
        const c = String(product.category?.name || product.category || '').toLowerCase()
        const n = String(product.proName || '').toLowerCase()
        if (v === 'FOOD' || v === 'RESTAURANT' || v === 'DINING') return true
        const foodKeys = ['burger', 'pizza', 'sandwich', 'platter', 'shawarma', 'biryani', 'pasta', 'bbq', 'roll', 'steak', 'salad', 'fries', 'sushi', 'dessert', 'cake', 'beverage', 'drink', 'shake', 'meal']
        return foodKeys.some(k => c.includes(k) || n.includes(k))
      })()

      // Dietary: Halal
      const matchesHalal = !onlyHalal || (isFoodItem && !desc.includes('pork') && !desc.includes('alcohol'))

      // Dietary: Pure Veg
      const matchesVeg = !onlyVeg || (isFoodItem && (name.includes('veg') || desc.includes('vegetarian') || desc.includes('salad') || desc.includes('cheese') || desc.includes('paneer')) && !name.includes('chicken') && !name.includes('beef') && !name.includes('mutton') && !name.includes('meat') && !name.includes('fish'))

      // Restaurant: Fast Prep (< 20 mins)
      const matchesFastPrep = !onlyFastPrep || (isFoodItem && (desc.includes('15') || desc.includes('20') || !desc.includes('slow')))

      // Retail: Brand Warranty (Amazon / Daraz standard)
      const matchesWarranty = !onlyBrandWarranty || Boolean(product.warranty && product.warranty.trim() && !product.warranty.toLowerCase().includes('no warranty'))

      return matchesSearch && matchesCategory && matchesSubcategory && matchesVendor && matchesPrice && matchesFreeDelivery && matchesDeals && matchesBrands && matchesColors && matchesStock && matchesRating && matchesHalal && matchesVeg && matchesFastPrep && matchesWarranty
    })
  }, [
    products,
    aiSearchPayload,
    searchQuery,
    selectedCategory,
    selectedSubcategory,
    selectedVendor,
    selectedBrands,
    selectedColors,
    onlyInStock,
    priceRange,
    onlyFreeDelivery,
    onlyDeals,
    onlyHighRating,
    onlyHalal,
    onlyVeg,
    onlyFastPrep,
    onlyBrandWarranty,
    topShops,
  ])

  // Sort products
  const sortedProducts = useMemo(() => {
    const list = [...filteredProducts]
    switch (sortBy) {
      case 'price-low':
        return list.sort((a, b) => (parseFloat(a.salePrice || a.price) || 0) - (parseFloat(b.salePrice || b.price) || 0))
      case 'price-high':
        return list.sort((a, b) => (parseFloat(b.salePrice || b.price) || 0) - (parseFloat(a.salePrice || a.price) || 0))
      case 'rating':
        return list.sort((a, b) => {
          const rA = a.reviews?.length ? a.reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0) / a.reviews.length : 0
          const rB = b.reviews?.length ? b.reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0) / b.reviews.length : 0
          return rB - rA
        })
      case 'newest':
        return list.sort((a, b) => (b.proId || 0) - (a.proId || 0))
      case 'relevance':
      default:
        return list
    }
  }, [filteredProducts, sortBy])

  // Sliced products for instant initial render
  const displayedProducts = useMemo(() => {
    return sortedProducts.slice(0, visibleCount)
  }, [sortedProducts, visibleCount])

  const handleClearFilters = () => {
    setSelectedCategory(null)
    setSelectedSubcategory(null)
    setSelectedVendor('')
    setSelectedBrands([])
    setSelectedColors([])
    setOnlyInStock(false)
    setPriceRange({ min: 0, max: 200000 })
    setOnlyFreeDelivery(false)
    setOnlyDeals(false)
    setOnlyHighRating(false)
    setOnlyHalal(false)
    setOnlyVeg(false)
    setOnlyFastPrep(false)
    setOnlyBrandWarranty(false)
    setCategorySearch('')
    setStoreSearch('')
    setBrandSearch('')
    setAiSearchPayload(null)
    if (onSelectDepartment) onSelectDepartment(null)
  }


  // Render Modern Bespoke Product Card (Grid View - Neo-Marketplace Iris & Slate aesthetic)
  const renderProductCard = (product, index) => {
    let avgRating = null
    if (Array.isArray(product.reviews) && product.reviews.length > 0) {
      avgRating = product.reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0) / product.reviews.length
    }

    const inWishlist = isInWishlist(product.proId)
    const listPrice = parseFloat(product.price) || 0
    const salePrice = product.salePrice ? parseFloat(product.salePrice) : null
    const hasDiscount = (salePrice && salePrice < listPrice) || parseFloat(product.discount || 0) > 0
    const discPct = hasDiscount
      ? (salePrice ? Math.round(((listPrice - salePrice) / listPrice) * 100) : Math.round(parseFloat(product.discount)))
      : 0

    // Safe image extraction supporting JSON string array, array, or raw URL
    let coverImg = null
    if (Array.isArray(product.proImages) && product.proImages.length > 0) {
      coverImg = product.proImages[0]
    } else if (typeof product.proImages === 'string') {
      try {
        const parsed = JSON.parse(product.proImages)
        if (Array.isArray(parsed) && parsed.length > 0) coverImg = parsed[0]
        else if (typeof parsed === 'string') coverImg = parsed
        else coverImg = product.proImages
      } catch {
        coverImg = product.proImages
      }
    }
    coverImg = normalizeImageUrl(coverImg)

    // Food vs Retail vertical detection
    const isFoodItem = (() => {
      const v = String(product.vertical || '').toUpperCase()
      const c = String(product.category?.name || product.category || '').toLowerCase()
      const n = String(product.proName || '').toLowerCase()
      if (v === 'FOOD' || v === 'RESTAURANT' || v === 'DINING') return true
      const foodKeys = ['burger', 'pizza', 'sandwich', 'platter', 'shawarma', 'biryani', 'pasta', 'bbq', 'roll', 'steak', 'salad', 'fries', 'sushi', 'dessert', 'cake', 'beverage', 'drink', 'shake', 'meal']
      return foodKeys.some(k => c.includes(k) || n.includes(k))
    })()

    return (
      <div
        key={product.proId || index}
        role="button"
        tabIndex={0}
        onClick={() => setDetailProduct(product)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setDetailProduct(product)
          }
        }}
        className="group relative flex flex-col h-full min-h-[340px] rounded-none bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all duration-200 overflow-hidden cursor-pointer text-left"
      >
        {/* Card Header Media & Badges */}
        <div className="relative aspect-square w-full bg-slate-50/70 dark:bg-slate-950/70 overflow-hidden flex items-center justify-center p-3">
          {coverImg ? (
            <Image
              src={normalizeImageUrl(coverImg)}
              alt={product.proName || 'Product'}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 260px"
              loading="lazy"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-slate-800 text-gray-400">
              <Package className="w-12 h-12 stroke-[1.25]" />
            </div>
          )}

          {/* Floating Discount Badge */}
          {hasDiscount && discPct > 0 && (
            <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-rose-500 to-blue-600 px-2.5 py-0.5 text-[10px] font-black text-white shadow-md z-10 flex items-center gap-0.5 tracking-wide">
              <span>-{discPct}%</span>
            </div>
          )}

          {/* Food-specific signals: Prep Time & Halal Pill */}
          {isFoodItem ? (
            <div className="absolute top-2 right-9 rounded-full bg-emerald-600/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-black text-white shadow-sm z-10 flex items-center gap-0.5 tracking-wide uppercase">
              <span>⏱️ 15-20m</span>
            </div>
          ) : (
            product.brandName && (
              <div className="absolute top-2 right-9 rounded-full bg-slate-900/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-black text-white shadow-sm z-10 tracking-wide uppercase truncate max-w-[80px]">
                {product.brandName}
              </div>
            )
          )}

          {/* Official Store Tag */}
          <div className="absolute bottom-2 left-2 rounded-full bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-extrabold text-slate-800 dark:text-slate-200 shadow-sm z-10 flex items-center gap-1 border border-slate-200/80 dark:border-slate-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
            <span className="truncate max-w-[90px]">{product.vendor?.businessName?.split(' ')[0] || 'Official'}</span>
          </div>

          {/* Wishlist Heart Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (inWishlist) {
                removeFromWishlist(product.proId)
                toast.success('Removed from wishlist')
              } else {
                addToWishlist(product)
                toast.success('Added to wishlist!')
              }
            }}
            aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            title="Wishlist"
            className="absolute top-2 right-2 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full hover:bg-white dark:hover:bg-slate-700 hover:scale-110 transition-all shadow-sm z-10 text-slate-400 hover:text-rose-500 border border-slate-100 dark:border-slate-700"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'text-rose-500 fill-current' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Card Body & Details */}
        <div className="p-3.5 flex flex-col flex-1 justify-between bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80">
          <div>
            {/* Vendor / Brand Line & Food Signals */}
            <div className="flex items-center justify-between gap-1 text-[11px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
              <div className="flex items-center gap-1 truncate max-w-[130px]">
                <Store className="w-3 h-3 text-blue-500 flex-shrink-0" />
                <span className="truncate">
                  {product.vendor?.businessName || product.vendor?.username || 'Verified Store'}
                </span>
              </div>
              {isFoodItem && (
                <span className="text-[9px] font-black uppercase text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1 py-0.2 rounded">
                  🥩 Halal
                </span>
              )}
            </div>

            {/* Product Title - Clickable link to dedicated page with SEO slug */}
            <Link
              href={getProductUrl(product)}
              onClick={(e) => e.stopPropagation()}
              className="block group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors mb-1.5"
            >
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-[13.5px] leading-snug line-clamp-2 tracking-tight">
                {product.proName}
              </h3>
            </Link>

            {/* Star Rating & Review Count */}
            <div className="flex items-center text-xs gap-1.5 mb-2">
              <div className="flex items-center text-amber-500 font-extrabold">
                <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                <span>{avgRating !== null ? avgRating.toFixed(1) : '4.8'}</span>
              </div>
              <span className="text-slate-400 text-[11px]">
                ({product.reviews?.length || 24})
              </span>
              <span className="text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded text-[10px] font-black tracking-wide">
                {t('inStock')}
              </span>
            </div>
          </div>

          {/* Pricing & Add to Cart Action */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-end justify-between gap-1">
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
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">
                {product.freeDelivery ? t('freeDelivery') : (isFoodItem ? 'Express 30m Courier' : t('standardShipping'))}
              </span>
            </div>

            {/* Quick Add Button */}
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
              className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-600 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 hover:text-white dark:hover:text-white transition-all shadow-sm group-hover:scale-105 border border-blue-100 dark:border-blue-900 hover:border-transparent cursor-pointer"
              aria-label={t('addToCart') || 'Add to basket'}
            title={t('addToCart')}
            >
              <ShoppingBag className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Render Horizontal List View Card (Amazon / Daraz Search Results standard)
  const renderProductListCard = (product, index) => {
    let avgRating = null
    if (Array.isArray(product.reviews) && product.reviews.length > 0) {
      avgRating = product.reviews.reduce((acc, r) => acc + (parseFloat(r.rating) || 0), 0) / product.reviews.length
    }

    const inWishlist = isInWishlist(product.proId)
    const listPrice = parseFloat(product.price) || 0
    const salePrice = product.salePrice ? parseFloat(product.salePrice) : null
    const hasDiscount = (salePrice && salePrice < listPrice) || parseFloat(product.discount || 0) > 0
    const discPct = hasDiscount
      ? (salePrice ? Math.round(((listPrice - salePrice) / listPrice) * 100) : Math.round(parseFloat(product.discount)))
      : 0

    let coverImg = null
    if (Array.isArray(product.proImages) && product.proImages.length > 0) {
      coverImg = product.proImages[0]
    } else if (typeof product.proImages === 'string') {
      try {
        const parsed = JSON.parse(product.proImages)
        if (Array.isArray(parsed) && parsed.length > 0) coverImg = parsed[0]
        else if (typeof parsed === 'string') coverImg = parsed
        else coverImg = product.proImages
      } catch {
        coverImg = product.proImages
      }
    }
    coverImg = normalizeImageUrl(coverImg)

    const isFoodItem = (() => {
      const v = String(product.vertical || '').toUpperCase()
      const c = String(product.category?.name || product.category || '').toLowerCase()
      const n = String(product.proName || '').toLowerCase()
      if (v === 'FOOD' || v === 'RESTAURANT' || v === 'DINING') return true
      const foodKeys = ['burger', 'pizza', 'sandwich', 'platter', 'shawarma', 'biryani', 'pasta', 'bbq', 'roll', 'steak', 'salad', 'fries', 'sushi', 'dessert', 'cake', 'beverage', 'drink', 'shake', 'meal']
      return foodKeys.some(k => c.includes(k) || n.includes(k))
    })()

    return (
      <div
        key={product.proId || index}
        role="button"
        tabIndex={0}
        onClick={() => setDetailProduct(product)}
        className="group relative flex flex-col sm:flex-row items-stretch rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer text-left"
      >
        {/* Left: Product Thumbnail */}
        <div className="relative sm:w-52 w-full aspect-square sm:aspect-auto bg-slate-50/70 dark:bg-slate-950/70 flex-shrink-0 flex items-center justify-center p-3">
          {coverImg ? (
            <Image
              src={normalizeImageUrl(coverImg)}
              alt={product.proName || 'Product'}
              fill
              sizes="(max-width: 640px) 100vw, 208px"
              loading="lazy"
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 p-2"
            />
          ) : (
            <Package className="w-12 h-12 text-slate-400 stroke-[1.25]" />
          )}

          {hasDiscount && discPct > 0 && (
            <div className="absolute top-2 left-2 rounded-full bg-gradient-to-r from-rose-500 to-blue-600 px-2 py-0.5 text-[10px] font-black text-white shadow-md z-10">
              -{discPct}%
            </div>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation()
              if (inWishlist) {
                removeFromWishlist(product.proId)
                toast.success('Removed from wishlist')
              } else {
                addToWishlist(product)
                toast.success('Added to wishlist!')
              }
            }}
            className="absolute top-2 right-2 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md rounded-full shadow-sm text-slate-400 hover:text-rose-500"
          >
            <Heart className={`w-4 h-4 ${inWishlist ? 'text-rose-500 fill-current' : 'text-slate-400'}`} />
          </button>
        </div>

        {/* Center: Details & Features */}
        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between border-t sm:border-t-0 sm:border-l border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                {product.category?.name || 'Exclusive'}
              </span>

              {isFoodItem ? (
                <>
                  <span className="text-[10px] font-black uppercase text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                    ⏱️ 15–20 Mins Prep
                  </span>
                  <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                    🥩 100% Halal
                  </span>
                </>
              ) : (
                <span className="text-[10px] font-black uppercase text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                  🛡️ Genuine Sealed Box
                </span>
              )}
            </div>

            <Link
              href={getProductUrl(product)}
              onClick={(e) => e.stopPropagation()}
              className="block group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors"
            >
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base leading-snug line-clamp-2">
                {product.proName}
              </h3>
            </Link>

            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>Sold by: <strong>{product.vendor?.businessName || 'Verified Merchant'}</strong></span>
              <span>•</span>
              <div className="flex items-center text-amber-500 font-extrabold">
                <Star className="w-3.5 h-3.5 fill-current mr-0.5" />
                <span>{avgRating !== null ? avgRating.toFixed(1) : '4.8'}</span>
              </div>
              <span>({product.reviews?.length || 24} reviews)</span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 leading-relaxed">
              {product.description || (isFoodItem ? 'Prepared fresh on order with certified premium ingredients and hygienic kitchen packaging.' : 'Original brand authenticated item with complete manufacturer warranty and rapid dispatch.')}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 font-bold">
              <CheckCircle2 className="w-3 h-3" /> In Stock & Ready
            </span>
            <span>•</span>
            <span>14-Day Resolution</span>
            <span>•</span>
            <span>COD Available</span>
          </div>
        </div>

        {/* Right: Price & CTA Column */}
        <div className="p-4 sm:p-5 sm:w-56 flex-shrink-0 flex flex-col justify-between sm:border-l border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-slate-950 dark:text-white">
                Rs. {(salePrice || listPrice).toLocaleString()}
              </span>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  Rs. {listPrice.toLocaleString()}
                </span>
              )}
            </div>

            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
              {product.freeDelivery ? (t('freeDelivery') || 'Free Delivery') : (isFoodItem ? (t('expressCourier') || 'Express 30m Courier') : (t('standardShipping') || 'Standard Shipping (Rs. 150)'))}
            </span>

            {!isFoodItem && listPrice >= 2000 && (
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">
                {t('fromRs') || 'From'} Rs. {Math.round(listPrice / 3).toLocaleString()}/mo
              </span>
            )}
          </div>

          <div className="space-y-2 pt-3">
            <button
              type="button"
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
              className="w-full py-2.5 px-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-sm rounded-xl transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>{t('addToBasket') || 'Add to Basket'}</span>
            </button>

            <Link
              href={getProductUrl(product)}
              onClick={(e) => e.stopPropagation()}
              className="w-full py-2 px-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs uppercase tracking-wider flex items-center justify-center border border-slate-200 dark:border-slate-700 rounded-xl transition-colors"
            >
              {t('viewDetails') || 'View Details'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // NOTE: We intentionally do NOT return a full-page skeleton while `loading`.
  // The hero, promo cards and layout are rendered immediately (and server-side),
  // so the LCP hero image is discoverable in the initial HTML and the layout does
  // not jump when products arrive. Only the product grid shows a skeleton.

  // Left Sidebar Filter Component Body
  const SidebarFilterPanel = (
    <div className="space-y-6 text-sm">
      {/* Title & Clear Action */}
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-blue-600 dark:text-blue-400" /> {t('filterCatalog')}
        </h3>
        <button
          type="button"
          onClick={handleClearFilters}
          className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 transition-colors cursor-pointer"
        >
          {t('resetAll') || 'Reset all'}
        </button>
      </div>

      {/* ── 1. Department / Categories with Search ── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
            {t('departments')}
          </h4>
          {selectedCategory !== null && (
            <button
              type="button"
              onClick={() => setSelectedCategory(null)}
              className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
            >
              All
            </button>
          )}
        </div>

        {/* Categories Inline Search Box */}
        <div className="relative mb-2.5">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            placeholder="Search categories..."
            className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          {categorySearch && (
            <button
              type="button"
              onClick={() => setCategorySearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
              selectedCategory === null
                ? 'bg-blue-50 dark:bg-blue-950/60 font-black text-blue-600 dark:text-blue-400'
                : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
            }`}
          >
            <span>{t('allDepartments')}</span>
            <span className="text-[11px] text-slate-400">{products.length}</span>
          </button>
          {filteredSidebarCategories.map((cat) => {
            const isSel = idsEqual(selectedCategory, cat.id)
            const count = products.filter(p => idsEqual(p.catId ?? p.category?.id, cat.id)).length
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(isSel ? null : cat.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                  isSel
                    ? 'bg-blue-50 dark:bg-blue-950/60 font-black text-blue-600 dark:text-blue-400'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium'
                }`}
              >
                <span className="truncate max-w-[170px]">{cat.name}</span>
                <span className="text-[11px] text-slate-400">{count}</span>
              </button>
            )
          })}
          {filteredSidebarCategories.length === 0 && (
            <p className="text-xs text-slate-400 py-2 text-center">No categories found</p>
          )}
        </div>
      </div>

      {/* ── 2. Multi-Vendor Official Brands / Boutiques with Search ── */}
      {topShops.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {t('officialBoutiques')}
            </h4>
            {selectedVendor && (
              <button
                type="button"
                onClick={() => setSelectedVendor('')}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Store Inline Search Box */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={storeSearch}
              onChange={(e) => setStoreSearch(e.target.value)}
              placeholder="Search stores & restaurants..."
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {storeSearch && (
              <button
                type="button"
                onClick={() => setStoreSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {filteredSidebarShops.map((shop) => {
              const sId = String(shop.id)
              const isChecked = selectedVendor === sId
              const vendorCount = products.filter(p => productMatchesShop(p, shop)).length
              return (
                <label
                  key={shop.id}
                  className="flex items-center justify-between p-1.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => setSelectedVendor(isChecked ? '' : sId)}
                      className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5 accent-blue-600 cursor-pointer"
                    />
                    <span className={`truncate text-xs ${isChecked ? 'font-black text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                      {shop.businessName || shop.username}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 ml-1">({vendorCount})</span>
                </label>
              )
            })}
            {filteredSidebarShops.length === 0 && (
              <p className="text-xs text-slate-400 py-2 text-center">No stores found</p>
            )}
          </div>
        </div>
      )}

      {/* ── 3. Dietary & Kitchen Lifestyle (Food & Restaurant delivery) ── */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-2 text-xs uppercase tracking-wider flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>Food & Kitchen Lifestyle</span>
        </h4>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600">
          <input
            type="checkbox"
            checked={onlyHalal}
            onChange={(e) => setOnlyHalal(e.target.checked)}
            className="rounded accent-emerald-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              🥩 100% Halal
            </span>
            <span>{t('halalCertified') || 'Halal Certified Only'}</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600">
          <input
            type="checkbox"
            checked={onlyVeg}
            onChange={(e) => setOnlyVeg(e.target.checked)}
            className="rounded accent-emerald-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded">
              🌱 Pure Veg
            </span>
            <span>{t('pureVeg') || 'Vegetarian Dishes'}</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600">
          <input
            type="checkbox"
            checked={onlyFastPrep}
            onChange={(e) => setOnlyFastPrep(e.target.checked)}
            className="rounded accent-emerald-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('fastPrep') || 'Fast Kitchen Prep (< 20m)'}</span>
          </div>
        </label>
      </div>

      {/* ── 4. Price Filter (Slider & Inputs) ── */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-2 text-xs uppercase tracking-wider">
          {t('priceRangePkr') || 'Price Range (PKR)'}
        </h4>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="0"
              max="200000"
              value={priceRange.min}
              onChange={(e) => setPriceRange({ ...priceRange, min: Math.max(0, Number(e.target.value)) })}
              placeholder="Min"
              className="w-1/2 p-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-blue-500 font-semibold"
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="number"
              min="0"
              max="200000"
              value={priceRange.max}
              onChange={(e) => setPriceRange({ ...priceRange, max: Math.max(0, Number(e.target.value)) })}
              placeholder="Max"
              className="w-1/2 p-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:outline-blue-500 font-semibold"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              { label: 'Under 1k', min: 0, max: 1000 },
              { label: '1k - 3k', min: 1000, max: 3000 },
              { label: '3k - 10k', min: 3000, max: 10000 },
              { label: '10k+', min: 10000, max: 200000 },
            ].map((pill, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setPriceRange({ min: pill.min, max: pill.max })}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-slate-700 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer"
              >
                {t(pill.label) || pill.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── 5. Customer Rating, Deals & Express Delivery ── */}
      <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-2">
        <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-1 text-xs uppercase tracking-wider">
          {t('serviceRating') || 'Service & Rating'}
        </h4>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600">
          <input
            type="checkbox"
            checked={onlyHighRating}
            onChange={(e) => setOnlyHighRating(e.target.checked)}
            className="rounded accent-blue-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <span className="flex text-amber-500"><Star className="w-3.5 h-3.5 fill-current" /></span>
            <span>{t('starsAbove') || '4.0 Stars & Above'}</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600">
          <input
            type="checkbox"
            checked={onlyDeals}
            onChange={(e) => setOnlyDeals(e.target.checked)}
            className="rounded accent-blue-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <Percent className="w-3.5 h-3.5 text-rose-500" />
            <span>{t('onSaleOnly') || 'On Sale / Flash Drops'}</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600">
          <input
            type="checkbox"
            checked={onlyFreeDelivery}
            onChange={(e) => setOnlyFreeDelivery(e.target.checked)}
            className="rounded accent-blue-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <Truck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t('freeExpressDelivery') || 'Free Express Delivery'}</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600">
          <input
            type="checkbox"
            checked={onlyInStock}
            onChange={(e) => setOnlyInStock(e.target.checked)}
            className="rounded accent-blue-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('inStockOnly') || 'In Stock Only'}</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600">
          <input
            type="checkbox"
            checked={onlyBrandWarranty}
            onChange={(e) => setOnlyBrandWarranty(e.target.checked)}
            className="rounded accent-blue-600 h-3.5 w-3.5 cursor-pointer"
          />
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('officialWarranty') || 'Official Brand Warranty'}</span>
          </div>
        </label>
      </div>

      {/* ── 6. Dynamic Brand Multi-Select Facet with Search ── */}
      {availableBrands.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-xs uppercase tracking-wider">
              {t('brands') || 'Brands'} ({availableBrands.length})
            </h4>
            {selectedBrands.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedBrands([])}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {t('clear') || 'Clear'}
              </button>
            )}
          </div>

          {/* Brands Inline Search Box */}
          <div className="relative mb-2.5">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={brandSearch}
              onChange={(e) => setBrandSearch(e.target.value)}
              placeholder={t('searchBrands') || 'Search brands...'}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            {brandSearch && (
              <button
                type="button"
                onClick={() => setBrandSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {filteredSidebarBrands.map((b) => {
              const isChecked = selectedBrands.includes(b.name)
              return (
                <label
                  key={b.name}
                  className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {
                        setSelectedBrands(prev =>
                          isChecked ? prev.filter(x => x !== b.name) : [...prev, b.name]
                        )
                      }}
                      className="rounded accent-blue-600 h-3.5 w-3.5 cursor-pointer"
                    />
                    <span className={`truncate text-xs ${isChecked ? 'font-black text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300 font-medium'}`}>
                      {b.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400">({b.count})</span>
                </label>
              )
            })}
            {filteredSidebarBrands.length === 0 && (
              <p className="text-xs text-slate-400 py-2 text-center">No brands found</p>
            )}
          </div>
        </div>
      )}

      {/* ── 7. Dynamic Color Swatches Facet ── */}
      {availableColors.length > 0 && (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
          <h4 className="font-extrabold text-slate-900 dark:text-slate-100 mb-2 text-xs uppercase tracking-wider">
            Colors
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {availableColors.map((c) => {
              const isSelected = selectedColors.includes(c.name)
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => {
                    setSelectedColors(prev =>
                      isSelected ? prev.filter(x => x !== c.name) : [...prev, c.name]
                    )
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {c.name} ({c.count})
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-3 space-y-6">

      {/* ══════════════════════════════════════════════════════════════════
          0. SUPER-APP QUICK SERVICES BAR (RapidRide Taxi, Luggage, 2nd Hand, Deals)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => router.push('/customer?tab=taxi')}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white font-black text-xs shadow-md shadow-emerald-700/25 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 border border-emerald-400/30"
        >
          <span className="text-base">🚖</span>
          <span>RapidRide City Taxi</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">Offer Fare</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/customer?tab=taxi')}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 text-white font-black text-xs shadow-md shadow-purple-700/25 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 border border-purple-400/30"
        >
          <span className="text-base">📦</span>
          <span>Luggage & Parcel Drop</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">Courier</span>
        </button>

        <button
          type="button"
          onClick={() => router.push('/customer?tab=secondhand')}
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-black text-xs shadow-md shadow-amber-600/25 hover:scale-105 active:scale-95 transition-all cursor-pointer whitespace-nowrap shrink-0 border border-amber-300/30"
        >
          <span className="text-base">♻️</span>
          <span>2nd Hand Marketplace</span>
          <span className="px-1.5 py-0.5 rounded-full bg-white/20 text-[10px] font-black uppercase tracking-wider">Make Offers</span>
        </button>

        <button
          type="button"
          onClick={() => setOnlyDeals(prev => !prev)}
          className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-black text-xs border transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            onlyDeals
              ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/30'
              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-200 dark:border-slate-700 hover:border-rose-400'
          }`}
        >
          <span className="text-base">⚡</span>
          <span>Flash Drops</span>
          <span className="px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase">Up to 50%</span>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          1. FULL-WIDTH HERO SHOWCASE & BENTO PROMO HUB (Amazon / Daraz Hub)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Main Banner Slider (8 Cols on Desktop - Pure Banner Image Style) */}
        <div className="lg:col-span-8 relative rounded-2xl overflow-hidden shadow-lg h-[260px] sm:h-[310px] md:h-[350px] lg:h-[380px] flex flex-col justify-end text-white bg-slate-900 group">
          {/* Active Banner Slide (Image Fills the Container) */}
          {heroSlides.map((slide, idx) => {
            const isActive = (activeSlideIndex % heroSlides.length) === idx
            return (
              <div
                key={slide.id || idx}
                onClick={() => {
                  if (slide.ctaLink) {
                    if (slide.ctaLink.startsWith('http')) {
                      window.open(slide.ctaLink, '_blank')
                    } else {
                      router.push(slide.ctaLink)
                    }
                  } else if (slide.deptId && onSelectDepartment) {
                    onSelectDepartment(slide.deptId)
                  }
                }}
                className={`absolute inset-0 transition-opacity duration-700 cursor-pointer overflow-hidden ${
                  isActive ? 'opacity-100 pointer-events-auto z-0' : 'opacity-0 pointer-events-none -z-10'
                }`}
              >
                {slide.image && (isActive || heroWarm) ? (
                  <Image
                    src={normalizeImageUrl(slide.image)}
                    alt={slide.title || 'Promotional Banner'}
                    fill
                    priority={idx === 0}
                    quality={70}
                    sizes="(max-width: 1024px) 100vw, 66vw"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                ) : null}

                {/* Subtle soft gradient at the bottom so controls always stay readable */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 via-black/20 to-transparent pointer-events-none" />
              </div>
            )
          })}

          {/* Slider Pagination Controls & Prev/Next Arrows */}
          <div className="relative z-10 flex items-center justify-between p-4 sm:p-6 mt-auto pointer-events-auto">
            <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
              {heroSlides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveSlideIndex(i)
                  }}
                  className={`h-2 rounded-full transition-all cursor-pointer ${
                    (activeSlideIndex % heroSlides.length) === i ? 'w-8 bg-white shadow' : 'w-2 bg-white/40 hover:bg-white/70'
                  }`}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>

            <div className="flex gap-2" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveSlideIndex(prev => (prev === 0 ? heroSlides.length - 1 : prev - 1))
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all cursor-pointer hover:scale-110"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveSlideIndex(prev => (prev + 1) % heroSlides.length)
                }}
                className="p-2 rounded-full bg-black/40 hover:bg-black/70 backdrop-blur-md text-white transition-all cursor-pointer hover:scale-110"
                aria-label="Next slide"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Bento Promo Cards (4 Cols on Desktop - Dynamic & Premium Redesign) */}
        {(() => {
          const w1 = promoWidgets?.widget_1 || {
            badge: 'LIMITED DROPS',
            title: 'Curated Drop Discounts',
            subtitle: 'Flash deals with up to 50% discount across verified tech, pantry, and gourmet dining.',
            buttonText: 'Explore Drops',
            buttonLink: '/deals',
            showTimer: true,
          }
          const w2 = promoWidgets?.widget_2 || {
            badge: 'FEATURED STORES & RESTAURANTS',
            title: '100% Authentic Brand Guarantees',
            subtitle: 'Direct partner merchants with certified authenticity, direct fulfillment, and official warranties.',
            footerTag: '7-Day Easy Returns',
            footerLinkText: 'View Boutiques →',
            footerLink: '/customer',
          }

          return (
            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-4">
              {/* Bento Card 1: Live Flash Drops Countdown (Electric Violet & Obsidian Glow) */}
              <div className="flex-1 rounded-2xl bg-gradient-to-br from-[#0c0f1d] via-[#1a1438] to-[#2d124d] border border-violet-500/30 p-5 text-white shadow-xl shadow-purple-950/20 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:border-violet-400/60 hover:-translate-y-0.5">
                {/* Ambient Glow & Watermark Flame */}
                <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-violet-600/20 blur-2xl pointer-events-none" />
                <div className="absolute right-1 bottom-1 opacity-10 text-violet-400 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <Flame className="w-28 h-28" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-[11px] font-black tracking-wider uppercase text-rose-300 shadow-sm shadow-rose-950/30">
                      <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400 animate-pulse" />
                      <span>{w1.badge || 'LIMITED DROPS'}</span>
                    </span>
                    <span className="text-[11px] font-black text-violet-300/80 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      CLOSING IN
                    </span>
                  </div>

                  {/* Digital Countdown Timer Blocks with Micro Labels */}
                  {w1.showTimer !== false && <BentoCountdown />}

                  <h4 className="font-black text-base text-white leading-tight mb-1">
                    {w1.title || 'Curated Drop Discounts'}
                  </h4>
                  <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2">
                    {w1.subtitle || 'Flash deals with up to 50% discount across verified tech, pantry, and gourmet dining.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (w1.buttonLink) {
                      if (w1.buttonLink.startsWith('http')) window.open(w1.buttonLink, '_blank')
                      else router.push(w1.buttonLink)
                    } else {
                      setOnlyDeals(true)
                    }
                  }}
                  className="relative z-10 mt-3.5 w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <span>{w1.buttonText || 'Explore Drops'}</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>

              {/* Bento Card 2: 100% Genuine Multi-Vendor Guarantee (Emerald Shield) */}
              <div className="flex-1 rounded-2xl bg-gradient-to-br from-[#061412] via-[#09221d] to-[#043329] border border-emerald-500/30 p-5 text-white shadow-xl shadow-emerald-950/20 flex flex-col justify-between relative overflow-hidden group transition-all duration-300 hover:border-emerald-400/60 hover:-translate-y-0.5">
                {/* Ambient Glow */}
                <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />
                <div className="absolute right-2 top-2 opacity-10 text-emerald-400 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
                  <ShieldCheck className="w-24 h-24" />
                </div>

                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-[11px] font-black tracking-wider uppercase text-emerald-300 shadow-sm shadow-emerald-950/30">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{w2.badge || 'FEATURED STORES & RESTAURANTS'}</span>
                    </span>
                  </div>

                  <h4 className="font-extrabold text-sm sm:text-base text-slate-100 leading-tight mb-1">
                    {w2.title || '100% Authentic Brand Guarantees'}
                  </h4>
                  <p className="text-xs text-slate-300/80 leading-relaxed line-clamp-2 mb-2.5">
                    {w2.subtitle || 'Direct partner merchants with certified authenticity, direct fulfillment, and official warranties.'}
                  </p>

                  {/* Social Proof: Verified Store Avatars Strip */}
                  {topShops && topShops.length > 0 && (
                    <div className="flex items-center gap-1.5 mb-2">
                      <div className="flex -space-x-2 overflow-hidden">
                        {topShops.slice(0, 4).map((shop, i) => (
                          <div
                            key={shop.id || i}
                            className="inline-block h-6 w-6 rounded-full ring-2 ring-emerald-950 overflow-hidden bg-slate-800"
                            title={shop.businessName}
                          >
                            {shop.urlLogo ? (
                              <Image src={normalizeImageUrl(shop.urlLogo)} alt={shop.businessName || 'Brand'} width={48} height={48} sizes="48px" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[10px] font-bold text-emerald-300">
                                {(shop.businessName || 'S').charAt(0)}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-300/90 ml-1">
                        {topShops.length}+ Verified Partners
                      </span>
                    </div>
                  )}
                </div>

                <div className="relative z-10 flex items-center justify-between pt-2.5 border-t border-emerald-500/20 text-xs">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-extrabold text-[11px]">
                    {w2.footerTag || '7-Day Easy Returns'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (w2.footerLink) {
                        if (w2.footerLink.startsWith('http')) window.open(w2.footerLink, '_blank')
                        else router.push(w2.footerLink)
                      } else {
                        topShopsScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
                      }
                    }}
                    className="font-extrabold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 group/btn cursor-pointer transition-colors"
                  >
                    <span>{w2.footerLinkText || 'View Boutiques →'}</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          2. DEPARTMENT SQUIRCLES / QUICK JUMP BAR
      ══════════════════════════════════════════════════════════════════ */}
      {categories.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-black text-slate-900 dark:text-slate-100 text-sm sm:text-base uppercase tracking-tight flex items-center gap-2">
              <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" /> {t('exploreDepartments')}
            </h3>
            <div className="flex gap-1">
              <button
                onClick={() => scrollCarousel(departmentStripRef, -200)}
                className="p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                aria-label="Scroll left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scrollCarousel(departmentStripRef, 200)}
                className="p-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                aria-label="Scroll right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div
            ref={departmentStripRef}
            className="flex gap-4 sm:gap-6 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id
              const count = products.filter(p => idsEqual(p.catId ?? p.category?.id, cat.id)).length
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(isSelected ? null : cat.id)}
                  aria-label={cat.name || "Browse category"}
                  className="flex flex-col items-center flex-shrink-0 group focus:outline-none"
                >
                  <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden p-1 border-2 transition-all duration-200 shadow-sm bg-slate-50 dark:bg-slate-800 flex items-center justify-center ${
                    isSelected ? 'border-blue-600 dark:border-blue-500 scale-105 shadow-blue-500/20 shadow-md' : 'border-slate-200 dark:border-slate-700 group-hover:border-blue-400'
                  }`}>
                    {cat.image ? (
                      <Image
                        src={normalizeImageUrl(cat.image)}
                        alt={cat.name || 'Category'}
                        width={80}
                        height={80}
                        sizes="80px"
                        loading="lazy"
                        className="w-full h-full object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400 font-black text-xl">
                        {cat.name?.charAt(0)?.toUpperCase() || 'C'}
                      </span>
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-black text-center truncate max-w-[90px] ${
                    isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                  }`}>
                    {t(cat.name) || cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">
                    {count} {t('items') || 'items'}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          3. LIVE FLASH DROPS TICKER (Neo-Marketplace Rose & Iris)
      ══════════════════════════════════════════════════════════════════ */}
      {discountedProducts.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-sm relative overflow-hidden">
          {/* Flash Bar Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-rose-600">
                <Flame className="w-5 h-5 fill-current text-rose-500" />
                <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-slate-100">
                  {t('flashDrops')}
                </h3>
              </div>

              {/* Ticking Timer Countdown Pill */}
              <PillCountdown label={t('endsIn') || 'Ends in:'} />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setOnlyDeals(true)}
                className="text-xs font-black text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>{t('exploreAllDrops') || 'EXPLORE ALL DROPS'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <div className="flex gap-1">
                <button
                  onClick={() => scrollCarousel(flashDealsScrollRef, -240)}
                  className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 shadow-sm"
                  aria-label="Scroll deals left"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-700" />
                </button>
                <button
                  onClick={() => scrollCarousel(flashDealsScrollRef, 240)}
                  className="p-1.5 rounded-full border border-slate-200 hover:bg-slate-100 shadow-sm"
                  aria-label="Scroll deals right"
                >
                  <ChevronRight className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>
          </div>

          {/* Flash Deals Horizontal Carousel */}
          <div
            ref={flashDealsScrollRef}
            className="flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-hide scroll-smooth"
          >
            {discountedProducts.slice(0, 14).map((p, idx) => (
              <div key={p.proId || idx} className="w-48 sm:w-52 md:w-56 flex-shrink-0 flex flex-col">
                {renderProductCard(p, idx)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          4. OFFICIAL MULTI-VENDOR BRAND BOUTIQUES
      ══════════════════════════════════════════════════════════════════ */}
      {topShops.length > 0 && (
        <div ref={topShopsScrollRef} className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" /> {t('officialBoutiques') || 'Featured Stores & Restaurants'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                100% verified merchants, restaurants & supermarkets
              </p>
            </div>

            <div className="flex gap-1.5">
              <button
                onClick={() => scrollCarousel(topShopsScrollRef, -240)}
                className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
                aria-label="Scroll stores left"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
              <button
                onClick={() => scrollCarousel(topShopsScrollRef, 240)}
                className="p-1.5 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm"
                aria-label="Scroll stores right"
              >
                <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
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
              const count = products.filter(p => productMatchesShop(p, shop)).length

              return (
                <button
                  key={shop.id || idx}
                  type="button"
                  onClick={() => setSelectedVendor(isSelected ? '' : sId)}
                  className={`flex-shrink-0 w-48 sm:w-56 rounded-2xl border p-4 text-left shadow-sm hover:shadow-md transition-all group ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 dark:border-blue-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-500'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 p-1 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0">
                      {logo ? (
                        <Image
                          src={normalizeImageUrl(logo)}
                          alt={shop.businessName || 'Store'}
                          width={48}
                          height={48}
                          sizes="48px"
                          loading="lazy"
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Store className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100 dark:fill-emerald-950" />
                        <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">{t('verified') || 'Verified'}</span>
                      </div>
                      <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">{count} {t('productsCount') || 'Products'}</span>
                    </div>
                  </div>

                  <h4 className="font-black text-sm text-slate-900 dark:text-slate-100 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {shop.businessName || shop.username}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {shop.city || 'Express Doorstep Delivery'}
                  </p>

                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="font-extrabold text-blue-600 dark:text-blue-400 group-hover:underline">
                      {isSelected ? (t('viewingBoutique') || 'Viewing Store') : (t('visitBoutique') || 'Visit Store →')}
                    </span>
                    <span className="text-amber-500 font-extrabold flex items-center gap-0.5">
                      <Star className="w-3 h-3 fill-current" /> 4.9
                    </span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          5. MAIN PRODUCT CATALOG (Full-Width Amazon / Daraz Grid)
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-6 items-start pt-2">
        {/* Left Sticky Sidebar (Desktop Filter Panel) */}
        <aside className="hidden lg:block w-64 xl:w-72 flex-shrink-0 sticky top-28 rounded-2xl bg-white dark:bg-slate-900 p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {SidebarFilterPanel}
        </aside>

        {/* Right Main Product Grid Area */}
        <main className="flex-1 min-w-0 space-y-4">
          {/* AI Vector & NLP Intent Banner (When AI Search is active) */}
          {aiSearchPayload && (
            <div className="rounded-none border border-blue-500/40 bg-gradient-to-r from-blue-950/80 via-slate-900 to-indigo-950/80 p-4 text-white shadow-xl flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-blue-600/30 border border-blue-400/50 flex items-center justify-center text-blue-400">
                  <Sparkles className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider bg-blue-600 text-white rounded-none">
                      {aiSearchPayload.isAiPowered ? 'Gemini AI Intent Active' : 'Smart Intent Active'}
                    </span>
                    <span className="text-xs text-blue-300 font-medium">
                      &ldquo;{aiSearchPayload.query}&rdquo;
                    </span>
                  </div>
                  <p className="text-sm font-bold text-white mt-1">
                    {aiSearchPayload.explanation}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAiSearchPayload(null)
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('clearAiSearch'))
                  }
                }}
                className="text-xs font-bold px-3 py-1.5 rounded-none bg-white/10 hover:bg-white/20 border border-white/20 text-white transition-colors cursor-pointer"
              >
                Clear AI Results
              </button>
            </div>
          )}

          {/* Top Bar: Item Counter, Active Tags & Sort Dropdown */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 sm:p-4 border border-slate-200/90 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {/* Mobile Filter Drawer Trigger */}
              <button
                type="button"
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-xs text-slate-800 dark:text-slate-200 flex items-center gap-1.5"
              >
                <Filter className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> {t('filters') || 'Filters'}
              </button>

              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none">
                  {t('allProducts') || 'All Products'}
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  {t('showing') || 'Showing'} <strong>{sortedProducts.length}</strong> {t('of') || 'of'} {products.length} {t('productsCount') || 'products'}
                </span>
              </div>
            </div>

            {/* Active Filter Tags Bar */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-[200px]">
              {selectedCategory && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200/80 dark:border-blue-900">
                  {t(categories.find(c => idsEqual(c.id, selectedCategory))?.name) || 'Category'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedCategory(null)} />
                </span>
              )}
              {selectedVendor && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 text-xs font-bold border border-blue-200/80 dark:border-blue-900">
                  {topShops.find(s => String(s.id) === String(selectedVendor))?.businessName || 'Store'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setSelectedVendor('')} />
                </span>
              )}
              {onlyDeals && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 text-xs font-bold border border-rose-200/80 dark:border-rose-900">
                  {t('flashDrops') || 'Flash Drops'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setOnlyDeals(false)} />
                </span>
              )}
              {onlyFreeDelivery && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/80 dark:border-emerald-900">
                  {t('freeDelivery') || 'Free Delivery'}
                  <X className="w-3 h-3 cursor-pointer" onClick={() => setOnlyFreeDelivery(false)} />
                </span>
              )}
              {(selectedCategory || selectedVendor || onlyDeals || onlyFreeDelivery) && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-[11px] font-black text-rose-600 hover:underline px-2 py-1 cursor-pointer"
                >
                  {t('clearAll') || 'Clear All'}
                </button>
              )}
            </div>

            {/* View Mode Toggle & Sort Dropdown (Amazon & Daraz Standard) */}
            <div className="flex items-center gap-3">
              {/* Grid vs List View Toggle */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')} aria-label="Switch to grid view"
                  title="Grid View (Amazon / Daraz Cards)"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')} aria-label="Switch to list view"
                  title="List View (Spec & Comparison Rich)"
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-bold hidden sm:inline">{t('sortBy') || 'Sort:'}</span>
                <select
                  id="catalog-sort-select"
                  aria-label="Sort products by"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 py-1.5 px-3 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-blue-500 cursor-pointer"
                >
                  <option value="relevance">{t('sortRelevance') || 'Relevance'}</option>
                  <option value="price-low">{t('sortPriceLow') || 'Price: Low to High'}</option>
                  <option value="price-high">{t('sortPriceHigh') || 'Price: High to Low'}</option>
                  <option value="rating">{t('sortRating') || 'Highest Rated'}</option>
                  <option value="discount">{t('sortDiscount') || 'Biggest Discount %'}</option>
                  <option value="newest">{t('sortNewest') || 'Newest Arrivals'}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Product Cards Responsive Container (Grid or List View) */}
          {loading && sortedProducts.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4" aria-busy="true" aria-label="Loading products">
              {Array.from({ length: 8 }).map((_, i) => (
                <ShimmerBlock key={i} className="h-[340px] rounded-xl" />
              ))}
            </div>
          ) : sortedProducts.length === 0 ? (
            <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <Package className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 mb-1">{t('noProductsFound') || 'No products found'}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 max-w-sm mx-auto">
                {t('noProductsSubtitle') || 'No items matched your current filters. Try resetting the filters or modifying your search terms.'}
              </p>
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition-colors cursor-pointer"
              >
                {t('resetAllFilters') || 'Reset All Filters'}
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-3.5 sm:gap-4">
                {displayedProducts.map((product, index) => renderProductCard(product, index))}
              </div>
              {visibleCount < sortedProducts.length && (
                <div className="flex flex-col items-center justify-center mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-3">
                    Showing {displayedProducts.length} of {sortedProducts.length} items
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(prev => prev + 24)}
                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Load More Products ({sortedProducts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="space-y-3.5">
                {displayedProducts.map((product, index) => renderProductListCard(product, index))}
              </div>
              {visibleCount < sortedProducts.length && (
                <div className="flex flex-col items-center justify-center mt-10 pt-6 border-t border-slate-200/80 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-3">
                    Showing {displayedProducts.length} of {sortedProducts.length} items
                  </p>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(prev => prev + 24)}
                    className="px-8 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    Load More Products ({sortedProducts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          6. MOBILE FILTERS DRAWER (For Screens < lg)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showMobileFilters && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm lg:hidden"
            onClick={() => setShowMobileFilters(false)}
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-xs h-full bg-white dark:bg-slate-900 p-5 overflow-y-auto shadow-2xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">{t('filterCatalog')}</h3>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {SidebarFilterPanel}
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-6">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-black text-xs text-center shadow-md hover:bg-blue-700 transition-colors"
                >
                  Apply Filters ({sortedProducts.length} Items)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          7. FULL PRODUCT DETAIL MODAL (Neo-Marketplace Detail View)
      ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {detailProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm"
            onClick={() => setDetailProduct(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-slate-900 overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col text-slate-900 dark:text-slate-100"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                    {detailProduct.vendor?.businessName || detailProduct.vendor?.username || (t('officialBoutique') || 'Official Boutique')}
                  </span>
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> {t('verified') || 'Verified'}
                  </span>
                </div>
                <button
                  onClick={() => setDetailProduct(null)}
                  className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Grid */}
              <div className="overflow-y-auto p-5 sm:p-6 flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: Product Images Gallery */}
                <div>
                  <div className="relative aspect-square w-full rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center p-4">
                    {detailProduct.proImages?.[activeModalImage] || detailProduct.proImages?.[0] ? (
                      <img
                        src={normalizeImageUrl(detailProduct.proImages[activeModalImage] || detailProduct.proImages[0])}
                        alt={detailProduct.proName || 'Product'}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const s = e.currentTarget.src
                          if (s && s.includes('rapidtechpro.s3')) {
                            e.currentTarget.src = s.replace(/https:\/\/[^/]*s3[^/]*\/(rapidtechpro\/)?/, 'https://d1nvnelpyr43e7.cloudfront.net/')
                          }
                        }}
                      />
                    ) : (
                      <Package className="w-16 h-16 text-slate-300 dark:text-slate-700" />
                    )}
                  </div>

                  {/* Thumbnails list */}
                  {Array.isArray(detailProduct.proImages) && detailProduct.proImages.length > 1 && (
                    <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                      {detailProduct.proImages.map((img, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setActiveModalImage(i)}
                          className={`w-14 h-14 rounded-xl border-2 overflow-hidden flex-shrink-0 p-1 bg-slate-50 dark:bg-slate-950 ${
                            activeModalImage === i ? 'border-blue-600 dark:border-blue-500 scale-105' : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                        >
                          <img
                            src={normalizeImageUrl(img)}
                            alt={`Thumb ${i}`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              const s = e.currentTarget.src
                              if (s && s.includes('rapidtechpro.s3')) {
                                e.currentTarget.src = s.replace(/https:\/\/[^/]*s3[^/]*\/(rapidtechpro\/)?/, 'https://d1nvnelpyr43e7.cloudfront.net/')
                              }
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right: Specifications, Variations & Cart Actions */}
                <div className="flex flex-col justify-between space-y-4">
                  <div>
                    <Link
                      href={getProductUrl(detailProduct)}
                      onClick={(e) => handleNavigateToProduct(e, detailProduct)}
                      className="block group cursor-pointer"
                    >
                      <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 leading-snug mb-2 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {detailProduct.proName}
                      </h3>
                    </Link>

                    {/* Ratings & Category */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-3 flex-wrap">
                      <div className="flex items-center text-amber-500 font-extrabold">
                        <Star className="w-4 h-4 fill-current mr-0.5" />
                        <span>4.8 (24 {t('reviews') || 'Reviews'})</span>
                      </div>
                      <span>•</span>
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {[detailProduct.category?.name, detailProduct.subCategory?.subCatName].filter(Boolean).map(c => t(c) || c).join(' / ')}
                      </span>
                    </div>

                    {/* Price Block (Sapphire & Gold) */}
                    <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 mb-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                          Rs. {parseFloat(detailProduct.salePrice || detailProduct.price || 0).toLocaleString()}
                        </span>
                        {detailProduct.salePrice && parseFloat(detailProduct.salePrice) < parseFloat(detailProduct.price) && (
                          <span className="text-sm text-slate-400 line-through">
                            Rs. {parseFloat(detailProduct.price).toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold block mt-0.5">
                        ✓ {t('inStockReady') || 'In Stock & Ready to Ship'}
                      </span>
                    </div>

                    {/* Description */}
                    {detailProduct.description && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                        {detailProduct.description}
                      </p>
                    )}

                    {/* Variations */}
                    {parsedVariations.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-black text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2">
                          {t('selectOption') || 'Select Option:'}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {parsedVariations.map((v, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setSelectedVariation(v)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                                selectedVariation?.name === v.name
                                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-black'
                                  : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                              }`}
                            >
                              {v.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{t('quantity') || 'Quantity:'}</span>
                      <div className="flex items-center border border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800">
                        <button
                          type="button"
                          onClick={() => setModalQty(Math.max(1, modalQty - 1))}
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-3 py-1 text-xs font-black min-w-[28px] text-center dark:text-white">
                          {modalQty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setModalQty(modalQty + 1)}
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Add to Basket & Full Page Actions */}
                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          addToCart(detailProduct, modalQty, selectedVariation)
                          toast.success(`Added ${modalQty} item(s) to basket!`)
                          setDetailProduct(null)
                        }}
                        className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                      >
                        <ShoppingBag className="w-4 h-4" />
                        <span>{t('addToBasket') || 'Add to Basket'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          addToCart(detailProduct, modalQty, selectedVariation)
                          setDetailProduct(null)
                          window.dispatchEvent(new CustomEvent('openCart'))
                        }}
                        className="px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm shadow-md transition-colors cursor-pointer"
                      >
                        {t('buyNow') || 'Buy Now'}
                      </button>
                    </div>

                    <Link
                      href={getProductUrl(detailProduct)}
                      onClick={(e) => handleNavigateToProduct(e, detailProduct)}
                      className="w-full py-2.5 px-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-extrabold text-xs flex items-center justify-center gap-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t('viewFullPage') || 'View Full Product Page with Reviews & Specifications →'}</span>
                    </Link>
                  </div>
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
