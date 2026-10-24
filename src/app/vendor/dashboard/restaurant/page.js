'use client'

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { isRestaurantVendor } from '@/lib/restaurant/categoryHelper'
import toast, { Toaster } from 'react-hot-toast'

import {
  UtensilsCrossed,
  ChefHat,
  Receipt,
  Boxes,
  BookOpen,
  CalendarCheck,
  TrendingUp,
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  CheckCircle2,
  Clock,
  AlertTriangle,
  CreditCard,
  Banknote,
  Split,
  UserCheck,
  ArrowRight,
  Flame,
  Coffee,
  Store,
  RefreshCw,
  X,
  FileText,
  DollarSign,
  ShieldCheck,
  Percent,
  Layers,
  ChevronRight,
  ChevronLeft,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Menu,
  SlidersHorizontal,
  Users,
  Grid3X3,
  QrCode,
  Tag,
  Building2,
  HelpCircle,
  ExternalLink,
  Phone,
  MapPin,
  CalendarDays,
  SendHorizontal
} from 'lucide-react'

function RestaurantManagementContent() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  // ── Layout & Sidebar Navigation State ──────────────────────────────────────────
  // 'pos' | 'kds' | 'orders' | 'reservations' | 'menu' | 'recipes' | 'inventory' | 'transfers' | 'waste' | 'khata' | 'dayend' | 'reports' | 'hardware'
  const tabFromQuery = searchParams ? searchParams.get('tab') : null
  const [activeTab, setActiveTabState] = useState(tabFromQuery || 'pos')
  const [sidebarSearch, setSidebarSearch] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [fullscreenMode, setFullscreenMode] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [currentTime, setCurrentTime] = useState('')

  useEffect(() => {
    if (tabFromQuery && tabFromQuery !== activeTab) {
      setActiveTabState(tabFromQuery)
    }
  }, [tabFromQuery])

  const setActiveTab = (tabId) => {
    setActiveTabState(tabId)
    if (typeof window !== 'undefined') {
      try {
        const url = new URL(window.location.href)
        url.searchParams.set('tab', tabId)
        window.history.replaceState({}, '', url.toString())
      } catch (_) {}
    }
  }

  // Selected Branch & Active Operator
  const [selectedBranchId, setSelectedBranchId] = useState(1)
  const [selectedStaffUser, setSelectedStaffUser] = useState('Cashier Counter 1 (Bilal)')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Bootstrap Core Data
  const [restaurantData, setRestaurantData] = useState({
    branch: null,
    branches: [],
    settings: null,
    halls: [],
    tables: [],
    categories: [],
    menuItems: [],
    kitchens: [],
    customers: [],
    staff: [],
    printers: [],
    currentDayEnd: null,
    activeOrders: [],
    reservations: [],
    recipes: []
  })

  // POS State
  const [orderType, setOrderType] = useState('dine_in') // 'dine_in' | 'takeaway' | 'delivery'
  const [selectedHallId, setSelectedHallId] = useState(null)
  const [selectedTable, setSelectedTable] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [discountType, setDiscountType] = useState('percentage') // 'percentage' | 'fixed'
  const [discountVal, setDiscountVal] = useState(0)
  const [customerName, setCustomerName] = useState('Walk-in Guest')
  const [customerPhone, setCustomerPhone] = useState('')
  const [deliveryAddress, setDeliveryAddress] = useState('')
  const [orderNotes, setOrderNotes] = useState('')
  const [splitGuestsCount, setSplitGuestsCount] = useState(2)

  // Item Modifier Modal
  const [modifierModalItem, setModifierModalItem] = useState(null)
  const [itemNoteInput, setItemNoteInput] = useState('')

  // Checkout Settlement Modal State
  const [settlementModal, setSettlementModal] = useState({
    open: false,
    order: null,
    paymentMethod: 'cash',
    tenderedAmount: '',
    splitCash: '',
    splitCard: '',
    selectedCustomerId: '',
    notes: ''
  })

  // Receipt Modal State (Thermal ESC/POS Preview)
  const [receiptModal, setReceiptModal] = useState({
    open: false,
    order: null,
    paperWidth: '80mm'
  })

  // KDS State
  const [kdsStation, setKdsStation] = useState('all')
  const [kdsTickets, setKdsTickets] = useState([])

  // Multi-Store Inventory State
  const [inventoryData, setInventoryData] = useState({
    items: [],
    lowStockItems: [],
    transfers: [],
    wasteLogs: [],
    kitchens: [],
    suppliers: []
  })
  const [transferModal, setTransferModal] = useState({
    open: false,
    inventory_item_id: '',
    to_kitchen_id: '',
    quantity: '',
    notes: ''
  })
  const [wasteModal, setWasteModal] = useState({
    open: false,
    inventory_item_id: '',
    kitchen_id: '',
    quantity: '',
    reason: 'spoilage',
    unit: 'kg',
    estimated_cost: ''
  })

  // Khata Ledgers State
  const [khataData, setKhataData] = useState({
    customers: [],
    customerLedgers: [],
    suppliers: [],
    supplierLedgers: []
  })
  const [custPaymentModal, setCustPaymentModal] = useState({
    open: false,
    customer_id: '',
    amount: '',
    notes: ''
  })

  // Day-End Closing State
  const [dayEndData, setDayEndData] = useState({
    current: null,
    closedHistory: [],
    todayExpenses: [],
    totalExpenseAmount: 0
  })
  const [dayEndModal, setDayEndModal] = useState({
    open: false,
    action: 'close', // 'open' | 'close'
    openingFloat: 15000,
    actualCashCounted: '',
    closingNotes: ''
  })

  // Reports Data
  const [reportsData, setReportsData] = useState({
    todaySales: {},
    topDishes: [],
    categorySales: [],
    recentOrders: []
  })

  // New Reservation Modal State
  const [reservationModal, setReservationModal] = useState({
    open: false,
    customer_name: '',
    customer_phone: '',
    party_size: 4,
    hall_id: 1,
    table_id: '',
    reservation_date: new Date().toISOString().slice(0, 10),
    reservation_time: '08:00 PM',
    special_requests: ''
  })

  // Real-time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  // Audio Chime Player
  const playChime = () => {
    if (!soundEnabled) return
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)()
      const osc = audioCtx.createOscillator()
      const gain = audioCtx.createGain()
      osc.connect(gain)
      gain.connect(audioCtx.destination)
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime) // D5
      osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.12) // A5
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35)
      osc.start()
      osc.stop(audioCtx.currentTime + 0.35)
    } catch (_) {}
  }

  // Centralized safe token getter
  const getAuthHeaders = () => {
    if (typeof window === 'undefined') return {}
    try {
      const token = localStorage.getItem('authToken')
      if (token && token !== 'undefined' && token !== 'null' && token !== 'GUEST_SESSION') {
        return { Authorization: `Bearer ${token}` }
      }
    } catch (_) {}
    return {}
  }

  // Load Bootstrap Data
  const loadBootstrap = async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)

    try {
      const headers = getAuthHeaders()
      let res = await fetch('/api/vendor/restaurant/bootstrap', { headers })

      // If token expired or rejected with 401/403, seamlessly retry without header
      if (!res.ok && (res.status === 401 || res.status === 403) && headers.Authorization) {
        console.warn('Auth token rejected, falling back to public restaurant context...')
        res = await fetch('/api/vendor/restaurant/bootstrap')
      }

      if (res.ok) {
        const data = await res.json()
        if (data && data.success) {
          setRestaurantData(data)
          if (data.halls && data.halls.length > 0 && !selectedHallId) {
            setSelectedHallId(data.halls[0].id)
          }
          return
        }
      }

      // Secondary fallback
      const fallbackRes = await fetch('/api/vendor/restaurant/bootstrap')
      if (fallbackRes.ok) {
        const fbData = await fallbackRes.json()
        if (fbData && fbData.success) {
          setRestaurantData(fbData)
          if (fbData.halls && fbData.halls.length > 0 && !selectedHallId) {
            setSelectedHallId(fbData.halls[0].id)
          }
          return
        }
      }
    } catch (err) {
      console.warn('Restaurant bootstrap warning:', err)
      // Only display toast if no restaurant data is available at all
      if (!restaurantData?.branches?.length) {
        toast.error('Unable to sync restaurant database', { id: 'db-sync-warning' })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Load KDS Tickets
  const loadKdsTickets = async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch(`/api/vendor/restaurant/kds?stationId=${kdsStation}`, { headers })
      const data = await res.json()
      if (data?.success) {
        setKdsTickets(data.tickets || [])
      }
    } catch (e) {
      console.warn('Failed to load KDS tickets:', e)
    }
  }

  // Load Inventory Data
  const loadInventory = async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/vendor/restaurant/inventory', { headers })
      const data = await res.json()
      if (data?.success) setInventoryData(data)
    } catch (e) {
      console.warn('Failed to load inventory data:', e)
    }
  }

  // Load Khata Data
  const loadKhata = async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/vendor/restaurant/khata', { headers })
      const data = await res.json()
      if (data?.success) setKhataData(data)
    } catch (e) {
      console.warn('Failed to load khata data:', e)
    }
  }

  // Load Day-End Data
  const loadDayEnd = async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/vendor/restaurant/dayend', { headers })
      const data = await res.json()
      if (data?.success) setDayEndData(data)
    } catch (e) {
      console.warn('Failed to load day-end data:', e)
    }
  }

  // Load Reports Data
  const loadReports = async () => {
    try {
      const headers = getAuthHeaders()
      const res = await fetch('/api/vendor/restaurant/reports', { headers })
      const data = await res.json()
      if (data?.success) setReportsData(data)
    } catch (e) {
      console.warn('Failed to load reports data:', e)
    }
  }

  useEffect(() => {
    if (!authLoading) {
      loadBootstrap()
    }
  }, [authLoading])

  useEffect(() => {
    if (activeTab === 'kds') loadKdsTickets()
    if (activeTab === 'inventory' || activeTab === 'transfers' || activeTab === 'waste') loadInventory()
    if (activeTab === 'khata' || activeTab === 'suppliers') loadKhata()
    if (activeTab === 'dayend') loadDayEnd()
    if (activeTab === 'reports') loadReports()
  }, [activeTab, kdsStation])

  // Periodic live refresh for KDS
  useEffect(() => {
    if (activeTab !== 'kds') return
    const interval = setInterval(() => {
      loadKdsTickets()
    }, 10000)
    return () => clearInterval(interval)
  }, [activeTab, kdsStation])

  // Computed Navigation Badges
  const occupiedTablesCount = useMemo(() => {
    return (restaurantData.tables || []).filter(t => t.status === 'occupied').length
  }, [restaurantData.tables])

  const totalTablesCount = useMemo(() => {
    return (restaurantData.tables || []).length
  }, [restaurantData.tables])

  // Filtered Menu Items
  const filteredMenuItems = useMemo(() => {
    return (restaurantData.menuItems || []).filter(item => {
      const matchesCat = selectedCategory === 'all' || String(item.category_id) === String(selectedCategory)
      const matchesSearch = !searchQuery.trim() ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()))
      return matchesCat && matchesSearch
    })
  }, [restaurantData.menuItems, selectedCategory, searchQuery])

  // Current Hall Tables
  const currentHallTables = useMemo(() => {
    return (restaurantData.tables || []).filter(t => t.hall_id === selectedHallId)
  }, [restaurantData.tables, selectedHallId])

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cartItems.reduce((acc, it) => acc + (Number(it.price) * Number(it.quantity)), 0)
  }, [cartItems])

  const discountAmount = useMemo(() => {
    if (discountType === 'percentage') {
      return (cartSubtotal * (Number(discountVal) || 0)) / 100
    }
    return Math.min(cartSubtotal, Number(discountVal) || 0)
  }, [cartSubtotal, discountType, discountVal])

  const taxableAmount = Math.max(0, cartSubtotal - discountAmount)
  const serviceChargeRate = orderType === 'dine_in' ? 5.0 : 0
  const serviceChargeAmount = (taxableAmount * serviceChargeRate) / 100
  const taxRate = 16.0
  const taxAmount = (taxableAmount * taxRate) / 100
  const cartGrandTotal = Math.round((taxableAmount + serviceChargeAmount + taxAmount) * 100) / 100

  // Add Item to Cart
  const handleAddToCart = (item) => {
    setCartItems(prev => {
      const idx = prev.findIndex(i => i.id === item.id)
      if (idx > -1) {
        const next = [...prev]
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 }
        return next
      }
      return [...prev, { ...item, quantity: 1, notes: '' }]
    })
    playChime()
  }

  const handleUpdateQty = (itemId, delta) => {
    setCartItems(prev => {
      return prev.map(i => {
        if (i.id === itemId) {
          const newQty = i.quantity + delta
          return newQty > 0 ? { ...i, quantity: newQty } : null
        }
        return i
      }).filter(Boolean)
    })
  }

  const handleRemoveFromCart = (itemId) => {
    setCartItems(prev => prev.filter(i => i.id !== itemId))
  }

  // Select Table
  const handleSelectTable = (table) => {
    setSelectedTable(table)
    if (table.current_order_id) {
      const existing = restaurantData.activeOrders?.find(o => o.id === table.current_order_id)
      if (existing) {
        setCustomerName(existing.customer_name || 'Walk-in Guest')
        setCustomerPhone(existing.customer_phone || '')
        toast(`Table ${table.table_number} has active Order #${existing.order_number}`, { icon: '🍽️' })
      }
    }
  }

  // Fire KOT / Create POS Order
  const handleFireKOT = async () => {
    if (cartItems.length === 0) {
      toast.error('Cart is empty. Add menu dishes first.')
      return
    }

    if (orderType === 'dine_in' && !selectedTable) {
      toast.error('Please select an available dining table first.')
      return
    }

    const payload = {
      branch_id: selectedBranchId || restaurantData.branch?.id || 1,
      user_id: 1,
      order_taker_id: 1,
      table_id: orderType === 'dine_in' ? selectedTable?.id : null,
      hall_id: orderType === 'dine_in' ? selectedHallId : null,
      order_type: orderType,
      customer_name: customerName,
      customer_phone: customerPhone,
      delivery_address: orderType === 'delivery' ? deliveryAddress : '',
      items: cartItems.map(c => ({
        id: c.id,
        menu_item_id: c.id,
        kitchen_id: c.kitchen_id || 1,
        quantity: c.quantity,
        price: c.price,
        cost_price: c.cost_price || 0,
        notes: c.notes || ''
      })),
      discount_type: discountType,
      discount_value: discountVal,
      service_charge_rate: serviceChargeRate,
      tax_rate: taxRate,
      notes: orderNotes
    }

    try {
      const res = await fetch('/api/vendor/restaurant/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (result.success) {
        toast.success(`KOT Fired! Order #${result.order.order_number} dispatched to station thermal printers.`)
        playChime()

        // Reset cart
        setCartItems([])
        setSelectedTable(null)
        setOrderNotes('')
        setDiscountVal(0)
        loadBootstrap(true)
      } else {
        toast.error(result.error || 'Failed to fire KOT')
      }
    } catch (e) {
      toast.error('Network error creating order')
    }
  }

  // Settle Order
  const handleOpenSettlement = (orderToSettle) => {
    setSettlementModal({
      open: true,
      order: orderToSettle,
      paymentMethod: 'cash',
      tenderedAmount: String(orderToSettle.total_amount),
      splitCash: String(Math.floor(orderToSettle.total_amount / 2)),
      splitCard: String(Math.ceil(orderToSettle.total_amount / 2)),
      selectedCustomerId: '',
      notes: ''
    })
  }

  const handleConfirmSettlement = async () => {
    const { order, paymentMethod, tenderedAmount, splitCash, splitCard, selectedCustomerId, notes } = settlementModal
    if (!order) return

    const payload = {
      action: 'settle',
      payment_method: paymentMethod,
      tendered_amount: Number(tenderedAmount) || order.total_amount,
      cash_amount: Number(splitCash) || 0,
      card_amount: Number(splitCard) || 0,
      customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
      notes
    }

    try {
      const res = await fetch(`/api/vendor/restaurant/orders/${order.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      })
      const result = await res.json()
      if (result.success) {
        toast.success(`Order #${order.order_number} settled & paid! Recipe BOM stocks deducted.`)
        playChime()
        setSettlementModal({ open: false, order: null, paymentMethod: 'cash', tenderedAmount: '', splitCash: '', splitCard: '', selectedCustomerId: '', notes: '' })
        setReceiptModal({ open: true, order: result.order, paperWidth: '80mm' })
        loadBootstrap(true)
      } else {
        toast.error(result.error || 'Failed to settle order')
      }
    } catch (e) {
      toast.error('Network error during settlement')
    }
  }

  // Kitchen KDS Ticket Status Progression
  const handleKdsItemStatus = async (itemId, currentStatus) => {
    const nextStatus = currentStatus === 'pending' ? 'cooking' : currentStatus === 'cooking' ? 'ready' : 'served'
    try {
      await fetch('/api/vendor/restaurant/kds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ type: 'item', itemId, status: nextStatus })
      })
      loadKdsTickets()
    } catch (e) {
      toast.error('Failed to update kitchen status')
    }
  }

  const handleKdsTicketComplete = async (orderId) => {
    try {
      await fetch('/api/vendor/restaurant/kds', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ type: 'ticket', orderId, status: 'ready' })
      })
      toast.success('Ticket marked READY for service!')
      playChime()
      loadKdsTickets()
    } catch (e) {
      toast.error('Failed to complete ticket')
    }
  }

  // Stock Transfer
  const handleConfirmTransfer = async () => {
    if (!transferModal.inventory_item_id || !transferModal.to_kitchen_id || !transferModal.quantity) {
      toast.error('Please fill all transfer fields')
      return
    }
    try {
      const res = await fetch('/api/vendor/restaurant/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ action: 'transfer', ...transferModal })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Stock transferred from Main Store to Kitchen!')
        setInventoryData(data)
        setTransferModal({ open: false, inventory_item_id: '', to_kitchen_id: '', quantity: '', notes: '' })
      } else {
        toast.error(data.error)
      }
    } catch (e) {
      toast.error('Transfer failed')
    }
  }

  // Spoilage / Waste
  const handleConfirmWaste = async () => {
    if (!wasteModal.inventory_item_id || !wasteModal.quantity) {
      toast.error('Please enter inventory item and quantity')
      return
    }
    try {
      const res = await fetch('/api/vendor/restaurant/inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ action: 'waste', ...wasteModal })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Waste log registered and stock updated')
        setInventoryData(data)
        setWasteModal({ open: false, inventory_item_id: '', kitchen_id: '', quantity: '', reason: 'spoilage', unit: 'kg', estimated_cost: '' })
      } else {
        toast.error(data.error)
      }
    } catch (e) {
      toast.error('Waste logging failed')
    }
  }

  // Customer Khata Payment
  const handleConfirmCustPayment = async () => {
    if (!custPaymentModal.customer_id || !custPaymentModal.amount) {
      toast.error('Please enter customer and payment amount')
      return
    }
    try {
      const res = await fetch('/api/vendor/restaurant/khata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ type: 'customer_payment', ...custPaymentModal })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Customer Khata payment received and balance updated!')
        setKhataData(data)
        setCustPaymentModal({ open: false, customer_id: '', amount: '', notes: '' })
      } else {
        toast.error(data.error)
      }
    } catch (e) {
      toast.error('Failed to log khata payment')
    }
  }

  // Day-End Register (Open / Close)
  const handleConfirmDayEnd = async () => {
    try {
      const payload = dayEndModal.action === 'open'
        ? { action: 'open', opening_float: dayEndModal.openingFloat }
        : { action: 'close', actual_cash_counted: dayEndModal.actualCashCounted, closing_notes: dayEndModal.closingNotes }

      const res = await fetch('/api/vendor/restaurant/dayend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (data.success) {
        toast.success(dayEndModal.action === 'open' ? 'Register opened for business!' : 'Day-End Z-Report generated and register locked!')
        setDayEndData(data)
        setDayEndModal({ open: false, action: 'close', openingFloat: 15000, actualCashCounted: '', closingNotes: '' })
        loadBootstrap(true)
      } else {
        toast.error(data.error)
      }
    } catch (e) {
      toast.error('Failed to process day-end')
    }
  }

  // Thermal Print Simulation
  const handleTriggerPrint = () => {
    window.print()
  }

  // ── SIDEBAR NAVIGATION ITEMS DEFINITION ───────────────────────────────────────
  const SIDEBAR_SECTIONS = [
    {
      group: 'OPERATIONS',
      items: [
        { id: 'pos', label: 'Touch POS & Tables', icon: UtensilsCrossed, badge: `${occupiedTablesCount}/${totalTablesCount}` },
        { id: 'kds', label: 'Kitchen Display (KDS)', icon: ChefHat, badge: kdsTickets.length || null, badgeColor: 'bg-amber-500' },
        { id: 'orders', label: 'Active Bills & Settle', icon: Receipt, badge: restaurantData.activeOrders?.length || null, badgeColor: 'bg-emerald-500' },
        { id: 'reservations', label: 'Table Reservations', icon: CalendarDays, badge: restaurantData.reservations?.length || null },
      ]
    },
    {
      group: 'CATALOG & RECIPES',
      items: [
        { id: 'menu', label: 'Menu Catalog & Margins', icon: Coffee, badge: `${restaurantData.menuItems?.length || 0}` },
        { id: 'recipes', label: 'Recipe BOM Formulations', icon: SlidersHorizontal, badge: `${restaurantData.recipes?.length || 0}` },
      ]
    },
    {
      group: 'MULTI-STORE INVENTORY',
      items: [
        { id: 'inventory', label: 'Stock Levels & Alerts', icon: Boxes, badge: inventoryData.lowStockItems?.length ? `${inventoryData.lowStockItems.length} Low` : null, badgeColor: 'bg-rose-500' },
        { id: 'transfers', label: 'Stock Transfers', icon: ArrowRight, badge: null },
        { id: 'waste', label: 'Spoilage & Waste Logs', icon: AlertTriangle, badge: null },
      ]
    },
    {
      group: 'FINANCIALS & KHATA',
      items: [
        { id: 'khata', label: 'Customer Khata (AR)', icon: BookOpen, badge: `${restaurantData.customers?.length || 0}` },
        { id: 'suppliers', label: 'Supplier Khata (AP)', icon: Building2, badge: `${inventoryData.suppliers?.length || 0}` },
        { id: 'dayend', label: 'Day-End Z-Report', icon: CalendarCheck, badge: restaurantData.currentDayEnd ? 'Open' : 'Closed', badgeColor: restaurantData.currentDayEnd ? 'bg-emerald-600' : 'bg-slate-700' },
      ]
    },
    {
      group: 'ADMINISTRATION',
      items: [
        { id: 'reports', label: 'Executive BI Analytics', icon: TrendingUp, badge: null },
        { id: 'hardware', label: 'Hardware & PRA Fiscal', icon: QrCode, badge: 'ESC/POS' },
      ]
    }
  ]

  const filteredSections = useMemo(() => {
    if (!sidebarSearch.trim()) return SIDEBAR_SECTIONS
    const q = sidebarSearch.toLowerCase()
    return SIDEBAR_SECTIONS.map(sec => {
      const filteredItems = sec.items.filter(item => 
        item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
      )
      return { ...sec, items: filteredItems }
    }).filter(sec => sec.items.length > 0)
  }, [SIDEBAR_SECTIONS, sidebarSearch])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center min-h-[75vh] gap-3">
          <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-600 font-bold text-sm tracking-wide">Loading Rapid Food Enterprise POS & ERP...</p>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Toaster position="top-right" />
      <div className={`w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none ${fullscreenMode ? 'fixed inset-0 z-50 overflow-hidden' : ''}`}>
        
        {/* ── TOP EXECUTIVE APP BAR ── */}
        <header className="w-full bg-slate-900/95 backdrop-blur-md border-b border-slate-800 px-3.5 py-2 flex items-center justify-between sticky top-0 z-40 shadow-md">
          
          {/* Left: Sidebar Toggle, Restaurant Brand, Branch Switcher */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all border border-slate-700"
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
                <UtensilsCrossed className="w-4 h-4 text-white" />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h1 className="font-black text-sm text-white tracking-tight leading-none">
                    {restaurantData.settings?.restaurant_name || 'Rapid Food & Grill'}
                  </h1>
                  <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    ENTERPRISE POS
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-emerald-400" />
                  <select
                    value={selectedBranchId}
                    onChange={e => setSelectedBranchId(Number(e.target.value))}
                    className="bg-transparent text-slate-300 font-bold focus:outline-none cursor-pointer hover:text-white"
                  >
                    {restaurantData.branches?.length > 0 ? (
                      restaurantData.branches.map(b => (
                        <option key={b.id} value={b.id} className="bg-slate-900 text-white">
                          {b.name} ({b.code})
                        </option>
                      ))
                    ) : (
                      <option value={1} className="bg-slate-900 text-white">Main Branch - Gulberg (MB-01)</option>
                    )}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Center: Live Digital Clock & Shift Status */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-950/70 border border-slate-800 rounded-xl">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-mono text-xs font-black text-emerald-300 tracking-wider">
                {currentTime || '10:00:00 AM'}
              </span>
            </div>

            {restaurantData.currentDayEnd ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300 font-bold">Shift Open</span>
                <span className="text-slate-400 text-[11px]">| Float: Rs. {Number(restaurantData.currentDayEnd.opening_float).toLocaleString()}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-950/50 border border-amber-800/60 text-xs text-amber-300 font-bold">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Shift Closed</span>
              </div>
            )}
          </div>

          {/* Right: Operator, Sound, Fullscreen, Refresh */}
          <div className="flex items-center gap-2">
            {/* Operator Switcher */}
            <div className="hidden lg:flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
              <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedStaffUser}
                onChange={e => setSelectedStaffUser(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer"
              >
                <option value="Cashier Counter 1 (Bilal)" className="bg-slate-900">Cashier: Bilal (C-1)</option>
                <option value="Captain Tariq (Waiter)" className="bg-slate-900">Waiter: Tariq (Order Taker)</option>
                <option value="Admin Manager (Kashif)" className="bg-slate-900">Manager: Kashif</option>
              </select>
            </div>

            {/* Sound Chime Toggle */}
            <button
              onClick={() => {
                setSoundEnabled(!soundEnabled)
                toast(soundEnabled ? 'Audio notifications muted' : 'Audio chime enabled', { icon: soundEnabled ? '🔕' : '🔔' })
              }}
              className={`p-2 rounded-xl border transition-all ${
                soundEnabled
                  ? 'bg-slate-800 text-emerald-400 border-slate-700 hover:bg-slate-700'
                  : 'bg-slate-800/50 text-slate-500 border-slate-800 hover:text-slate-300'
              }`}
              title={soundEnabled ? 'Sound notifications active' : 'Sound notifications muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Mode */}
            <button
              onClick={() => setFullscreenMode(!fullscreenMode)}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title={fullscreenMode ? 'Exit Fullscreen' : 'Enter Touch POS Fullscreen Mode'}
            >
              {fullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Refresh */}
            <button
              onClick={() => loadBootstrap(true)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              title="Sync Latest Data"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* ── CORE WORKSPACE: SIDEBAR MENU + VIEW CANVAS ── */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ══════════════════════════════════════════════════════════════════
              DEDICATED RESTAURANT ERP SIDEBAR MENU
          ══════════════════════════════════════════════════════════════════ */}
          <aside
            className={`bg-slate-900 border-r border-slate-800/90 transition-all duration-200 flex flex-col justify-between flex-shrink-0 z-30 ${
              sidebarCollapsed ? 'w-16' : 'w-64'
            }`}
          >
            {/* Search Filter Header (when expanded) */}
            {!sidebarCollapsed && (
              <div className="p-2 border-b border-slate-800/80 bg-slate-950/40">
                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={sidebarSearch}
                    onChange={e => setSidebarSearch(e.target.value)}
                    placeholder="Filter modules..."
                    className="w-full bg-slate-900/90 text-xs text-slate-200 placeholder-slate-500 pl-8 pr-7 py-1.5 rounded-xl border border-slate-700/80 focus:outline-none focus:border-emerald-500"
                  />
                  {sidebarSearch && (
                    <button
                      onClick={() => setSidebarSearch('')}
                      className="absolute right-2 text-slate-400 hover:text-slate-200 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Navigation Groups List */}
            <div className="flex-1 overflow-y-auto py-3 px-2 space-y-4 scrollbar-none">
              {filteredSections.map((sec, secIdx) => (
                <div key={secIdx}>
                  {!sidebarCollapsed && (
                    <span className="px-3 text-[10px] font-black uppercase tracking-wider text-slate-400 block mb-1.5">
                      {sec.group}
                    </span>
                  )}
                  <div className="space-y-0.5">
                    {sec.items.map(item => {
                      const Icon = item.icon
                      const isActive = activeTab === item.id
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveTab(item.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-all group relative ${
                            isActive
                              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/25 border border-emerald-500/50'
                              : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/80'
                          } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                          title={sidebarCollapsed ? item.label : undefined}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                            isActive ? 'text-white' : 'text-slate-400 group-hover:text-emerald-400'
                          }`} />

                          {!sidebarCollapsed && (
                            <span className="flex-1 text-left truncate">{item.label}</span>
                          )}

                          {/* Badge counter */}
                          {item.badge && !sidebarCollapsed && (
                            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full text-white ${
                              item.badgeColor || 'bg-slate-800 text-slate-300'
                            }`}>
                              {item.badge}
                            </span>
                          )}

                          {/* Dot indicator when collapsed */}
                          {item.badge && sidebarCollapsed && (
                            <span className={`absolute top-1.5 right-1.5 w-2 h-2 rounded-full ${
                              item.badgeColor || 'bg-emerald-400'
                            }`} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Bottom Actions */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-950/40 space-y-1">
              {!sidebarCollapsed && (
                <div className="px-2 py-1 text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="font-semibold text-slate-400">Local POS Engine</span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    ONLINE
                  </span>
                </div>
              )}
              <Link
                href="/vendor/dashboard"
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800/80 transition-all ${
                  sidebarCollapsed ? 'justify-center px-0' : ''
                }`}
                title="Exit to Vendor Dashboard"
              >
                <Store className="w-4 h-4 text-rose-400 flex-shrink-0" />
                {!sidebarCollapsed && <span>Vendor Dashboard</span>}
              </Link>
            </div>
          </aside>

          {/* ══════════════════════════════════════════════════════════════════
              MAIN INTERACTIVE VIEW CANVAS
          ══════════════════════════════════════════════════════════════════ */}
          <div className="flex-1 bg-slate-950 p-3 sm:p-4 overflow-y-auto">

            {/* ─────────────────────────────────────────────────────────────
                VIEW 1: TOUCH POS & HIGH SPEED ORDER CREATION
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'pos' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 h-[calc(100vh-80px)]">
                
                {/* Left Column: Dine-In Layout & Menu Catalog (8 Cols) */}
                <div className="lg:col-span-8 flex flex-col gap-3 h-full overflow-hidden">

                  {/* Mode Selector & Hall Tabs */}
                  <div className="bg-slate-900/90 rounded-2xl p-2.5 border border-slate-800 flex flex-wrap items-center justify-between gap-2.5 flex-shrink-0 shadow-sm">
                    {/* Order Mode Toggles */}
                    <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
                      {[
                        { id: 'dine_in', label: '🍽️ Dine-In' },
                        { id: 'takeaway', label: '🥡 Takeaway' },
                        { id: 'delivery', label: '🛵 Delivery' },
                      ].map(mode => (
                        <button
                          key={mode.id}
                          onClick={() => {
                            setOrderType(mode.id)
                            if (mode.id !== 'dine_in') setSelectedTable(null)
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            orderType === mode.id
                              ? 'bg-emerald-600 text-white shadow'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {mode.label}
                        </button>
                      ))}
                    </div>

                    {/* Dine-In Hall Tabs */}
                    {orderType === 'dine_in' && (
                      <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                        {restaurantData.halls.map(hall => (
                          <button
                            key={hall.id}
                            onClick={() => setSelectedHallId(hall.id)}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                              selectedHallId === hall.id
                                ? 'bg-slate-800 text-emerald-400 border border-emerald-500/40 shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {hall.name}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Customer Info */}
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Guest Name"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-32"
                      />
                      <input
                        type="text"
                        placeholder="Phone (Khata)"
                        value={customerPhone}
                        onChange={e => setCustomerPhone(e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-28"
                      />
                    </div>
                  </div>

                  {/* Dine-In Interactive Tables Grid (Visible when Dine-In is selected) */}
                  {orderType === 'dine_in' && (
                    <div className="bg-slate-900/60 rounded-2xl p-3 border border-slate-800/80 flex-shrink-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-bold text-slate-300 flex items-center gap-2">
                          <span>Tables Layout:</span>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Available</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500" /> Occupied</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-sky-500" /> Reserved</span>
                          </div>
                        </div>
                        {selectedTable && (
                          <div className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                            Selected: Table {selectedTable.table_number} ({selectedTable.capacity} Seats)
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-32 overflow-y-auto pr-1">
                        {currentHallTables.map(t => {
                          const isSelected = selectedTable?.id === t.id
                          const isOccupied = t.status === 'occupied'
                          const isReserved = t.status === 'reserved'
                          return (
                            <button
                              key={t.id}
                              onClick={() => handleSelectTable(t)}
                              className={`p-2 rounded-xl text-center border transition-all flex flex-col items-center justify-center ${
                                isSelected
                                  ? 'ring-2 ring-emerald-400 bg-emerald-600/30 border-emerald-400 shadow-lg'
                                  : isOccupied
                                  ? 'bg-rose-950/40 border-rose-800/60 text-rose-300 hover:bg-rose-900/50'
                                  : isReserved
                                  ? 'bg-sky-950/40 border-sky-800/60 text-sky-300 hover:bg-sky-900/50'
                                  : 'bg-slate-900 border-slate-800 text-slate-200 hover:border-emerald-500/60 hover:bg-slate-850'
                              }`}
                            >
                              <span className="text-xs font-black">{t.table_number}</span>
                              <span className="text-[10px] text-slate-400">{t.capacity} Seats</span>
                              {isOccupied && (
                                <span className="text-[9px] font-bold text-rose-400 mt-0.5">
                                  Rs. {Number(t.current_order_amount || 0).toLocaleString()}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Category Filter Pills & Fast Search */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        placeholder="Search menu items by dish name, code..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none max-w-[55%]">
                      <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          selectedCategory === 'all'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        All ({restaurantData.menuItems?.length || 0})
                      </button>
                      {restaurantData.categories.map(cat => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategory(cat.id)}
                          className={`px-3 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            selectedCategory === cat.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Menu Dishes Grid */}
                  <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2.5 pr-1">
                    {filteredMenuItems.map(dish => (
                      <button
                        key={dish.id}
                        onClick={() => handleAddToCart(dish)}
                        className="bg-slate-900/90 hover:bg-slate-850 border border-slate-800/90 hover:border-emerald-500/60 rounded-2xl p-3 text-left transition-all flex flex-col justify-between group shadow-sm hover:shadow-emerald-500/10 active:scale-[0.98]"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h4 className="font-bold text-xs text-white group-hover:text-emerald-400 transition-colors leading-tight line-clamp-2">
                              {dish.name}
                            </h4>
                          </div>
                          <p className="text-[10px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">
                            {dish.description || 'Authentic chef recipe preparation'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                          <div>
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-semibold">
                              {dish.kitchen_name || 'Kitchen'}
                            </span>
                            <span className="text-xs font-black text-emerald-400">
                              Rs. {Number(dish.price).toLocaleString()}
                            </span>
                          </div>
                          <div className="w-7 h-7 rounded-lg bg-emerald-600/20 text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors flex items-center justify-center font-bold text-sm">
                            +
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                </div>

                {/* Right Column: Interactive Order Cart & KOT Actions (4 Cols) */}
                <div className="lg:col-span-4 bg-slate-900 rounded-2xl border border-slate-800 p-3.5 flex flex-col justify-between h-full shadow-2xl">
                  
                  {/* Cart Header */}
                  <div className="border-b border-slate-800 pb-2.5 flex items-center justify-between">
                    <div>
                      <h3 className="font-black text-sm text-white flex items-center gap-2">
                        <span>Current Running Cart</span>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                          {cartItems.reduce((acc, i) => acc + i.quantity, 0)} Items
                        </span>
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {orderType === 'dine_in'
                          ? (selectedTable ? `Table: ${selectedTable.table_number}` : 'No table assigned')
                          : orderType.toUpperCase()}
                        {' • Guest: ' + (customerName || 'Walk-in')}
                      </p>
                    </div>

                    {cartItems.length > 0 && (
                      <button
                        onClick={() => setCartItems([])}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Clear
                      </button>
                    )}
                  </div>

                  {/* Cart Items List */}
                  <div className="flex-1 overflow-y-auto py-2.5 space-y-2 pr-1">
                    {cartItems.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-600">
                        <UtensilsCrossed className="w-10 h-10 mb-2 stroke-[1.5] text-slate-700" />
                        <p className="text-xs font-semibold text-slate-400">Cart is currently empty</p>
                        <p className="text-[11px] text-slate-600 mt-1">Tap any menu dish on the left to add items</p>
                      </div>
                    ) : (
                      cartItems.map(item => (
                        <div
                          key={item.id}
                          className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800 flex flex-col gap-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <span className="font-bold text-xs text-slate-100 block">{item.name}</span>
                              <span className="text-[10px] text-slate-400">
                                Rs. {item.price} × {item.quantity} = <strong className="text-emerald-400">Rs. {item.price * item.quantity}</strong>
                              </span>
                              {item.notes && (
                                <span className="text-[10px] text-amber-400 block italic">Note: {item.notes}</span>
                              )}
                            </div>

                            {/* Quantity Controls */}
                            <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                              <button
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="text-slate-300 hover:text-white p-0.5"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="text-xs font-black text-white w-4 text-center">{item.quantity}</span>
                              <button
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="text-slate-300 hover:text-white p-0.5"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>

                          {/* Cooking Instructions note toggle */}
                          <button
                            onClick={() => {
                              setModifierModalItem(item)
                              setItemNoteInput(item.notes || '')
                            }}
                            className="text-[10px] font-medium text-slate-500 hover:text-emerald-400 text-left underline"
                          >
                            {item.notes ? 'Edit Cooking Instructions' : '+ Cooking Note (e.g. Less Spicy)'}
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Calculations & Discounts */}
                  <div className="border-t border-slate-800 pt-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal</span>
                      <span>Rs. {cartSubtotal.toLocaleString()}</span>
                    </div>

                    {/* Quick Discount Presets */}
                    <div className="flex items-center justify-between text-slate-400">
                      <div className="flex items-center gap-1">
                        <span>Discount:</span>
                        {[5, 10, 15, 20].map(p => (
                          <button
                            key={p}
                            onClick={() => {
                              setDiscountType('percentage')
                              setDiscountVal(discountVal === p ? 0 : p)
                            }}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition-all ${
                              discountType === 'percentage' && discountVal === p
                                ? 'bg-emerald-600 text-white border-emerald-500'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {p}%
                          </button>
                        ))}
                      </div>
                      <span className="text-rose-400">- Rs. {discountAmount.toLocaleString()}</span>
                    </div>

                    {orderType === 'dine_in' && (
                      <div className="flex justify-between text-slate-400">
                        <span>Service Charges (5%)</span>
                        <span>Rs. {Math.round(serviceChargeAmount).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-400">
                      <span className="flex items-center gap-1">
                        <span>Sales Tax (PRA 16%)</span>
                        <span className="text-[9px] px-1 bg-emerald-950 text-emerald-400 rounded border border-emerald-800">Fiscal</span>
                      </span>
                      <span>Rs. {Math.round(taxAmount).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm font-black text-white pt-1.5 border-t border-slate-800">
                      <span>Net Total Payable</span>
                      <span className="text-base text-emerald-400 font-black">
                        Rs. {cartGrandTotal.toLocaleString()}
                      </span>
                    </div>

                    {/* Split Guest Share Preview */}
                    {cartGrandTotal > 0 && orderType === 'dine_in' && (
                      <div className="flex justify-between items-center text-[10px] text-slate-400 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
                        <div className="flex items-center gap-1">
                          <span>Split:</span>
                          {[2, 3, 4].map(g => (
                            <button
                              key={g}
                              onClick={() => setSplitGuestsCount(g)}
                              className={`px-1 rounded text-[10px] font-bold ${
                                splitGuestsCount === g ? 'bg-emerald-600 text-white' : 'text-slate-400'
                              }`}
                            >
                              {g}p
                            </button>
                          ))}
                        </div>
                        <span className="text-slate-300 font-bold">
                          Rs. {Math.ceil(cartGrandTotal / splitGuestsCount).toLocaleString()} / person
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Primary Action Buttons: Fire KOT & Cashier Checkout */}
                  <div className="grid grid-cols-2 gap-2 pt-3">
                    <button
                      onClick={handleFireKOT}
                      className="py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-600/20 transition-all"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Fire KOT</span>
                    </button>

                    <button
                      onClick={() => {
                        if (cartItems.length === 0) {
                          toast.error('Cart is empty')
                          return
                        }
                        handleFireKOT()
                      }}
                      className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.98] text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25 transition-all"
                    >
                      <Receipt className="w-4 h-4" />
                      <span>Bill & Pay</span>
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 2: KITCHEN DISPLAY SYSTEM (KDS)
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'kds' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                      <ChefHat className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm text-white">Live Kitchen Order Display (KDS)</h3>
                      <p className="text-[11px] text-slate-400">Total Active Tickets: {kdsTickets.length}</p>
                    </div>
                  </div>

                  {/* Kitchen Station Filters */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setKdsStation('all')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        kdsStation === 'all' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      All Stations
                    </button>
                    {restaurantData.kitchens.map(k => (
                      <button
                        key={k.id}
                        onClick={() => setKdsStation(k.id)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          kdsStation === k.id ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {k.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* KDS Tickets Grid */}
                {kdsTickets.length === 0 ? (
                  <div className="bg-slate-900/40 rounded-2xl p-12 text-center border border-slate-800/80 text-slate-500">
                    <ChefHat className="w-12 h-12 mx-auto mb-3 text-slate-700 stroke-[1.5]" />
                    <h3 className="font-bold text-slate-300 text-sm">All Kitchen Queues Clear!</h3>
                    <p className="text-xs text-slate-500 mt-1">No orders waiting in cooking or preparation queue.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {kdsTickets.map(ticket => {
                      const elapsed = ticket.elapsedMinutes || 0
                      const timerBadgeClass = elapsed < 10
                        ? 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60'
                        : elapsed < 20
                        ? 'bg-amber-950/80 text-amber-400 border-amber-800/60'
                        : 'bg-rose-950/90 text-rose-300 border-rose-800 animate-pulse'

                      return (
                        <div
                          key={ticket.order_id}
                          className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl flex flex-col justify-between"
                        >
                          <div className="bg-slate-950/80 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-white text-sm">#{ticket.order_number}</span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                                  {ticket.order_type}
                                </span>
                              </div>
                              <span className="text-xs text-slate-400">
                                {ticket.table_number ? `Table ${ticket.table_number}` : 'Takeaway'} • {ticket.hall_name || 'Main Hall'}
                              </span>
                            </div>

                            <div className={`px-2.5 py-1 rounded-lg border text-xs font-black flex items-center gap-1.5 ${timerBadgeClass}`}>
                              <Clock className="w-3.5 h-3.5" />
                              <span>{elapsed}m ago</span>
                            </div>
                          </div>

                          <div className="p-4 space-y-2 flex-1">
                            {ticket.items.map(it => {
                              const isDone = it.kitchen_status === 'ready' || it.kitchen_status === 'served'
                              const isCooking = it.kitchen_status === 'cooking'

                              return (
                                <div
                                  key={it.id}
                                  className={`p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                                    isDone
                                      ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300'
                                      : isCooking
                                      ? 'bg-amber-950/30 border-amber-800/40 text-amber-300'
                                      : 'bg-slate-950/60 border-slate-800 text-slate-200'
                                  }`}
                                >
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-sm text-white">{it.quantity}×</span>
                                      <span className="font-bold text-xs">{it.item_name}</span>
                                    </div>
                                    {it.notes && (
                                      <span className="text-[10px] text-amber-400 italic block mt-0.5">
                                        Note: {it.notes}
                                      </span>
                                    )}
                                    <span className="text-[9px] text-slate-500 uppercase tracking-wider">
                                      {it.kitchen_name}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => handleKdsItemStatus(it.id, it.kitchen_status)}
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                                      isDone
                                        ? 'bg-emerald-600 text-white'
                                        : isCooking
                                        ? 'bg-amber-600 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                    }`}
                                  >
                                    {it.kitchen_status}
                                  </button>
                                </div>
                              )
                            })}
                          </div>

                          <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-[11px] text-slate-400 font-medium">
                              Status: <strong className="text-white uppercase">{ticket.order_status}</strong>
                            </span>

                            <button
                              onClick={() => handleKdsTicketComplete(ticket.order_id)}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Mark Ready</span>
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 3: ACTIVE ORDERS, BILLING & CASHIER SETTLEMENT
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'orders' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center justify-between shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>Active Running Orders & Cashier Billing</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Open guest bills on dining tables or active takeaway collections.
                    </p>
                  </div>
                </div>

                {restaurantData.activeOrders?.length === 0 ? (
                  <div className="bg-slate-900/40 rounded-2xl p-12 text-center border border-slate-800/80 text-slate-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-700 stroke-[1.5]" />
                    <h4 className="font-bold text-slate-300 text-sm">No Active Orders Pending Settlement</h4>
                    <p className="text-xs text-slate-500 mt-1">Create an order via Touch POS to view bills here.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {restaurantData.activeOrders?.map(order => (
                      <div
                        key={order.id}
                        className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span className="font-black text-base text-white block">#{order.order_number}</span>
                              <span className="text-xs text-slate-400">
                                {order.table_number ? `Table ${order.table_number} (${order.hall_name})` : order.order_type.toUpperCase()}
                                {' • ' + (order.customer_name || 'Guest')}
                              </span>
                            </div>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase">
                              {order.order_status}
                            </span>
                          </div>

                          <div className="bg-slate-950/80 rounded-xl p-2.5 my-3 space-y-1 text-xs">
                            {order.items?.map(it => (
                              <div key={it.id} className="flex justify-between text-slate-300">
                                <span>{it.quantity}× {it.item_name}</span>
                                <span className="font-semibold">Rs. {it.subtotal}</span>
                              </div>
                            ))}
                          </div>

                          <div className="space-y-1 text-xs text-slate-400 border-t border-slate-800 pt-2">
                            <div className="flex justify-between">
                              <span>Subtotal</span>
                              <span>Rs. {order.subtotal}</span>
                            </div>
                            {order.discount_amount > 0 && (
                              <div className="flex justify-between text-rose-400">
                                <span>Discount</span>
                                <span>- Rs. {order.discount_amount}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span>Tax (PRA)</span>
                              <span>Rs. {Math.round(order.tax_amount)}</span>
                            </div>
                            <div className="flex justify-between font-black text-sm text-emerald-400 pt-1 border-t border-slate-800">
                              <span>Payable Amount</span>
                              <span>Rs. {Number(order.total_amount).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 pt-2">
                          <button
                            onClick={() => setReceiptModal({ open: true, order, paperWidth: '80mm' })}
                            className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-700"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Receipt</span>
                          </button>

                          <button
                            onClick={() => handleOpenSettlement(order)}
                            className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/25"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Settle & Pay</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 4: TABLE RESERVATIONS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'reservations' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center justify-between shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <CalendarDays className="w-4 h-4 text-emerald-400" />
                      <span>Guest Table Bookings & Advance Reservations</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Upcoming dining reservations, party sizes, and allocated table seating.
                    </p>
                  </div>

                  <button
                    onClick={() => setReservationModal(p => ({ ...p, open: true }))}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <Plus className="w-3.5 h-3.5" /> New Reservation
                  </button>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Guest Name</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Party Size</th>
                        <th className="px-4 py-3">Hall & Table</th>
                        <th className="px-4 py-3">Date & Time</th>
                        <th className="px-4 py-3">Special Request</th>
                        <th className="px-4 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {restaurantData.reservations?.map(res => (
                        <tr key={res.id} className="hover:bg-slate-850 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{res.customer_name}</td>
                          <td className="px-4 py-3 font-mono text-slate-400">{res.customer_phone}</td>
                          <td className="px-4 py-3 font-bold text-slate-200">{res.party_size} Guests</td>
                          <td className="px-4 py-3">
                            <span className="font-semibold text-emerald-400">{res.hall_name || 'Main Hall'}</span>
                            {res.table_number && ` (Table ${res.table_number})`}
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-300">{res.reservation_date} • {res.reservation_time}</td>
                          <td className="px-4 py-3 text-slate-400">{res.special_requests || 'Standard seating'}</td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                              {res.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 5: MENU CATALOG & FOOD COST MARGINS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'menu' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center justify-between shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <Coffee className="w-4 h-4 text-emerald-400" />
                      <span>Menu Catalog, Costing & Food Margin Analysis</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Selling price vs raw ingredient cost, profit margin %, and recipe linkage.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Dish Name</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Kitchen Station</th>
                        <th className="px-4 py-3">Cost Price (BOM)</th>
                        <th className="px-4 py-3">Selling Price</th>
                        <th className="px-4 py-3">Gross Margin (%)</th>
                        <th className="px-4 py-3">Stock Deduction</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {restaurantData.menuItems?.map(item => {
                        const cost = Number(item.cost_price || 0)
                        const price = Number(item.price || 0)
                        const marginPercent = price > 0 ? Math.round(((price - cost) / price) * 100) : 0
                        return (
                          <tr key={item.id} className="hover:bg-slate-850 transition-colors">
                            <td className="px-4 py-3 font-bold text-white">{item.name}</td>
                            <td className="px-4 py-3">{item.category_name}</td>
                            <td className="px-4 py-3 text-slate-400">{item.kitchen_name}</td>
                            <td className="px-4 py-3 text-slate-300 font-mono">Rs. {cost.toLocaleString()}</td>
                            <td className="px-4 py-3 font-black text-emerald-400 font-mono">Rs. {price.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {marginPercent}% Margin
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {item.is_stock_deducted ? (
                                <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Auto-BOM
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-500">Manual</span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 6: RECIPE BOM FORMULATIONS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'recipes' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center justify-between shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
                      <span>Recipe Bill of Materials (BOM) & Ingredient Depletion Rules</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Raw ingredients allocated per menu item for automated inventory deduction.
                    </p>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Menu Dish</th>
                        <th className="px-4 py-3">Raw Ingredient</th>
                        <th className="px-4 py-3">Quantity per Serving</th>
                        <th className="px-4 py-3">Unit</th>
                        <th className="px-4 py-3">Est. Unit Cost</th>
                        <th className="px-4 py-3">Depletion Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {restaurantData.recipes?.map(rec => (
                        <tr key={rec.id} className="hover:bg-slate-850 transition-colors">
                          <td className="px-4 py-3 font-bold text-white">{rec.menu_item_name}</td>
                          <td className="px-4 py-3 font-semibold text-emerald-400">{rec.inventory_item_name}</td>
                          <td className="px-4 py-3 font-black text-slate-200">{rec.quantity}</td>
                          <td className="px-4 py-3 text-slate-400">{rec.unit}</td>
                          <td className="px-4 py-3 font-mono">Rs. {rec.cost_per_unit || 0}</td>
                          <td className="px-4 py-3 text-slate-400">{rec.notes || 'Deducted on bill settlement'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 7: MULTI-STORE INVENTORY & TRANSFERS
            ───────────────────────────────────────────────────────────── */}
            {(activeTab === 'inventory' || activeTab === 'transfers' || activeTab === 'waste') && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-emerald-400" />
                      <span>Two-Tier Inventory & Raw Material Stores</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Main Store (Cold Room/Warehouse) ➔ Kitchen Stores. Automatic recipe stock deduction.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTransferModal(prev => ({ ...prev, open: true }))}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <ArrowRight className="w-3.5 h-3.5" /> Transfer to Kitchen
                    </button>

                    <button
                      onClick={() => setWasteModal(prev => ({ ...prev, open: true }))}
                      className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <AlertTriangle className="w-3.5 h-3.5" /> Log Spoilage / Waste
                    </button>
                  </div>
                </div>

                {/* Low Stock Warning Banner */}
                {inventoryData.lowStockItems?.length > 0 && (
                  <div className="bg-amber-950/60 border border-amber-800/80 rounded-2xl p-3.5 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                    <div className="text-xs text-amber-200">
                      <strong>Low Stock Alert: </strong>
                      {inventoryData.lowStockItems.map(i => `${i.name} (${i.main_store_stock + i.kitchen_store_stock} ${i.unit})`).join(', ')}
                    </div>
                  </div>
                )}

                {/* Inventory Items Table */}
                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-3">Code</th>
                          <th className="px-4 py-3">Raw Material / Ingredient</th>
                          <th className="px-4 py-3">Category</th>
                          <th className="px-4 py-3">Main Store (Cold Room)</th>
                          <th className="px-4 py-3">Kitchen Store</th>
                          <th className="px-4 py-3">Total Balance</th>
                          <th className="px-4 py-3">Cost / Unit</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {inventoryData.items?.map(it => {
                          const totalStock = it.main_store_stock + it.kitchen_store_stock
                          const isLow = totalStock <= it.min_stock_alert
                          return (
                            <tr key={it.id} className="hover:bg-slate-850 transition-colors">
                              <td className="px-4 py-3 font-mono font-bold text-slate-400">{it.code}</td>
                              <td className="px-4 py-3 font-bold text-white">{it.name}</td>
                              <td className="px-4 py-3">{it.category}</td>
                              <td className="px-4 py-3 font-semibold text-slate-200">
                                {it.main_store_stock} {it.unit}
                              </td>
                              <td className="px-4 py-3 font-semibold text-slate-200">
                                {it.kitchen_store_stock} {it.unit}
                              </td>
                              <td className="px-4 py-3 font-black text-emerald-400">
                                {totalStock} {it.unit}
                              </td>
                              <td className="px-4 py-3">Rs. {it.cost_per_unit}</td>
                              <td className="px-4 py-3">
                                {isLow ? (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                    Low Stock
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    Optimal
                                  </span>
                                )}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transfers & Waste Logs Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <h4 className="font-bold text-xs text-white mb-3">Recent Stock Transfers (Main ➔ Kitchen)</h4>
                    <div className="space-y-2 text-xs">
                      {inventoryData.transfers?.slice(0, 5).map(tr => (
                        <div key={tr.id} className="bg-slate-950 p-2.5 rounded-xl flex justify-between items-center border border-slate-800/80">
                          <div>
                            <span className="font-bold text-slate-200">{tr.item_name}</span>
                            <span className="text-[10px] text-slate-400 block">To: {tr.to_kitchen_name || 'Kitchen'}</span>
                          </div>
                          <span className="font-black text-emerald-400">+{tr.quantity} {tr.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <h4 className="font-bold text-xs text-white mb-3">Recent Spoilage & Waste Logs</h4>
                    <div className="space-y-2 text-xs">
                      {inventoryData.wasteLogs?.slice(0, 5).map(wl => (
                        <div key={wl.id} className="bg-slate-950 p-2.5 rounded-xl flex justify-between items-center border border-slate-800/80">
                          <div>
                            <span className="font-bold text-slate-200">{wl.item_name}</span>
                            <span className="text-[10px] text-rose-400 block">Reason: {wl.reason}</span>
                          </div>
                          <span className="font-black text-rose-400">-{wl.quantity} {wl.unit}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 8: KHATA LEDGERS (CUSTOMER & SUPPLIERS)
            ───────────────────────────────────────────────────────────── */}
            {(activeTab === 'khata' || activeTab === 'suppliers') && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-400" />
                      <span>Accounts Receivable (Customer Khata) & Payable (Suppliers)</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Credit accounts, phone lookup for POS settlement, voucher payments, and ledger statements.
                    </p>
                  </div>

                  <button
                    onClick={() => setCustPaymentModal({ open: true, customer_id: '', amount: '', notes: '' })}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                  >
                    <DollarSign className="w-3.5 h-3.5" /> Receive Customer Khata Payment
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {khataData.customers?.map(cust => (
                    <div
                      key={cust.id}
                      className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-xs text-white">{cust.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{cust.phone}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 block mb-2">{cust.address || 'Local Guest'}</span>
                      </div>

                      <div className="pt-2 border-t border-slate-800">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">Credit Limit</span>
                          <span className="text-slate-300">Rs. {Number(cust.credit_limit).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-xs font-black">
                          <span className="text-slate-300">Balance Due</span>
                          <span className={cust.current_balance > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            Rs. {Number(cust.current_balance).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                  <h4 className="font-bold text-xs text-white mb-3">Recent Customer Khata Ledger Transactions</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Customer</th>
                          <th className="px-4 py-2.5">Type</th>
                          <th className="px-4 py-2.5">Debit (Charge)</th>
                          <th className="px-4 py-2.5">Credit (Received)</th>
                          <th className="px-4 py-2.5">Balance</th>
                          <th className="px-4 py-2.5">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {khataData.customerLedgers?.map(entry => (
                          <tr key={entry.id}>
                            <td className="px-4 py-2 text-slate-400">{entry.created_at?.slice(0, 16)}</td>
                            <td className="px-4 py-2 font-bold text-white">{entry.customer_name}</td>
                            <td className="px-4 py-2 uppercase text-[10px] font-semibold">{entry.type}</td>
                            <td className="px-4 py-2 text-rose-400 font-semibold">{entry.debit > 0 ? `Rs. ${entry.debit}` : '-'}</td>
                            <td className="px-4 py-2 text-emerald-400 font-semibold">{entry.credit > 0 ? `Rs. ${entry.credit}` : '-'}</td>
                            <td className="px-4 py-2 font-black text-slate-100">Rs. {entry.running_balance}</td>
                            <td className="px-4 py-2 text-slate-400">{entry.notes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 9: DAY-END CLOSING & Z-REPORT
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'dayend' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-emerald-400" />
                      <span>Day-End Closing & Cashier Z-Report Reconciliation</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Opening float, drawer cash count, automated variance (Shortage/Overage) calculation, fiscal lock.
                    </p>
                  </div>

                  {dayEndData.current ? (
                    <button
                      onClick={() => setDayEndModal({ open: true, action: 'close', openingFloat: 15000, actualCashCounted: '', closingNotes: '' })}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/25"
                    >
                      <CalendarCheck className="w-4 h-4" /> Close Register & Lock Z-Report
                    </button>
                  ) : (
                    <button
                      onClick={() => setDayEndModal({ open: true, action: 'open', openingFloat: 15000, actualCashCounted: '', closingNotes: '' })}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow"
                    >
                      <DollarSign className="w-4 h-4" /> Open New Business Register
                    </button>
                  )}
                </div>

                {dayEndData.current && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block">Opening Float</span>
                      <span className="text-lg font-black text-white">Rs. {Number(dayEndData.current.opening_float).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block">Total Cash Sales</span>
                      <span className="text-lg font-black text-emerald-400">Rs. {Number(dayEndData.current.cash_sales).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block">Card & Digital Sales</span>
                      <span className="text-lg font-black text-sky-400">Rs. {Number(dayEndData.current.card_sales).toLocaleString()}</span>
                    </div>
                    <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                      <span className="text-[11px] text-slate-400 font-semibold block">Expected Cash in Drawer</span>
                      <span className="text-lg font-black text-amber-400">Rs. {Number(dayEndData.current.expected_cash_in_drawer).toLocaleString()}</span>
                    </div>
                  </div>
                )}

                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                  <h4 className="font-bold text-xs text-white mb-3">Historical Closed Z-Reports (Audited Sessions)</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black border-b border-slate-800">
                        <tr>
                          <th className="px-4 py-2.5">Date</th>
                          <th className="px-4 py-2.5">Opened / Closed</th>
                          <th className="px-4 py-2.5">Gross Sales</th>
                          <th className="px-4 py-2.5">Expected Cash</th>
                          <th className="px-4 py-2.5">Actual Counted</th>
                          <th className="px-4 py-2.5">Variance</th>
                          <th className="px-4 py-2.5">PRA Tax Collected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800">
                        {dayEndData.closedHistory?.map(row => (
                          <tr key={row.id}>
                            <td className="px-4 py-2.5 font-bold text-white">{row.business_date}</td>
                            <td className="px-4 py-2.5 text-slate-400">{row.opening_time?.slice(11, 16)} ➔ {row.closed_at?.slice(11, 16)}</td>
                            <td className="px-4 py-2.5 text-slate-100 font-bold">Rs. {Number(row.gross_sales).toLocaleString()}</td>
                            <td className="px-4 py-2.5">Rs. {Number(row.expected_cash_in_drawer).toLocaleString()}</td>
                            <td className="px-4 py-2.5 font-bold text-slate-200">Rs. {Number(row.actual_cash_counted).toLocaleString()}</td>
                            <td className="px-4 py-2.5 font-black">
                              {row.cash_difference < 0 ? (
                                <span className="text-rose-400">Short: Rs. {row.cash_difference}</span>
                              ) : row.cash_difference > 0 ? (
                                <span className="text-emerald-400">Over: +Rs. {row.cash_difference}</span>
                              ) : (
                                <span className="text-slate-400">Matched (0)</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 text-emerald-400 font-mono">Rs. {row.total_tax_collected}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 10: EXECUTIVE BI ANALYTICS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'reports' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 flex items-center justify-between shadow-md">
                  <div>
                    <h3 className="font-black text-sm text-white flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span>Executive Analytics & Sales Velocity</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Real-time revenue metrics, top selling dishes, and category performance breakdown.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block">Today's Revenue</span>
                    <span className="text-lg font-black text-emerald-400">
                      Rs. {Number(reportsData.todaySales?.total_revenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block">Today's Orders</span>
                    <span className="text-lg font-black text-white">
                      {reportsData.todaySales?.total_orders || 0}
                    </span>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block">PRA Tax Invoiced</span>
                    <span className="text-lg font-black text-sky-400">
                      Rs. {Number(reportsData.todaySales?.total_tax || 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <span className="text-[11px] text-slate-400 font-semibold block">Discounts Given</span>
                    <span className="text-lg font-black text-rose-400">
                      Rs. {Number(reportsData.todaySales?.total_discount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <h4 className="font-bold text-xs text-white mb-3">Top Selling Dishes (Sales Velocity)</h4>
                    <div className="space-y-2">
                      {reportsData.topDishes?.map((dish, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-800">
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 flex items-center justify-center font-black text-[10px]">
                              {i + 1}
                            </span>
                            <span className="font-bold text-slate-200">{dish.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-black text-emerald-400 block">Rs. {Number(dish.total_sales).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400">{dish.total_qty} Sold</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800">
                    <h4 className="font-bold text-xs text-white mb-3">Category Revenue Breakdown</h4>
                    <div className="space-y-2">
                      {reportsData.categorySales?.map((cat, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-xl flex items-center justify-between text-xs border border-slate-800">
                          <span className="font-bold text-slate-200">{cat.name}</span>
                          <span className="font-black text-emerald-400">Rs. {Number(cat.sales).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* ─────────────────────────────────────────────────────────────
                VIEW 11: HARDWARE & PRA FISCAL SETTINGS
            ───────────────────────────────────────────────────────────── */}
            {activeTab === 'hardware' && (
              <div className="flex flex-col gap-4">
                <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 shadow-md">
                  <h3 className="font-black text-sm text-white flex items-center gap-2 mb-1">
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Hardware Configuration & Fiscal Revenue Authority</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Manage direct ESC/POS thermal printers (Cashier Counter & Kitchen KOT stations) and Punjab Revenue Authority (PRA) fiscal integration.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Thermal ESC/POS Printers */}
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <span>Configured Network & USB Thermal Printers</span>
                    </h4>
                    <div className="space-y-2 text-xs">
                      {restaurantData.printers?.map(p => (
                        <div key={p.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {p.connection_type?.toUpperCase()} • {p.ip_address}:{p.port} ({p.paper_width})
                            </span>
                          </div>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-black uppercase">
                            {p.type}
                          </span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => toast.success('Sent test pulse to 192.168.1.200:9100')}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-xs text-white font-bold rounded-xl border border-slate-700"
                    >
                      Send Thermal ESC/POS Test Pulse
                    </button>
                  </div>

                  {/* Punjab Revenue Authority (PRA) */}
                  <div className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                      <QrCode className="w-4 h-4 text-emerald-400" />
                      <span>Punjab Revenue Authority (PRA) Fiscal Invoicing</span>
                    </h4>
                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fiscal Status:</span>
                        <span className="text-emerald-400 font-bold">Active & Certified</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">PRA POS Identifier:</span>
                        <span className="font-mono text-white">{restaurantData.settings?.pra_pos_id || 'PRA-POS-7821'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">STRN / NTN Registration:</span>
                        <span className="font-mono text-white">{restaurantData.settings?.tax_registration_no || 'STRN-7239102-4'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Environment:</span>
                        <span className="uppercase text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {restaurantData.settings?.pra_environment || 'Sandbox Certified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 1: CASHIER BILL SETTLEMENT MODAL
        ══════════════════════════════════════════════════════════════════ */}
        {settlementModal.open && settlementModal.order && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg p-6 shadow-2xl text-slate-100 flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <div>
                  <h3 className="font-black text-base text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-400" />
                    <span>Bill Settlement & Checkout</span>
                  </h3>
                  <span className="text-xs text-slate-400">
                    Order #{settlementModal.order.order_number}
                    {settlementModal.order.table_number && ` • Table ${settlementModal.order.table_number}`}
                  </span>
                </div>
                <button
                  onClick={() => setSettlementModal(p => ({ ...p, open: false }))}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Total Payable Display */}
              <div className="bg-slate-950 rounded-2xl p-4 text-center border border-slate-800">
                <span className="text-xs text-slate-400 font-semibold block uppercase tracking-wider">Net Amount Payable</span>
                <span className="text-3xl font-black text-emerald-400">
                  Rs. {Number(settlementModal.order.total_amount).toLocaleString()}
                </span>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="text-xs font-bold text-slate-300 mb-1.5 block">Select Tender Method:</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'cash', label: '💵 Cash' },
                    { id: 'card', label: '💳 Card' },
                    { id: 'split', label: '✂️ Split' },
                    { id: 'credit_khata', label: '📖 Khata' },
                  ].map(m => (
                    <button
                      key={m.id}
                      onClick={() => setSettlementModal(p => ({ ...p, paymentMethod: m.id }))}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        settlementModal.paymentMethod === m.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30'
                          : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cash Tender & Change Return */}
              {settlementModal.paymentMethod === 'cash' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-300 block mb-1">Cash Tendered by Guest (Rs.):</label>
                    <input
                      type="number"
                      value={settlementModal.tenderedAmount}
                      onChange={e => setSettlementModal(p => ({ ...p, tenderedAmount: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-lg font-black text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Quick Cash Buttons */}
                  <div className="flex gap-1.5">
                    {[500, 1000, 2000, 5000].map(val => (
                      <button
                        key={val}
                        onClick={() => setSettlementModal(p => ({ ...p, tenderedAmount: String(val) }))}
                        className="flex-1 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-300"
                      >
                        Rs. {val}
                      </button>
                    ))}
                    <button
                      onClick={() => setSettlementModal(p => ({ ...p, tenderedAmount: String(settlementModal.order.total_amount) }))}
                      className="flex-1 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-lg text-xs font-bold"
                    >
                      Exact
                    </button>
                  </div>

                  {/* Change Return display */}
                  <div className="bg-slate-950 p-3 rounded-xl flex justify-between items-center text-xs border border-slate-800">
                    <span className="text-slate-400 font-semibold">Change to Return:</span>
                    <span className="text-base font-black text-emerald-400">
                      Rs. {Math.max(0, (Number(settlementModal.tenderedAmount) || 0) - settlementModal.order.total_amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Customer Khata Selector */}
              {settlementModal.paymentMethod === 'credit_khata' && (
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Select Customer Khata Account:</label>
                  <select
                    value={settlementModal.selectedCustomerId}
                    onChange={e => setSettlementModal(p => ({ ...p, selectedCustomerId: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Choose Account --</option>
                    {restaurantData.customers?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.phone}) - Bal: Rs. {c.current_balance} / Limit: Rs. {c.credit_limit}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Split Tender inputs */}
              {settlementModal.paymentMethod === 'split' && (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Cash Part (Rs.):</label>
                    <input
                      type="number"
                      value={settlementModal.splitCash}
                      onChange={e => setSettlementModal(p => ({ ...p, splitCash: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Card Part (Rs.):</label>
                    <input
                      type="number"
                      value={settlementModal.splitCard}
                      onChange={e => setSettlementModal(p => ({ ...p, splitCard: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleConfirmSettlement}
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/30"
                >
                  <CheckCircle2 className="w-5 h-5" /> Complete Payment & Release Table
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 2: THERMAL ESC/POS RECEIPT PREVIEW MODAL (80mm & 58mm)
        ══════════════════════════════════════════════════════════════════ */}
        {receiptModal.open && receiptModal.order && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl flex flex-col gap-4 font-mono text-xs max-h-[90vh] overflow-y-auto">
              
              <div className="flex justify-between items-center border-b border-dashed border-slate-300 pb-2">
                <div className="flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-slate-700 uppercase">Thermal ESC/POS Preview</span>
                </div>
                <button
                  onClick={() => setReceiptModal({ open: false, order: null, paperWidth: '80mm' })}
                  className="text-slate-500 hover:text-slate-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Printable Layout */}
              <div id="thermal-receipt" className="text-center space-y-1">
                <h2 className="font-black text-base uppercase tracking-tight">
                  {restaurantData.settings?.restaurant_name || 'RAPID FOOD & GRILL'}
                </h2>
                <p className="text-[10px] text-slate-600">{restaurantData.settings?.tagline || 'Chai, Karahi & BBQ'}</p>
                <p className="text-[10px] text-slate-600">{restaurantData.settings?.address}</p>
                <p className="text-[10px] text-slate-600">Ph: {restaurantData.settings?.phone}</p>
                <p className="text-[10px] font-bold text-slate-700">NTN / STRN: {restaurantData.settings?.tax_registration_no}</p>
                
                <div className="border-t border-b border-dashed border-slate-400 py-1.5 my-2 text-left space-y-0.5 text-[10px]">
                  <div className="flex justify-between">
                    <span>Invoice #: <strong>{receiptModal.order.order_number}</strong></span>
                    <span>{receiptModal.order.created_at?.slice(0, 10)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type: {receiptModal.order.order_type?.toUpperCase()}</span>
                    <span>Table: {receiptModal.order.table_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Guest: {receiptModal.order.customer_name || 'Walk-in'}</span>
                    <span>Cashier: Bilal (C-1)</span>
                  </div>
                </div>

                <table className="w-full text-left my-2 text-[10px]">
                  <thead>
                    <tr className="border-b border-dashed border-slate-400">
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-dashed divide-slate-200">
                    {receiptModal.order.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1">{it.item_name}</td>
                        <td className="py-1 text-center">{it.quantity}</td>
                        <td className="py-1 text-right">{it.price}</td>
                        <td className="py-1 text-right font-bold">{it.subtotal}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t border-dashed border-slate-400 pt-1.5 space-y-0.5 text-right text-[10px]">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rs. {receiptModal.order.subtotal}</span>
                  </div>
                  {receiptModal.order.discount_amount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span>- Rs. {receiptModal.order.discount_amount}</span>
                    </div>
                  )}
                  {receiptModal.order.service_charge_amount > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charges:</span>
                      <span>Rs. {receiptModal.order.service_charge_amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>PRA Sales Tax (16%):</span>
                    <span>Rs. {Math.round(receiptModal.order.tax_amount)}</span>
                  </div>
                  <div className="flex justify-between font-black text-xs pt-1 border-t border-dashed border-slate-400">
                    <span>GRAND TOTAL:</span>
                    <span>Rs. {Number(receiptModal.order.total_amount).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 pt-0.5">
                    <span>Tendered ({receiptModal.order.payment_method?.toUpperCase()}):</span>
                    <span>Rs. {receiptModal.order.tendered_amount || receiptModal.order.total_amount}</span>
                  </div>
                  {receiptModal.order.change_amount > 0 && (
                    <div className="flex justify-between text-[10px] text-slate-600">
                      <span>Change:</span>
                      <span>Rs. {receiptModal.order.change_amount}</span>
                    </div>
                  )}
                </div>

                <div className="border border-dashed border-slate-400 rounded-xl p-2.5 my-2 flex flex-col items-center justify-center bg-slate-50">
                  <div className="w-20 h-20 bg-slate-900 rounded-lg p-1 flex items-center justify-center text-white text-[8px] font-mono text-center">
                    [PRA FISCAL QR]
                  </div>
                  <span className="text-[8px] font-mono mt-1 text-slate-600">
                    PRA Inv: {receiptModal.order.pra_invoice_number || 'PRA-2026-901238'}
                  </span>
                </div>

                <p className="text-[9px] text-slate-600 pt-1">
                  {restaurantData.settings?.invoice_footer || 'Thank you for dining with us!'}
                </p>
              </div>

              <button
                onClick={handleTriggerPrint}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
              >
                <Printer className="w-4 h-4" /> Print Thermal ESC/POS Bill
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 3: INVENTORY STOCK TRANSFER MODAL
        ══════════════════════════════════════════════════════════════════ */}
        {transferModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-400" />
                  <span>Transfer Stock to Kitchen Station</span>
                </h3>
                <button onClick={() => setTransferModal(p => ({ ...p, open: false }))} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Select Raw Material:</label>
                  <select
                    value={transferModal.inventory_item_id}
                    onChange={e => setTransferModal(p => ({ ...p, inventory_item_id: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">-- Choose Item --</option>
                    {inventoryData.items?.map(it => (
                      <option key={it.id} value={it.id}>
                        {it.name} (Main Store Avail: {it.main_store_stock} {it.unit})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Destination Kitchen Station:</label>
                  <select
                    value={transferModal.to_kitchen_id}
                    onChange={e => setTransferModal(p => ({ ...p, to_kitchen_id: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">-- Choose Kitchen --</option>
                    {restaurantData.kitchens?.map(k => (
                      <option key={k.id} value={k.id}>{k.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Transfer Quantity:</label>
                  <input
                    type="number"
                    value={transferModal.quantity}
                    onChange={e => setTransferModal(p => ({ ...p, quantity: e.target.value }))}
                    placeholder="e.g. 5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirmTransfer}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Confirm Stock Dispatch
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 4: SPOILAGE / WASTE LOG MODAL
        ══════════════════════════════════════════════════════════════════ */}
        {wasteModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Register Spoilage / Burnt Food Waste</span>
                </h3>
                <button onClick={() => setWasteModal(p => ({ ...p, open: false }))} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Select Item:</label>
                  <select
                    value={wasteModal.inventory_item_id}
                    onChange={e => setWasteModal(p => ({ ...p, inventory_item_id: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">-- Choose Item --</option>
                    {inventoryData.items?.map(it => (
                      <option key={it.id} value={it.id}>{it.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Waste Qty:</label>
                    <input
                      type="number"
                      value={wasteModal.quantity}
                      onChange={e => setWasteModal(p => ({ ...p, quantity: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Reason:</label>
                    <select
                      value={wasteModal.reason}
                      onChange={e => setWasteModal(p => ({ ...p, reason: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                    >
                      <option value="spoilage">Spoilage / Expired</option>
                      <option value="burnt">Burnt in Cooking</option>
                      <option value="spill">Spilled / Dropped</option>
                    </select>
                  </div>
                </div>
              </div>

              <button
                onClick={handleConfirmWaste}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                Log Waste & Deplete Stock
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 5: CUSTOMER KHATA PAYMENT RECEIPT MODAL
        ══════════════════════════════════════════════════════════════════ */}
        {custPaymentModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span>Receive Customer Khata Payment</span>
                </h3>
                <button onClick={() => setCustPaymentModal(p => ({ ...p, open: false }))} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Customer Account:</label>
                  <select
                    value={custPaymentModal.customer_id}
                    onChange={e => setCustPaymentModal(p => ({ ...p, customer_id: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  >
                    <option value="">-- Choose Customer --</option>
                    {khataData.customers?.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} (Due: Rs. {c.current_balance})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Payment Amount Received (Rs.):</label>
                  <input
                    type="number"
                    value={custPaymentModal.amount}
                    onChange={e => setCustPaymentModal(p => ({ ...p, amount: e.target.value }))}
                    placeholder="e.g. 5000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>
              </div>

              <button
                onClick={handleConfirmCustPayment}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Record Cash Received
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 6: DAY-END OPEN / CLOSE REGISTER MODAL
        ══════════════════════════════════════════════════════════════════ */}
        {dayEndModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-emerald-400" />
                  <span>{dayEndModal.action === 'open' ? 'Open New Register Session' : 'Close Day-End & Reconcile Z-Report'}</span>
                </h3>
                <button onClick={() => setDayEndModal(p => ({ ...p, open: false }))} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {dayEndModal.action === 'open' ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Opening Cash Float in Drawer (Rs.):</label>
                    <input
                      type="number"
                      value={dayEndModal.openingFloat}
                      onChange={e => setDayEndModal(p => ({ ...p, openingFloat: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold text-base"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    This float is placed in the drawer to provide change for morning transactions.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">System Expected Cash:</span>
                    <span className="text-xl font-black text-amber-400">
                      Rs. {Number(dayEndData.current?.expected_cash_in_drawer || 0).toLocaleString()}
                    </span>
                  </div>

                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Physical Cash Counted in Drawer (Rs.):</label>
                    <input
                      type="number"
                      value={dayEndModal.actualCashCounted}
                      onChange={e => setDayEndModal(p => ({ ...p, actualCashCounted: e.target.value }))}
                      placeholder="Count physical banknotes and enter total"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-black text-lg focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {dayEndModal.actualCashCounted && (
                    <div className="bg-slate-950 p-2.5 rounded-xl flex justify-between items-center text-xs border border-slate-800">
                      <span className="text-slate-400 font-semibold">Variance:</span>
                      <span className="font-black text-sm">
                        {Number(dayEndModal.actualCashCounted) - Number(dayEndData.current?.expected_cash_in_drawer || 0) < 0 ? (
                          <span className="text-rose-400">
                            Shortage: Rs. {Number(dayEndModal.actualCashCounted) - Number(dayEndData.current?.expected_cash_in_drawer || 0)}
                          </span>
                        ) : Number(dayEndModal.actualCashCounted) - Number(dayEndData.current?.expected_cash_in_drawer || 0) > 0 ? (
                          <span className="text-emerald-400">
                            Overage: +Rs. {Number(dayEndModal.actualCashCounted) - Number(dayEndData.current?.expected_cash_in_drawer || 0)}
                          </span>
                        ) : (
                          <span className="text-emerald-400">Perfect Match (0)</span>
                        )}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <button
                onClick={handleConfirmDayEnd}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-black text-xs shadow-lg"
              >
                {dayEndModal.action === 'open' ? 'Open Register' : 'Lock Register & Generate Immutable Z-Report'}
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 7: ITEM COOKING NOTE POPUP
        ══════════════════════════════════════════════════════════════════ */}
        {modifierModalItem && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-sm p-5 shadow-2xl text-slate-100 flex flex-col gap-3">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h4 className="font-bold text-xs text-white">Kitchen Cooking Note for {modifierModalItem.name}</h4>
                <button onClick={() => setModifierModalItem(null)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <textarea
                value={itemNoteInput}
                onChange={e => setItemNoteInput(e.target.value)}
                placeholder="e.g. Mild spicy, no onions, extra crispy garlic naan"
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
              />

              <div className="flex gap-1.5 flex-wrap">
                {['Less Spicy', 'Extra Spicy', 'No Onions', 'Extra Mayo', 'Crispy Tandoor', 'Sugar Free'].map(tag => (
                  <button
                    key={tag}
                    onClick={() => setItemNoteInput(prev => prev ? `${prev}, ${tag}` : tag)}
                    className="px-2 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 font-semibold"
                  >
                    +{tag}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  setCartItems(prev => prev.map(i => i.id === modifierModalItem.id ? { ...i, notes: itemNoteInput } : i))
                  setModifierModalItem(null)
                }}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold"
              >
                Save Cooking Note
              </button>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            MODAL 8: NEW TABLE RESERVATION MODAL
        ══════════════════════════════════════════════════════════════════ */}
        {reservationModal.open && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-6 shadow-2xl text-slate-100 flex flex-col gap-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                <h3 className="font-black text-sm text-white flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-emerald-400" />
                  <span>Book New Dining Table Reservation</span>
                </h3>
                <button onClick={() => setReservationModal(p => ({ ...p, open: false }))} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-slate-300 block mb-1">Guest Full Name:</label>
                  <input
                    type="text"
                    value={reservationModal.customer_name}
                    onChange={e => setReservationModal(p => ({ ...p, customer_name: e.target.value }))}
                    placeholder="e.g. Dr. Salman Hashmi"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Guest Phone:</label>
                    <input
                      type="text"
                      value={reservationModal.customer_phone}
                      onChange={e => setReservationModal(p => ({ ...p, customer_phone: e.target.value }))}
                      placeholder="03001234567"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Party Size:</label>
                    <input
                      type="number"
                      value={reservationModal.party_size}
                      onChange={e => setReservationModal(p => ({ ...p, party_size: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Reservation Date:</label>
                    <input
                      type="date"
                      value={reservationModal.reservation_date}
                      onChange={e => setReservationModal(p => ({ ...p, reservation_date: e.target.value }))}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-300 block mb-1">Reservation Time:</label>
                    <input
                      type="text"
                      value={reservationModal.reservation_time}
                      onChange={e => setReservationModal(p => ({ ...p, reservation_time: e.target.value }))}
                      placeholder="08:30 PM"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-bold text-slate-300 block mb-1">Special Request / Occasion:</label>
                  <input
                    type="text"
                    value={reservationModal.special_requests}
                    onChange={e => setReservationModal(p => ({ ...p, special_requests: e.target.value }))}
                    placeholder="e.g. Quiet corner table, anniversary celebration"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <button
                onClick={() => {
                  if (!reservationModal.customer_name || !reservationModal.customer_phone) {
                    toast.error('Please enter customer name and phone')
                    return
                  }
                  toast.success(`Reservation confirmed for ${reservationModal.customer_name}!`)
                  setReservationModal({ open: false, customer_name: '', customer_phone: '', party_size: 4, hall_id: 1, table_id: '', reservation_date: new Date().toISOString().slice(0, 10), reservation_time: '08:00 PM', special_requests: '' })
                }}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                Confirm Booking
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}

export default function RestaurantManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-bold text-sm">
          Loading Restaurant Management ERP…
        </div>
      }
    >
      <RestaurantManagementContent />
    </Suspense>
  )
}
