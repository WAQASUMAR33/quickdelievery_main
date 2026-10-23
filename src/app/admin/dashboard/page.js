'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CustomerManagement from '@/components/admin/CustomerManagement'
import ProductManagement from '@/components/admin/ProductManagement'
import OrderManagement from '@/components/admin/OrderManagement'
import AdminAnalyticsCharts from '@/components/admin/AdminAnalyticsCharts'

import Box              from '@mui/material/Box'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import List             from '@mui/material/List'
import ListItem         from '@mui/material/ListItem'
import ListItemText     from '@mui/material/ListItemText'
import Tab              from '@mui/material/Tab'
import Tabs             from '@mui/material/Tabs'
import Typography       from '@mui/material/Typography'

import ActivityOutlinedIcon       from '@mui/icons-material/FiberManualRecordOutlined'
import BarChartOutlinedIcon       from '@mui/icons-material/BarChartOutlined'
import CheckCircleOutlinedIcon    from '@mui/icons-material/CheckCircleOutlined'
import Inventory2OutlinedIcon     from '@mui/icons-material/Inventory2Outlined'
import PendingActionsOutlinedIcon from '@mui/icons-material/PendingActionsOutlined'
import PeopleOutlinedIcon         from '@mui/icons-material/PeopleOutlined'
import SettingsOutlinedIcon       from '@mui/icons-material/SettingsOutlined'
import ShoppingCartOutlinedIcon   from '@mui/icons-material/ShoppingCartOutlined'
import StoreOutlinedIcon          from '@mui/icons-material/StoreOutlined'
import VerifiedOutlinedIcon       from '@mui/icons-material/VerifiedOutlined'

import { useRealtimeEvent } from '@/contexts/RealtimeContext'

const BRAND = '#39772A'

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab]       = useState(0)
  const [dashboardStats, setStats]      = useState({})

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login?redirect=/admin/dashboard')
        return
      }
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) {
        const role = getUserRole(userData)
        if (role === 'CUSTOMER')    router.push('/customer')
        else if (role === 'VENDOR') router.push('/vendor/dashboard')
        else if (role === 'DRIVER') router.push('/driver/dashboard')
        else                        router.push(access.redirectTo || '/login')
      }
    }
  }, [user, userData, loading, router])

  const fetchStats = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      const headers = token ? { 'Authorization': `Bearer ${token}` } : {}
      const [customersRes, productsRes] = await Promise.all([
        fetch('/api/users', { headers }),
        fetch('/api/products?type=products', { headers }),
      ])
      const [customersData, productsData] = await Promise.all([
        customersRes.json(),
        productsRes.json(),
      ])
      const usersList = Array.isArray(customersData?.data) ? customersData.data : []
      const productsList = Array.isArray(productsData?.data) ? productsData.data : []

      setStats({
        totalUsers:       usersList.length,
        totalCustomers:   usersList.filter(u => u.role === 'CUSTOMER').length,
        totalVendors:     usersList.filter(u => u.role === 'VENDOR').length,
        verifiedUsers:    usersList.filter(u => u.emailVerification).length,
        totalProducts:    productsList.length,
        approvedProducts: productsList.filter(p => p.approvalStatus === 'Approved').length,
        pendingProducts:  productsList.filter(p => p.approvalStatus === 'Pending').length,
        activeProducts:   productsList.filter(p => p.status).length,
      })
    } catch (e) { console.error('Error fetching admin stats:', e) }
  }

  useEffect(() => {
    if (user && (userData?.role === 'ADMIN' || userData?.role === 'SUPER_ADMIN')) {
      fetchStats()
    }
  }, [user, userData])

  // Live Auto-Update: when any order, product, or account is created or updated
  useRealtimeEvent(['ORDER_CREATED', 'ORDER_UPDATED', 'PRODUCT_UPDATED'], () => {
    fetchStats()
  })

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading Admin Dashboard…</Typography>
      </Box>
    )
  }

  const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
  if (!user || !access.hasAccess) {
    return null
  }



  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.3px' }}>
            System Executive Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Welcome back, {userData?.username || 'System Admin'}! Here is your marketplace operational overview and real-time trends.
          </Typography>
        </Box>

        {/* Live Graphs, Charts, and Multi-Vendor Analytics */}
        <AdminAnalyticsCharts />

      </Box>
    </DashboardLayout>
  )
}
