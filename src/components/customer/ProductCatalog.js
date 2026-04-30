'use client'

import { useState, useEffect } from 'react'
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
  RotateCcw
} from 'lucide-react'

const BRAND = '#D70F64'

const ProductCatalog = ({ searchQuery, onToggleFavorite, favorites }) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const { user, userData } = useAuth()
  const isGuest = !userData || userData.role === 'GUEST'

  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [recentOrderProducts, setRecentOrderProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedVendor, sortBy])

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([])
      setSelectedSubcategory('')
      return
    }
    const fetchSubcategories = async () => {
      try {
        const res = await fetch(`/api/products?type=subcategories&categoryId=${selectedCategory}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setSubcategories(data.data)
          setSelectedSubcategory('')
        } else {
          setSubcategories([])
        }
      } catch { setSubcategories([]) }
    }
    fetchSubcategories()
  }, [selectedCategory])

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

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/products?type=products')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.success && data.data) {
        const active = data.data.filter(p => p?.proName && p?.price && p.status === true && p.approvalStatus === 'Approved')
        setProducts(active.length ? active : data.data.filter(p => p?.proName && p?.price))
      } else {
        setProducts([])
      }
    } catch { setProducts([]) }
    finally { setLoading(false) }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products?type=categories')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setCategories(data.success && data.data?.length ? data.data : [])
    } catch { setCategories([]) }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.proName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.catId === selectedCategory
    const matchesSubcategory = !selectedSubcategory || product.subCatId === Number(selectedSubcategory)
    const matchesVendor = !selectedVendor || product.vendorId === selectedVendor
    const price = parseFloat(product.price) || 0
    return matchesSearch && matchesCategory && matchesSubcategory && matchesVendor &&
      price >= priceRange.min && price <= priceRange.max
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low': return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
      case 'price-high': return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
      case 'rating': return (b.reviews?.length || 0) - (a.reviews?.length || 0)
      default: return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  // Deals: products with discount > 0
  const dealProducts = products.filter(p => parseFloat(p.discount || 0) > 0).slice(0, 10)

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

    return (
      <motion.div
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
          {disc > 0 && (
            <div className="absolute top-3 left-0 bg-[#D70F64] text-white text-xs font-bold px-2 py-1 rounded-r-full shadow-sm z-10">
              {disc}% OFF
            </div>
          )}
          <button
            onClick={e => { e.stopPropagation(); onToggleFavorite(product) }}
            className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'text-[#D70F64] fill-current' : 'text-gray-600'}`} />
          </button>
        </div>
        <div className="p-3">
          <h3 className="font-bold text-gray-900 line-clamp-1 text-sm group-hover:text-[#D70F64] transition-colors mb-1">
            {product.proName}
          </h3>
          <div className="flex items-center text-xs text-gray-600 mb-2 gap-1.5">
            <div className="flex items-center font-bold text-gray-800">
              <Star className="w-3 h-3 text-[#D70F64] fill-current mr-0.5" />
              {avgRating > 0 ? avgRating.toFixed(1) : 'New'}
            </div>
            <span>•</span>
            <span className="truncate max-w-[120px]">{product.vendor?.username || product.category?.name || 'General'}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2">
              {product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price) ? (
                <>
                  <span className="font-bold text-gray-900 text-sm">${parseFloat(product.salePrice).toFixed(2)}</span>
                  <span className="text-xs text-gray-400 line-through">${parseFloat(product.price).toFixed(2)}</span>
                </>
              ) : (
                <span className="font-bold text-gray-900 text-sm">${parseFloat(product.price).toFixed(2)}</span>
              )}
            </div>
            <motion.button
              onClick={e => { e.stopPropagation(); addToCart(product) }}
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
                  onClick={() => setSelectedCategory('')}
                  className={`flex-shrink-0 flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-300 min-w-[100px] ${
                    selectedCategory === ''
                      ? 'border-[#D70F64] bg-[#D70F64]/5 shadow-md'
                      : 'border-gray-200 bg-white hover:border-[#D70F64] hover:shadow-sm'
                  }`}
                >
                  <div className="w-14 h-14 bg-gradient-to-br from-[#D70F64] to-[#FF6B5B] rounded-full flex items-center justify-center mb-2 shadow-md">
                    <Package className="w-7 h-7 text-white" />
                  </div>
                  <span className={`text-xs font-bold text-center ${selectedCategory === '' ? 'text-[#D70F64]' : 'text-gray-700'}`}>All</span>
                </button>
                {categories.map((cat, idx) => {
                  const image = categoryImages[cat.name] || defaultCatImages[idx % defaultCatImages.length]
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
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

            {/* Subcategories */}
            {selectedCategory && subcategories.length > 0 && (
              <div className="mt-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedSubcategory('')}
                    className={`flex-shrink-0 px-4 py-1.5 rounded-full whitespace-nowrap border text-sm font-medium transition-all ${
                      selectedSubcategory === '' ? 'bg-[#D70F64] text-white border-[#D70F64]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#D70F64] hover:text-[#D70F64]'
                    }`}
                  >All</button>
                  {subcategories.map(sub => (
                    <button
                      key={sub.subCatId}
                      onClick={() => setSelectedSubcategory(String(sub.subCatId))}
                      className={`flex-shrink-0 px-4 py-1.5 rounded-full whitespace-nowrap border text-sm font-medium transition-all ${
                        selectedSubcategory === String(sub.subCatId) ? 'bg-[#D70F64] text-white border-[#D70F64]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#D70F64] hover:text-[#D70F64]'
                      }`}
                    >{sub.subCatName}</button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── 2. TODAY'S DEALS ── */}
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

        {/* ── 3. ORDER AGAIN ── */}
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

        {/* ── 4. TOP SHOPS ── */}
        {topShops.length > 0 && (
          <div className="mb-8">
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

        {/* ── 5. ALL PRODUCTS ── */}
        <div>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">All Products</h2>
              <span className="text-sm text-gray-500 font-medium">({filteredProducts.length})</span>
              {(selectedCategory || selectedVendor || searchQuery) && (
                <button
                  onClick={() => { setSelectedCategory(''); setSelectedVendor(''); setSelectedSubcategory('') }}
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
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D70F64] text-white rounded-lg hover:bg-[#C20D5A] transition-colors text-sm font-medium"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filter Sidebar */}
            <AnimatePresence>
              {showFilters && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    onClick={() => setShowFilters(false)}
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  />
                  <motion.div
                    initial={{ x: -300, opacity: 0 }}
                    animate={{ x: 0, opacity: 1, width: 280 }}
                    exit={{ x: -300, opacity: 0, width: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl lg:static lg:block lg:shadow-none lg:h-auto overflow-y-auto lg:overflow-visible"
                  >
                    <div className="bg-white rounded-xl p-5 sticky top-0 lg:top-24 h-full lg:h-auto border border-gray-100">
                      <div className="flex items-center justify-between mb-5 border-b border-gray-100 pb-3">
                        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Filter className="w-4 h-4" /> Filters
                        </h3>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => { setSelectedCategory(''); setSelectedVendor(''); setPriceRange({ min: 0, max: 100000 }) }}
                            className="text-xs font-bold text-[#D70F64] hover:text-[#C20D5A] uppercase tracking-wide"
                          >Reset</button>
                          <button onClick={() => setShowFilters(false)} className="lg:hidden p-1 bg-gray-100 rounded-full hover:bg-gray-200">
                            <X className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>

                      {/* Category filter */}
                      <div className="mb-6">
                        <h4 className="font-bold text-gray-700 mb-3 text-xs uppercase tracking-wider">Category</h4>
                        <div className="space-y-1">
                          {[{ id: '', name: 'All' }, ...categories].map(cat => (
                            <label key={cat.id} className="flex items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center mr-3 ${selectedCategory === cat.id ? 'border-[#D70F64]' : 'border-gray-300 group-hover:border-[#D70F64]'}`}>
                                {selectedCategory === cat.id && <div className="w-2 h-2 bg-[#D70F64] rounded-full" />}
                              </div>
                              <input type="radio" name="category" value={cat.id} checked={selectedCategory === cat.id}
                                onChange={e => setSelectedCategory(e.target.value)} className="hidden" />
                              <span className={`text-sm font-medium ${selectedCategory === cat.id ? 'text-[#D70F64]' : 'text-gray-600 group-hover:text-gray-900'}`}>{cat.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Vendor filter */}
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

                      {/* Price range */}
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
                    onClick={() => { setSelectedCategory(''); setSelectedVendor(''); setSelectedSubcategory('') }}
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    className="mt-5 px-6 py-2.5 bg-[#D70F64] text-white font-bold rounded-xl hover:bg-[#C20D5A] transition-all shadow-md"
                  >Clear Filters</motion.button>
                </motion.div>
              ) : (
                <div className={`grid gap-4 ${viewMode === 'grid'
                  ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                  : 'grid-cols-1'}`}>
                  {sortedProducts.map((product, index) => (
                    <ProductCard key={product.proId} product={product} index={index} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProductCatalog
