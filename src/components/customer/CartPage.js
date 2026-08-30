'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { computeServiceCharge, computeOrderTotalWithService } from '@/lib/serviceCharge'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import toast from 'react-hot-toast'
import NextLink from 'next/link'
import { 
  ShoppingBag, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  MapPin, 
  Truck,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  Clock,
  Tag,
  ShieldCheck,
  Phone,
  FileText,
  Navigation,
  Sparkles,
  ChevronRight
} from 'lucide-react'

const THEME = {
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  secondary: '#7c3aed',
  gradient: 'linear-gradient(135deg, #4338ca 0%, #6366f1 35%, #7c3aed 70%, #9333ea 100%)',
  accentPink: '#d946ef',
}

const CartPage = ({ onNavigateExplore, onNavigateOrders }) => {
  const { 
    items, 
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems 
  } = useCart()

  const { user, userData } = useAuth()
  const isGuest = !userData || userData.role === 'GUEST' || userData.id === 'guest' || String(userData.id) === 'guest'

  const subtotalCart = getTotalPrice()
  const serviceChargeAmt = computeServiceCharge(subtotalCart)

  // Voucher State
  const [voucherCode, setVoucherCode] = useState('')
  const [appliedVoucher, setAppliedVoucher] = useState(null)
  const [voucherDiscount, setVoucherDiscount] = useState(0)

  // Delivery & Customer Details
  const [shippingAddress, setShippingAddress] = useState('')
  const [addressLabel, setAddressLabel] = useState('Home')
  const [riderNotes, setRiderNotes] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY')
  const [deliveryLatitude, setDeliveryLatitude] = useState(31.5204)
  const [deliveryLongitude, setDeliveryLongitude] = useState(74.3587)
  const [isLocating, setIsLocating] = useState(false)

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(null)
  const [error, setError] = useState(null)

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  // Autofill user details
  useEffect(() => {
    if (userData) {
      if (userData.address && !shippingAddress) {
        setShippingAddress(userData.address)
      }
      if (userData.phoneNumber && !customerPhone) {
        setCustomerPhone(userData.phoneNumber)
      }
    }
  }, [userData])

  // Apply Voucher Code
  const handleApplyVoucher = (e) => {
    e.preventDefault()
    const code = voucherCode.trim().toUpperCase()
    if (!code) return

    if (code === 'WELCOME50' || code === 'SAVE50') {
      const disc = Math.min(50, subtotalCart * 0.2)
      setAppliedVoucher({ code, discount: disc, label: 'Rs. 50 OFF Promo' })
      setVoucherDiscount(disc)
      toast.success('Voucher applied successfully! 🎉')
    } else if (code === 'DISCOUNT10' || code === 'QUICK10') {
      const disc = subtotalCart * 0.1
      setAppliedVoucher({ code, discount: disc, label: '10% OFF Promo' })
      setVoucherDiscount(disc)
      toast.success('10% Discount applied! 🎉')
    } else if (code === 'FREEDEL' || code === 'FREEDELIVERY') {
      setAppliedVoucher({ code, discount: 0, label: 'Free Delivery Applied' })
      setVoucherDiscount(0)
      toast.success('Free Delivery voucher applied! 🛵')
    } else {
      toast.error('Invalid or expired voucher code.')
    }
  }

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null)
    setVoucherDiscount(0)
    setVoucherCode('')
    toast.success('Voucher removed.')
  }

  // Get current device GPS location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setDeliveryLatitude(position.coords.latitude)
        setDeliveryLongitude(position.coords.longitude)
        setIsLocating(false)
        toast.success('Location updated with GPS coordinates! 📍')
      },
      (err) => {
        setIsLocating(false)
        toast.error('Unable to retrieve location. Please select on map.')
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }

  const effectiveTotal = Math.max(0, computeOrderTotalWithService(subtotalCart) - voucherDiscount)

  // Group items by vendor/store if applicable
  const storeName = items[0]?.vendor?.businessName || items[0]?.vendor?.username || 'QuickDelivery Store'

  const handlePlaceOrder = async () => {
    setError(null)

    if (isGuest || !user || !userData) {
      toast.error('Please sign in or create an account to place your order.')
      return
    }

    if (items.length === 0) {
      toast.error('Your cart is empty.')
      return
    }

    if (!shippingAddress.trim()) {
      setError('Please enter your complete delivery street address.')
      toast.error('Please enter your delivery address.')
      return
    }

    if (deliveryLatitude === null || deliveryLongitude === null) {
      setError('Please pin your exact delivery location on the map.')
      toast.error('Please drop a pin on the map.')
      return
    }

    setIsCheckingOut(true)

    try {
      const orderItems = items.map(item => ({
        proId: item.proId,
        quantity: item.quantity,
        price: parseFloat(item.salePrice) || parseFloat(item.price) || 0,
        selectedVariation: item.selectedVariation || null,
      }))

      const fullShippingAddress = `${shippingAddress.trim()}${customerPhone ? ' | Tel: ' + customerPhone.trim() : ''}${riderNotes ? ' | Note: ' + riderNotes.trim() : ''}`

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userData.id || user.uid,
          totalAmount: effectiveTotal,
          shippingAddress: fullShippingAddress,
          paymentMethod,
          items: orderItems,
          deliveryLatitude,
          deliveryLongitude,
          vertical: 'FOOD',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setOrderSuccess(data.data)
        clearCart()
        toast.success('Order placed successfully! 🛵🎉')
      } else {
        setError(data.error || 'Failed to place order. Please try again.')
        toast.error(data.error || 'Failed to place order.')
      }
    } catch (err) {
      console.error('Order placement error:', err)
      setError('A network error occurred during checkout. Please try again.')
      toast.error('Network error. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // ── ORDER SUCCESS SCREEN (FOODPANDA STYLE) ──
  if (orderSuccess) {
    return (
      <div className="w-full min-h-[75vh] flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="bg-white rounded-3xl p-6 sm:p-10 max-w-xl w-full text-center shadow-xl border border-gray-100"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220 }}
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-200"
          >
            <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
          </motion.div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-extrabold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Order Confirmed #{orderSuccess.id}
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-2">
            Your Order is on the way!
          </h2>
          <p className="text-sm sm:text-base text-gray-600 mb-6 max-w-md mx-auto">
            The kitchen has received your order and rider dispatch is in progress. Estimated arrival in <span className="font-bold text-gray-900">20-30 minutes</span>.
          </p>

          <div className="bg-gray-50 rounded-2xl p-4 mb-6 border border-gray-100 text-left space-y-2 text-xs sm:text-sm text-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-500">Delivery Address:</span>
              <span className="font-bold truncate max-w-[240px]">{shippingAddress}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Method:</span>
              <span className="font-bold uppercase">{paymentMethod.replace(/_/g, ' ')}</span>
            </div>
            <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-200">
              <span>Total Paid:</span>
              <span className="text-[#4f46e5]">Rs. {effectiveTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => onNavigateOrders?.()}
              className="w-full sm:w-auto px-7 py-3.5 bg-gradient-to-r from-[#4f46e5] to-[#7c3aed] text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4" />
              Track Live Order
            </button>
            <button
              onClick={() => onNavigateExplore?.()}
              className="w-full sm:w-auto px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-sm transition-colors"
            >
              Continue Exploring
            </button>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── EMPTY CART SCREEN ──
  if (items.length === 0) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center text-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full"
        >
          <div className="w-24 h-24 bg-gradient-to-tr from-violet-100 to-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-indigo-100 shadow-sm">
            <ShoppingBag className="w-12 h-12 text-[#6366f1]" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Your basket is empty</h2>
          <p className="text-sm text-gray-500 mb-8 max-w-sm mx-auto">
            Hungry? Discover curated restaurant meals, hot deals, and daily grocery essentials delivered in minutes.
          </p>
          <button
            onClick={() => onNavigateExplore?.()}
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#7c3aed] text-white rounded-full font-black text-sm shadow-xl shadow-indigo-200 hover:shadow-indigo-300 hover:scale-105 transition-all"
          >
            <ShoppingBag className="w-4 h-4" />
            Explore Stores &amp; Menus
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
      
      {/* ── Top Header & Breadcrumb ── */}
      <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateExplore?.()}
            className="flex items-center gap-1 text-xs sm:text-sm font-bold text-gray-600 hover:text-[#6366f1] transition-colors p-2 -ml-2 rounded-xl hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Menu
          </button>
          <span className="text-gray-300">|</span>
          <h1 className="text-xl sm:text-2xl font-black text-gray-900 flex items-center gap-2">
            Checkout
            <span className="text-xs font-extrabold bg-indigo-50 text-[#4f46e5] px-2.5 py-0.5 rounded-full">
              {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'}
            </span>
          </h1>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
          <Clock className="w-3.5 h-3.5 text-emerald-600" />
          <span>Estimated Delivery: 20-30 mins</span>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Main Two-Column Foodpanda Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        
        {/* ── LEFT COLUMN: Delivery Details & Items (7 Cols on desktop) ── */}
        <div className="lg:col-span-7 space-y-6">

          {/* 1. Delivery Address Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#6366f1]" />
                1. Delivery Details
              </h2>
              <div className="flex items-center gap-1.5">
                {['Home', 'Work', 'Other'].map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setAddressLabel(tag)}
                    className={`text-xs font-bold px-3 py-1 rounded-full transition-all ${
                      addressLabel === tag
                        ? 'bg-[#4f46e5] text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {/* Street Address Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Street / Apartment / Building Address *
                </label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="e.g. House #14, Street 8, Block C, Gulberg III, Lahore"
                  className="w-full p-3 text-sm border border-gray-200 rounded-2xl focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none transition-all resize-none"
                />
              </div>

              {/* Phone & Rider Notes row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Contact Phone Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0300-1234567"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Instructions for Rider
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={riderNotes}
                      onChange={(e) => setRiderNotes(e.target.value)}
                      placeholder="e.g. Ring bell / Leave at gate"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Interactive Google Map Pin Drop */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-[#6366f1]" />
                    Drop Pin on Map for Live GPS Delivery:
                  </span>
                  <button
                    type="button"
                    onClick={handleGetCurrentLocation}
                    disabled={isLocating}
                    className="text-xs font-bold text-[#4f46e5] hover:text-[#4338ca] bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-full transition-colors flex items-center gap-1"
                  >
                    {isLocating ? 'Locating…' : '📍 Use My GPS Location'}
                  </button>
                </div>

                <div className="w-full h-44 rounded-2xl overflow-hidden border border-gray-200 relative bg-gray-100">
                  {isLoaded ? (
                    <GoogleMap
                      mapContainerStyle={{ width: '100%', height: '100%' }}
                      center={{ lat: deliveryLatitude, lng: deliveryLongitude }}
                      zoom={14}
                      onClick={(e) => {
                        if (e.latLng) {
                          setDeliveryLatitude(e.latLng.lat())
                          setDeliveryLongitude(e.latLng.lng())
                          toast.success('Pin dropped! 📍')
                        }
                      }}
                      options={{
                        disableDefaultUI: true,
                        zoomControl: true,
                        gestureHandling: 'cooperative',
                      }}
                    >
                      <Marker
                        position={{ lat: deliveryLatitude, lng: deliveryLongitude }}
                        draggable={true}
                        onDragEnd={(e) => {
                          if (e.latLng) {
                            setDeliveryLatitude(e.latLng.lat())
                            setDeliveryLongitude(e.latLng.lng())
                          }
                        }}
                      />
                    </GoogleMap>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
                      Loading interactive map…
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* 2. Cart Items Review Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-violet-50 flex items-center justify-center text-[#6366f1]">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-gray-900 leading-tight">
                    2. Order Items
                  </h2>
                  <span className="text-xs text-gray-500 font-medium">From {storeName}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onNavigateExplore?.()}
                className="text-xs font-extrabold text-[#4f46e5] hover:text-[#4338ca] bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add More
              </button>
            </div>

            {/* List of Cart Items */}
            <div className="divide-y divide-gray-100">
              {items.map((item, idx) => {
                const itemKey = `${item.proId}_${item.selectedVariation?.name || 'def'}_${idx}`
                const itemPrice = parseFloat(item.salePrice) || parseFloat(item.price) || 0
                const itemLineTotal = itemPrice * item.quantity

                return (
                  <div key={itemKey} className="py-4 flex items-center gap-3 sm:gap-4 group">
                    {/* Item Thumbnail */}
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                      <img
                        src={item.proImages?.[0] || '/placeholder-product.jpg'}
                        alt={item.proName}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug line-clamp-1">
                        {item.proName}
                      </h3>
                      {item.selectedVariation && (
                        <span className="inline-block mt-0.5 text-[11px] font-bold text-[#6366f1] bg-indigo-50 px-2 py-0.5 rounded-md">
                          {item.selectedVariation.name}
                        </span>
                      )}
                      <p className="text-xs text-gray-500 mt-1 font-semibold">
                        Rs. {itemPrice.toLocaleString()} each
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-50 p-1 rounded-full border border-gray-200">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.proId, item.quantity - 1, item.selectedVariation)}
                        className="w-7 h-7 rounded-full bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center shadow-sm transition-colors"
                        aria-label="Decrease quantity"
                      >
                        {item.quantity === 1 ? <Trash2 className="w-3.5 h-3.5 text-rose-500" /> : <Minus className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-xs sm:text-sm font-black w-6 text-center tabular-nums text-gray-900">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.proId, item.quantity + 1, item.selectedVariation)}
                        className="w-7 h-7 rounded-full bg-white text-gray-700 hover:bg-gray-200 flex items-center justify-center shadow-sm transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total Price */}
                    <div className="text-right min-w-[70px]">
                      <span className="text-sm sm:text-base font-black text-gray-900">
                        Rs. {itemLineTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.proId, item.selectedVariation)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 3. Payment Method Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border border-gray-200 shadow-sm">
            <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5 text-[#6366f1]" />
              3. Payment Method
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'CASH_ON_DELIVERY', label: 'Cash on Delivery', desc: 'Pay cash when rider arrives', icon: '💵' },
                { id: 'CARD', label: 'Debit / Credit Card', desc: 'Visa, Mastercard', icon: '💳' },
                { id: 'WALLET', label: 'JazzCash / Easypaisa', desc: 'Mobile Wallet Transfer', icon: '📱' },
              ].map(method => {
                const isSelected = paymentMethod === method.id
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`p-4 rounded-2xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-[#6366f1] bg-indigo-50/40 ring-2 ring-[#6366f1]/20'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <h3 className={`text-sm font-extrabold ${isSelected ? 'text-[#4f46e5]' : 'text-gray-900'}`}>
                      {method.label}
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">{method.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN: Sticky Order Summary & Voucher (5 Cols on desktop) ── */}
        <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-24">

          {/* Voucher Promo Input */}
          <div className="bg-white rounded-3xl p-5 border border-gray-200 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-[#6366f1]" />
              <h3 className="text-sm font-black text-gray-900">Have a Voucher / Promo Code?</h3>
            </div>

            {appliedVoucher ? (
              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">
                    {appliedVoucher.code} ({appliedVoucher.label})
                  </span>
                  <span className="text-xs text-emerald-600 font-semibold">Discount applied to bill!</span>
                </div>
                <button
                  type="button"
                  onClick={handleRemoveVoucher}
                  className="text-xs font-bold text-rose-600 hover:underline px-2"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyVoucher} className="flex gap-2">
                <input
                  type="text"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value)}
                  placeholder="e.g. WELCOME50"
                  className="flex-1 px-3.5 py-2.5 text-sm uppercase font-bold border border-gray-200 rounded-xl focus:border-[#6366f1] focus:ring-2 focus:ring-[#6366f1]/20 outline-none"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gray-900 hover:bg-[#4f46e5] text-white text-xs font-extrabold rounded-xl transition-colors"
                >
                  Apply
                </button>
              </form>
            )}
          </div>

          {/* Bill Summary Breakdown */}
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-sm space-y-4">
            <h3 className="text-lg font-black text-gray-900 pb-3 border-b border-gray-100">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-gray-900">Rs. {subtotalCart.toLocaleString()}</span>
              </div>

              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span className="font-bold text-emerald-600">FREE</span>
              </div>

              <div className="flex justify-between">
                <span>Platform &amp; Service Fee</span>
                <span className="font-bold text-gray-900">Rs. {serviceChargeAmt.toLocaleString()}</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Voucher Discount</span>
                  <span>- Rs. {voucherDiscount.toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-gray-200 flex justify-between items-baseline">
              <div>
                <span className="text-base font-extrabold text-gray-900 block">Total (incl. VAT)</span>
                <span className="text-[11px] text-gray-400 font-medium">All taxes &amp; charges included</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-[#4f46e5] tracking-tight">
                Rs. {effectiveTotal.toLocaleString()}
              </span>
            </div>

            {/* Place Order CTA */}
            {isGuest ? (
              <NextLink
                href="/login"
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#7c3aed] text-white font-black text-base shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.01]"
              >
                Sign In to Place Order
                <ChevronRight className="w-5 h-5" />
              </NextLink>
            ) : (
              <button
                type="button"
                disabled={isCheckingOut || items.length === 0}
                onClick={handlePlaceOrder}
                className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-gradient-to-r from-[#4f46e5] via-[#6366f1] to-[#7c3aed] text-white font-black text-base shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all hover:scale-[1.01] disabled:opacity-60 disabled:pointer-events-none"
              >
                {isCheckingOut ? (
                  <span className="flex items-center gap-2">
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Placing Your Order…
                  </span>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Place Order • Rs. {effectiveTotal.toLocaleString()}
                  </>
                )}
              </button>
            )}

            <div className="flex items-center justify-center gap-2 pt-2 text-[11px] font-bold text-gray-400">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>100% Safe &amp; Contactless Delivery Available</span>
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}

export default CartPage
