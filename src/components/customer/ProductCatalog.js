'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import AnimatedCard from '@/components/ui/AnimatedCard'
import {
  Heart,
  ShoppingCart,
  Star,
  Filter,
  Grid,
  List,
  ChevronDown,
  Search,
  SlidersHorizontal,
  Package,
  Truck,
  Smartphone,
  ShoppingBag,
  Home,
  Tag,
  X
} from 'lucide-react'

const ProductCatalog = ({ searchQuery, onToggleFavorite, favorites }) => {
  const { addToCart } = useCart()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100000 })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    console.log('ProductCatalog mounted, fetching products and categories...')
    fetchProducts()
    fetchCategories()
  }, [])

  // Refetch products when filters change
  useEffect(() => {
    fetchProducts()
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedVendor, sortBy])

  // Fetch subcategories when a category is selected
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        if (!selectedCategory) {
          setSubcategories([])
          setSelectedSubcategory('')
          return
        }
        const response = await fetch(`/api/products?type=subcategories&categoryId=${selectedCategory}`)

        // Check if response is ok
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }

        // Check if response is JSON
        const contentType = response.headers.get('content-type')
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text()
          console.error('Expected JSON but got:', textResponse.substring(0, 200))
          throw new Error('Response is not JSON')
        }

        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setSubcategories(data.data)
          setSelectedSubcategory('')
        } else {
          setSubcategories([])
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err)
        setSubcategories([])
      }
    }
    fetchSubcategories()
  }, [selectedCategory])


  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching products from database...')

      const response = await fetch('/api/products?type=products')

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Expected JSON but got:', textResponse.substring(0, 200))
        throw new Error('Response is not JSON')
      }

      const data = await response.json()

      console.log('API Response:', data)

      if (data.success && data.data) {
        console.log('Products found:', data.data.length)
        console.log('Raw products data:', data.data)
        // Filter for active and approved products only
        const activeProducts = data.data.filter(product =>
          product &&
          product.proName &&
          product.price &&
          product.status === true &&
          product.approvalStatus === 'Approved'
        )
        console.log('Active approved products:', activeProducts.length)
        console.log('Filtered products:', activeProducts)

        // If no approved products, show all products for debugging
        if (activeProducts.length === 0) {
          console.log('No approved products found, showing all products for debugging')
          const allProducts = data.data.filter(product =>
            product && product.proName && product.price
          )
          setProducts(allProducts)
        } else {
          setProducts(activeProducts)
        }
      } else {
        console.log('No products found in API response')
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from original API...')

      const response = await fetch('/api/products?type=categories')

      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // Check if response is JSON
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text()
        console.error('Expected JSON but got:', textResponse.substring(0, 200))
        throw new Error('Response is not JSON')
      }

      const data = await response.json()

      console.log('Categories API Response:', data)

      if (data.success && data.data && data.data.length > 0) {
        console.log('Fetched categories from original API:', data.data.length)
        setCategories(data.data)
      } else {
        console.log('Failed to Fetch the Categories')
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.proName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.catId === selectedCategory
    const matchesSubcategory = !selectedSubcategory || product.subCatId === Number(selectedSubcategory)
    const matchesVendor = !selectedVendor || product.vendorId === selectedVendor
    const productPrice = parseFloat(product.price) || 0
    const matchesPrice = productPrice >= priceRange.min && productPrice <= priceRange.max

    console.log(`Product: ${product.proName}, catId: ${product.catId}, subCatId: ${product.subCatId}, selectedCategory: ${selectedCategory}, selectedSubcategory: ${selectedSubcategory}`)
    console.log(`matchesSearch: ${matchesSearch}, matchesCategory: ${matchesCategory}, matchesSubcategory: ${matchesSubcategory}, matchesVendor: ${matchesVendor}, matchesPrice: ${matchesPrice}`)

    return matchesSearch && matchesCategory && matchesSubcategory && matchesVendor && matchesPrice
  })

  console.log('Total products:', products.length)
  console.log('Filtered products:', filteredProducts.length)
  console.log('Selected category:', selectedCategory)
  console.log('Selected subcategory:', selectedSubcategory)
  console.log('Price range:', priceRange)
  console.log('Search query:', searchQuery)

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
      case 'price-high':
        return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
      case 'rating':
        return (b.reviews?.length || 0) - (a.reviews?.length || 0)
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  const ProductCard = ({ product, index }) => {
    const isFavorite = favorites.find(fav => fav.proId === product.proId)
    const inWishlist = isInWishlist(product.proId)

    const handleWishlistToggle = (e) => {
      e.stopPropagation()
      if (inWishlist) {
        removeFromWishlist(product.proId)
      } else {
        addToWishlist(product)
      }
    }
    const averageRating = product.reviews?.length ?
      product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ y: -5 }}
        className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer border border-transparent hover:border-gray-100 overflow-hidden"
      >
        {/* Image Section */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <img
            src={product.proImages?.[0] || '/placeholder-product.jpg'}
            alt={product.proName}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
          {/* Discount Badge Mockup - Conditional if needed */}
          <div className="absolute top-3 left-0 bg-[#D70F64] text-white text-xs font-bold px-2 py-1 rounded-r-full shadow-sm z-10">
            10% OFF
          </div>
          {/* Favorite Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleFavorite(product)
            }}
            className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors z-10"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'text-[#D70F64] fill-current' : 'text-gray-600'}`} />
          </button>
        </div>

        {/* Content Section */}
        <div className="p-3">
          <div className="flex justify-between items-start mb-1">
            <h3 className="font-bold text-gray-900 line-clamp-1 flex-1 text-sm sm:text-base group-hover:text-[#D70F64] transition-colors">
              {product.proName}
            </h3>
          </div>

          {/* Rating & Category */}
          <div className="flex items-center text-xs text-gray-600 mb-2 gap-1.5">
            <div className="flex items-center font-bold text-gray-800">
              <Star className="w-3 h-3 text-[#D70F64] fill-current mr-0.5" />
              {averageRating > 0 ? averageRating.toFixed(1) : 'New'}
            </div>
            <span>•</span>
            <span className="truncate max-w-[100px]">{product.category?.name || 'General'}</span>
          </div>

          {/* Delivery Info */}
          <div className="flex items-center text-xs text-gray-500 mb-3 gap-3">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-700">15-25 min</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-gray-700">Free delivery</span>
            </div>
          </div>

          {/* Price & Add Button */}
          <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
            <div className="flex items-center gap-2">
              {product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price) ? (
                <>
                  <span className="font-bold text-gray-900">${parseFloat(product.salePrice)}</span>
                  <span className="text-xs text-gray-400 line-through">${parseFloat(product.price)}</span>
                </>
              ) : (
                <span className="font-bold text-gray-900">${parseFloat(product.price)}</span>
              )}
            </div>

            <motion.button
              onClick={(e) => {
                e.stopPropagation()
                addToCart(product)
              }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-[#D70F64] hover:text-white flex items-center justify-center transition-colors text-[#D70F64]"
              title="Add to Cart"
            >
              <ShoppingBag className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    )
  }

  if (loading) {
    console.log('ProductCatalog loading...')
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" text="Loading products..." />
      </div>
    )
  }

  console.log('ProductCatalog products:', products.length)
  console.log('ProductCatalog categories:', categories.length)
  console.log('ProductCatalog products data:', products)
  console.log('ProductCatalog filtered products:', filteredProducts.length)
  console.log('ProductCatalog sorted products:', sortedProducts.length)

  return (
    <div className="w-full overflow-x-hidden">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <motion.h1
              className="text-4xl font-bold bg-gradient-to-r from-[#F25D49] via-[#FF6B5B] to-[#FF8E7A] bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              Products
            </motion.h1>
            <motion.p
              className="text-gray-600 text-lg"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {filteredProducts.length} products found
            </motion.p>
          </div>

          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow' : ''}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-8 focus:ring-2 focus:ring-[#D70F64] focus:border-transparent outline-none cursor-pointer"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-[#D70F64] text-white rounded-lg hover:bg-[#C20D5A] transition-colors shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
            </button>
          </div>
        </motion.div>

        {/* Foodpanda Style Horizontal Scrolling Categories */}
        {categories.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">What's on your mind?</h2>
            <div className="relative">
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {/* All Categories Button */}
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`flex-shrink-0 flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 min-w-[120px] ${
                    selectedCategory === ''
                      ? 'border-[#D70F64] bg-[#D70F64]/5 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-[#D70F64] hover:shadow-md'
                  }`}
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-[#D70F64] to-[#FF6B5B] rounded-full flex items-center justify-center mb-3 shadow-lg">
                    <Package className="w-8 h-8 text-white" />
                  </div>
                  <span className={`text-sm font-bold text-center ${
                    selectedCategory === '' ? 'text-[#D70F64]' : 'text-gray-700'
                  }`}>
                    All
                  </span>
                </button>

                {categories.map((cat, idx) => {
                  // Foodpanda-style category images
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

                  const defaultImages = [
                    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=200&q=80',
                    'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=200&q=80',
                    'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?w=200&q=80',
                    'https://images.unsplash.com/photo-1493770348161-369560ae357d?w=200&q=80',
                    'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=200&q=80',
                    'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=200&q=80'
                  ]

                  const image = categoryImages[cat.name] || defaultImages[idx % defaultImages.length]

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex-shrink-0 flex flex-col items-center p-4 rounded-2xl border-2 transition-all duration-300 min-w-[120px] group ${
                        selectedCategory === cat.id
                          ? 'border-[#D70F64] bg-[#D70F64]/5 shadow-lg scale-105'
                          : 'border-gray-200 bg-white hover:border-[#D70F64] hover:shadow-md hover:scale-105'
                      }`}
                    >
                      <div className="relative w-16 h-16 rounded-full overflow-hidden mb-3 shadow-lg group-hover:shadow-xl transition-shadow">
                        <img
                          src={image}
                          alt={cat.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                      </div>
                      <span className={`text-sm font-bold text-center leading-tight ${
                        selectedCategory === cat.id ? 'text-[#D70F64]' : 'text-gray-700'
                      }`}>
                        {cat.name}
                      </span>
                    </button>
                  )
                })}
              </div>

              {/* Scroll indicators */}
              <div className="absolute left-0 top-0 bottom-4 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none" />
              <div className="absolute right-0 top-0 bottom-4 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none" />
            </div>
          </div>
        )}

        {/* Category and Subcategory Tabs */}
        <div className="space-y-4">
          {/* Categories Tabs */}
          <div className="flex items-center gap-2 flex-wrap pb-1">
            <button
              onClick={() => { setSelectedCategory(''); setSelectedSubcategory('') }}
              className={`px-4 py-2 rounded-full whitespace-nowrap border transition-colors font-medium ${selectedCategory === '' ? 'bg-[#D70F64] text-white border-[#D70F64]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#D70F64] hover:text-[#D70F64]'
                }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full whitespace-nowrap border transition-colors font-medium ${selectedCategory === cat.id ? 'bg-[#D70F64] text-white border-[#D70F64]' : 'bg-white text-gray-700 border-gray-200 hover:border-[#D70F64] hover:text-[#D70F64]'
                  }`}
                title={cat.description || cat.name}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Horizontal Scrolling Subcategories (shown when category selected) */}
          {selectedCategory && subcategories.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Choose your favorite</h3>
              <div className="relative">
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  <button
                    onClick={() => setSelectedSubcategory('')}
                    className={`flex-shrink-0 px-4 py-2 rounded-full whitespace-nowrap border transition-all duration-300 font-medium ${
                      selectedSubcategory === ''
                        ? 'bg-[#D70F64] text-white border-[#D70F64] shadow-md'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-[#D70F64] hover:text-[#D70F64] hover:shadow-sm'
                    }`}
                  >
                    All
                  </button>
                  {subcategories.map((sub) => (
                    <button
                      key={sub.subCatId}
                      onClick={() => setSelectedSubcategory(String(sub.subCatId))}
                      className={`flex-shrink-0 px-4 py-2 rounded-full whitespace-nowrap border transition-all duration-300 font-medium ${
                        selectedSubcategory === String(sub.subCatId)
                          ? 'bg-[#D70F64] text-white border-[#D70F64] shadow-md'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-[#D70F64] hover:text-[#D70F64] hover:shadow-sm'
                      }`}
                      title={sub.subCatName}
                    >
                      {sub.subCatName}
                    </button>
                  ))}
                </div>
                {/* Scroll indicators */}
                <div className="absolute left-0 top-0 bottom-2 w-6 bg-gradient-to-r from-white to-transparent pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-2 w-6 bg-gradient-to-l from-white to-transparent pointer-events-none" />
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar */}
          {/* Filters Sidebar */}
          <AnimatePresence>
            {showFilters && (
              <>
                {/* Mobile Backdrop */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowFilters(false)}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden glass"
                />

                {/* Sidebar Container */}
                <motion.div
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1, width: 280 }}
                  exit={{ x: -300, opacity: 0, width: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-2xl lg:static lg:block lg:shadow-none lg:h-auto overflow-y-auto lg:overflow-visible"
                >
                  <div className="bg-white rounded-xl border-none lg:border lg:border-gray-100 p-5 sticky top-0 lg:top-24 h-full lg:h-auto">
                    <div className="flex items-center justify-between mb-6 border-b border-gray-100 pb-3">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Filter className="w-4 h-4" /> Filters
                      </h3>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setSelectedCategory('')
                            setSelectedVendor('')
                            setPriceRange({ min: 0, max: 100000 })
                          }}
                          className="text-xs font-bold text-[#D70F64] hover:text-[#C20D5A] uppercase tracking-wide"
                        >
                          Reset
                        </button>
                        {/* Close Button for Mobile */}
                        <button
                          onClick={() => setShowFilters(false)}
                          className="lg:hidden p-1 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
                        >
                          <X className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Category Filter */}
                  <div className="mb-8">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Cuisines / Categories</h4>
                    <div className="space-y-1">
                      <label className="flex items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selectedCategory === '' ? 'border-[#D70F64]' : 'border-gray-300 group-hover:border-[#D70F64]'}`}>
                          {selectedCategory === '' && <div className="w-2.5 h-2.5 bg-[#D70F64] rounded-full" />}
                        </div>
                        <input
                          type="radio"
                          name="category"
                          value=""
                          checked={selectedCategory === ''}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="hidden"
                        />
                        <span className={`text-sm font-medium ${selectedCategory === '' ? 'text-[#D70F64]' : 'text-gray-600 group-hover:text-gray-900'}`}>All</span>
                      </label>
                      {categories.map((category) => (
                        <label key={category.id} className="flex items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-3 ${selectedCategory === category.id ? 'border-[#D70F64]' : 'border-gray-300 group-hover:border-[#D70F64]'}`}>
                            {selectedCategory === category.id && <div className="w-2.5 h-2.5 bg-[#D70F64] rounded-full" />}
                          </div>
                          <input
                            type="radio"
                            name="category"
                            value={category.id}
                            checked={selectedCategory === category.id}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="hidden"
                          />
                          <span className={`text-sm font-medium ${selectedCategory === category.id ? 'text-[#D70F64]' : 'text-gray-600 group-hover:text-gray-900'}`}>{category.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Vendor Filter */}
                  <div className="mb-8">
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Shops & Restaurants</h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                      <label className="flex items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 ${selectedVendor === '' ? 'border-[#D70F64] bg-[#D70F64]' : 'border-gray-300'}`}>
                          {selectedVendor === '' && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </div>
                        <input
                          type="radio"
                          name="vendor"
                          value=""
                          checked={selectedVendor === ''}
                          onChange={(e) => setSelectedVendor(e.target.value)}
                          className="hidden"
                        />
                        <span className="text-sm text-gray-600 group-hover:text-gray-900">All</span>
                      </label>
                      {Array.from(new Set(products.map(p => p.vendor?.businessName).filter(Boolean))).map((vendorName) => {
                        const vendor = products.find(p => p.vendor?.businessName === vendorName)?.vendor
                        return (
                          <label key={vendor?.id} className="flex items-center group cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors">
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center mr-3 ${selectedVendor === vendor?.id ? 'border-[#D70F64] bg-[#D70F64]' : 'border-gray-300'}`}>
                              {selectedVendor === vendor?.id && <div className="w-2 h-2 bg-white rounded-sm" />}
                            </div>
                            <input
                              type="radio"
                              name="vendor"
                              value={vendor?.id}
                              checked={selectedVendor === vendor?.id}
                              onChange={(e) => setSelectedVendor(e.target.value)}
                              className="hidden"
                            />
                            <span className="text-sm text-gray-600 group-hover:text-gray-900 truncate flex-1">
                              {vendorName}
                              {vendor?.role === 'ADMIN' && (
                                <span className="ml-2 px-1 py-0.5 bg-green-100 text-green-800 text-[10px] rounded uppercase font-bold">
                                  Official
                                </span>
                              )}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div>
                    <h4 className="font-bold text-gray-800 mb-3 text-sm uppercase tracking-wider">Price Range</h4>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          value={priceRange.min}
                          onChange={(e) => setPriceRange({ ...priceRange, min: Number(e.target.value) })}
                          className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#D70F64] focus:ring-1 focus:ring-[#D70F64] outline-none"
                          placeholder="Min"
                        />
                      </div>
                      <span className="text-gray-400">-</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                        <input
                          type="number"
                          value={priceRange.max}
                          onChange={(e) => setPriceRange({ ...priceRange, max: Number(e.target.value) })}
                          className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:border-[#D70F64] focus:ring-1 focus:ring-[#D70F64] outline-none"
                          placeholder="Max"
                        />
                      </div>
                    </div>
                  </div>

                </motion.div>
              </>
            )}
          </AnimatePresence>

          {/* Products Grid */}
          <div className="flex-1">
            {sortedProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-6"
                >
                  <Package className="w-12 h-12 text-[#D70F64]" />
                </motion.div>
                <h3 className="text-2xl font-bold text-gray-800 mb-2">No products found</h3>
                <p className="text-gray-500 text-lg">Try adjusting your search or filters</p>
                <motion.button
                  onClick={() => {
                    // Clear filters by triggering parent component to reset searchQuery
                    window.location.reload() // Simple solution to reset all filters
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 px-8 py-3 bg-[#D70F64] text-white font-bold rounded-xl hover:bg-[#C20D5A] transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Clear Filters
                </motion.button>
              </motion.div>
            ) : (
              <div className={`grid gap-4 ${viewMode === 'grid'
                ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
                : 'grid-cols-1'
                }`}>
                {sortedProducts.map((product, index) => (
                  <ProductCard key={product.proId} product={product} index={index} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  )
}

export default ProductCatalog
