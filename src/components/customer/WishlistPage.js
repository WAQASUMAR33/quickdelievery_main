'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWishlist } from '@/contexts/WishlistContext'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import AnimatedCard from '@/components/ui/AnimatedCard'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import { 
  Heart, 
  ShoppingCart, 
  Trash2, 
  Star, 
  Package2,
  ArrowRight,
  Filter,
  Search,
  Grid3X3,
  List,
  SortAsc,
  X
} from 'lucide-react'

const WishlistPage = () => {
  const { items, removeFromWishlist, clearWishlist, getTotalWishlistItems } = useWishlist()
  const { addToCart, isInCart } = useCart()
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('newest') // 'newest', 'oldest', 'name', 'price'
  const [searchQuery, setSearchQuery] = useState('')

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-600 mb-2">Login Required</h2>
          <p className="text-gray-500">Please login to view your wishlist</p>
        </div>
      </div>
    )
  }

  const filteredItems = items
    .filter(item => 
      item.proName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.addedAt) - new Date(b.addedAt)
        case 'name':
          return (a.proName || '').localeCompare(b.proName || '')
        case 'price':
          return (parseFloat(a.salePrice) || parseFloat(a.price) || 0) - 
                 (parseFloat(b.salePrice) || parseFloat(b.price) || 0)
        case 'newest':
        default:
          return new Date(b.addedAt) - new Date(a.addedAt)
      }
    })

  const handleAddToCart = (product) => {
    addToCart(product)
  }

  const handleRemoveFromWishlist = (productId) => {
    removeFromWishlist(productId)
  }

  const WishlistCard = ({ product, index }) => {
    const price = parseFloat(product.salePrice) || parseFloat(product.price) || 0
    const originalPrice = parseFloat(product.price) || 0
    const hasDiscount = product.salePrice && originalPrice > price

    return (
      <AnimatedCard
        delay={index * 0.1}
        className={`group relative overflow-hidden hover-lift ${
          viewMode === 'list' ? 'flex items-center p-4' : 'p-6'
        }`}
      >
        {/* Remove Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => handleRemoveFromWishlist(product.proId)}
          className="absolute top-3 right-3 z-10 p-2 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
        >
          <X className="w-4 h-4" />
        </motion.button>

        <div className={`${viewMode === 'list' ? 'flex items-center space-x-4 w-full' : ''}`}>
          {/* Product Image */}
          <div className={`relative ${viewMode === 'list' ? 'w-24 h-24' : 'w-full h-48 mb-4'} overflow-hidden rounded-lg bg-gray-100`}>
            <motion.img
              whileHover={{ scale: 1.05 }}
              src={product.proImages?.[0] || '/placeholder-product.jpg'}
              alt={product.proName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = '/placeholder-product.jpg'
              }}
            />
            {hasDiscount && (
              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full font-semibold">
                {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
              </div>
            )}
          </div>

          <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
            {/* Product Info */}
            <div className={`${viewMode === 'list' ? 'mb-0' : 'mb-4'}`}>
              <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-[#F25D49] transition-colors">
                {product.proName}
              </h3>
              
              {product.description && (
                <p className={`text-gray-600 text-sm ${viewMode === 'list' ? 'line-clamp-2' : 'line-clamp-3'} mb-2`}>
                  {product.description}
                </p>
              )}

              <div className="flex items-center space-x-2 mb-2">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < (product.rating || 4) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm text-gray-500">({product.reviews || 0})</span>
              </div>

              {/* Price */}
              <div className="flex items-center space-x-2 mb-4">
                <span className="text-2xl font-bold text-[#F25D49]">
                  ${price.toFixed(2)}
                </span>
                {hasDiscount && (
                  <span className="text-lg text-gray-400 line-through">
                    ${originalPrice.toFixed(2)}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className={`flex ${viewMode === 'list' ? 'flex-col space-y-2' : 'space-x-2'}`}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleAddToCart(product)}
                className="flex-1 bg-gradient-to-r from-[#F25D49] to-[#FF6B5B] text-white py-2 px-4 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Add to Cart</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRemoveFromWishlist(product.proId)}
                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-red-100 hover:text-red-600 transition-all duration-300 flex items-center justify-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span className={viewMode === 'list' ? 'hidden lg:inline' : ''}>Remove</span>
              </motion.button>
            </div>
          </div>
        </div>
      </AnimatedCard>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
            <Heart className="text-[#F25D49]" />
            <span>My Wishlist</span>
          </h1>
          <p className="text-gray-600 mt-2">
            {getTotalWishlistItems()} {getTotalWishlistItems() === 1 ? 'item' : 'items'} saved for later
          </p>
        </div>

        {getTotalWishlistItems() > 0 && (
          <div className="flex items-center space-x-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearWishlist}
              className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear All</span>
            </motion.button>
          </div>
        )}
      </motion.div>

      {/* Filters and Controls */}
      {getTotalWishlistItems() > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border border-gray-100"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search wishlist..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25D49] focus:border-transparent"
              />
            </div>

            <div className="flex items-center space-x-3">
              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25D49] focus:border-transparent"
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="name">Name A-Z</option>
                <option value="price">Price Low-High</option>
              </select>

              {/* View Mode */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${
                    viewMode === 'grid'
                      ? 'bg-white shadow-sm text-[#F25D49]'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${
                    viewMode === 'list'
                      ? 'bg-white shadow-sm text-[#F25D49]'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Wishlist Content */}
      <AnimatePresence mode="wait">
        {getTotalWishlistItems() === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-100 to-red-100 rounded-full flex items-center justify-center"
            >
              <Heart className="w-12 h-12 text-[#F25D49]" />
            </motion.div>
            
            <h3 className="text-2xl font-bold text-gray-600 mb-3">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Start adding products you love to keep track of them and purchase later.
            </p>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="inline-block"
            >
              <div className="bg-gradient-to-r from-[#F25D49] to-[#FF6B5B] text-white py-3 px-6 rounded-lg font-semibold hover:shadow-lg transition-all duration-300 flex items-center space-x-2 cursor-pointer">
                <Package2 className="w-5 h-5" />
                <span>Browse Products</span>
                <ArrowRight className="w-4 h-4" />
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {filteredItems.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No items found</h3>
                <p className="text-gray-500">Try adjusting your search or filters</p>
              </div>
            ) : (
              <div className={
                viewMode === 'grid'
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
              }>
                <AnimatePresence>
                  {filteredItems.map((product, index) => (
                    <motion.div
                      key={product.proId}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                    >
                      <WishlistCard product={product} index={index} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default WishlistPage
