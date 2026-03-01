'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import CustomerManagement from '@/components/admin/CustomerManagement'
import ProductManagement from '@/components/admin/ProductManagement'
import OrderManagement from '@/components/admin/OrderManagement'

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

const BRAND = '#D70F64'

export default function AdminDashboard() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab]       = useState(0)
  const [dashboardStats, setStats]      = useState({})

  useEffect(() => {
    if (!loading && user) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) {
        const role = getUserRole(userData)
        if (role === 'CUSTOMER')    router.push('/customer')
        else if (role === 'VENDOR') router.push('/vendor-dashboard')
        else                        router.push(access.redirectTo)
      }
    }
  }, [user, userData, loading, router])

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [customersRes, productsRes] = await Promise.all([
          fetch('/api/users?limit=1'),
          fetch('/api/products?type=products&limit=1'),
        ])
        const [customersData, productsData] = await Promise.all([
          customersRes.json(),
          productsRes.json(),
        ])
        if (customersData.success && productsData.success) {
          setStats({
            totalUsers:       customersData.data?.length || 0,
            totalCustomers:   customersData.data?.filter(u => u.role === 'CUSTOMER').length || 0,
            totalVendors:     customersData.data?.filter(u => u.role === 'VENDOR').length || 0,
            verifiedUsers:    customersData.data?.filter(u => u.emailVerification).length || 0,
            totalProducts:    productsData.data?.length || 0,
            approvedProducts: productsData.data?.filter(p => p.approvalStatus === 'Approved').length || 0,
            pendingProducts:  productsData.data?.filter(p => p.approvalStatus === 'Pending').length || 0,
            activeProducts:   productsData.data?.filter(p => p.status).length || 0,
          })
        }
      } catch (e) { console.error(e) }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={36} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading Admin Dashboard…</Typography>
      </Box>
    )
  }

  const TABS = [
    { label: 'Overview',  icon: <BarChartOutlinedIcon sx={{ fontSize: 18 }} /> },
    { label: 'Customers', icon: <PeopleOutlinedIcon sx={{ fontSize: 18 }} /> },
    { label: 'Products',  icon: <Inventory2OutlinedIcon sx={{ fontSize: 18 }} /> },
    { label: 'Orders',    icon: <ShoppingCartOutlinedIcon sx={{ fontSize: 18 }} /> },
    { label: 'Settings',  icon: <SettingsOutlinedIcon sx={{ fontSize: 18 }} /> },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 0: return <OverviewTab stats={dashboardStats} username={userData?.username} />
      case 1: return <CustomerManagement />
      case 2: return <ProductManagement />
      case 3: return <OrderManagement />
      case 4: return <SettingsTab router={router} />
      default: return null
    }
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>

        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={700}>Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Welcome back, {userData?.username || 'Admin'}!
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minHeight: 44, fontSize: 13, borderRadius: 0 },
              '& .Mui-selected': { color: BRAND },
              '& .MuiTabs-indicator': { bgcolor: BRAND },
            }}
          >
            {TABS.map(({ label, icon }) => (
              <Tab key={label} label={label} icon={icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>

        {renderContent()}

      </Box>
    </DashboardLayout>
  )
}

/* ── Overview Tab ── */
function OverviewTab({ stats, username }) {
  const STAT_CARDS = [
    { label: 'Total Users',      value: stats.totalUsers      || 0, color: '#3b82f6', icon: <PeopleOutlinedIcon /> },
    { label: 'Total Products',   value: stats.totalProducts   || 0, color: '#10b981', icon: <Inventory2OutlinedIcon /> },
    { label: 'Active Products',  value: stats.activeProducts  || 0, color: '#8b5cf6', icon: <VerifiedOutlinedIcon /> },
    { label: 'Pending Approval', value: stats.pendingProducts || 0, color: '#f59e0b', icon: <PendingActionsOutlinedIcon /> },
  ]

  const ACTIVITY = [
    { action: 'New product submitted',  user: 'TechStore Pro',         time: '2h ago',  color: BRAND },
    { action: 'Customer registered',    user: 'john.doe@email.com',    time: '4h ago',  color: '#3b82f6' },
    { action: 'Product approved',       user: 'Wireless Headphones',   time: '6h ago',  color: '#10b981' },
    { action: 'Vendor verified',        user: 'Electronics Hub',       time: '8h ago',  color: '#8b5cf6' },
  ]

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Stats */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5 }}>
        {STAT_CARDS.map(({ label, value, color, icon }) => (
          <Card key={label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                    {label}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5 }}>{value}</Typography>
                </Box>
                <Box sx={{ p: 1.25, bgcolor: `${color}18`, color, borderRadius: 1, display: 'flex' }}>
                  {icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Recent Activity */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="subtitle1" fontWeight={700}>Recent Activity</Typography>
        </Box>
        <List disablePadding>
          {ACTIVITY.map((item, i) => (
            <Box key={i}>
              <ListItem sx={{ px: 2.5, py: 1.5 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color, mr: 2, flexShrink: 0 }} />
                <ListItemText
                  primary={<Typography variant="body2" fontWeight={500}>{item.action}</Typography>}
                  secondary={<Typography variant="caption" color="text.secondary">{item.user}</Typography>}
                />
                <Chip label={item.time} size="small" variant="outlined"
                  sx={{ borderRadius: 0, fontSize: 10, height: 20, ml: 1 }} />
              </ListItem>
              {i < ACTIVITY.length - 1 && <Divider />}
            </Box>
          ))}
        </List>
      </Card>

    </Box>
  )
}

/* ── Settings Tab ── */
function SettingsTab({ router }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
      <CardContent sx={{ p: 3, textAlign: 'center' }}>
        <SettingsOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
        <Typography variant="h6" fontWeight={600} color="text.secondary">Settings</Typography>
        <Typography variant="body2" color="text.disabled" mt={0.5}>
          Manage your account from the Settings page
        </Typography>
        <Box mt={2}>
          <Chip
            label="Go to Settings →"
            onClick={() => router.push('/dashboard/settings')}
            clickable
            sx={{ bgcolor: BRAND, color: 'white', fontWeight: 600, borderRadius: 0, '&:hover': { bgcolor: '#b00d52' } }}
          />
        </Box>
      </CardContent>
    </Card>
  )
}
