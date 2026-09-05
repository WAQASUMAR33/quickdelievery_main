'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import toast from 'react-hot-toast'
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  Eye,
  Star,
  RefreshCw,
  Calendar,
  MapPin,
  CreditCard,
  X,
  Printer,
  MessageCircle,
  Navigation,
  ChevronRight,
  ShoppingBag,
  Sparkles,
  Receipt,
  Search,
} from 'lucide-react'
import CustomerLiveTracking from '@/components/tracking/CustomerLiveTracking'
import OrderChatDrawer from '@/components/chat/OrderChatDrawer'
import { computeServiceCharge, getServiceChargePercent } from '@/lib/serviceCharge'

function escapeReceiptHtml(text) {
  return String(text ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

function printOrderReceipt(order) {
  const pct = getServiceChargePercent()
  const subtotal =
    Number(order.subtotal) ||
    order.items.reduce((s, i) => s + Number(i.price) * Number(i.quantity || 1), 0)
  let svc = parseFloat(order.serviceCharge)
  if (!Number.isFinite(svc)) {
    svc = computeServiceCharge(Math.round(subtotal * 100) / 100)
  }
  const total = Number(order.total) || Math.round((subtotal + svc) * 100) / 100

  const rowsHtml = order.items
    .map(
      (item) =>
        `<tr>
          <td>${escapeReceiptHtml(item.name)}</td>
          <td style="text-align:right">${item.quantity}</td>
          <td style="text-align:right">$${Number(item.price).toFixed(2)}</td>
          <td style="text-align:right;font-weight:600">$${(Number(item.price) * item.quantity).toFixed(2)}</td>
        </tr>`,
    )
    .join('')

  const oid = escapeReceiptHtml(order.id)

  const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Receipt #${oid}</title>
<style>
  body{font-family:system-ui,-apple-system,sans-serif;padding:28px;color:#0f172a;max-width:560px;margin:0 auto;font-size:14px;}
  h1{font-size:20px;margin:0 0 8px;font-weight:800;} .muted{color:#64748b;font-size:12px;line-height:1.6;} table{width:100%;border-collapse:collapse;margin:18px 0;} th,td{border-bottom:1px solid #e2e8f0;padding:10px 4px;text-align:left;} th{font-size:11px;text-transform:uppercase;color:#64748b;letter-spacing:0.5px;} .sum{margin-top:14px;background:#f8fafc;padding:14px;border-radius:12px;} .sum div{display:flex;justify-content:space-between;padding:4px 0;} .grand{font-size:16px;font-weight:800;margin-top:8px;padding-top:8px;border-top:1px dashed #cbd5e1;color:#0f172a;} .brand{color:#D70F64;font-weight:900;font-size:18px;margin-bottom:4px;} footer{margin-top:30px;font-size:11px;color:#94a3b8;text-align:center;}
</style></head><body>
  <p class="brand">QuickDelivery</p>
  <h1>Order Receipt</h1>
  <p class="muted">Order #${oid}<br/>Date: ${escapeReceiptHtml(new Date(order.date).toLocaleString())}<br/>
  Status: ${escapeReceiptHtml(order.status).toUpperCase()}<br/>Payment: ${escapeReceiptHtml(order.paymentMethod)}</p>
  <table>
    <thead><tr><th>Item</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
  <div class="sum">
    <div><span>Subtotal</span><span>$${Number(subtotal).toFixed(2)}</span></div>
    <div><span>Service charges (${pct}%)</span><span>$${Number(svc).toFixed(2)}</span></div>
    <div><span>Delivery fee</span><span style="color:#059669;font-weight:600;">Free</span></div>
    <div class="grand"><span>Total payable</span><span>$${Number(total).toFixed(2)}</span></div>
  </div>
  <p style="margin-top:20px;font-size:12px;color:#475569;"><strong>Deliver to</strong><br/>${escapeReceiptHtml(order.shippingAddress)}</p>
  <footer>Thank you for ordering with QuickDelivery!</footer>
</body></html>`

  const w = window.open('', '_blank')
  if (!w) {
    window.alert('Allow pop-ups to print the receipt.')
    return
  }
  w.document.open()
  w.document.write(html)
  w.document.close()
  w.onload = () => {
    w.focus()
    w.print()
  }
}

const OrderHistory = () => {
  const { user, userData } = useAuth()
  const { clearCart, addToCart } = useCart()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [trackingOrder, setTrackingOrder] = useState(null)
  const [chattingOrder, setChattingOrder] = useState(null)
  const [ratingModal, setRatingModal] = useState(null)
  const [ratingVal, setRatingVal] = useState(5)
  const [ratingText, setRatingText] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (userData?.id || userData?.uid) {
      fetchOrders()
      return
    }
    setLoading(false)
  }, [userData])

  const fetchOrders = async (isRefresh = false) => {
    const userRef = userData?.id || userData?.uid
    if (!userRef) {
      setOrders([])
      setLoading(false)
      return
    }

    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)
      
      const response = await fetch(`/api/orders?userId=${encodeURIComponent(userRef)}`)
      const data = await response.json()
      
      if (data.success) {
        const transformedOrders = (data.data || []).map((order) => {
          const orderItems = order.orderItems || []
          const items = orderItems.map((item) => {
            let img = '/placeholder-product.jpg'
            const pi = item.product?.proImages
            if (typeof pi === 'string') {
              try {
                const parsed = JSON.parse(pi)
                if (Array.isArray(parsed) && parsed[0]) img = parsed[0]
              } catch { /* keep default */ }
            } else if (Array.isArray(pi) && pi.length) {
              img = pi[0]
            }
            return {
              proId: item.productId || item.product?.proId,
              product: item.product,
              name: item.product?.proName || 'Unknown Product',
              price: parseFloat(item.price) || 0,
              quantity: item.quantity || 1,
              image: img,
            }
          })
          const subtotal = items.reduce((s, row) => s + row.price * row.quantity, 0)
          const subRounded = Math.round(subtotal * 100) / 100
          let serviceCharge = parseFloat(order.serviceCharge) || 0
          if (!serviceCharge && subRounded > 0) {
            serviceCharge = computeServiceCharge(subRounded)
          }
          return {
            id: order.id,
            date: order.createdAt || order.date,
            status: (order.status || 'PENDING').toLowerCase(),
            total: parseFloat(order.totalAmount) || 0,
            subtotal: subRounded,
            serviceCharge,
            items,
            review: order.review || null,
            shippingAddress: order.shippingAddress || 'N/A',
            trackingNumber: order.trackingNumber || null,
            estimatedDelivery: order.estimatedDelivery || null,
            paymentMethod: order.paymentMethod || 'Cash On Delivery',
            deliveryLatitude: order.deliveryLatitude || null,
            deliveryLongitude: order.deliveryLongitude || null,
          }
        })

        setOrders(transformedOrders)
      } else {
        console.error('Failed to fetch orders:', data.error)
        setOrders([])
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleReorder = (order) => {
    clearCart()
    order.items.forEach(item => {
      let p = { proId: item.proId || Date.now(), proName: item.name, price: item.price, proImages: [item.image] }
      if (item.product) {
        p = { ...item.product, proImages: [item.image] }
      }
      addToCart(p, item.quantity)
    })
    window.dispatchEvent(new Event('openCart'))
    toast.success('Items added to cart!')
  }

  const handleRateSubmit = async () => {
    if (!ratingModal) return
    try {
      const res = await fetch(`/api/orders/${ratingModal}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating: ratingVal, comment: ratingText })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Thank you! Rating submitted.')
        setOrders(orders.map(o => o.id === ratingModal ? { ...o, review: data.data } : o))
        setRatingModal(null)
        setRatingVal(5)
        setRatingText('')
      } else {
        toast.error(data.error || 'Failed to submit rating')
      }
    } catch (e) {
      toast.error('An error occurred')
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'delivered':
        return {
          icon: <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />,
          label: 'Delivered',
          classes: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
          dot: 'bg-emerald-500',
        }
      case 'shipped':
        return {
          icon: <Truck className="w-3.5 h-3.5 text-sky-600" />,
          label: 'On the Way',
          classes: 'bg-sky-50 text-sky-700 border-sky-200/80',
          dot: 'bg-sky-500 animate-pulse',
        }
      case 'processing':
        return {
          icon: <Clock className="w-3.5 h-3.5 text-amber-600" />,
          label: 'Processing',
          classes: 'bg-amber-50 text-amber-700 border-amber-200/80',
          dot: 'bg-amber-500 animate-pulse',
        }
      case 'cancelled':
        return {
          icon: <XCircle className="w-3.5 h-3.5 text-rose-600" />,
          label: 'Cancelled',
          classes: 'bg-rose-50 text-rose-700 border-rose-200/80',
          dot: 'bg-rose-500',
        }
      default:
        return {
          icon: <Package className="w-3.5 h-3.5 text-slate-600" />,
          label: status.charAt(0).toUpperCase() + status.slice(1),
          classes: 'bg-slate-50 text-slate-700 border-slate-200/80',
          dot: 'bg-slate-400',
        }
    }
  }

  // Filter & Search Logic
  const filteredOrders = orders.filter(order => {
    const matchesFilter = filterStatus === 'all' 
      ? true 
      : filterStatus === 'active'
        ? ['pending', 'processing', 'shipped'].includes(order.status)
        : order.status === filterStatus

    const matchesSearch = searchQuery.trim() === ''
      ? true
      : String(order.id).includes(searchQuery.trim()) ||
        order.items.some(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesFilter && matchesSearch
  })

  const statusCounts = {
    all: orders.length,
    active: orders.filter(o => ['pending', 'processing', 'shipped'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-2">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Order History</h1>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
              {orders.length} {orders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Track active deliveries, review past receipts, and reorder with one click.
          </p>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search orders or items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D70F64]/30 focus:border-[#D70F64] w-48 sm:w-56 transition-all"
            />
          </div>

          <button
            onClick={() => fetchOrders(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50"
            title="Refresh Orders"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${refreshing ? 'animate-spin text-[#D70F64]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Segmented Status Filter Tabs ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100">
        {[
          { id: 'all', label: 'All Orders', count: statusCounts.all },
          { id: 'active', label: 'In Progress', count: statusCounts.active },
          { id: 'delivered', label: 'Delivered', count: statusCounts.delivered },
          { id: 'cancelled', label: 'Cancelled', count: statusCounts.cancelled },
        ].map((tab) => {
          const isActive = filterStatus === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`relative px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-200/80 text-slate-600'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Orders Content ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm animate-pulse space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 bg-slate-200 rounded w-32" />
                <div className="h-6 bg-slate-200 rounded-full w-24" />
              </div>
              <div className="flex gap-4 items-center">
                <div className="w-14 h-14 bg-slate-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-1/4" />
                </div>
              </div>
              <div className="h-10 bg-slate-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            {searchQuery ? 'No matching orders found' : 'No orders in this category'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            {searchQuery
              ? `We couldn't find anything matching "${searchQuery}". Try a different keyword.`
              : "When you place orders, they will appear here with live tracking and receipts."}
          </p>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const badge = getStatusBadge(order.status)
            const isActiveOrder = ['pending', 'processing', 'shipped'].includes(order.status)

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: index * 0.05 }}
                className="bg-white rounded-2xl border border-slate-100/90 shadow-[0_2px_14px_rgba(15,23,42,0.04)] hover:shadow-[0_8px_26px_rgba(15,23,42,0.07)] transition-all duration-300 overflow-hidden"
              >
                {/* ── Card Header ── */}
                <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-gradient-to-r from-slate-50/60 to-white">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-sm shadow-sm">
                      #{order.id}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-slate-900">
                          Order #{order.id}
                        </h3>
                        <span className="text-xs text-slate-400 font-medium">•</span>
                        <span className="text-xs font-medium text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                          {order.paymentMethod}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(order.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.classes} shadow-xs`}>
                    <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </div>
                </div>

                {/* ── Card Body / Items ── */}
                <div className="p-5 sm:p-6 space-y-4">
                  <div className="space-y-2.5">
                    {order.items.map((item, itemIdx) => (
                      <div
                        key={itemIdx}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50/70 hover:bg-slate-50 border border-slate-100/80 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200/60 bg-white"
                              onError={(e) => {
                                e.target.src = '/placeholder-product.jpg'
                              }}
                            />
                            <span className="absolute -top-1.5 -right-1.5 bg-slate-900 text-white text-[10px] font-extrabold rounded-full w-5 h-5 flex items-center justify-center shadow-xs">
                              {item.quantity}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-sm font-semibold text-slate-800 truncate">
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                              ${Number(item.price).toFixed(2)} × {item.quantity}
                            </p>
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0 pl-3">
                          <span className="text-sm font-bold text-slate-900">
                            ${(Number(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* ── Bill Breakdown Box ── */}
                  <div className="p-4 rounded-xl bg-slate-50/90 border border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-600">
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                      <div>
                        <span className="text-slate-400 mr-1.5">Subtotal:</span>
                        <span className="font-semibold text-slate-700">${Number(order.subtotal ?? 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 mr-1.5">Service ({getServiceChargePercent()}%):</span>
                        <span className="font-semibold text-slate-700">${Number(order.serviceCharge ?? 0).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 mr-1.5">Delivery:</span>
                        <span className="font-bold text-emerald-600">Free</span>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <span className="text-xs text-slate-500 font-medium uppercase tracking-wider">Total Payable:</span>
                      <span className="text-lg font-extrabold text-slate-900">
                        ${Number(order.total).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Tracking Number pill if present */}
                  {order.trackingNumber && (
                    <div className="flex items-center gap-2 text-xs font-mono bg-sky-50 text-sky-800 px-3 py-1.5 rounded-lg border border-sky-200/60">
                      <Truck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Tracking: <strong>{order.trackingNumber}</strong></span>
                    </div>
                  )}

                  {/* ── Actions Row ── */}
                  <div className="pt-2 flex flex-wrap items-center justify-between gap-2.5">
                    {/* Left Actions (Receipt, Details, Rating) */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => printOrderReceipt(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95 shadow-2xs"
                      >
                        <Printer className="w-3.5 h-3.5 text-slate-500" />
                        <span>Print receipt</span>
                      </button>

                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200/60 rounded-xl transition-all active:scale-95"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-600" />
                        <span>View Details</span>
                      </button>

                      {order.status === 'delivered' && !order.review && (
                        <button
                          onClick={() => setRatingModal(order.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition-all active:scale-95"
                        >
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span>Rate Order</span>
                        </button>
                      )}

                      {order.review && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-amber-700 bg-amber-50/70 border border-amber-200/60 rounded-xl">
                          <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                          <span>{order.review.rating}/5 Rated</span>
                        </div>
                      )}
                    </div>

                    {/* Right Primary Actions (Reorder, Live Tracking, Live Chat) */}
                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                      {isActiveOrder && (
                        <>
                          <button
                            onClick={() => setTrackingOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 rounded-xl shadow-xs hover:shadow transition-all active:scale-95"
                          >
                            <Navigation className="w-3.5 h-3.5 animate-pulse" />
                            <span>Live Track Driver</span>
                          </button>

                          <button
                            onClick={() => setChattingOrder(order)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200/80 rounded-xl transition-all active:scale-95"
                          >
                            <MessageCircle className="w-3.5 h-3.5 text-sky-600" />
                            <span>Live Chat</span>
                          </button>
                        </>
                      )}

                      {(order.status === 'delivered' || order.status === 'shipped') && (
                        <button
                          onClick={() => handleReorder(order)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-[#D70F64] to-[#C20E5A] hover:from-[#C20E5A] hover:to-[#A30B4B] rounded-xl shadow-xs hover:shadow-md transition-all active:scale-95"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>Reorder</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* ── Order Details Modal ── */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="bg-white rounded-2xl max-w-xl w-full max-h-[88vh] overflow-y-auto shadow-2xl border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Order #{selectedOrder.id}</h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Placed on {new Date(selectedOrder.date).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => printOrderReceipt(selectedOrder)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      <Printer className="w-3.5 h-3.5 text-slate-600" />
                      <span>Print</span>
                    </button>
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-5 pt-5">
                  {/* Status and Summary Cards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Status</span>
                      <p className="text-sm font-bold text-slate-800 capitalize mt-1">
                        {selectedOrder.status}
                      </p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Payment</span>
                      <p className="text-sm font-bold text-slate-800 mt-1">
                        {selectedOrder.paymentMethod}
                      </p>
                    </div>
                  </div>

                  {/* Delivery destination */}
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-[#D70F64] flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Delivery Address</span>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">
                        {selectedOrder.shippingAddress}
                      </p>
                    </div>
                  </div>

                  {/* Itemized list */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">Items Ordered</h4>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50/70 border border-slate-100 text-xs">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-10 h-10 rounded-lg object-cover bg-white border border-slate-200/60"
                              onError={(e) => { e.target.src = '/placeholder-product.jpg' }}
                            />
                            <div>
                              <p className="font-semibold text-slate-800">{item.name}</p>
                              <p className="text-slate-500">${Number(item.price).toFixed(2)} × {item.quantity}</p>
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">
                            ${(Number(item.price) * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calculation summary */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>Subtotal</span>
                      <span className="font-semibold">${Number(selectedOrder.subtotal ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Service Charges ({getServiceChargePercent()}%)</span>
                      <span className="font-semibold">${Number(selectedOrder.serviceCharge ?? 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>Delivery Fee</span>
                      <span className="font-semibold text-emerald-400">Free</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800 flex justify-between text-sm font-extrabold text-white">
                      <span>Total Payable</span>
                      <span className="text-base text-white">${Number(selectedOrder.total).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Rating Modal ── */}
      <AnimatePresence>
        {ratingModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setRatingModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 border border-slate-100"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-900">Rate Order #{ratingModal}</h3>
                <button onClick={() => setRatingModal(null)} className="text-slate-400 hover:text-slate-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-500 mb-4 text-center">
                How was your food and delivery experience?
              </p>
              <div className="flex space-x-2 justify-center mb-5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRatingVal(s)}
                    className="focus:outline-none transition-transform hover:scale-115 active:scale-95"
                  >
                    <Star
                      className={`w-8 h-8 transition-colors ${
                        s <= ratingVal ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                      }`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 mb-4 focus:ring-2 focus:ring-[#D70F64]/30 focus:border-[#D70F64] focus:outline-none resize-none"
                rows="3"
                placeholder="Share your feedback (optional)..."
                value={ratingText}
                onChange={(e) => setRatingText(e.target.value)}
              />
              <button
                type="button"
                onClick={handleRateSubmit}
                className="w-full py-2.5 text-white rounded-xl text-xs font-bold bg-gradient-to-r from-[#D70F64] to-[#C20E5A] hover:from-[#C20E5A] hover:to-[#A30B4B] shadow-sm transition-all active:scale-98"
              >
                Submit Rating
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Customer Live GPS Tracking Fullscreen Modal */}
      {trackingOrder && (
        <CustomerLiveTracking
          open={Boolean(trackingOrder)}
          onClose={() => setTrackingOrder(null)}
          order={trackingOrder}
          currentUser={userData}
        />
      )}

      {/* Live Chat Drawer */}
      {chattingOrder && (
        <OrderChatDrawer
          open={Boolean(chattingOrder)}
          onClose={() => setChattingOrder(null)}
          orderId={chattingOrder.id}
          currentUser={{ id: userData?.id || chattingOrder.userId, role: 'CUSTOMER', username: userData?.username || 'Customer' }}
          recipientUser={{ name: chattingOrder.driver?.username || 'Assigned Driver', phone: chattingOrder.driver?.phoneNumber, role: 'DRIVER' }}
        />
      )}
    </div>
  )
}

export default OrderHistory