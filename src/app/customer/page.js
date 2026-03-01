'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useRouter } from 'next/navigation'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import ProductCatalog from '@/components/customer/ProductCatalog'
import OrderHistory from '@/components/customer/OrderHistory'
import CustomerProfile from '@/components/customer/CustomerProfile'
import CustomerHero from '@/components/customer/CustomerHero'
import CartPage from '@/components/customer/CartPage'
import WishlistPage from '@/components/customer/WishlistPage'
import CustomerFooter from '@/components/customer/CustomerFooter'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import {
  ShoppingBag,
  Package,
  User,
  Heart,
  Search,
  Filter,
  Star,
  ShoppingCart,
  Bell,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Grid3X3,
  Layers,
  UserCircle,
  Wishlist,
  Settings
} from 'lucide-react'
import toast from 'react-hot-toast'

const CustomerDashboard = () => {
  const { user, userData, logout } = useAuth()
  const { addToCart, getTotalItems } = useCart()
  const { getTotalWishlistItems } = useWishlist()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showCategoriesSidebar, setShowCategoriesSidebar] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [categories, setCategories] = useState([])
  const [notifications, setNotifications] = useState([
    { id: 1, message: 'New products available!', time: '2 min ago', read: false },
    { id: 2, message: 'Your order has been shipped', time: '1 hour ago', read: true },
    { id: 3, message: 'Flash sale on electronics!', time: '3 hours ago', read: false }
  ])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user && userData) {
      const access = checkUserAccess(user, userData, ['CUSTOMER'])

      if (!access.hasAccess) {
        // Redirect based on user role
        const userRole = getUserRole(userData)

        if (userRole === 'ADMIN') {
          router.push('/admin/dashboard')
        } else if (userRole === 'VENDOR') {
          router.push('/vendor/dashboard')
        } else {
          router.push(access.redirectTo)
        }
        return
      }

      // Customer - stay on customer page
      setLoading(false)
    }
  }, [user, userData, router])

  // Fetch categories for sidebar
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/products?type=categories')
        const data = await response.json()
        if (data.success) {
          setCategories(data.data || [])
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
      }
    }
    fetchCategories()
  }, [])

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showUserMenu && !event.target.closest('.user-menu-container')) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserMenu])

  const handleSignOut = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const isGuest = userData?.role === 'GUEST'

  const tabs = [
    { id: 'products', label: 'Products', icon: Package },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag, protected: true },
    { id: 'wishlist', label: 'Wishlist', icon: Heart, protected: true },
    { id: 'favorites', label: 'Favorites', icon: Star, protected: true },
    { id: 'profile', label: 'Profile', icon: User, protected: true }
  ].filter(tab => !isGuest || !tab.protected)

  const handleAddToCart = (product) => {
    addToCart(product)
    if (isGuest) {
      toast.success('Item added! Create an account to save your cart.')
    }
  }

  const handleToggleFavorite = (product) => {
    if (isGuest) {
      toast.error('Please sign in to save favorites')
      return
    }
    const isFavorite = favorites.find(fav => fav.proId === product.proId)
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.proId !== product.proId))
    } else {
      setFavorites([...favorites, product])
    }
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <div>
            <CustomerHero />
            <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
              <ProductCatalog
                searchQuery={searchQuery}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
              />
            </div>
          </div>
        )
      case 'orders':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <OrderHistory />
          </div>
        )
      case 'wishlist':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <WishlistPage />
          </div>
        )
      case 'favorites':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="space-y-6">
              <div className="text-center py-8">
                <Heart className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-3xl font-bold text-gray-800 mb-2">My Favorites</h2>
                <p className="text-gray-600">Products you&apos;ve saved for later</p>
              </div>
              {favorites.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No favorites yet</h3>
                  <p className="text-gray-500">Start adding products to your favorites!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {favorites.map((product, index) => (
                    <motion.div
                      key={product.proId}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 product-card"
                    >
                      <div className="relative">
                        <img
                          src={product.proImages?.[0] || '/placeholder-product.jpg'}
                          alt={product.proName}
                          className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => handleToggleFavorite(product)}
                          className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 transition-colors"
                        >
                          <Heart className="w-4 h-4 text-red-500 fill-current" />
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2">{product.proName}</h3>
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-blue-600">
                            ${product.price}
                          </span>
                          <button
                            onClick={() => handleAddToCart(product)}
                            className="px-4 py-2 bg-[#F25D49] text-white rounded-lg hover:bg-[#F25D49]/90 transition-colors btn-animated"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      case 'profile':
        return (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <CustomerProfile />
          </div>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-pink-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 border-4 border-orange-200 border-t-[#F25D49] rounded-full mx-auto mb-6"
          />
          <motion.h2
            className="text-2xl font-bold bg-gradient-to-r from-[#F25D49] to-[#FF6B5B] bg-clip-text text-transparent mb-2"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            Loading Dashboard...
          </motion.h2>
          <p className="text-gray-600">Preparing your shopping experience</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Foodpanda-style Sticky Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100 h-16 sm:h-20"
      >
        <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between gap-4">
          {/* Logo & Loc */}
          <div className="flex items-center gap-6">
            <motion.button
              onClick={() => setActiveTab('products')}
              className="flex items-center gap-2 group"
            >
              <div className="w-10 h-10 bg-[#D70F64] rounded-xl flex items-center justify-center text-white font-bold text-xl group-hover:scale-105 transition-transform">
                FP
              </div>
              <span className="text-2xl font-bold text-[#D70F64] hidden sm:block tracking-tight">foodpanda</span>
            </motion.button>

            {/* Delivery Loc Placeholder */}
            <div className="hidden md:flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full border border-gray-200 hover:border-[#D70F64] cursor-pointer transition-colors max-w-xs">
              <span className="text-[#D70F64] font-bold text-sm">Delivery to</span>
              <span className="text-gray-600 text-sm truncate">Home • Islamabad</span>
              <ChevronDown className="w-4 h-4 text-[#D70F64]" />
            </div>
          </div>

          {/* Search Bar - Centered */}
          <div className="flex-1 max-w-2xl hidden lg:block">
            <div className="relative group">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for shops & restaurants"
                className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#D70F64]/20 focus:border-[#D70F64] transition-all"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-focus-within:text-[#D70F64]" />
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Mobile Search Toggle */}
            <button className="lg:hidden p-2 text-gray-600 hover:text-[#D70F64] hover:bg-gray-50 rounded-full">
              <Search className="w-6 h-6" />
            </button>

            {/* Cart */}
            <button
              onClick={() => setShowCart(true)}
              className="p-2 text-gray-600 hover:text-[#D70F64] hover:bg-pink-50 rounded-full relative transition-colors"
            >
              <ShoppingBag className="w-6 h-6" />
              {getTotalItems() > 0 && (
                <span className="absolute top-0 right-0 bg-[#D70F64] text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold border-2 border-white">
                  {getTotalItems()}
                </span>
              )}
            </button>

            {/* Profile Dropdown */}
            <div className="relative user-menu-container">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 hover:bg-gray-50 p-1.5 pr-3 rounded-full border border-transparent hover:border-gray-200 transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                  <User className="w-5 h-5" />
                </div>
                <div className="hidden sm:block text-left">
                  <span className="block text-xs text-gray-500 font-medium">Hello,</span>
                  <span className="block text-sm font-bold text-gray-800 -mt-0.5 max-w-[100px] truncate">
                    {user?.displayName || 'Guest'}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden"
                  >
                    {!isGuest ? (
                      <>
                        <div className="px-4 py-3 bg-[#D70F64] text-white mb-2">
                          <p className="font-bold text-lg">{user?.displayName}</p>
                          <p className="text-sm opacity-90">{user?.email}</p>
                        </div>
                        <button onClick={() => { setActiveTab('orders'); setShowUserMenu(false) }} className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50">
                          <Package className="w-5 h-5 mr-3 text-[#D70F64]" /> Orders
                        </button>
                        <button onClick={() => { setActiveTab('wishlist'); setShowUserMenu(false) }} className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50">
                          <Heart className="w-5 h-5 mr-3 text-[#D70F64]" /> Wishlist
                        </button>
                        <button onClick={() => { setActiveTab('profile'); setShowUserMenu(false) }} className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50">
                          <Settings className="w-5 h-5 mr-3 text-[#D70F64]" /> Settings
                        </button>
                      </>
                    ) : (
                      <div className="px-4 py-3 text-center">
                        <p className="text-gray-600 mb-3">Login to access your orders & profile</p>
                        <button onClick={handleSignOut} className="w-full py-2 bg-[#D70F64] text-white rounded-lg font-bold hover:bg-[#C20D5A]">
                          Login / Sign up
                        </button>
                      </div>
                    )}

                    {!isGuest && (
                      <div className="border-t border-gray-100 mt-2 pt-2">
                        <button onClick={handleSignOut} className="w-full flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50">
                          <LogOut className="w-5 h-5 mr-3" /> Sign Out
                        </button>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Mobile Menu Button - simplified */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden p-2 text-[#D70F64]"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Enhanced Mobile Menu Overlay */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setShowMobileMenu(false)}
          >
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="w-80 h-full bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800">Menu</h2>
                  <button
                    onClick={() => setShowMobileMenu(false)}
                    className="p-2 text-gray-600 hover:text-[#F25D49] hover:bg-[#F25D49]/10 rounded-full transition-all duration-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* User Info */}
                <div className="flex items-center space-x-3 p-4 bg-gradient-to-r from-[#F25D49]/10 to-[#FF6B5B]/10 rounded-xl mb-6">
                  <div className="w-12 h-12 bg-[#F25D49] rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-white font-bold text-lg">
                      {user?.displayName?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user?.displayName || 'User'}</p>
                    <p className="text-sm text-gray-500">Customer</p>
                  </div>
                </div>

                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id)
                        setShowMobileMenu(false)
                      }}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${activeTab === tab.id
                        ? 'bg-[#F25D49]/20 text-[#F25D49] border border-[#F25D49]/30'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-[#F25D49]'
                        }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}

                  {/* Categories Button */}
                  <button
                    onClick={() => {
                      setShowCategoriesSidebar(true)
                      setShowMobileMenu(false)
                    }}
                    className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 text-gray-600 hover:bg-gray-100 hover:text-[#F25D49]"
                  >
                    <Grid3X3 className="w-5 h-5" />
                    <span className="font-medium">Categories</span>
                  </button>

                  {/* Sign Out / Sign In Button */}
                  <button
                    onClick={() => {
                      handleSignOut()
                      setShowMobileMenu(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 ${isGuest ? 'text-blue-600 hover:bg-blue-50' : 'text-red-600 hover:bg-red-50'}`}
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">{isGuest ? 'Sign In / Register' : 'Sign Out'}</span>
                  </button>
                </nav>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Categories Sidebar - Leaving as is for now, but style could be updated */}
      <AnimatePresence>
        {showCategoriesSidebar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex"
            onClick={() => setShowCategoriesSidebar(false)}
          >
            {/* Clear/transparent backdrop that still captures clicks */}
            <div className="absolute inset-0 bg-transparent" />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              className="relative z-10 w-80 h-full bg-white shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    <Layers className="w-6 h-6 mr-2 text-[#F25D49]" />
                    Categories
                  </h2>
                  <button
                    onClick={() => setShowCategoriesSidebar(false)}
                    className="p-2 text-gray-600 hover:text-[#F25D49] hover:bg-[#F25D49]/10 rounded-full transition-all duration-300"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-3">
                  <motion.button
                    whileHover={{ scale: 1.02, x: 5 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSearchQuery('')
                      setShowCategoriesSidebar(false)
                    }}
                    className="w-full flex items-center p-4 rounded-xl text-gray-600 hover:bg-gradient-to-r hover:from-[#F25D49]/10 hover:to-[#FF6B5B]/10 hover:text-[#F25D49] transition-all duration-300 border border-transparent hover:border-[#F25D49]/20"
                  >
                    <Package className="w-6 h-6 mr-4 text-[#F25D49]" />
                    <span className="font-semibold text-lg">All Products</span>
                  </motion.button>

                  {categories.map((cat, idx) => {
                    // Category icons mapping
                    const categoryIcons = {
                      'Electronics': Star,
                      'Fashion': Heart,
                      'Home & Kitchen': ShoppingBag,
                      'Books': Package,
                      'Health & Beauty': Star,
                      'Sports': Package,
                      'Food': Package,
                      'Grocery': ShoppingBag
                    }

                    const IconComponent = categoryIcons[cat.name] || Package

                    return (
                      <motion.button
                        key={cat.id}
                        whileHover={{ scale: 1.02, x: 5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          setSearchQuery(cat.name.toLowerCase())
                          setShowCategoriesSidebar(false)
                        }}
                        className="w-full flex items-center p-4 rounded-xl text-gray-600 hover:bg-gradient-to-r hover:from-[#F25D49]/10 hover:to-[#FF6B5B]/10 hover:text-[#F25D49] transition-all duration-300 border border-transparent hover:border-[#F25D49]/20"
                      >
                        <IconComponent className="w-6 h-6 mr-4 text-[#F25D49]" />
                        <span className="font-semibold text-lg">{cat.name}</span>
                      </motion.button>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Page */}
      <AnimatePresence>
        {showCart && (
          <CartPage onClose={() => setShowCart(false)} />
        )}
      </AnimatePresence>

      {/* Footer */}
      <CustomerFooter />
    </div>
  )
}

export default CustomerDashboard
