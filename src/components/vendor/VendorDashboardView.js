'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import VendorProductManagement from '@/components/VendorProductManagement'
import VendorBusinessProfile from '@/components/vendor/VendorBusinessProfile'
import VendorAnalytics from '@/components/vendor/VendorAnalytics'
import FoodDealsManagement from '@/components/admin/FoodDealsManagement'

import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Stack from '@mui/material/Stack'

import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import StoreMallDirectoryOutlinedIcon from '@mui/icons-material/StoreMallDirectoryOutlined'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline'

const BRAND = '#D70F64'
const BRAND_DARK = '#B50B52'
const BRAND_LIGHT = 'rgba(215, 15, 100, 0.08)'

function pathnameToTab(pathname) {
  const n = (pathname || '').replace(/\/$/, '')
  if (n.endsWith('/products')) return 'products'
  if (n.endsWith('/deals')) return 'deals'
  if (n.endsWith('/profile')) return 'profile'
  return 'analytics'
}

export default function VendorDashboardView() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const activeTab = pathnameToTab(pathname)

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['VENDOR'])
      if (!access.hasAccess) router.push(access.redirectTo)
    }
  }, [user, userData, loading, router])

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={44} sx={{ color: BRAND }} />
        <Typography color="text.secondary" fontWeight={600}>Loading vendor portal...</Typography>
      </Box>
    )
  }

  const navTabs = [
    { id: 'analytics', label: 'Overview & Analytics', icon: TrendingUpIcon, path: '/vendor/dashboard' },
    { id: 'products', label: 'Products & Inventory', icon: Inventory2OutlinedIcon, path: '/vendor/dashboard/products' },
    { id: 'deals', label: 'Deals & Flash Drops', icon: LocalOfferOutlinedIcon, path: '/vendor/dashboard/deals' },
    { id: 'profile', label: 'Store Business Profile', icon: StorefrontOutlinedIcon, path: '/vendor/dashboard/profile' },
  ]

  const storeName = userData?.businessName || userData?.storeName || userData?.username || 'Merchant Partner'

  return (
    <DashboardLayout>
      <Box sx={{ width: '100%', minHeight: '100%', bgcolor: '#f8fafc', pb: 6 }}>
        {/* ── Executive Vendor Full-Width Subnav Bar ── */}
        <Paper
          elevation={0}
          sx={{
            width: '100%',
            bgcolor: '#ffffff',
            borderBottom: '1px solid #e2e8f0',
            px: { xs: 2, sm: 3, md: 4, xl: 5 },
            py: 1.5,
            position: 'sticky',
            top: 56,
            zIndex: 100,
            backdropFilter: 'blur(12px)',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 2,
            }}
          >
            {/* Left: Tab Switcher Capsules */}
            <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', py: 0.5, flex: 1, minWidth: 0, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
              {navTabs.map((tab) => {
                const isActive = activeTab === tab.id
                const IconComponent = tab.icon
                return (
                  <Button
                    key={tab.id}
                    onClick={() => router.push(tab.path)}
                    startIcon={<IconComponent sx={{ fontSize: 18 }} />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: isActive ? 800 : 600,
                      fontSize: 13,
                      px: 2,
                      py: 0.9,
                      borderRadius: '12px',
                      whiteSpace: 'nowrap',
                      color: isActive ? '#ffffff' : '#475569',
                      bgcolor: isActive ? BRAND : 'transparent',
                      background: isActive ? `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_DARK} 100%)` : 'transparent',
                      boxShadow: isActive ? '0 4px 14px rgba(215, 15, 100, 0.3)' : 'none',
                      transition: 'all 0.15s ease',
                      '&:hover': {
                        bgcolor: isActive ? BRAND_DARK : '#f1f5f9',
                        color: isActive ? '#ffffff' : '#0f172a',
                      },
                    }}
                  >
                    {tab.label}
                  </Button>
                )
              })}

              {/* Direct Link to Live Kitchen Queue */}
              <Button
                onClick={() => router.push('/vendor/dashboard/orders/new')}
                startIcon={<ShoppingBagOutlinedIcon sx={{ fontSize: 18 }} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 13,
                  px: 2,
                  py: 0.9,
                  borderRadius: '12px',
                  whiteSpace: 'nowrap',
                  color: '#0369a1',
                  bgcolor: '#f0f9ff',
                  border: '1px solid #bae6fd',
                  transition: 'all 0.15s ease',
                  '&:hover': {
                    bgcolor: '#e0f2fe',
                    borderColor: '#7dd3fc',
                  },
                }}
              >
                Live Kitchen Queue
              </Button>
            </Stack>

            {/* Right: Quick Actions Group */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flexShrink: 0 }}>
              <Button
                component={Link}
                href="/customer"
                target="_blank"
                size="small"
                variant="outlined"
                endIcon={<OpenInNewIcon sx={{ fontSize: 14 }} />}
                startIcon={<StoreMallDirectoryOutlinedIcon sx={{ fontSize: 16 }} />}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: 12,
                  borderRadius: '10px',
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  px: 1.75,
                  py: 0.7,
                  '&:hover': {
                    borderColor: '#94a3b8',
                    bgcolor: '#f8fafc',
                    color: '#0f172a',
                  },
                }}
              >
                View Marketplace
              </Button>

              <Button
                size="small"
                variant="contained"
                startIcon={<AddCircleOutlineIcon sx={{ fontSize: 16 }} />}
                onClick={() => router.push('/vendor/dashboard/products')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 12,
                  borderRadius: '10px',
                  bgcolor: BRAND,
                  color: '#ffffff',
                  px: 2,
                  py: 0.7,
                  boxShadow: '0 2px 8px rgba(215, 15, 100, 0.25)',
                  '&:hover': {
                    bgcolor: BRAND_DARK,
                  },
                }}
              >
                Add Item
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* ── Main Tab Content Area (Edge-to-Edge Full Width) ── */}
        <Box sx={{ width: '100%', px: { xs: 2, sm: 3, md: 4, xl: 5 }, pt: 3 }}>
          {activeTab === 'analytics' && <VendorAnalytics vendorId={userData?.uid} />}
          {activeTab === 'products' && <VendorProductManagement />}
          {activeTab === 'deals' && <FoodDealsManagement mode="vendor" />}
          {activeTab === 'profile' && <VendorBusinessProfile />}
        </Box>
      </Box>
    </DashboardLayout>
  )
}

