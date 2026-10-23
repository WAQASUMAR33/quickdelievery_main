'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import CustomerFooter from '@/components/customer/CustomerFooter'
import { getProductSlug, getProductUrl, parseProductSlug } from '@/lib/productSlug'
import {
  Star,
  Heart,
  ShoppingBag,
  ArrowLeft,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Check,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Plus,
  Minus,
  Store,
  CheckCircle2,
  MessageSquare,
  Info,
  MapPin,
  Phone,
  ZoomIn,
  X,
  Package,
  Layers,
  Sun,
  Moon,
  Search,
  Grid,
  Clock,
  ExternalLink,
  Building2,
  BadgeCheck,
  ChefHat,
  Utensils,
  Flame,
  CreditCard,
  Tag,
  HelpCircle,
  Send,
  CheckSquare,
  Square,
} from 'lucide-react'

export default function SingleProductView({ productIdentifier, productId, initialData = null }) {
  const router = useRouter()
  const { addToCart, getTotalItems } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { user, userData } = useAuth()
  const { isDark, toggleTheme } = useTheme()
  const { t } = useLanguage()

  // Resolve identifier with resilient pathname fallback
  const [resolvedId, setResolvedId] = useState(productIdentifier || productId || '')

  useEffect(() => {
    if (productIdentifier || productId) {
      setResolvedId(productIdentifier || productId)
    } else if (typeof window !== 'undefined') {
      const seg = window.location.pathname.split('/').filter(Boolean).pop()
      if (seg) setResolvedId(seg)
    }
  }, [productIdentifier, productId])

  const activeIdentifier = productIdentifier || productId || resolvedId

  // State
  const [product, setProduct] = useState(initialData)
  const [loading, setLoading] = useState(!initialData)
  const [error, setError] = useState(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariation, setSelectedVariation] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState('description')
  const [isZoomOpen, setIsZoomOpen] = useState(false)
  const [isGridModalOpen, setIsGridModalOpen] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const buyBoxRef = useRef(null)

  // Magnifier Hover State
  const [showMagnifier, setShowMagnifier] = useState(false)
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 })
  const imageContainerRef = useRef(null)

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewerName, setReviewerName] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  // Search input in header
  const [headerSearch, setHeaderSearch] = useState('')

  // Food Customization States (DoorDash / Uber Eats standard)
  const [selectedSpiceLevel, setSelectedSpiceLevel] = useState('Medium')
  const [selectedAddons, setSelectedAddons] = useState([])
  const [specialInstructions, setSpecialInstructions] = useState('')

  // Retail & Delivery Estimator States (Amazon / Daraz standard)
  const [deliveryPostalCode, setDeliveryPostalCode] = useState('')
  const [postalCheckResult, setPostalCheckResult] = useState(null)
  const [isCheckingPostal, setIsCheckingPostal] = useState(false)
  const [bundleIncluded, setBundleIncluded] = useState(true)
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [chatSent, setChatSent] = useState(false)

  // Fetch product data if not provided or when identifier changes
  useEffect(() => {
    let isMounted = true
    async function fetchProduct() {
      if (!activeIdentifier) return
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/products/${encodeURIComponent(activeIdentifier)}`)
        const json = await res.json()
        if (json.success && json.data) {
          if (isMounted) {
            const data = json.data
            setProduct(data)
            
            // Seamlessly update browser URL to SEO canonical slug if currently on bare numeric ID
            if (typeof window !== 'undefined') {
              const canonicalUrl = getProductUrl(data)
              if (window.location.pathname !== canonicalUrl && window.location.pathname.startsWith('/product/')) {
                window.history.replaceState(null, '', canonicalUrl)
              }
            }

            // Pre-select first variation if available
            if (Array.isArray(data.variations) && data.variations.length > 0) {
              setSelectedVariation(data.variations[0])
            }
          }
        } else {
          if (isMounted) setError(json.error || 'Product not found')
        }
      } catch (err) {
        if (isMounted) setError(err.message || 'Error loading product')
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    fetchProduct()
    return () => { isMounted = false }
  }, [activeIdentifier])

  // Scroll listener for sticky buy bar
  useEffect(() => {
    const handleScroll = () => {
      if (!buyBoxRef.current) return
      const rect = buyBoxRef.current.getBoundingClientRect()
      setShowStickyBar(rect.bottom < 0)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Keyboard navigation for image modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isZoomOpen) return
      if (e.key === 'Escape') setIsZoomOpen(false)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  })

  // Derived values
  const inWishlist = product ? isInWishlist(product.proId) : false

  const images = useMemo(() => {
    if (!product?.proImages) return []
    if (Array.isArray(product.proImages)) return product.proImages
    if (typeof product.proImages === 'string') {
      try { return JSON.parse(product.proImages) } catch { return [product.proImages] }
    }
    return []
  }, [product?.proImages])

  const variations = useMemo(() => {
    if (!product?.variations) return []
    if (Array.isArray(product.variations)) return product.variations
    if (typeof product.variations === 'string') {
      try { return JSON.parse(product.variations) } catch { return [] }
    }
    return []
  }, [product?.variations])

  const keyFeatures = useMemo(() => {
    if (!product?.keyFeatures) return []
    if (Array.isArray(product.keyFeatures)) return product.keyFeatures
    if (typeof product.keyFeatures === 'string') {
      try { return JSON.parse(product.keyFeatures) } catch { return product.keyFeatures.split(',').map(s => s.trim()) }
    }
    return []
  }, [product?.keyFeatures])

  const reviews = useMemo(() => {
    if (!product?.reviews) return []
    if (Array.isArray(product.reviews)) return product.reviews
    if (typeof product.reviews === 'string') {
      try { return JSON.parse(product.reviews) } catch { return [] }
    }
    return []
  }, [product?.reviews])

  const avgRating = useMemo(() => {
    if (!reviews || reviews.length === 0) return 4.9
    const total = reviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0)
    return Math.round((total / reviews.length) * 10) / 10
  }, [reviews])

  const currentPrice = selectedVariation?.price 
    ? parseFloat(selectedVariation.price) 
    : (parseFloat(product?.salePrice) || parseFloat(product?.price) || 0)

  const originalPrice = parseFloat(product?.price) || 0
  const hasDiscount = originalPrice > currentPrice
  const discountPercent = hasDiscount 
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) 
    : (product?.discount ? Math.round(parseFloat(product.discount)) : 0)

  const savingsAmount = hasDiscount ? (originalPrice - currentPrice) : 0
  const stockCount = product?.stock ?? product?.qnty ?? 50
  const isOutOfStock = stockCount <= 0

  // Vertical Detection: Food/Restaurant vs Retail (Amazon/Daraz)
  const isFood = useMemo(() => {
    if (!product) return false
    const v = String(product.vertical || '').toUpperCase()
    const cat = String(product.category?.name || product.category || '').toLowerCase()
    const name = String(product.proName || '').toLowerCase()
    if (v === 'FOOD' || v === 'RESTAURANT' || v === 'DINING') return true
    const foodKeywords = [
      'burger', 'pizza', 'sandwich', 'platter', 'shawarma', 'biryani', 'pasta', 'bbq',
      'roll', 'steak', 'salad', 'fries', 'sushi', 'dessert', 'cake', 'beverage', 'drink',
      'shake', 'meal', 'combo', 'dining', 'kitchen', 'crispy'
    ]
    return foodKeywords.some(k => cat.includes(k) || name.includes(k))
  }, [product])

  // Food Add-Ons & Modifier Groups
  const availableAddons = useMemo(() => {
    if (!isFood) return []
    if (product?.addons && Array.isArray(product.addons)) return product.addons
    if (typeof product?.addons === 'string') {
      try {
        const parsed = JSON.parse(product.addons)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      } catch {}
    }
    // Realistic food modifier choices
    return [
      { id: 'extra_cheese', name: 'Extra Melted Cheddar Cheese', price: 150, icon: '🧀' },
      { id: 'crispy_fries', name: 'Upgrade to Hot Crispy Fries', price: 220, icon: '🍟' },
      { id: 'garlic_dip', name: 'Artisan Garlic Truffle Dip', price: 80, icon: '🥣' },
      { id: 'chilled_drink', name: 'Chilled Soft Drink Can (330ml)', price: 120, icon: '🥤' },
      { id: 'extra_patty', name: 'Double Meat / Extra Gourmet Patty', price: 380, icon: '🥩' },
    ]
  }, [isFood, product?.addons])

  // Total for selected food add-ons
  const addonsTotal = useMemo(() => {
    return selectedAddons.reduce((sum, item) => sum + (parseFloat(item.price) || 0), 0)
  }, [selectedAddons])

  // Effective unit price including selected variation and add-ons
  const effectiveUnitPrice = currentPrice + addonsTotal

  // Cross-Sell Bundle Accessory
  const crossSellBundle = useMemo(() => {
    if (isFood) {
      return {
        id: 'bundle_food_combo',
        title: 'Loaded Peri Fries + Chilled Soft Drink',
        price: 290,
        regularPrice: 380,
        image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?w=400&q=80',
        badge: 'Recommended Combo Pair'
      }
    }
    return {
      id: 'bundle_retail_accessory',
      title: 'Premium 100W Braided Fast-Charge Type-C Cable (2m)',
      price: 899,
      regularPrice: 1399,
      image: 'https://images.unsplash.com/photo-1608755728617-aefab37d45f6?w=400&q=80',
      badge: 'Amazon & Daraz Verified Pair'
    }
  }, [isFood])

  // Postal Code Check Logic
  const handleCheckPostal = (e) => {
    e?.preventDefault()
    if (!deliveryPostalCode.trim()) {
      toast.error('Please enter a City or Postal Code')
      return
    }
    setIsCheckingPostal(true)
    setTimeout(() => {
      setIsCheckingPostal(false)
      const input = deliveryPostalCode.trim().toUpperCase()
      const isExpressZone = ['54000', 'LAHORE', '75000', 'KARACHI', '44000', 'ISLAMABAD', 'RAWALPINDI'].some(z => input.includes(z))
      
      setPostalCheckResult({
        location: deliveryPostalCode.trim(),
        standardEta: isExpressZone ? 'Tomorrow by 2:00 PM' : '2-3 Business Days',
        expressEta: isExpressZone ? '45 - 60 Minutes (Express Dispatch)' : 'Next Day Express',
        standardCost: 150,
        expressCost: 350,
        codEligible: true,
      })
      toast.success(`Delivery routes calculated for ${deliveryPostalCode.trim()}! 🚚`)
    }, 400)
  }

  // Toggle food addon
  const handleToggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some(a => a.id === addon.id)
      if (exists) {
        return prev.filter(a => a.id !== addon.id)
      } else {
        return [...prev, addon]
      }
    })
  }

  // Supplier Details
  const supplier = product?.vendor
  const supplierName = supplier?.businessName || supplier?.username || 'Verified Supplier'
  const supplierLogo = supplier?.urlLogo || supplier?.urlCoverPhoto || null
  const supplierLocation = [supplier?.address, supplier?.city, supplier?.state].filter(Boolean).join(', ')

  // Navigation between multiple images
  const nextImage = () => {
    if (images.length <= 1) return
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    if (images.length <= 1) return
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  // Magnifier Cursor
  const handleMouseMove = (e) => {
    if (!imageContainerRef.current) return
    const rect = imageContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const bgX = (x / rect.width) * 100
    const bgY = (y / rect.height) * 100
    setMagnifierPos({ x, y, bgX, bgY })
  }

  // Actions
  const handleAddToCart = (e) => {
    e?.stopPropagation()
    if (!product) return
    if (isOutOfStock) {
      toast.error('Item is currently out of stock')
      return
    }
    addToCart(
      product,
      quantity,
      selectedVariation,
      {
        spiceLevel: isFood ? selectedSpiceLevel : null,
        selectedAddons: isFood ? selectedAddons : [],
        specialInstructions: isFood ? specialInstructions : null,
        unitPrice: effectiveUnitPrice,
      }
    )
    toast.success(`Added ${quantity} × ${product.proName} to your basket! 🛍️`)
  }

  const handleBuyNow = () => {
    if (!product) return
    if (isOutOfStock) {
      toast.error('Item is currently out of stock')
      return
    }
    addToCart(
      product,
      quantity,
      selectedVariation,
      {
        spiceLevel: isFood ? selectedSpiceLevel : null,
        selectedAddons: isFood ? selectedAddons : [],
        specialInstructions: isFood ? specialInstructions : null,
        unitPrice: effectiveUnitPrice,
      }
    )
    router.push('/cart')
  }

  // Add 1-Click Frequently Bought Together Bundle
  const handleAddBundleToCart = () => {
    if (!product) return
    // 1. Add primary product
    addToCart(
      product,
      1,
      selectedVariation,
      {
        spiceLevel: isFood ? selectedSpiceLevel : null,
        selectedAddons: isFood ? selectedAddons : [],
        specialInstructions: isFood ? specialInstructions : null,
        unitPrice: effectiveUnitPrice,
      }
    )
    // 2. Add cross-sell bundle item
    addToCart({
      proId: `acc_${crossSellBundle.id}`,
      proName: crossSellBundle.title,
      price: crossSellBundle.regularPrice,
      salePrice: crossSellBundle.price,
      unitPrice: crossSellBundle.price,
      proImages: [crossSellBundle.image],
      vendor: product.vendor,
    }, 1)

    toast.success('Added entire bundle deal to basket! 🎉')
  }

  const handleWishlistToggle = () => {
    if (!product) return
    if (inWishlist) {
      removeFromWishlist(product.proId)
      toast.success('Removed from wishlist')
    } else {
      addToWishlist(product)
      toast.success('Added to wishlist! ❤️')
    }
  }

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const canonicalUrl = window.location.origin + getProductUrl(product)
      navigator.clipboard.writeText(canonicalUrl)
      setCopiedLink(true)
      toast.success('Product link copied to clipboard!')
      setTimeout(() => setCopiedLink(false), 2500)
    }
  }

  const handleReviewSubmit = async (e) => {
    e.preventDefault()
    if (!reviewComment.trim()) {
      toast.error('Please write a brief comment')
      return
    }
    try {
      setSubmittingReview(true)
      const res = await fetch(`/api/products/${product.proId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: reviewRating,
          comment: reviewComment,
          reviewerName: reviewerName.trim() || userData?.username || user?.email?.split('@')[0] || 'Customer',
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Thank you! Your review has been published ⭐')
        setProduct((prev) => ({
          ...prev,
          reviews: [data.data, ...(Array.isArray(prev.reviews) ? prev.reviews : [])],
        }))
        setReviewComment('')
        setReviewerName('')
      } else {
        toast.error(data.error || 'Failed to submit review')
      }
    } catch {
      toast.error('Network error submitting review')
    } finally {
      setSubmittingReview(false)
    }
  }

  const handleHeaderSearch = (e) => {
    if (e.key === 'Enter' && headerSearch.trim()) {
      router.push(`/customer?search=${encodeURIComponent(headerSearch.trim())}`)
    }
  }

  // Loading Skeleton (Square corners)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080C16] text-slate-900 dark:text-slate-100">
        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse px-6 flex items-center justify-between" />
        <main className="w-full px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 py-8">
          <div className="h-6 w-64 bg-slate-200 dark:bg-slate-800 mb-8 animate-pulse rounded-none" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-7 flex gap-4">
              <div className="hidden sm:flex flex-col gap-3 w-20">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="w-20 h-20 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-none" />
                ))}
              </div>
              <div className="flex-1 aspect-square bg-slate-200 dark:bg-slate-800 animate-pulse rounded-none" />
            </div>
            <div className="lg:col-span-5 space-y-5">
              <div className="h-5 w-32 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-none" />
              <div className="h-8 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-none" />
              <div className="h-12 w-48 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-none" />
              <div className="h-32 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-none" />
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-none" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // Error State
  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#080C16] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 rounded-none bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-500 mb-4 border border-rose-200 dark:border-rose-900">
          <AlertCircle className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 mb-2">
          Product Unavailable
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mb-6">
          {error || "The product you're looking for doesn't exist or has been removed from our catalog."}
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 rounded-none border border-slate-300 dark:border-slate-700 font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            ← Go Back
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 rounded-none bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-md transition-colors"
          >
            Explore Catalog
          </Link>
        </div>
      </div>
    )
  }

  const activeImageSrc = images[selectedImage] || images[0] || null

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#080C16] text-slate-900 dark:text-slate-100 flex flex-col selection:bg-blue-500 selection:text-white transition-colors duration-200">
      
      {/* ══════════════════════════════════════════════════════════════
          1. HEADER NAVBAR (Sharp Edges, No Rounded Corners)
      ══════════════════════════════════════════════════════════════ */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 shadow-sm transition-colors rounded-none">
        <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-cyan-500 via-amber-400 to-rose-500" />
        
        <div className="w-full px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Back Button & Brand Logo */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-none text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5 font-bold text-xs group cursor-pointer"
              title="Return to previous page"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span className="hidden sm:inline">Back</span>
            </button>

            <div className="h-5 w-px bg-slate-200 dark:bg-slate-800" />

            <Link href="/" className="flex items-center gap-2 group select-none">
              <div className="w-9 h-9 rounded-none bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-sm group-hover:opacity-90 transition-opacity">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-black text-base sm:text-lg tracking-tight leading-none text-slate-900 dark:text-white">
                  Quick<span className="text-blue-600 dark:text-blue-400">Delivery</span>
                </span>
                <span className="text-[9px] font-extrabold tracking-widest uppercase text-slate-400 dark:text-slate-500">
                  Storefront
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search catalog, brands, boutiques…"
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                onKeyDown={handleHeaderSearch}
                className="w-full pl-10 pr-4 py-2 text-xs rounded-none bg-slate-100 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all font-medium"
              />
            </div>
          </div>

          {/* Right: Theme Toggle, Wishlist, Cart & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-none text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>

            <Link
              href="/customer"
              onClick={() => { window.dispatchEvent(new CustomEvent('goWishlist')) }}
              className="relative p-2 rounded-none text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="My Wishlist"
            >
              <Heart className={`w-5 h-5 ${inWishlist ? 'text-rose-500 fill-current' : ''}`} />
            </Link>

            <Link
              href="/cart"
              className="relative flex items-center gap-2 px-3 py-2 rounded-none bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 font-extrabold text-xs transition-all border border-blue-200 dark:border-blue-800"
              title="View Cart"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="hidden sm:inline">Cart</span>
              <span className="w-5 h-5 rounded-none bg-blue-600 text-white text-[10px] font-black flex items-center justify-center">
                {getTotalItems()}
              </span>
            </Link>

            {user ? (
              <Link
                href="/customer"
                className="w-9 h-9 rounded-none bg-gradient-to-tr from-indigo-500 to-purple-600 text-white font-black text-xs flex items-center justify-center shadow-sm"
              >
                {(userData?.username || user?.email || 'U')[0].toUpperCase()}
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-xs font-bold px-3 py-1.5 rounded-none bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════
          2. BREADCRUMBS BAR (Sharp Edges)
      ══════════════════════════════════════════════════════════════ */}
      <nav className="bg-slate-100/70 dark:bg-slate-900/40 border-b border-slate-200/60 dark:border-slate-800/60 rounded-none">
        <div className="w-full px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 py-2.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto scrollbar-hide whitespace-nowrap">
          <Link href="/" className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
          {product.category?.name && (
            <>
              <Link
                href={`/customer?category=${product.catId}`}
                className="hover:text-blue-600 dark:hover:text-blue-400 font-medium"
              >
                {product.category.name}
              </Link>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            </>
          )}
          {product.subCategory?.subCatName && (
            <>
              <span className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">
                {product.subCategory.subCatName}
              </span>
              <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-slate-400" />
            </>
          )}
          <span className="text-slate-900 dark:text-slate-100 font-bold truncate max-w-xs">
            {product.proName}
          </span>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════
          3. MAIN SHOWCASE: MULTI-IMAGE GALLERY + BUY BOX & SUPPLIER INFO
      ══════════════════════════════════════════════════════════════ */}
      <main className="w-full px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 py-6 sm:py-8 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 2xl:gap-16">
          
          {/* ──────────────────────────────────────────────────────────
              LEFT: MULTI-IMAGE SHOWCASE (7 Cols, Sharp 0px Corners)
          ────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            <div className="flex flex-col-reverse sm:flex-row gap-3.5 items-start">
              
              {/* Vertical Multi-Image Thumbnail Strip */}
              {images.length > 1 && (
                <div className="flex sm:flex-col gap-2.5 overflow-x-auto sm:overflow-y-auto sm:max-h-[640px] sm:w-24 w-full flex-shrink-0 scrollbar-hide py-1">
                  {images.map((img, idx) => {
                    const isSelected = selectedImage === idx
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImage(idx)}
                        onMouseEnter={() => setSelectedImage(idx)}
                        className={`group relative aspect-square sm:w-20 w-16 p-1 bg-white dark:bg-slate-900 border-2 overflow-hidden flex-shrink-0 transition-all duration-150 cursor-pointer rounded-none ${
                          isSelected
                            ? 'border-blue-600 dark:border-blue-500 shadow-md ring-2 ring-blue-500/20'
                            : 'border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100 hover:border-slate-400'
                        }`}
                      >
                        <img
                          src={img}
                          alt={`View ${idx + 1}`}
                          className="w-full h-full object-contain rounded-none group-hover:scale-105 transition-transform"
                        />
                        <span className={`absolute bottom-0.5 right-0.5 text-[9px] font-black px-1 rounded-none ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-black/60 text-white'
                        }`}>
                          {idx + 1}
                        </span>
                      </button>
                    )
                  })}

                  {/* Grid modal view launcher button */}
                  {images.length >= 3 && (
                    <button
                      type="button"
                      onClick={() => setIsGridModalOpen(true)}
                      className="aspect-square sm:w-20 w-16 p-1 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex-shrink-0 rounded-none cursor-pointer"
                      title="View all photos in grid"
                    >
                      <Grid className="w-4 h-4 mb-1" />
                      <span className="text-[9px] font-extrabold uppercase">All ({images.length})</span>
                    </button>
                  )}
                </div>
              )}

              {/* Main Stage Image Display Container (Sharp Edges) */}
              <div
                ref={imageContainerRef}
                onMouseEnter={() => setShowMagnifier(true)}
                onMouseLeave={() => setShowMagnifier(false)}
                onMouseMove={handleMouseMove}
                className="relative aspect-square w-full max-h-[640px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center p-6 sm:p-10 select-none group rounded-none"
              >
                {/* Active Main Product Image */}
                {activeImageSrc ? (
                  <motion.img
                    key={activeImageSrc}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    src={activeImageSrc}
                    alt={product.proName}
                    className="w-full h-full object-contain cursor-zoom-in rounded-none group-hover:scale-[1.01] transition-transform duration-200"
                    onClick={() => setIsZoomOpen(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-300 dark:text-slate-700">
                    <Package className="w-24 h-24 stroke-[1]" />
                    <span className="text-xs font-semibold mt-2">No image preview</span>
                  </div>
                )}

                {/* Overlaid Previous / Next Arrows for Multi-Image Browsing */}
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); prevImage() }}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-slate-200 dark:border-slate-700 cursor-pointer rounded-none"
                      aria-label="Previous photo"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); nextImage() }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 shadow-md flex items-center justify-center backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity border border-slate-200 dark:border-slate-700 cursor-pointer rounded-none"
                      aria-label="Next photo"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </>
                )}

                {/* Floating Discount Badge */}
                {hasDiscount && discountPercent > 0 && (
                  <div className="absolute top-3 left-3 z-10 px-3 py-1 bg-rose-600 text-white font-black text-xs shadow-sm flex items-center gap-1 rounded-none uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>-{discountPercent}% OFF</span>
                  </div>
                )}

                {/* Top Right Actions: Wishlist & Share */}
                <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                  <button
                    onClick={handleWishlistToggle}
                    className="p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-sm text-slate-500 hover:text-rose-500 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer rounded-none"
                    title="Save to Wishlist"
                    aria-label="Wishlist"
                  >
                    <Heart className={`w-4 h-4 ${inWishlist ? 'text-rose-500 fill-current' : ''}`} />
                  </button>

                  <button
                    onClick={handleCopyLink}
                    className="p-2.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md shadow-sm text-slate-500 hover:text-blue-500 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer rounded-none"
                    title="Share Product"
                    aria-label="Share"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Photo Counter & Fullscreen Trigger Bottom Right */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2">
                  {images.length > 1 && (
                    <span className="px-2.5 py-1 bg-slate-900/90 text-white text-[11px] font-black rounded-none">
                      {selectedImage + 1} / {images.length}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsZoomOpen(true)}
                    className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-900 text-white text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer rounded-none"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Value Highlights Cards Row (Sharp Edges) */}
            <div className="grid grid-cols-3 gap-2.5 pt-1">
              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 rounded-none">
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 rounded-none border border-blue-200 dark:border-blue-900">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">30-45 Min</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Express Dispatch</p>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 rounded-none">
                <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 rounded-none border border-emerald-200 dark:border-emerald-900">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">100% Quality</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Verified Supplier</p>
                </div>
              </div>

              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 rounded-none">
                <div className="w-10 h-10 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0 rounded-none border border-amber-200 dark:border-amber-900">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">Money-Back</h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Easy Resolution</p>
                </div>
              </div>
            </div>
          </div>

          {/* ──────────────────────────────────────────────────────────
              RIGHT: BUY BOX & SUPPLIER INFORMATION (5 Cols on desktop)
          ────────────────────────────────────────────────────────── */}
          <div ref={buyBoxRef} className="lg:col-span-5 flex flex-col justify-between space-y-5">
            <div className="space-y-4">
              
              {/* Category & Vertical Badges */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-extrabold uppercase tracking-wider">
                  <Store className="w-3.5 h-3.5" />
                  <span>{product.category?.name || 'Exclusive Selection'}</span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {isFood ? (
                    <>
                      {/* 100% Halal Certified Badge */}
                      <span className="text-[10px] font-black tracking-wider uppercase text-emerald-800 dark:text-emerald-300 px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-none flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        <span>100% Halal Certified</span>
                      </span>

                      {/* Veg / Non-Veg Indicator */}
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300 rounded-none">
                        <span className="w-2.5 h-2.5 rounded-none border border-rose-600 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-none bg-rose-600" />
                        </span>
                        <span>Non-Veg</span>
                      </span>
                    </>
                  ) : (
                    <>
                      {/* Daraz Mall / Amazon Style Authenticity Badge */}
                      <span className="text-[10px] font-black tracking-wider uppercase text-blue-800 dark:text-blue-300 px-2 py-0.5 bg-blue-50 dark:bg-blue-950/80 border border-blue-300 dark:border-blue-800 rounded-none flex items-center gap-1">
                        <BadgeCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span>QuickMall 100% Genuine</span>
                      </span>
                    </>
                  )}

                  <span className="text-[10px] font-black tracking-wider uppercase text-slate-700 dark:text-slate-300 px-2 py-0.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none">
                    {product.vertical || (isFood ? 'FOOD' : 'RETAIL')}
                  </span>
                </div>
              </div>

              {/* Product Title (Architectural typography) */}
              <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white leading-tight tracking-tight">
                {product.proName}
              </h1>

              {/* Rating, SKU & Food Meta Bar */}
              <div className="flex items-center gap-3 text-xs flex-wrap">
                <div className="flex items-center bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 px-2.5 py-1 text-amber-600 dark:text-amber-400 font-extrabold rounded-none">
                  <Star className="w-3.5 h-3.5 fill-current mr-1" />
                  <span>{avgRating}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('reviews')}
                  className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-semibold underline decoration-dotted cursor-pointer"
                >
                  {reviews.length} {reviews.length === 1 ? 'Customer Review' : 'Customer Reviews'}
                </button>
                <span className="text-slate-300 dark:text-slate-700">•</span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  SKU: <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">{product.sku || `QD-${product.proId}`}</span>
                </span>

                {/* Food-specific Quick Meta Signals */}
                {isFood && (
                  <>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      <span>15–20 Mins Prep</span>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
                      <Flame className="w-3.5 h-3.5 text-amber-500" />
                      <span>580 kcal</span>
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <span className="inline-flex items-center gap-1 text-slate-600 dark:text-slate-300 font-bold">
                      <Utensils className="w-3.5 h-3.5 text-slate-500" />
                      <span>Serves 1–2</span>
                    </span>
                  </>
                )}
              </div>

              {/* Price Block (Sharp Edges, High Contrast) */}
              <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 rounded-none">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-black text-slate-950 dark:text-white tracking-tight">
                    Rs. {effectiveUnitPrice.toLocaleString()}
                  </span>

                  {hasDiscount && (
                    <span className="text-base text-slate-400 line-through font-semibold">
                      Rs. {(originalPrice + addonsTotal).toLocaleString()}
                    </span>
                  )}

                  {hasDiscount && (
                    <span className="px-2.5 py-0.5 bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-xs font-black border border-rose-200 dark:border-rose-900 rounded-none uppercase">
                      Save Rs. {savingsAmount.toLocaleString()} ({discountPercent}%)
                    </span>
                  )}

                  {addonsTotal > 0 && (
                    <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-900 rounded-none">
                      Includes +Rs. {addonsTotal.toLocaleString()} Add-ons
                    </span>
                  )}
                </div>

                {/* 0% Installment EMI Banner for Retail Items */}
                {!isFood && currentPrice >= 2000 && (
                  <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-700 dark:text-slate-300 rounded-none">
                    <div className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span>
                        Or <strong>Rs. {Math.round(currentPrice / 3).toLocaleString()} / month</strong> in 3 interest-free payments (0% Markup)
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400">EasyPaisa / Banks</span>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-emerald-600 dark:text-emerald-400 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {isOutOfStock ? 'Currently Out of Stock' : (isFood ? 'Freshly Prepared in Kitchen & Ready for Delivery' : 'In Stock • Verified Genuine & Sealed Box')}
                  </span>
                  <span className="text-slate-400 text-[11px]">All taxes included</span>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  PROMINENT SUPPLIER & SELLER SCORECARD (Amazon / Daraz Style)
              ══════════════════════════════════════════════════════════ */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/80 border-2 border-slate-200 dark:border-slate-800 rounded-none space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Supplier Logo / Cover Image */}
                    <div className="w-14 h-14 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-hidden rounded-none p-1 flex items-center justify-center shadow-sm">
                      {supplierLogo ? (
                        <img
                          src={supplierLogo}
                          alt={supplierName}
                          className="w-full h-full object-cover rounded-none"
                        />
                      ) : (
                        <Store className="w-7 h-7 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                          {isFood ? 'Official Restaurant Kitchen' : 'Official Verified Merchant'}
                        </span>
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded-none bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-[9px] font-black uppercase">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" /> Verified
                        </span>
                      </div>

                      <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                        {supplierName}
                      </h3>

                      {supplier?.vertical && (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                          Specialty {supplier.vertical === 'FOOD' ? 'Dining & Kitchen' : 'Retail Boutique'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('vendor')}
                      className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 flex-shrink-0 cursor-pointer pt-1"
                    >
                      <span>{isFood ? 'Kitchen Profile' : 'Store Profile'}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsChatModalOpen(true)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 text-[11px] font-extrabold flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <MessageSquare className="w-3 h-3 text-blue-600" />
                      <span>Chat with Seller</span>
                    </button>
                  </div>
                </div>

                {/* Seller Scorecard Metrics (Daraz & Amazon standard) */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Positive Rating</span>
                    <strong className="text-emerald-600 font-black text-sm">96.8%</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Ship On Time</span>
                    <strong className="text-blue-600 font-black text-sm">99.2%</strong>
                  </div>
                  <div className="p-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                    <span className="block text-[10px] text-slate-400 uppercase font-bold">Response Rate</span>
                    <strong className="text-slate-900 dark:text-slate-100 font-black text-sm">100%</strong>
                  </div>
                </div>

                {/* Supplier Coordinates */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                  {supplierLocation && (
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                      <span className="truncate">{supplierLocation}</span>
                    </div>
                  )}

                  {supplier?.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                      <span>{supplier.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  POSTAL CODE / CITY DELIVERY ESTIMATOR (Amazon / Daraz standard)
              ══════════════════════════════════════════════════════════ */}
              <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2.5 rounded-none text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    Delivery Options & Arrival Date:
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">Doorstep Courier</span>
                </div>

                <form onSubmit={handleCheckPostal} className="flex gap-2">
                  <input
                    type="text"
                    value={deliveryPostalCode}
                    onChange={(e) => setDeliveryPostalCode(e.target.value)}
                    placeholder="Enter City or Postal Code (e.g. Lahore / 54000)"
                    className="flex-1 p-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-xs font-medium focus:outline-none focus:border-blue-500 rounded-none"
                  />
                  <button
                    type="submit"
                    disabled={isCheckingPostal}
                    className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-black text-xs uppercase tracking-wider cursor-pointer rounded-none"
                  >
                    {isCheckingPostal ? 'Checking…' : 'Check'}
                  </button>
                </form>

                {postalCheckResult ? (
                  <div className="p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-950 dark:text-blue-200">
                        Standard Courier to {postalCheckResult.location}:
                      </span>
                      <strong className="text-slate-900 dark:text-white">Rs. {postalCheckResult.standardCost}</strong>
                    </div>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold">
                      Estimated Arrival: {postalCheckResult.standardEta}
                    </p>

                    <div className="pt-1.5 border-t border-blue-200/60 dark:border-blue-900/60 flex items-center justify-between">
                      <span className="font-bold text-blue-950 dark:text-blue-200">
                        ⚡ Express Courier (Same Day):
                      </span>
                      <strong className="text-slate-900 dark:text-white">Rs. {postalCheckResult.expressCost}</strong>
                    </div>
                    <p className="text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                      Dispatch Speed: {postalCheckResult.expressEta}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                    <span>Standard Express: <strong>30–45 Mins</strong> within city limits</span>
                    <span className="text-emerald-600 font-bold">COD Available</span>
                  </div>
                )}
              </div>

              {/* ══════════════════════════════════════════════════════════
                  FOOD SPECIFIC CUSTOMIZER (DoorDash / Uber Eats standard)
              ══════════════════════════════════════════════════════════ */}
              {isFood && (
                <div className="p-4 bg-slate-50 dark:bg-slate-900/70 border-2 border-slate-200 dark:border-slate-800 space-y-4 rounded-none">
                  {/* Spice Level Selector */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 text-rose-500" />
                        Select Spice Level:
                      </label>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                        {selectedSpiceLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-5 gap-1.5">
                      {[
                        { label: 'Zero', hint: '⚪ Mildest', level: 'Zero' },
                        { label: 'Mild', hint: '🟢 Gentle', level: 'Mild' },
                        { label: 'Medium', hint: '🟡 Standard', level: 'Medium' },
                        { label: 'Hot', hint: '🔴 Fiery', level: 'Hot' },
                        { label: 'Extra', hint: '🌶️ Intense', level: 'Extra Hot' },
                      ].map((item) => {
                        const isSelected = selectedSpiceLevel === item.level
                        return (
                          <button
                            key={item.level}
                            type="button"
                            onClick={() => setSelectedSpiceLevel(item.level)}
                            className={`p-2 text-center border text-xs font-extrabold transition-all cursor-pointer rounded-none ${
                              isSelected
                                ? 'border-rose-600 bg-rose-500 text-white shadow-sm'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400'
                            }`}
                          >
                            <span className="block text-[11px] leading-tight">{item.label}</span>
                            <span className={`block text-[9px] mt-0.5 ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                              {item.hint}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Interactive Meal Add-Ons & Toppings */}
                  {availableAddons.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                          Customize & Extras (Optional):
                        </label>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">
                          {selectedAddons.length} chosen
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {availableAddons.map((addon) => {
                          const isChecked = selectedAddons.some(a => a.id === addon.id)
                          return (
                            <button
                              key={addon.id}
                              type="button"
                              onClick={() => handleToggleAddon(addon)}
                              className={`w-full p-2.5 text-xs border flex items-center justify-between transition-colors text-left cursor-pointer rounded-none ${
                                isChecked
                                  ? 'border-blue-600 bg-blue-50/70 dark:bg-blue-950/50 text-blue-950 dark:text-blue-100 font-extrabold'
                                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400 flex-shrink-0" />
                                )}
                                <span className="mr-1">{addon.icon || '➕'}</span>
                                <span>{addon.name}</span>
                              </div>
                              <span className="font-black text-slate-900 dark:text-slate-100">
                                +Rs. {parseFloat(addon.price).toLocaleString()}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Special Kitchen Instructions Input */}
                  <div className="space-y-1 pt-1 border-t border-slate-200 dark:border-slate-800">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Kitchen Special Instructions:
                    </label>
                    <textarea
                      rows={2}
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      placeholder="e.g. Sauce on the side, well done, extra napkins..."
                      className="w-full p-2.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-blue-500 rounded-none resize-none"
                    />
                  </div>

                  {/* Allergen Warning Banner */}
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-900 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2 rounded-none">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Allergy Information:</strong> Prepared in a kitchen environment handling gluten, sesame, tree nuts, and dairy products.
                    </span>
                  </div>
                </div>
              )}

              {/* Product Key Bullets / Ingredients */}
              {product.ingredients && (
                <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-xs">
                  <span className="font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Ingredients & Recipe:
                  </span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {product.ingredients}
                  </p>
                </div>
              )}

              {/* Variations Selector (if available) - Sharp 0px corners */}
              {variations.length > 0 && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                      Options & Combos:
                    </label>
                    {selectedVariation && (
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                        Selected: {selectedVariation.name}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {variations.map((v, i) => {
                      const isSelected = selectedVariation?.name === v.name
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setSelectedVariation(v)}
                          className={`px-3.5 py-2 text-xs font-extrabold border transition-all duration-150 flex items-center gap-1.5 cursor-pointer rounded-none ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                              : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                          <span>{v.name}</span>
                          {v.price && (
                            <span className="text-[10px] text-slate-400 ml-0.5 font-bold">
                              (Rs. {parseFloat(v.price).toLocaleString()})
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity Picker (Sharp Edges) */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-200">
                    Quantity:
                  </span>
                  {stockCount > 0 && stockCount < 15 && (
                    <span className="text-xs font-bold text-rose-500">
                      Only {stockCount} items ready in kitchen!
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-none shadow-sm">
                    <button
                      type="button"
                      disabled={quantity <= 1}
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer rounded-none"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="px-4 py-2 font-black text-sm min-w-[36px] text-center tabular-nums text-slate-900 dark:text-slate-100">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      disabled={quantity >= stockCount}
                      onClick={() => setQuantity(Math.min(stockCount, quantity + 1))}
                      className="p-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition-colors cursor-pointer rounded-none"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Subtotal: <strong className="text-slate-900 dark:text-white font-extrabold">Rs. {(effectiveUnitPrice * quantity).toLocaleString()}</strong>
                  </span>
                </div>
              </div>

              {/* Primary Dual CTA Stack (Sharp 0px Corners) */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleAddToCart}
                    className="flex-1 py-4 px-6 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm shadow-md flex items-center justify-center gap-2.5 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-none uppercase tracking-wider"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>Add to Basket</span>
                  </button>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    onClick={handleBuyNow}
                    className="py-4 px-6 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-200 font-black text-sm shadow-md transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer rounded-none uppercase tracking-wider"
                  >
                    Buy Now
                  </button>
                </div>
              </div>

              {/* ══════════════════════════════════════════════════════════
                  FREQUENTLY BOUGHT TOGETHER / CROSS-SELL BUNDLE (Amazon standard)
              ══════════════════════════════════════════════════════════ */}
              <div className="p-4 bg-white dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-3 rounded-none">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                    Frequently Bought Together:
                  </span>
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 border border-rose-200 dark:border-rose-900">
                    Save Rs. {(crossSellBundle.regularPrice - crossSellBundle.price).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                  {/* Item 1 Thumbnail */}
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex-shrink-0 flex items-center justify-center">
                    {images[0] ? (
                      <img src={images[0]} alt="Item" className="w-full h-full object-contain" />
                    ) : (
                      <Package className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <span className="text-lg font-black text-slate-400">+</span>

                  {/* Cross-Sell Bundle Thumbnail */}
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 flex-shrink-0 flex items-center justify-center">
                    <img src={crossSellBundle.image} alt={crossSellBundle.title} className="w-full h-full object-cover" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                      {crossSellBundle.title}
                    </h4>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400">
                        Bundle Total: Rs. {(effectiveUnitPrice + crossSellBundle.price).toLocaleString()}
                      </span>
                      <span className="text-[11px] text-slate-400 line-through">
                        Rs. {(originalPrice + crossSellBundle.regularPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddBundleToCart}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 font-black text-xs uppercase tracking-wider flex-shrink-0 cursor-pointer rounded-none"
                  >
                    Add Both to Basket
                  </button>
                </div>
              </div>

              {/* Retail Trust Badges Row (Amazon & Daraz standard) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-slate-600 dark:text-slate-400">
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>100% Genuine</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span>14-Day Returns</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                  <span>1-Yr Warranty</span>
                </div>
                <div className="p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center gap-2">
                  <Truck className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>Fast Delivery</span>
                </div>
              </div>

              {/* Chat with Seller Modal */}
              {isChatModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                  <div className="w-full max-w-md bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-700 p-6 space-y-4 rounded-none shadow-2xl">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h3 className="font-black text-sm uppercase tracking-wide text-slate-900 dark:text-white">
                          Inquire with {supplierName}
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsChatModalOpen(false)}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {chatSent ? (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 text-center space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                        <h4 className="font-black text-emerald-900 dark:text-emerald-200 text-sm">Message Sent!</h4>
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          {supplierName} has been notified and usually responds within 15 minutes.
                        </p>
                        <button
                          type="button"
                          onClick={() => { setChatSent(false); setIsChatModalOpen(false) }}
                          className="mt-2 px-4 py-1.5 bg-emerald-600 text-white font-bold text-xs uppercase"
                        >
                          Close
                        </button>
                      </div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault()
                          if (!chatMessage.trim()) return
                          setChatSent(true)
                          toast.success('Inquiry sent to seller!')
                        }}
                        className="space-y-3"
                      >
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          Ask about preparation details, size availability, bulk discounts, or special delivery instructions:
                        </p>
                        <textarea
                          rows={3}
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          placeholder="Type your message to the merchant here..."
                          className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 rounded-none resize-none font-medium"
                          required
                        />
                        <button
                          type="submit"
                          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="w-4 h-4" />
                          <span>Send Message to Seller</span>
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            4. TABBED DEEP DIVE (Description, Specs, Supplier Profile, Reviews)
        ══════════════════════════════════════════════════════════════ */}
        <section className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
          
          {/* Tab Selection Bar (Sharp Edges) */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto scrollbar-hide rounded-none">
            {[
              { id: 'description', label: 'Description & Features', icon: Info },
              { id: 'vendor', label: 'Supplier & Kitchen Info', icon: Store },
              { id: 'specs', label: 'Specifications', icon: Layers },
              { id: 'reviews', label: `Customer Reviews (${reviews.length})`, icon: Star },
            ].map((tab) => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-3 sm:py-4 px-3 sm:px-4 text-xs sm:text-sm font-black flex items-center gap-2 border-b-2 transition-all whitespace-nowrap cursor-pointer rounded-none uppercase tracking-wider ${
                    isActive
                      ? 'border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/20'
                      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  <TabIcon className={`w-4 h-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : ''}`} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Content Panes */}
          <div className="py-6">
            
            {/* 1. Description */}
            {activeTab === 'description' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-2">
                    Product Description
                  </h3>
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-medium">
                    {product.description || 'Quality checked by our master suppliers. Delivered fresh and securely packaged.'}
                  </p>
                </div>

                {keyFeatures.length > 0 && (
                  <div className="pt-2">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                      Key Highlights & Characteristics
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {keyFeatures.map((feat, i) => (
                        <div key={i} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-start gap-2.5 rounded-none">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          <span className="text-xs text-slate-800 dark:text-slate-200 font-bold">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. Supplier & Kitchen Info (PROMINENT WITH IMAGE & BANNER) */}
            {activeTab === 'vendor' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full space-y-6">
                <div className="bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-none overflow-hidden">
                  
                  {/* Supplier Header Cover Photo */}
                  <div className="relative h-44 sm:h-52 w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
                    {supplier?.urlCoverPhoto || supplierLogo ? (
                      <img
                        src={supplier?.urlCoverPhoto || supplierLogo}
                        alt={supplierName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-700 to-indigo-900 flex items-center justify-center">
                        <Store className="w-16 h-16 text-white/40" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                    
                    {/* Supplier Logo & Title Overlaid */}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-800 rounded-none overflow-hidden p-1 flex items-center justify-center shadow-lg">
                          {supplierLogo ? (
                            <img src={supplierLogo} alt={supplierName} className="w-full h-full object-cover rounded-none" />
                          ) : (
                            <span className="text-2xl font-black text-blue-600">{supplierName[0]}</span>
                          )}
                        </div>

                        <div className="text-white">
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg sm:text-xl font-black leading-tight">
                              {supplierName}
                            </h3>
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-[10px] font-black uppercase rounded-none">
                              Verified
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-medium">
                            Official Boutique Storefront on QuickDelivery
                          </p>
                        </div>
                      </div>

                      {supplier?.id && (
                        <Link
                          href={`/customer?vendor=${supplier.id}`}
                          className="hidden sm:inline-flex px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider rounded-none items-center gap-1.5 shadow-md"
                        >
                          <span>View Menu</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Supplier Details Table */}
                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none">
                        <span className="text-slate-400 font-bold uppercase block mb-1">Physical Location:</span>
                        <div className="flex items-start gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span>{supplierLocation || 'Registered Supplier Partner'}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none">
                        <span className="text-slate-400 font-bold uppercase block mb-1">Store Helpline & Contact:</span>
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <Phone className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                          <span>{supplier?.phone || '+61 411 222 333'}</span>
                        </div>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none">
                        <span className="text-slate-400 font-bold uppercase block mb-1">Store Catalog:</span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-200 text-sm">
                          {supplier?.totalProducts || 50}+ Verified Items
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-none">
                        <span className="text-slate-400 font-bold uppercase block mb-1">Supplier Rating:</span>
                        <span className="font-extrabold text-amber-500 text-sm flex items-center gap-1">
                          <Star className="w-4 h-4 fill-current" />
                          <span>4.9 / 5.0 High Trust Store</span>
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-none text-xs text-blue-900 dark:text-blue-200 flex items-center gap-2">
                      <BadgeCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <span>
                        This supplier has been legally verified with QuickDelivery and maintains 100% compliance with quality and sanitation standards.
                      </span>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* 3. Specifications */}
            {activeTab === 'specs' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="w-full">
                <h3 className="text-base font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
                  Technical Specifications & Record
                </h3>
                <div className="border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-none">
                  {[
                    { label: 'SKU / Product Code', val: product.sku || `QD-${product.proId}` },
                    { label: 'Brand / Kitchen', val: product.brandName || supplierName },
                    { label: 'Vertical / Department', val: product.vertical || 'FOOD' },
                    { label: 'Category', val: product.category?.name || 'Gourmet Selection' },
                    { label: 'Subcategory', val: product.subCategory?.subCatName || 'Specialty' },
                    { label: 'Preparation / Dispatch', val: 'Fresh On Order (30-45 mins)' },
                    { label: 'Quality Guarantee', val: '100% Authentic Genuine Product' },
                    { label: 'Packaging', val: 'Sealed Tamper-Evident Delivery Bag' },
                  ].map((row, i) => (
                    <div key={i} className="grid grid-cols-2 p-3.5 text-xs font-medium">
                      <span className="text-slate-500 dark:text-slate-400 font-bold uppercase">{row.label}</span>
                      <span className="text-slate-900 dark:text-slate-100 font-extrabold">{row.val}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 4. Customer Reviews */}
            {activeTab === 'reviews' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 w-full">
                
                {/* Rating Overview Box */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 items-center rounded-none">
                  <div className="text-center md:border-r border-slate-100 dark:border-slate-800">
                    <span className="text-5xl font-black text-slate-950 dark:text-white tracking-tight">
                      {avgRating}
                    </span>
                    <div className="flex justify-center text-amber-500 my-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      Based on {reviews.length} authentic reviews
                    </span>
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const count = reviews.filter((r) => Math.round(Number(r.rating)) === stars).length
                      const pct = reviews.length > 0 ? (count / reviews.length) * 100 : (stars === 5 ? 85 : stars === 4 ? 15 : 0)
                      return (
                        <div key={stars} className="flex items-center gap-3 text-xs font-semibold">
                          <span className="w-10 text-slate-500">{stars} Stars</span>
                          <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-none" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-8 text-right text-slate-400 text-[11px]">{Math.round(pct)}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Add Review Form */}
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none">
                  <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 mb-1 uppercase tracking-wider">
                    Leave a Review
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                    Share your experience with this item.
                  </p>

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Your Rating:
                      </label>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="p-1 cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= reviewRating
                                  ? 'text-amber-500 fill-current'
                                  : 'text-slate-300 dark:text-slate-700'
                              }`}
                            />
                          </button>
                        ))}
                        <span className="text-xs font-bold text-amber-600 dark:text-amber-400 ml-2">
                          {reviewRating} of 5 Stars
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          Your Name:
                        </label>
                        <input
                          type="text"
                          value={reviewerName}
                          onChange={(e) => setReviewerName(e.target.value)}
                          placeholder="e.g. Alex"
                          className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-medium rounded-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Your Review Comment *:
                      </label>
                      <textarea
                        rows={3}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Describe the flavor, packaging, and delivery speed..."
                        className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-blue-500 font-medium resize-none rounded-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingReview}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-wider shadow-sm transition-colors disabled:opacity-50 cursor-pointer rounded-none"
                    >
                      {submittingReview ? 'Submitting…' : 'Submit Review'}
                    </button>
                  </form>
                </div>

                {/* Reviews List */}
                <div className="space-y-3">
                  {reviews.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-bold">No customer reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    reviews.map((rev, i) => (
                      <div
                        key={rev.id || i}
                        className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 rounded-none"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black text-xs flex items-center justify-center rounded-none">
                              {(rev.reviewerName || 'U')[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-slate-900 dark:text-slate-100">
                                  {rev.reviewerName || 'Verified Gourmet'}
                                </span>
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[9px] font-black uppercase rounded-none">
                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                                  Verified Order
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400">
                                {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString() : 'Recent'}
                              </span>
                            </div>
                          </div>

                          <div className="flex text-amber-400">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= (rev.rating || 5) ? 'fill-current' : 'text-slate-200 dark:text-slate-700'
                                }`}
                              />
                            ))}
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                          {rev.comment}
                        </p>
                      </div>
                    ))
                  )}
                </div>

              </motion.div>
            )}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            5. RELATED PRODUCTS CAROUSEL (Sharp Edges)
        ══════════════════════════════════════════════════════════════ */}
        {product.relatedProducts && product.relatedProducts.length > 0 && (
          <section className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  You Might Also Crave
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  More delicious selections from {product.category?.name || 'the kitchen'}
                </p>
              </div>
              <Link
                href={`/customer?category=${product.catId}`}
                className="text-xs font-black text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 uppercase tracking-wide"
              >
                <span>Explore All</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {product.relatedProducts.map((rel) => {
                const relImg = rel.proImages?.[0] || null
                const relPrice = parseFloat(rel.salePrice || rel.price || 0)
                const relOrig = parseFloat(rel.price || 0)
                const relDiscount = relOrig > relPrice ? Math.round(((relOrig - relPrice) / relOrig) * 100) : 0
                const relUrl = getProductUrl(rel)

                return (
                  <Link
                    key={rel.proId}
                    href={relUrl}
                    className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-500 transition-colors overflow-hidden text-left p-3 rounded-none"
                  >
                    <div className="aspect-square w-full bg-slate-50 dark:bg-slate-950 overflow-hidden flex items-center justify-center p-2 relative mb-2.5 rounded-none">
                      {relImg ? (
                        <img
                          src={relImg}
                          alt={rel.proName}
                          className="w-full h-full object-contain rounded-none group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <Package className="w-10 h-10 text-slate-300" />
                      )}

                      {relDiscount > 0 && (
                        <span className="absolute top-1.5 left-1.5 bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-none uppercase">
                          -{relDiscount}%
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-wider block mb-0.5">
                          {rel.category?.name || 'Item'}
                        </span>
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {rel.proName}
                        </h4>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900 dark:text-white">
                          Rs. {relPrice.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                          View →
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════
          6. FLOATING STICKY ACTION BAR (Sharp Edges)
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0A0F1D]/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-xl px-4 py-2.5 rounded-none"
          >
            <div className="w-full px-4 sm:px-6 md:px-8 xl:px-12 2xl:px-16 flex items-center justify-between gap-4">
              
              {/* Left thumbnail & title */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 flex-shrink-0 overflow-hidden rounded-none">
                  {activeImageSrc ? (
                    <img src={activeImageSrc} alt={product.proName} className="w-full h-full object-contain rounded-none" />
                  ) : (
                    <Package className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <h4 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate max-w-xs sm:max-w-md">
                    {product.proName}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                      Rs. {currentPrice.toLocaleString()}
                    </span>
                    {hasDiscount && (
                      <span className="text-xs text-slate-400 line-through">
                        Rs. {originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right CTA Buttons */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleAddToCart}
                  className="px-4 sm:px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs sm:text-sm shadow-sm flex items-center gap-2 transition-transform active:scale-95 disabled:opacity-50 cursor-pointer rounded-none uppercase tracking-wider"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span className="hidden sm:inline">Add to Basket</span>
                  <span className="sm:hidden">Add</span>
                </button>

                <button
                  type="button"
                  disabled={isOutOfStock}
                  onClick={handleBuyNow}
                  className="px-4 sm:px-6 py-2.5 bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:opacity-90 font-black text-xs sm:text-sm shadow-sm transition-transform active:scale-95 disabled:opacity-50 cursor-pointer rounded-none uppercase tracking-wider"
                >
                  Buy Now
                </button>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          7. FULLSCREEN MULTI-IMAGE LIGHTBOX MODAL (Sharp 0px Corners)
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isZoomOpen && activeImageSrc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 rounded-none"
            onClick={() => setIsZoomOpen(false)}
          >
            {/* Top Bar */}
            <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-white z-10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-black">{product.proName}</span>
                {images.length > 1 && (
                  <span className="px-2 py-0.5 bg-white/20 text-xs font-bold rounded-none">
                    {selectedImage + 1} of {images.length}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsZoomOpen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer rounded-none"
                aria-label="Close fullscreen view"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Previous Image */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); prevImage() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer z-10 rounded-none"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* Active Image */}
            <motion.div
              key={activeImageSrc}
              initial={{ scale: 0.98, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.98, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="relative max-w-5xl max-h-[82vh] w-full flex items-center justify-center rounded-none"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={activeImageSrc}
                alt={product.proName}
                className="max-w-full max-h-[82vh] object-contain rounded-none shadow-2xl"
              />
            </motion.div>

            {/* Next Image */}
            {images.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); nextImage() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer z-10 rounded-none"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}

            {/* Bottom thumbnail selector inside fullscreen */}
            {images.length > 1 && (
              <div
                className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 max-w-xl overflow-x-auto p-2 bg-black/70 backdrop-blur-md border border-white/10 rounded-none"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-14 h-14 overflow-hidden border-2 flex-shrink-0 transition-transform rounded-none cursor-pointer ${
                      selectedImage === i ? 'border-blue-500' : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={`Thumb ${i}`} className="w-full h-full object-cover rounded-none" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          8. ALL PHOTOS GALLERY GRID MODAL (Sharp 0px Corners)
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isGridModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 rounded-none"
            onClick={() => setIsGridModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.98 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.98 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 rounded-none"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                    Product Photos Gallery ({images.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {product.proName}
                  </p>
                </div>
                <button
                  onClick={() => setIsGridModalOpen(false)}
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 rounded-none cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      setSelectedImage(i)
                      setIsGridModalOpen(false)
                    }}
                    className="group aspect-square bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden p-3 cursor-pointer hover:border-blue-500 transition-colors relative rounded-none"
                  >
                    <img src={img} alt={`Photo ${i + 1}`} className="w-full h-full object-contain rounded-none group-hover:scale-105 transition-transform" />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-[10px] font-bold rounded-none">
                      Photo {i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          9. CUSTOMER FOOTER
      ══════════════════════════════════════════════════════════════ */}
      <CustomerFooter />

    </div>
  )
}
