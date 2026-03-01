'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useCart } from '@/contexts/CartContext'
import { useAuth } from '@/contexts/AuthContext'
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
  ArrowRight
} from 'lucide-react'

const CartPage = ({ onClose }) => {
  const { items, removeFromCart, updateQuantity, clearCart, getTotalPrice, getTotalItems } = useCart()
  const { user, userData } = useAuth()
  const [shippingAddress, setShippingAddress] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY')
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState(1)
  const [orderSuccess, setOrderSuccess] = useState(false)

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

  const handleCheckout = async () => {
    if (!user || !userData) {
      alert('Please login to place an order')
      return
    }

    if (!shippingAddress.trim()) {
      alert('Please enter a shipping address')
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
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: userData.id,
          items: orderItems,
          shippingAddress: shippingAddress,
          paymentMethod: paymentMethod,
          totalAmount: getTotalPrice()
        })
      })

      const data = await response.json()

      if (data.success) {
        setOrderSuccess(true)
        clearCart()
        setTimeout(() => {
          setOrderSuccess(false)
          onClose?.()
        }, 3000)
      } else {
        const errorMessage = data.error || 'Unknown error occurred'
        const helpMessage = data.help ? `\n\n${data.help}` : ''
        alert(`Failed to place order: ${errorMessage}${helpMessage}`)
        
        // Log detailed error for debugging
        console.error('Order placement failed:', data)
      }
    } catch (error) {
      console.error('Error placing order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  if (orderSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-2xl p-4 sm:p-8 max-w-md w-full text-center shadow-2xl"
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-0 sm:p-4 z-50"
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
        <div className="bg-gradient-to-r from-[#F25D49] to-[#FF6B5B] p-4 sm:p-6 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <ShoppingCart className="w-6 h-6 sm:w-8 sm:h-8" />
              <h2 className="text-xl sm:text-2xl font-bold">Shopping Cart</h2>
              <span className="bg-white/20 px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-medium">
                {getTotalItems()} items
              </span>
            </div>
            <button
              onClick={onClose}
              className="p-1 sm:p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
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
                <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Add some products to get started!</p>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-5 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-[#F25D49] to-[#FF6B5B] text-white rounded-lg font-medium text-sm sm:text-base"
                >
                  Start Shopping
                </motion.button>
              </motion.div>
            ) : (
              <div className="space-y-3 sm:space-y-4">
                <AnimatePresence>
                  {items.map((item, index) => (
                    <motion.div
                      key={item.proId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3 hover:shadow-sm hover:border-[#F25D49] transition-all"
                    >
                      {/* Product Image */}
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.proImages?.[0] || '/placeholder-product.jpg'}
                          alt={item.proName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      {/* Product Details */}
                      <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <h3 className="font-semibold text-gray-800 text-sm truncate">{item.proName}</h3>
                        <p className="text-xs text-gray-500 truncate">{item.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-bold text-[#F25D49]">
                              ${(parseFloat(item.salePrice) || parseFloat(item.price) || 0).toFixed(2)}
                            </span>
                            {item.salePrice && parseFloat(item.salePrice) < parseFloat(item.price) && (
                              <span className="text-xs text-gray-400 line-through">
                                ${parseFloat(item.price).toFixed(2)}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500 font-medium">
                            Qty: {item.quantity}
                          </span>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center bg-gray-50 rounded-lg border border-gray-200">
                          <button
                            onClick={() => updateQuantity(item.proId, item.quantity - 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-l-lg transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-10 text-center font-medium text-sm">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.proId, item.quantity + 1)}
                            className="p-1.5 hover:bg-gray-200 rounded-r-lg transition-colors"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        
                        <button
                          onClick={() => removeFromCart(item.proId)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          aria-label="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* Checkout Summary - Sticky */}
          {items.length > 0 && (
            <div className="w-full sm:w-96 bg-gray-50 p-4 sm:p-6 border-t sm:border-l border-gray-200 flex-shrink-0">
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Order Summary</h3>
              
              <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${getTotalPrice().toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium">$0.00</span>
                </div>
                <div className="border-t border-gray-300 pt-3 sm:pt-4">
                  <div className="flex justify-between text-base sm:text-lg">
                    <span className="font-bold text-gray-800">Total</span>
                    <span className="font-bold text-[#F25D49]">${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  Shipping Address
                </label>
                <textarea
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  placeholder="Enter your shipping address..."
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25D49] focus:border-transparent resize-none"
                  rows={3}
                />
              </div>

              {/* Payment Method */}
              <div className="mb-4 sm:mb-6">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1" />
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25D49] focus:border-transparent"
                >
                  <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="DEBIT_CARD">Debit Card</option>
                </select>
              </div>

              {/* Checkout Button */}
              <motion.button
                onClick={handleCheckout}
                disabled={isCheckingOut || !shippingAddress.trim()}
                whileHover={{ scale: isCheckingOut ? 1 : 1.02 }}
                whileTap={{ scale: isCheckingOut ? 1 : 0.98 }}
                className={`w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 ${
                  isCheckingOut || !shippingAddress.trim()
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#F25D49] to-[#FF6B5B] text-white hover:shadow-lg'
                }`}
              >
                {isCheckingOut ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-2">
                    <Truck className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>Place Order</span>
                  </div>
                )}
              </motion.button>

              <p className="text-xs text-gray-500 text-center mt-3 sm:mt-4">
                By placing this order, you agree to our terms and conditions.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default CartPage
