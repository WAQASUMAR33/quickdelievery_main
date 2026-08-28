'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
import { computeServiceCharge, computeOrderTotalWithService, getServiceChargePercent } from '@/lib/serviceCharge'
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api'
import toast from 'react-hot-toast'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard, 
  MapPin, 
  Truck,
  CheckCircle,
  AlertCircle,
  X,
  ArrowLeft,
  ArrowRight,
  PauseCircle,
  PlayCircle,
  FileText,
  Clock,
  Bookmark
} from 'lucide-react'

const CartPage = ({ onClose }) => {
  const { 
    items, 
    heldBills,
    removeFromCart, 
    updateQuantity, 
    clearCart, 
    getTotalPrice, 
    getTotalItems,
    holdCurrentBill,
    recallHeldBill,
    deleteHeldBill
  } = useCart()

  const getItemKey = (item) => `${item.proId}${item.selectedVariation ? '_' + item.selectedVariation.name : ''}`
  const subtotalCart = getTotalPrice()
  const serviceChargeAmt = computeServiceCharge(subtotalCart)
  const orderGrandTotal = computeOrderTotalWithService(subtotalCart)
  const { user, userData } = useAuth()
  
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [error, setError] = useState(null)
  const [deliveryLatitude, setDeliveryLatitude] = useState(null)
  const [deliveryLongitude, setDeliveryLongitude] = useState(null)

  // Hold Bill State
  const [showHeldBillsModal, setShowHeldBillsModal] = useState(false)
  const [showHoldPrompt, setShowHoldPrompt] = useState(false)
  const [holdNote, setHoldNote] = useState('')
  const [holdCustomer, setHoldCustomer] = useState('')

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''
  })

  // Default center map to Lahore
  const defaultMapCenter = { lat: 31.5204, lng: 74.3587 }

  useEffect(() => {
    // Load user's default address if available
    if (userData?.address) {
      setShippingAddress(userData.address)
    }
  }, [userData])

  // Prevent body scroll when cart is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [])

  const handleConfirmHoldBill = () => {
    if (items.length === 0) {
      toast.error('Cart is empty. Nothing to hold.')
      return
    }
    const created = holdCurrentBill(holdNote, holdCustomer)
    if (created) {
      toast.success(`Bill #${created.billNumber} placed on hold! ⏸️`, { duration: 4000 })
      setShowHoldPrompt(false)
      setHoldNote('')
      setHoldCustomer('')
    }
  }

  const handleRecall = (billId) => {
    if (items.length > 0) {
      if (!window.confirm('Current cart items will be replaced by the recalled held bill. Continue?')) {
        return
      }
    }
    const success = recallHeldBill(billId)
    if (success) {
      toast.success('Held bill recalled to active cart! 🛒')
      setShowHeldBillsModal(false)
    }
  }

  const handleDeleteHeld = (billId, e) => {
    e.stopPropagation()
    if (window.confirm('Are you sure you want to discard this held bill?')) {
      deleteHeldBill(billId)
      toast.success('Held bill discarded.')
    }
  }

  const handleCheckout = async () => {
    setError(null)

    if (!user || !userData) {
      setError('Please login to place an order')
      return
    }

    const isGuestPlaceholder =
      userData.role === 'GUEST' || userData.id === 'guest' || String(userData.id) === 'guest'
    if (isGuestPlaceholder) {
      setError('Please sign in or create an account to place an order.')
      return
    }

    if (!shippingAddress.trim()) {
      setError('Please enter a shipping address')
      return
    }
    
    if (deliveryLatitude === null || deliveryLongitude === null) {
      setError('Please drop a pin on the map to set your exact delivery location for live tracking')
      return
    }

    setIsCheckingOut(true)

    try {
      // Map cart items to order items format expected by API
      const orderItems = items.map(item => ({
        proId: item.proId,
        quantity: item.quantity,
        price: parseFloat(item.salePrice) || parseFloat(item.price) || 0
      }))

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userData.id,
          totalAmount: orderGrandTotal,
          shippingAddress,
          paymentMethod,
          items: orderItems,
          deliveryLatitude,
          deliveryLongitude,
        }),
      })

      const data = await response.json()

      if (data.success) {
        setOrderSuccess(true)
        clearCart()
      } else {
        setError(data.error || 'Failed to place order')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setError('An error occurred during checkout. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (orderSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[2000]"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6"
          >
            <CheckCircle className="w-8 h-8 sm:w-12 sm:h-12 text-green-600" />
          </motion.div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Order Placed Successfully!</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Your order has been confirmed and will be processed soon.</p>
          <motion.button
            onClick={() => {
              setOrderSuccess(false)
              onClose?.()
            }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-2 sm:py-3 bg-gradient-to-r from-[#F25D49] to-[#FF6B5B] text-white rounded-lg font-medium text-sm sm:text-base"
          >
            Continue Shopping
          </motion.button>
        </motion.div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-0 sm:p-4 z-[2000]"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full h-full sm:w-[95%] sm:max-w-6xl sm:h-[90vh] sm:max-h-[90vh] flex flex-col shadow-2xl sm:rounded-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#39772A] to-[#2e6322] p-4 sm:p-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ShoppingCart className="w-6 h-6 sm:w-7 sm:h-7" />
              <h2 className="text-xl sm:text-2xl font-bold">Shopping Cart & POS</h2>
              <span className="bg-white/20 px-2.5 py-1 rounded-full text-xs sm:text-sm font-semibold">
                {getTotalItems()} items
              </span>
            </div>

            <div className="flex items-center space-x-2">
              {/* Held Bills Button */}
              <button
                onClick={() => setShowHeldBillsModal(true)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all border border-white/30"
              >
                <Bookmark className="w-4 h-4" />
                <span>Held Bills</span>
                {heldBills.length > 0 && (
                  <span className="bg-amber-400 text-gray-900 font-extrabold px-1.5 py-0.5 rounded-full text-xs">
                    {heldBills.length}
                  </span>
                )}
              </button>

              <button
                onClick={onClose}
                className="p-1.5 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main Content - Scrollable */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Cart Items - Scrollable */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 lg:p-6 min-h-0">
            {items.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-8 sm:py-16"
              >
                <ShoppingCart className="w-16 h-16 sm:w-24 sm:h-24 text-gray-300 mx-auto mb-4 sm:mb-6" />
                <h3 className="text-xl sm:text-2xl font-bold text-gray-600 mb-2">Your cart is empty</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">
                  {heldBills.length > 0 
                    ? `You have ${heldBills.length} held bill(s) available to resume.` 
                    : 'Add some products to get started!'}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <motion.button
                    onClick={onClose}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#39772A] to-[#2e6322] text-white rounded-lg font-medium text-sm sm:text-base shadow-sm"
                  >
                    Start Shopping
                  </motion.button>
                  {heldBills.length > 0 && (
                    <motion.button
                      onClick={() => setShowHeldBillsModal(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-5 py-2 sm:px-6 sm:py-3 bg-amber-50 text-amber-800 border border-amber-300 rounded-lg font-semibold text-sm sm:text-base flex items-center gap-2"
                    >
                      <Bookmark className="w-4 h-4 text-amber-600" />
                      View Held Bills ({heldBills.length})
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                {/* Hold Bill Toolbar Banner */}
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-semibold">
                    <PauseCircle className="w-4 h-4 text-emerald-600" />
                    <span>Want to pause or serve another customer?</span>
                  </div>
                  <button
                    onClick={() => setShowHoldPrompt(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                  >
                    <PauseCircle className="w-3.5 h-3.5" />
                    Hold Bill
                  </button>
                </div>

                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={getItemKey(item)}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:shadow-sm hover:border-[#39772A] transition-all"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0 border border-gray-100">
                        <img
                          src={item.proImages?.[0] || '/placeholder-product.jpg'}
                          alt={item.proName}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-bold text-gray-800 truncate">{item.proName}</h4>
                        {item.selectedVariation && (
                          <p className="text-xs text-[#39772A] font-semibold mt-0.5">
                            Variation: {item.selectedVariation.name}
                          </p>
                        )}
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                          ${(parseFloat(item.salePrice) || parseFloat(item.price) || 0).toFixed(2)} each
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQuantity(getItemKey(item), item.quantity - 1)}
                              className="p-1 hover:bg-gray-100 transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                            <span className="px-3 text-xs sm:text-sm font-bold text-gray-800">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(getItemKey(item), item.quantity + 1)}
                              className="p-1 hover:bg-gray-100 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5 text-gray-600" />
                            </button>
                          </div>

                          <button
                            onClick={() => removeFromCart(getItemKey(item))}
                            className="p-1 text-gray-400 hover:text-red-500 transition-colors ml-auto"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Item Total */}
                      <div className="text-right flex-shrink-0">
                        <span className="text-sm sm:text-base font-extrabold text-[#39772A]">
                          ${((parseFloat(item.salePrice) || parseFloat(item.price) || 0) * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Checkout & Bill Summary Sidebar */}
          {items.length > 0 && (
            <div className="w-full sm:w-96 lg:w-[420px] bg-gray-50 border-t sm:border-t-0 sm:border-l border-gray-200 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3">Bill Summary</h3>

                {/* Error message */}
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Price Breakdown */}
                <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2 text-xs sm:text-sm mb-4">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-semibold">${subtotalCart.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Platform / Service Fee</span>
                    <span className="font-semibold">${serviceChargeAmt.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery Fee</span>
                    <span className="font-semibold text-emerald-600">FREE</span>
                  </div>
                  <div className="border-t border-dashed border-gray-200 pt-2 flex justify-between text-base sm:text-lg font-extrabold text-gray-900">
                    <span>Grand Total</span>
                    <span className="text-[#39772A]">${orderGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Delivery Location Map */}
                <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    <MapPin className="w-3.5 h-3.5 inline mr-1 text-[#39772A]" />
                    Delivery Pin Location (Required)
                  </label>
                  <div className="w-full h-36 rounded-lg overflow-hidden border border-gray-300 relative">
                    {isLoaded ? (
                      <GoogleMap
                        mapContainerStyle={{ width: '100%', height: '100%' }}
                        center={deliveryLatitude ? { lat: deliveryLatitude, lng: deliveryLongitude } : defaultMapCenter}
                        zoom={14}
                        onClick={(e) => {
                          setDeliveryLatitude(e.latLng.lat())
                          setDeliveryLongitude(e.latLng.lng())
                          if (error) setError(null)
                        }}
                        options={{
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: false,
                        }}
                      >
                        {deliveryLatitude && deliveryLongitude && (
                          <Marker position={{ lat: deliveryLatitude, lng: deliveryLongitude }} />
                        )}
                      </GoogleMap>
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <span className="text-xs text-gray-500">Loading map...</span>
                      </div>
                    )}
                    {!deliveryLatitude && (
                      <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center bg-white/50 backdrop-blur-[1px]">
                        <div className="bg-white/95 px-2.5 py-1 rounded-full shadow-sm">
                          <p className="text-xs font-bold text-[#39772A]">Tap on map to place pin</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="mb-3">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Shipping Address Details
                  </label>
                  <textarea
                    value={shippingAddress}
                    onChange={(e) => {
                      setShippingAddress(e.target.value)
                      if (error) setError(null)
                    }}
                    placeholder="Enter complete delivery address..."
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39772A] focus:border-transparent resize-none bg-white"
                    rows={2}
                  />
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 inline mr-1 text-[#39772A]" />
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39772A] focus:border-transparent bg-white font-medium"
                  >
                    <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                    <option value="CREDIT_CARD">Credit Card / POS</option>
                    <option value="DEBIT_CARD">Debit Card</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons: Hold Bill & Place Order */}
              <div className="space-y-2 pt-3 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-2">
                  {/* Hold Bill Secondary Button */}
                  <motion.button
                    type="button"
                    onClick={() => setShowHoldPrompt(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="col-span-1 py-3 px-2 rounded-xl font-bold text-xs sm:text-sm bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center gap-1 transition-all shadow-sm"
                  >
                    <PauseCircle className="w-4 h-4 text-amber-600" />
                    <span>Hold Bill</span>
                  </motion.button>

                  {/* Primary Checkout Button */}
                  <motion.button
                    onClick={handleCheckout}
                    disabled={isCheckingOut || !shippingAddress.trim()}
                    whileHover={{ scale: isCheckingOut ? 1 : 1.02 }}
                    whileTap={{ scale: isCheckingOut ? 1 : 0.98 }}
                    className={`col-span-2 py-3 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 shadow-md ${
                      isCheckingOut || !shippingAddress.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#39772A] to-[#2e6322] text-white hover:shadow-lg'
                    }`}
                  >
                    {isCheckingOut ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Placing Order...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center space-x-2">
                        <Truck className="w-4 h-4" />
                        <span>Place Order</span>
                      </div>
                    )}
                  </motion.button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── HOLD BILL PROMPT MODAL ── */}
        <AnimatePresence>
          {showHoldPrompt && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[2100]"
              onClick={() => setShowHoldPrompt(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-100"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-100 text-amber-800 rounded-xl">
                    <PauseCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Hold Current Bill</h3>
                    <p className="text-xs text-gray-500">Save current cart and clear it for the next order.</p>
                  </div>
                </div>

                <div className="space-y-3.5 mb-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Customer Name / Phone (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ali / 03001234567"
                      value={holdCustomer}
                      onChange={(e) => setHoldCustomer(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39772A] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Hold Note / Reference (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Table #4 / Cashier hold / Waiting for card"
                      value={holdNote}
                      onChange={(e) => setHoldNote(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#39772A] focus:border-transparent"
                    />
                  </div>

                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 flex justify-between text-xs font-bold text-amber-900">
                    <span>Items to Hold: {getTotalItems()} items</span>
                    <span>Total: ${orderGrandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowHoldPrompt(false)}
                    className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmHoldBill}
                    className="px-5 py-2 text-sm font-bold bg-[#39772A] hover:bg-[#2e6322] text-white rounded-lg transition-colors shadow-sm"
                  >
                    Confirm & Hold Bill
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── HELD BILLS LIST MODAL ── */}
        <AnimatePresence>
          {showHeldBillsModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[2100]"
              onClick={() => setShowHeldBillsModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
              >
                {/* Modal Header */}
                <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-500 to-amber-600 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Bookmark className="w-6 h-6" />
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold">Held Bills Manager</h3>
                      <p className="text-xs text-amber-100">Resume or discard suspended bills</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowHeldBillsModal(false)}
                    className="p-1 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3 min-h-[300px]">
                  {heldBills.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                      <h4 className="text-base font-bold text-gray-700">No Held Bills</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        When you hold a bill from the cart, it will appear here for easy recall.
                      </p>
                    </div>
                  ) : (
                    heldBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="bg-white border border-gray-200 hover:border-amber-400 p-4 rounded-xl shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-extrabold text-sm text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                              {bill.billNumber}
                            </span>
                            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                              {bill.totalItems} items
                            </span>
                            <span className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(bill.heldAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-sm font-semibold text-gray-800">
                            {bill.note || 'General Customer'} {bill.customerName ? `• ${bill.customerName}` : ''}
                          </p>

                          {/* Item names preview */}
                          <p className="text-xs text-gray-500 truncate max-w-sm">
                            {bill.items?.map(i => `${i.proName} (x${i.quantity})`).join(', ')}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                          <div className="text-left sm:text-right">
                            <span className="text-xs text-gray-400 block">Total Amount</span>
                            <span className="text-base font-extrabold text-[#39772A]">
                              ${bill.totalAmount?.toFixed(2)}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleRecall(bill.id)}
                              className="px-3.5 py-1.5 bg-[#39772A] hover:bg-[#2e6322] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-sm transition-all"
                            >
                              <PlayCircle className="w-4 h-4" />
                              Recall
                            </button>

                            <button
                              onClick={(e) => handleDeleteHeld(bill.id, e)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Discard Bill"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </motion.div>
  )
}

export default CartPage
