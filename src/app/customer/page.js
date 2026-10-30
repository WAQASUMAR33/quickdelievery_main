'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import dynamic from 'next/dynamic'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import ProductCatalog from '@/components/customer/ProductCatalog'
import OrderHistory from '@/components/customer/OrderHistory'
import CustomerProfile from '@/components/customer/CustomerProfile'
import WishlistPage from '@/components/customer/WishlistPage'
import CustomerFooter from '@/components/customer/CustomerFooter'
import StorefrontHeaderSearch from '@/components/customer/StorefrontHeaderSearch'
import VisualSearchModal from '@/components/customer/VisualSearchModal'
import toast from 'react-hot-toast'

const CartPage = dynamic(() => import('@/components/customer/CartPage'), { ssr: false })
const TaxiRideBooking = dynamic(() => import('@/components/customer/TaxiRideBooking'), { ssr: false })
const SecondHandMarketplace = dynamic(() => import('@/components/customer/SecondHandMarketplace'), { ssr: false })

import AppBar              from '@mui/material/AppBar'
import Avatar              from '@mui/material/Avatar'
import Badge               from '@mui/material/Badge'
import Box                 from '@mui/material/Box'
import Button              from '@mui/material/Button'
import Card                from '@mui/material/Card'
import CardContent         from '@mui/material/CardContent'
import CardMedia           from '@mui/material/CardMedia'
import Chip                from '@mui/material/Chip'
import CircularProgress    from '@mui/material/CircularProgress'
import Divider             from '@mui/material/Divider'
import Drawer              from '@mui/material/Drawer'
import IconButton          from '@mui/material/IconButton'
import InputAdornment      from '@mui/material/InputAdornment'
import List                from '@mui/material/List'
import ListItemButton      from '@mui/material/ListItemButton'
import ListItemIcon        from '@mui/material/ListItemIcon'
import ListItemText        from '@mui/material/ListItemText'
import Menu                from '@mui/material/Menu'
import MenuItem            from '@mui/material/MenuItem'
import Paper               from '@mui/material/Paper'
import Stack               from '@mui/material/Stack'
import Select             from '@mui/material/Select'
import TextField          from '@mui/material/TextField'
import Toolbar            from '@mui/material/Toolbar'
import Tooltip            from '@mui/material/Tooltip'
import Typography         from '@mui/material/Typography'

import CloseIcon               from '@mui/icons-material/Close'
import DeliveryDiningIcon      from '@mui/icons-material/DeliveryDining'
import ExpandMoreIcon          from '@mui/icons-material/ExpandMore'
import FavoriteIcon            from '@mui/icons-material/Favorite'
import FavoriteBorderIcon      from '@mui/icons-material/FavoriteBorder'
import FlashOnIcon             from '@mui/icons-material/FlashOn'
import HomeIcon                from '@mui/icons-material/Home'
import HomeOutlinedIcon        from '@mui/icons-material/HomeOutlined'
import LocationOnIcon          from '@mui/icons-material/LocationOn'
import LogoutOutlinedIcon      from '@mui/icons-material/LogoutOutlined'
import MenuIcon                from '@mui/icons-material/Menu'
import PersonIcon              from '@mui/icons-material/Person'
import LocalTaxiIcon           from '@mui/icons-material/LocalTaxi'
import AutorenewIcon           from '@mui/icons-material/Autorenew'
import PersonOutlineIcon       from '@mui/icons-material/PersonOutline'
import SearchIcon              from '@mui/icons-material/Search'
import SecurityIcon            from '@mui/icons-material/Security'
import SettingsOutlinedIcon    from '@mui/icons-material/SettingsOutlined'
import ShoppingBagIcon         from '@mui/icons-material/ShoppingBag'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import StarIcon                from '@mui/icons-material/Star'
import StarBorderIcon          from '@mui/icons-material/StarBorder'
import StorefrontIcon          from '@mui/icons-material/Storefront'
import DarkModeOutlinedIcon    from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon   from '@mui/icons-material/LightModeOutlined'
import TranslateIcon           from '@mui/icons-material/Translate'
import AutoAwesomeIcon         from '@mui/icons-material/AutoAwesome'
import CameraAltIcon           from '@mui/icons-material/CameraAlt'

// Ultra-Impressive Luxe Sapphire & Champagne Gold Palette
const THEME = {
  primary: '#2563EB',         // Royal Sapphire
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  gold: '#F59E0B',            // Champagne Gold
  goldLight: '#FBBF24',
  secondary: '#06B6D4',       // Luminous Cyan
  accent: '#10B981',          // Emerald Mint
  rose: '#F43F5E',            // Sunset Rose
  darkNav: '#0A0F1D',         // Luxe Midnight Obsidian
  darkNavSub: '#0E1528',
  topBar: '#060A14',
  soft: '#EFF6FF',
  lightBg: '#F8FAFC',
  gradient: 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
  goldGradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
  luxeGradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 50%, #F59E0B 100%)',
}

function getCategoryEmoji(cat) {
  const str = `${cat.code || ''} ${cat.name || ''} ${cat.vertical || ''}`.toLowerCase()
  if (str.includes('restaurant') || str.includes('dining') || str.includes('food') || str.includes('burger') || str.includes('pizza') || str.includes('fast food')) return '🍽️'
  if (str.includes('grocer') || str.includes('produce') || str.includes('supermarket') || str.includes('pantry') || str.includes('organic')) return '🛒'
  if (str.includes('baker') || str.includes('dessert') || str.includes('croissant') || str.includes('sweet') || str.includes('patisserie') || str.includes('cake')) return '🥐'
  if (str.includes('tech') || str.includes('electron') || str.includes('mobile') || str.includes('gadget') || str.includes('phone') || str.includes('laptop') || str.includes('computer')) return '📱'
  if (str.includes('fashion') || str.includes('apparel') || str.includes('clothing') || str.includes('wear')) return '👗'
  if (str.includes('health') || str.includes('pharmacy') || str.includes('medicine') || str.includes('beauty')) return '💊'
  if (str.includes('home') || str.includes('furniture') || str.includes('decor')) return '🏠'
  if (str.includes('sport') || str.includes('fitness')) return '⚽'
  return '📦'
}

function storefrontGreeting(t = (k) => k) {
  const h = new Date().getHours()
  if (h < 12) return t('goodMorning') || 'Good morning'
  if (h < 18) return t('goodAfternoon') || 'Good afternoon'
  return t('goodEvening') || 'Good evening'
}

export default function CustomerDashboard({ initialTab = 'products' }) {
  const { user, userData, logout, loading: authLoading } = useAuth()
  const { addToCart, getTotalItems, getTotalPrice } = useCart()
  const { isDark, toggleTheme } = useTheme()
  const { language, setLanguage, t, isRTL, availableLanguages } = useLanguage()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState(initialTab)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchCategory, setSearchCategory] = useState('all')
  const [mobileVisualModalOpen, setMobileVisualModalOpen] = useState(false)
  const [selectedDepartment, setSelectedDepartment] = useState(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [activeFilter, setActiveFilter] = useState(null)
  const [showMobileSidebar, setShowMobileSidebar] = useState(false)
  const [userMenuAnchor, setUserMenuAnchor] = useState(null)
  const [favorites, setFavorites] = useState([])
  const [categories, setCategories] = useState([])
  const [serviceMode, setServiceMode] = useState('delivery')

  useEffect(() => {
    if (authLoading || !user || !userData) return
    const access = checkUserAccess(user, userData, ['CUSTOMER'])
    if (access.hasAccess) return
    const role = getUserRole(userData)
    if (role === 'ADMIN' || role === 'SUPER_ADMIN') router.push('/admin/dashboard')
    else if (role === 'VENDOR') router.push('/vendor/dashboard')
    else router.push(access.redirectTo)
  }, [user, userData, authLoading, router])

  useEffect(() => {
    const handleOpenCart = () => setActiveTab('cart')
    const handleGoProducts = () => setActiveTab('products')
    
    // Check URL ?tab= parameter on load
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search)
      const tab = sp.get('tab')
      if (tab && ['products', 'orders', 'favorites', 'wishlist', 'profile', 'cart', 'taxi', 'secondhand'].includes(tab)) {
        setActiveTab(tab)
      }
    }

    window.addEventListener('openCart', handleOpenCart)
    window.addEventListener('goProducts', handleGoProducts)
    
    return () => {
      window.removeEventListener('openCart', handleOpenCart)
      window.removeEventListener('goProducts', handleGoProducts)
    }
  }, [])

  const { isGuest, navTabs, effectiveTab } = useMemo(() => {
    const guest = userData?.role === 'GUEST' || !userData
    const tabDefs = [
      { id: 'products',   label: t('exploreHome') || 'Explore & Home', icon: <HomeOutlinedIcon />, activeIcon: <HomeIcon />, protected: false },
      { id: 'taxi',       label: '🚖 RapidRide & Luggage', icon: <LocalTaxiIcon />, activeIcon: <LocalTaxiIcon />, protected: false },
      { id: 'secondhand', label: '♻️ 2nd Hand Deals', icon: <AutorenewIcon />, activeIcon: <AutorenewIcon />, protected: false },
      { id: 'orders',     label: t('myOrders') || 'My Orders',      icon: <ShoppingBagOutlinedIcon />, activeIcon: <ShoppingBagIcon />, protected: true },
      { id: 'favorites',  label: t('favourites') || 'Favourites',     icon: <StarBorderIcon />, activeIcon: <StarIcon />, protected: true },
      { id: 'wishlist',   label: t('wishlist') || 'Wishlist',       icon: <FavoriteBorderIcon />, activeIcon: <FavoriteIcon />, protected: true },
      { id: 'profile',    label: t('profileSettings') || 'Profile Settings', icon: <PersonOutlineIcon />, activeIcon: <PersonIcon />, protected: true },
    ]
    const allowed = tabDefs.filter(tab => !guest || !tab.protected)
    const allowedIds = new Set(allowed.map(t => t.id))
    allowedIds.add('products')
    allowedIds.add('cart')
    allowedIds.add('taxi')
    allowedIds.add('secondhand')
    return {
      isGuest: guest,
      navTabs: tabDefs,
      effectiveTab: allowedIds.has(activeTab) ? activeTab : 'products',
    }
  }, [userData?.role, activeTab, userData, t, language])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('/api/products?type=categories')
        const data = await res.json()
        if (data.success) setCategories(data.data || [])
      } catch (e) { console.error('Error fetching categories:', e) }
    }
    fetchCategories()
  }, [])

  const dynamicDepartments = useMemo(() => {
    const list = [
      { id: 'deals', label: t('flashDrops') || '⚡ Flash Drops', badge: 'LIVE', badgeBg: THEME.rose },
    ]

    if (categories && categories.length > 0) {
      categories.forEach(cat => {
        const catTranslated = t(cat.name) || cat.name
        list.push({
          id: String(cat.id),
          label: `${getCategoryEmoji(cat)} ${catTranslated}`,
          rawName: cat.name,
        })
      })
    } else {
      list.push(
        { id: 'restaurant', label: `🍽️ ${t('Restaurant') || 'Restaurant'}` },
        { id: 'grocery', label: `🛒 ${t('Fresh Groceries') || 'Fresh Groceries'}` },
        { id: 'bakery', label: `🥐 ${t('Bakery & Desserts') || 'Bakery & Desserts'}` },
        { id: 'tech', label: `📱 ${t('Electronics & Tech') || 'Electronics & Tech'}` },
      )
    }

    list.push({ id: 'stores', label: t('brandBoutiques') || '🏬 Brand Boutiques' })
    return list
  }, [categories, t, language])

  // Fetch Favorites from API
  useEffect(() => {
    if (userData?.id) {
      const fetchFavorites = async () => {
        try {
          const res = await fetch(`/api/customer/favorites?userId=${userData.id}`)
          const data = await res.json()
          if (data.success) {
            setFavorites(data.data || [])
          }
        } catch (e) { console.error('Error fetching favorites:', e) }
      }
      fetchFavorites()
    }
  }, [userData?.id])

  const heroFirstName = useMemo(() => {
    if (authLoading) return '…'
    const dn = user?.displayName?.trim()
    if (dn) return dn.split(/\s+/)[0]
    if (userData?.username) return userData.username
    return 'there'
  }, [authLoading, user?.displayName, userData?.username])

  const handleTabSwitch = (tabId) => {
    const tabDef = navTabs.find(t => t.id === tabId)
    if (tabDef?.protected && isGuest) {
      toast.error('Please sign in to access ' + tabDef.label)
      return
    }
    setActiveTab(tabId)
    setShowMobileSidebar(false)
  }

  const handleSignOut = async () => {
    setUserMenuAnchor(null)
    await logout()
    toast.success('Signed out successfully')
    router.push('/')
  }

  const renderSidebarContent = () => (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2.5, bgcolor: isDark ? '#0A0F1D' : '#ffffff' }}>
      {/* Brand Header */}
      <Box
        onClick={() => { setActiveTab('products'); setShowMobileSidebar(false) }}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          cursor: 'pointer',
          mb: 4,
          p: 1.5,
          borderRadius: 0,
          bgcolor: 'rgba(99, 102, 241, 0.06)',
          border: '1px solid rgba(99, 102, 241, 0.12)',
        }}
      >
        <Box
          sx={{
            width: 44,
            height: 44,
            background: THEME.gradient,
            borderRadius: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(99, 102, 241, 0.35)',
          }}
        >
          <DeliveryDiningIcon sx={{ color: '#fff', fontSize: 26 }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={900} sx={{ background: THEME.gradient, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: -0.5 }}>
            QuickDelivery
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ fontSize: 10, letterSpacing: 0.5 }}>
            FOOD & GROCERY
          </Typography>
        </Box>
      </Box>

      {/* Navigation List */}
      <Typography variant="caption" fontWeight={700} color="text.disabled" textTransform="uppercase" letterSpacing={1} sx={{ px: 1.5, mb: 1, fontSize: 11 }}>
        {t('mainMenu') || 'Main Menu'}
      </Typography>

      <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {navTabs.map((tab) => {
          const isActive = effectiveTab === tab.id
          return (
            <ListItemButton
              key={tab.id}
              onClick={() => handleTabSwitch(tab.id)}
              sx={{
                borderRadius: '10px',
                py: 1.25,
                px: 2,
                transition: 'all 0.25s ease',
                bgcolor: isActive ? (isDark ? 'rgba(37, 99, 235, 0.25)' : 'rgba(37, 99, 235, 0.1)') : 'transparent',
                border: isActive ? `1px solid ${isDark ? 'rgba(37, 99, 235, 0.5)' : 'rgba(37, 99, 235, 0.25)'}` : '1px solid transparent',
                color: isActive ? (isDark ? THEME.goldLight : THEME.primaryDark) : (isDark ? '#CBD5E1' : 'text.secondary'),
                '&:hover': {
                  bgcolor: isActive ? (isDark ? 'rgba(37, 99, 235, 0.35)' : 'rgba(37, 99, 235, 0.16)') : (isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(241, 245, 249, 0.8)'),
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 38,
                  color: isActive ? (isDark ? THEME.goldLight : THEME.primaryDark) : (isDark ? '#94A3B8' : 'text.secondary'),
                }}
              >
                {isActive ? tab.activeIcon : tab.icon}
              </ListItemIcon>
              <ListItemText
                primary={tab.label}
                primaryTypographyProps={{
                  fontSize: 14,
                  fontWeight: isActive ? 800 : 600,
                  letterSpacing: -0.2,
                }}
              />
              {tab.id === 'orders' && !isGuest && (
                <Chip label="Live" size="small" sx={{ height: 20, fontSize: 10, fontWeight: 800, bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#dcfce7', color: isDark ? '#34d399' : '#15803d', borderRadius: '6px' }} />
              )}
            </ListItemButton>
          )
        })}
      </List>

      <Divider sx={{ my: 3, borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'divider' }} />

      {/* Cart Quick Trigger Card */}
      <Box
        onClick={() => { setActiveTab('cart'); setShowMobileSidebar(false) }}
        sx={{
          p: 2,
          borderRadius: '12px',
          background: isDark ? 'linear-gradient(135deg, #0A0F1D 0%, #1E293B 100%)' : 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e0e7ff',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          '&:hover': { boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.5)' : '0 8px 20px rgba(37, 99, 235, 0.12)' },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Badge badgeContent={getTotalItems()} sx={{ '& .MuiBadge-badge': { bgcolor: THEME.gold, color: '#000', fontWeight: 800, borderRadius: '4px' } }}>
              <ShoppingBagIcon sx={{ color: isDark ? THEME.goldLight : THEME.primaryDark, fontSize: 24 }} />
            </Badge>
            <Typography variant="body2" fontWeight={800} sx={{ color: isDark ? '#F1F5F9' : 'text.primary' }}>
              {t('myBasket') || 'My Basket'}
            </Typography>
          </Box>
          <Chip label={`${getTotalItems()} ${t('items') || 'items'}`} size="small" sx={{ fontWeight: 700, fontSize: 11, bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#ffffff', color: isDark ? '#fff' : THEME.primaryDark, borderRadius: '6px' }} />
        </Box>
        <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : 'text.secondary' }} display="block">
          {t('tapToViewBill') || 'Tap to view bill & checkout'}
        </Typography>
      </Box>

      {/* Spacer */}
      <Box sx={{ flexGrow: 1 }} />

      {/* User Footer / Auth status */}
      <Box sx={{ pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        {isGuest ? (
          <Button
            component={NextLink}
            href="/login"
            fullWidth
            variant="contained"
            startIcon={<PersonOutlineIcon />}
            sx={{
              background: THEME.gradient,
              borderRadius: 0,
              py: 1.25,
              textTransform: 'none',
              fontWeight: 800,
              boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)',
            }}
          >
            {t('signInRegister') || 'Sign In / Register'}
          </Button>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
              <Avatar sx={{ bgcolor: THEME.primaryDark, width: 38, height: 38, fontWeight: 800, fontSize: 15, borderRadius: 0 }}>
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={800} noWrap>
                  {user?.displayName || 'My Account'}
                </Typography>
                <Typography variant="caption" color="text.secondary" noWrap display="block">
                  {user?.email || 'Customer'}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Sign Out">
              <IconButton size="small" onClick={handleSignOut} sx={{ color: 'error.main', borderRadius: 0 }}>
                <LogoutOutlinedIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Box>
    </Box>
  )

  const renderActiveTabContent = () => {
    switch (effectiveTab) {
      case 'products':
        return (
          <Box sx={{ width: '100%', py: 0 }}>
            <ProductCatalog
              searchQuery={searchQuery}
              searchCategory={searchCategory}
              selectedDepartment={selectedDepartment}
              onSelectDepartment={setSelectedDepartment}
              onToggleFavorite={() => {}}
              favorites={favorites}
              serviceMode={serviceMode}
              onServiceModeChange={setServiceMode}
              heroFirstName={heroFirstName}
              externalSubcategory={selectedSubcategory}
              externalFilter={activeFilter}
            />
          </Box>
        )
      case 'taxi':
        return (
          <Box sx={{ width: '100%', py: { xs: 2, sm: 3 } }}>
            <TaxiRideBooking onBack={() => setActiveTab('products')} />
          </Box>
        )
      case 'secondhand':
        return (
          <Box sx={{ width: '100%', py: { xs: 2, sm: 3 } }}>
            <SecondHandMarketplace user={userData || user} />
          </Box>
        )
      case 'orders':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <OrderHistory />
          </Box>
        )
      case 'wishlist':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <WishlistPage onAddToCart={(p) => addToCart(p)} />
          </Box>
        )
      case 'favorites':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <Typography variant="h5" fontWeight={800} mb={3}>
              Favorite Stores & Kitchens
            </Typography>
            {favorites.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8, bgcolor: isDark ? '#0A0F1D' : '#fff', borderRadius: 0, border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', p: 4 }}>
                <StarBorderIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} color="text.secondary">No favorites saved yet</Typography>
                <Typography variant="body2" color="text.disabled" mb={3}>
                  Save stores & restaurants by clicking the star on items you love.
                </Typography>
                <Button variant="contained" onClick={() => setActiveTab('products')} sx={{ background: THEME.gradient, borderRadius: 0 }}>
                  Explore Stores
                </Button>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                {favorites.map((vendor, idx) => (
                  <Card key={idx} elevation={0} sx={{ borderRadius: 0, bgcolor: isDark ? '#0E1528' : '#fff', border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #e2e8f0', overflow: 'hidden' }}>
                    <CardMedia
                      component="img"
                      height={140}
                      image={vendor.urlLogo || vendor.urlCoverPhoto || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=500&q=80'}
                      alt="Store"
                    />
                    <CardContent>
                      <Typography variant="subtitle1" fontWeight={800} sx={{ color: isDark ? '#F1F5F9' : 'text.primary' }}>{vendor.businessName || 'Verified Store'}</Typography>
                      <Typography variant="caption" color="text.secondary">Fast delivery ready</Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )
      case 'profile':
        return (
          <Box sx={{ p: { xs: 2, sm: 3, md: 4, lg: 4, xl: 5 }, width: '100%' }}>
            <CustomerProfile />
          </Box>
        )
      case 'cart':
        return (
          <Box sx={{ width: '100%', py: { xs: 1, sm: 2 } }}>
            <CartPage
              onNavigateExplore={() => setActiveTab('products')}
              onNavigateOrders={() => setActiveTab('orders')}
            />
          </Box>
        )
      default:
        return null
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: isDark ? '#080C16' : '#F8FAFC', color: isDark ? '#F1F5F9' : '#0F172A', display: 'flex', flexDirection: 'column', transition: 'background-color 0.3s ease' }}>

      {/* Mobile Drawer Sidebar */}
      <Drawer
        variant="temporary"
        open={showMobileSidebar}
        onClose={() => setShowMobileSidebar(false)}
        ModalProps={{ keepMounted: true }}
        PaperProps={{ sx: { width: 290, border: 'none', bgcolor: isDark ? '#0F172A' : '#ffffff', color: isDark ? '#F1F5F9' : '#0F172A' } }}
      >
        {renderSidebarContent()}
      </Drawer>

      {/* ── TOP HEADER NAVBAR (UNIQUE BESPOKE NEO-MARKETPLACE NAVBAR) ── */}
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          top: 0,
          zIndex: 1100,
          bgcolor: isDark ? THEME.darkNav : '#FFFFFF',
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          color: isDark ? '#ffffff' : '#0F172A',
          boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 4px 20px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(20px)',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        {/* Top Accent Gradient Line (Sapphire to Gold) */}
        <Box sx={{ height: 2.5, background: 'linear-gradient(90deg, #2563EB 0%, #06B6D4 40%, #F59E0B 80%, #D97706 100%)' }} />

        {/* ── 1. TOP UTILITY RIBBON ── */}
        <Box
          sx={{
            bgcolor: isDark ? THEME.topBar : '#F8FAFC',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
            py: 0.6,
            px: { xs: 2, sm: 3, md: 4, xl: 6 },
            display: { xs: 'none', sm: 'block' },
            transition: 'background-color 0.25s ease',
          }}
        >
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
            {/* Left: Deliver To & Status */}
            <Stack direction="row" spacing={3} alignItems="center">
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.75,
                  color: isDark ? '#94A3B8' : '#64748B',
                  cursor: 'pointer',
                  '&:hover': { color: isDark ? '#ffffff' : '#0F172A' },
                }}
              >
                <LocationOnIcon sx={{ fontSize: 15, color: THEME.gold }} />
                <Typography variant="caption" sx={{ fontSize: 11.5, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 500 }}>
                  {t('deliverTo')}:
                </Typography>
                <Typography variant="caption" sx={{ fontSize: 11.5, fontWeight: 700, color: isDark ? '#F1F5F9' : '#0F172A' }}>
                  {userData?.address || userData?.city || 'Pakistan (All Regions)'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                <Typography variant="caption" sx={{ fontSize: 11.5, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                  {t('highSpeedCdn') || 'High-Speed CDN • Multi-Store Ready'}
                </Typography>
              </Box>
            </Stack>

            {/* Right: Language Selector | Light/Dark Mode | Partner | Orders | Support */}
            <Stack direction="row" spacing={2.5} alignItems="center">
              {/* Language Selector Dropdown */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#EDF2F7', px: 1, py: 0.25, borderRadius: '6px', border: isDark ? '1px solid transparent' : '1px solid #E2E8F0' }}>
                <TranslateIcon sx={{ fontSize: 13, color: THEME.gold }} />
                <Select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  variant="standard"
                  disableUnderline
                  sx={{
                    color: isDark ? '#F1F5F9' : '#0F172A',
                    fontSize: 11.5,
                    fontWeight: 700,
                    '& .MuiSelect-select': { py: 0.2, pr: '18px !important' },
                    '& .MuiSvgIcon-root': { color: isDark ? '#94A3B8' : '#64748B', fontSize: 16 },
                  }}
                >
                  {availableLanguages.map((lang) => (
                    <MenuItem key={lang.code} value={lang.code} sx={{ fontSize: 12, fontWeight: 600 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <span>{lang.flag}</span>
                        <span>{lang.label || lang.name}</span>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </Box>

              {/* Light / Dark Mode Switcher */}
              <Tooltip title={isDark ? t('lightMode') : t('darkMode')}>
                <IconButton
                  size="small"
                  onClick={toggleTheme}
                  sx={{
                    color: isDark ? THEME.goldLight : '#475569',
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#EDF2F7',
                    border: isDark ? '1px solid transparent' : '1px solid #E2E8F0',
                    width: 26,
                    height: 26,
                    borderRadius: '6px',
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', color: isDark ? '#fff' : '#000' },
                  }}
                >
                  {isDark ? <LightModeOutlinedIcon sx={{ fontSize: 15 }} /> : <DarkModeOutlinedIcon sx={{ fontSize: 15 }} />}
                </IconButton>
              </Tooltip>

              <NextLink
                href="/business-register"
                style={{ textDecoration: 'none', color: isDark ? '#F8FAFC' : '#0F172A', display: 'flex', alignItems: 'center', gap: 5 }}
              >
                <StorefrontIcon sx={{ fontSize: 14, color: THEME.gold }} />
                <Typography variant="caption" sx={{ fontSize: 11.5, fontWeight: 700, color: isDark ? '#E2E8F0' : '#334155', '&:hover': { color: THEME.gold } }}>
                  {t('partnerWithUs')}
                </Typography>
                <Chip
                  label={t('zeroFee') || '0% FEE'}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 8.5,
                    fontWeight: 900,
                    background: THEME.goldGradient,
                    color: '#000',
                    borderRadius: '4px',
                    px: 0.25,
                  }}
                />
              </NextLink>

              {/* RapidRide Taxi & Luggage Quick Link */}
              <Box
                onClick={() => handleTabSwitch('taxi')}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  color: isDark ? '#34D399' : '#059669',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <LocalTaxiIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontSize: 11.5, fontWeight: 800 }}>
                  RapidRide Taxi & Luggage
                </Typography>
                <Chip
                  label="OFFER FARE"
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 8.5,
                    fontWeight: 900,
                    bgcolor: '#10B981',
                    color: '#fff',
                    borderRadius: '4px',
                    px: 0.25,
                  }}
                />
              </Box>

              {/* 2nd Hand Market Quick Link */}
              <Box
                onClick={() => handleTabSwitch('secondhand')}
                sx={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.6,
                  color: isDark ? '#FBBF24' : '#D97706',
                  '&:hover': { opacity: 0.8 },
                }}
              >
                <AutorenewIcon sx={{ fontSize: 14 }} />
                <Typography variant="caption" sx={{ fontSize: 11.5, fontWeight: 800 }}>
                  2nd Hand Market
                </Typography>
                <Chip
                  label="MAKE OFFERS"
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: 8.5,
                    fontWeight: 900,
                    bgcolor: '#F59E0B',
                    color: '#000',
                    borderRadius: '4px',
                    px: 0.25,
                  }}
                />
              </Box>

              <Box
                onClick={() => handleTabSwitch('orders')}
                sx={{ cursor: 'pointer', color: isDark ? '#94A3B8' : '#64748B', '&:hover': { color: isDark ? '#ffffff' : '#0F172A' } }}
              >
                <Typography variant="caption" sx={{ fontSize: 11.5, fontWeight: 600 }}>
                  {t('trackOrder')}
                </Typography>
              </Box>

              <NextLink
                href="/login"
                style={{ textDecoration: 'none', color: isDark ? '#94A3B8' : '#64748B' }}
              >
                <Typography variant="caption" sx={{ fontSize: 11.5, fontWeight: 600, '&:hover': { color: isDark ? '#ffffff' : '#0F172A' } }}>
                  {t('support247')}
                </Typography>
              </NextLink>
            </Stack>
          </Box>
        </Box>

        {/* ── 2. MAIN HEADER (Unique Sculpted Pill Search & Glass Actions) ── */}
        <Box sx={{ width: '100%', px: { xs: 1.5, sm: 3, md: 4, xl: 6 } }}>
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', gap: { xs: 1, md: 1.5, lg: 2.5 }, minHeight: { xs: 58, md: 68 } }}>
            {/* Left: Mobile Drawer Trigger & Unique Brand Logo */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.75, sm: 1.5 }, flexShrink: 0 }}>
              <IconButton
                onClick={() => setShowMobileSidebar(true)}
                sx={{ display: { lg: 'none' }, color: isDark ? '#F8FAFC' : '#0F172A', p: 0.5 }}
                aria-label="open navigation menu"
              >
                <MenuIcon />
              </IconButton>

              {/* Bespoke Logo */}
              <Box
                onClick={() => { setActiveTab('products'); setSelectedDepartment(null) }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1, sm: 1.25 },
                  cursor: 'pointer',
                  userSelect: 'none',
                  flexShrink: 0,
                }}
              >
                <Box
                  sx={{
                    height: { xs: 36, sm: 40, md: 44 },
                    display: 'flex',
                    alignItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Box
                    component="img"
                    src="/images/martzona_logo_transparent.png"
                    alt="MARTZONA"
                    sx={{
                      height: { xs: 36, sm: 40, md: 44 },
                      width: 'auto',
                      objectFit: 'contain',
                    }}
                  />
                </Box>
                <Box sx={{ minWidth: 0, display: { xs: 'none', sm: 'block' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    <Chip
                      label={t('boutiqueMall') || 'BOUTIQUE MALL'}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 9,
                        fontWeight: 900,
                        letterSpacing: 0.75,
                        bgcolor: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                        color: isDark ? '#A5B4FC' : '#2563EB',
                        border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid rgba(37, 99, 235, 0.2)',
                        borderRadius: 0,
                      }}
                    />
                  </Box>
                  <Typography variant="caption" sx={{ fontSize: 10, color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600, display: { xs: 'none', xl: 'block' }, whiteSpace: 'nowrap' }}>
                    {t('curatedMarketplace') || 'Curated Multi-Vendor Marketplace'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Center: Enhanced Search Bar with Mega Menu Trigger & Live Suggestions */}
            <StorefrontHeaderSearch
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              searchCategory={searchCategory}
              setSearchCategory={setSearchCategory}
              categories={categories}
              onSearchSubmit={(q) => {
                if (effectiveTab !== 'products') setActiveTab('products')
              }}
              onSelectSubcategory={(subCatId) => {
                setSelectedSubcategory(subCatId)
                if (effectiveTab !== 'products') setActiveTab('products')
              }}
              onApplyFilter={(filterType) => {
                if (effectiveTab !== 'products') setActiveTab('products')
                if (filterType === 'deals') {
                  setSelectedDepartment('deals')
                } else if (filterType === 'stores') {
                  setSelectedDepartment('stores')
                } else {
                  setActiveFilter(filterType)
                }
              }}
              isDark={isDark}
              t={t}
              THEME={THEME}
            />

            {/* Right: AI Concierge | User Account | Orders | Wishlist | Cart */}
            <Stack direction="row" alignItems="center" spacing={{ xs: 0.75, sm: 1, md: 1.25, lg: 1.5 }} sx={{ flexShrink: 0 }}>
              {/* Interactive AI Concierge Button (Shown on desktop >= xl) */}
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('openAI'))
                  }
                }}
                size="small"
                startIcon={<AutoAwesomeIcon sx={{ fontSize: 16, color: THEME.gold, animation: 'pulse 2s infinite' }} />}
                sx={{
                  display: { xs: 'none', xl: 'inline-flex' },
                  color: isDark ? '#FFFFFF' : '#1E293B',
                  textTransform: 'none',
                  fontWeight: 800,
                  fontSize: 12,
                  px: 1.75,
                  py: 0.7,
                  borderRadius: 0,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.28) 0%, rgba(245, 158, 11, 0.22) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%)',
                  border: isDark ? '1px solid rgba(245, 158, 11, 0.45)' : '1px solid rgba(245, 158, 11, 0.4)',
                  boxShadow: isDark ? '0 0 16px rgba(245, 158, 11, 0.15)' : 'none',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.45) 0%, rgba(245, 158, 11, 0.35) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.15) 0%, rgba(245, 158, 11, 0.2) 100%)',
                    borderColor: THEME.gold,
                    transform: 'translateY(-1px)',
                  },
                }}
              >
                {t('askAI')}
                <Chip
                  label="PRO"
                  size="small"
                  sx={{
                    ml: 0.75,
                    height: 16,
                    fontSize: 8.5,
                    fontWeight: 900,
                    bgcolor: THEME.gold,
                    color: '#000',
                    borderRadius: 0,
                    px: 0.25,
                  }}
                />
              </Button>

              {/* Account Dropdown */}
              {isGuest ? (
                <Button
                  component={NextLink}
                  href="/login"
                  variant="contained"
                  size="small"
                  sx={{
                    background: THEME.gradient,
                    color: '#fff',
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 800,
                    px: { xs: 1.5, sm: 2, xl: 2.5 },
                    py: 0.85,
                    fontSize: { xs: 12, sm: 13 },
                    boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
                    '&:hover': { opacity: 0.95 },
                  }}
                >
                  {t('signIn')}
                </Button>
              ) : (
                <Box
                  onClick={(e) => setUserMenuAnchor(e.currentTarget)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: { xs: 0.75, sm: 1.25 },
                    py: 0.6,
                    borderRadius: 0,
                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0' },
                  }}
                >
                  <Avatar
                    src={userData?.urlLogo || userData?.avatarUrl || userData?.photoURL || user?.photoURL || ''}
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: 0,
                      background: THEME.gradient,
                      color: '#fff',
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
                  </Avatar>
                  <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: isRTL ? 'right' : 'left' }}>
                    <Typography variant="caption" sx={{ fontSize: 10, color: isDark ? '#94A3B8' : '#64748B', display: 'block', lineHeight: 1 }}>
                      {t('welcome') || 'Welcome,'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                      <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 800, color: isDark ? '#F8FAFC' : '#0F172A' }}>
                        {heroFirstName}
                      </Typography>
                      <ExpandMoreIcon sx={{ fontSize: 15, color: isDark ? '#94A3B8' : '#64748B' }} />
                    </Box>
                  </Box>
                </Box>
              )}

              {/* Wishlist Button */}
              <IconButton
                onClick={() => handleTabSwitch('wishlist')}
                sx={{
                  color: effectiveTab === 'wishlist' ? THEME.gold : (isDark ? '#CBD5E1' : '#475569'),
                  borderRadius: 0,
                  p: { xs: 0.75, sm: 1 },
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                  border: isDark ? '1px solid transparent' : '1px solid #E2E8F0',
                  '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0', color: isDark ? '#fff' : '#000' },
                }}
                title={t('wishlist')}
              >
                <FavoriteBorderIcon sx={{ fontSize: { xs: 19, sm: 21 } }} />
              </IconButton>

              {/* Shopping Bag Capsule Button */}
              <Button
                onClick={() => handleTabSwitch('cart')}
                sx={{
                  color: isDark ? '#FFFFFF' : '#0F172A',
                  textTransform: 'none',
                  px: { xs: 1, sm: 1.5, xl: 2 },
                  py: 0.8,
                  borderRadius: 0,
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.25) 0%, rgba(245, 158, 11, 0.2) 100%)'
                    : 'linear-gradient(135deg, rgba(37, 99, 235, 0.08) 0%, rgba(245, 158, 11, 0.12) 100%)',
                  border: isDark ? '1px solid rgba(37, 99, 235, 0.35)' : '1px solid rgba(37, 99, 235, 0.25)',
                  '&:hover': {
                    background: isDark
                      ? 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(245, 158, 11, 0.3) 100%)'
                      : 'linear-gradient(135deg, rgba(37, 99, 235, 0.16) 0%, rgba(245, 158, 11, 0.2) 100%)',
                    borderColor: THEME.primary,
                  },
                }}
              >
                <Badge
                  badgeContent={getTotalItems()}
                  sx={{
                    '& .MuiBadge-badge': {
                      background: THEME.goldGradient,
                      color: '#000',
                      fontWeight: 900,
                      fontSize: 10,
                      minWidth: 18,
                      height: 18,
                      borderRadius: 0,
                    }
                  }}
                >
                  <ShoppingBagIcon sx={{ fontSize: { xs: 19, sm: 21 }, color: THEME.gold }} />
                </Badge>
                <Box sx={{ ml: 1, textAlign: 'left', display: { xs: 'none', xl: 'block' } }}>
                  <Typography variant="caption" sx={{ fontSize: 9.5, color: isDark ? '#CBD5E1' : '#64748B', display: 'block', lineHeight: 1 }}>
                    {t('cart')}
                  </Typography>
                  <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 800, color: isDark ? '#FFFFFF' : '#0F172A', lineHeight: 1.1 }}>
                    Rs. {getTotalPrice().toFixed(0)}
                  </Typography>
                </Box>
              </Button>
            </Stack>
          </Toolbar>
        </Box>

        {/* ── Sticky Mobile Search Bar (< md screens, phones & portrait tablets) ── */}
        <Box
          sx={{
            display: { xs: 'block', md: 'none' },
            bgcolor: isDark ? THEME.darkNavSub : '#F1F5F9',
            px: { xs: 1.5, sm: 2.5 },
            py: 0.75,
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
              borderRadius: 0,
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
              p: 0.35,
              px: 1,
              gap: 1,
            }}
          >
            <Button
              size="small"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('toggleMegaMenu'))
                }
              }}
              sx={{
                minWidth: 0,
                p: 0.5,
                px: 1,
                borderRadius: 0,
                fontSize: 11,
                fontWeight: 800,
                textTransform: 'none',
                bgcolor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
                color: THEME.primary,
                whiteSpace: 'nowrap',
              }}
            >
              {t('menu') || 'Menu ▾'}
            </Button>
            <Box
              component="input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && effectiveTab !== 'products') {
                  setActiveTab('products')
                }
              }}
              placeholder={t('searchItemsPlaceholder') || 'Search 161+ items, burgers, tech…'}
              sx={{
                flex: 1,
                height: 34,
                border: 'none',
                outline: 'none',
                fontSize: 13,
                color: isDark ? '#FFFFFF' : '#0F172A',
                bgcolor: 'transparent',
                fontFamily: 'inherit',
                '&::placeholder': { color: isDark ? '#64748B' : '#94A3B8' },
              }}
            />
            {searchQuery && (
              <IconButton
                size="small"
                onClick={() => setSearchQuery('')}
                sx={{ p: 0.5, color: isDark ? '#94A3B8' : '#64748B', borderRadius: 0 }}
              >
                <CloseIcon sx={{ fontSize: 16 }} />
              </IconButton>
            )}
            <IconButton
              size="small"
              onClick={() => setMobileVisualModalOpen(true)}
              sx={{ p: 0.5, color: isDark ? '#94A3B8' : '#64748B', borderRadius: 0 }}
            >
              <CameraAltIcon sx={{ fontSize: 18 }} />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => {
                if (effectiveTab !== 'products') setActiveTab('products')
              }}
              sx={{
                width: 30,
                height: 30,
                background: THEME.gradient,
                color: '#FFFFFF',
                borderRadius: 0,
              }}
            >
              <SearchIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>

          <VisualSearchModal
            open={mobileVisualModalOpen}
            onClose={() => setMobileVisualModalOpen(false)}
            isDark={isDark}
          />
        </Box>

        {/* ── 3. CURATED DEPARTMENTS SUB-NAV STRIP ── */}
        <Box
          sx={{
            bgcolor: isDark ? THEME.darkNavSub : '#F1F5F9',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #CBD5E1',
            px: { xs: 1.5, sm: 2.5, md: 3, xl: 6 },
            py: 0.75,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' },
            transition: 'background-color 0.25s ease',
          }}
        >
          {/* Category Pill Buttons */}
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 'max-content' }}>
            <Button
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('toggleMegaMenu'))
                }
              }}
              size="small"
              startIcon={<MenuIcon sx={{ fontSize: 17 }} />}
              sx={{
                color: isDark ? '#FFFFFF' : '#000000',
                fontWeight: 900,
                fontSize: 13,
                letterSpacing: 0.2,
                textTransform: 'none',
                px: 2,
                py: 0.6,
                borderRadius: 0,
                bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#FFFFFF',
                border: isDark ? '1px solid rgba(255,255,255,0.18)' : '1.5px solid #0F172A',
                boxShadow: isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.08)',
                WebkitFontSmoothing: 'antialiased',
                '&:hover': {
                  bgcolor: isDark ? 'rgba(255,255,255,0.15)' : '#0F172A',
                  color: '#FFFFFF',
                },
              }}
            >
              {t('allDepartments')}
            </Button>

            {dynamicDepartments.map((dep) => {
              const isActive = selectedDepartment === dep.id
              return (
                <Button
                  key={dep.id}
                  onClick={() => {
                    setSelectedDepartment(isActive ? null : dep.id)
                    if (effectiveTab !== 'products') setActiveTab('products')
                  }}
                  size="small"
                  sx={{
                    color: isActive ? '#FFFFFF' : (isDark ? '#FFFFFF' : '#000000'),
                    fontWeight: isActive ? 900 : 750,
                    fontSize: 13,
                    letterSpacing: 0.15,
                    textTransform: 'none',
                    px: 2,
                    py: 0.6,
                    borderRadius: 0,
                    bgcolor: isActive
                      ? THEME.primary
                      : (isDark ? 'rgba(255,255,255,0.05)' : '#FFFFFF'),
                    border: isActive
                      ? `1.5px solid ${THEME.primaryLight}`
                      : (isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1'),
                    boxShadow: isActive
                      ? '0 3px 10px rgba(37, 99, 235, 0.4)'
                      : (isDark ? 'none' : '0 1px 2px rgba(0,0,0,0.04)'),
                    WebkitFontSmoothing: 'antialiased',
                    MozOsxFontSmoothing: 'grayscale',
                    textRendering: 'optimizeLegibility',
                    '&:hover': {
                      bgcolor: isActive
                        ? THEME.primaryDark
                        : (isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0'),
                      color: isActive || isDark ? '#FFFFFF' : '#000000',
                      borderColor: isActive ? THEME.primaryDark : '#94A3B8',
                    },
                  }}
                >
                  {dep.label}
                  {dep.badge && (
                    <Chip
                      label={dep.badge}
                      size="small"
                      sx={{
                        ml: 0.75,
                        height: 17,
                        fontSize: 9,
                        fontWeight: 900,
                        bgcolor: dep.badgeBg || THEME.rose,
                        color: '#FFFFFF',
                        borderRadius: 0,
                        letterSpacing: 0.5,
                      }}
                    />
                  )}
                </Button>
              )
            })}
          </Stack>

          {/* Right Status Badge (Rendered cleanly on xl screens with flexShrink 0) */}
          <Box sx={{ display: { xs: 'none', xl: 'flex' }, alignItems: 'center', gap: 1, flexShrink: 0, whiteSpace: 'nowrap' }}>
            <Box sx={{ width: 7, height: 7, borderRadius: 0, bgcolor: '#0284C7', boxShadow: '0 0 8px #0284C7' }} />
            <Typography variant="caption" sx={{ color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap', WebkitFontSmoothing: 'antialiased' }}>
              {t('expressNotice') || 'Express Delivery across Pakistan • Free on orders over Rs. 1,500'}
            </Typography>
          </Box>
        </Box>
      </AppBar>

      {/* ── Main Content Area (Full-Width Container) ── */}
      <Box sx={{ flex: 1, width: '100%', pb: { xs: 8, md: 2 }, display: 'flex', flexDirection: 'column' }}>

        {/* Tab View Body */}
        {renderActiveTabContent()}

        {/* Footer */}
        <CustomerFooter />

      </Box>



      {/* User Context Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{ elevation: 4, sx: { width: 260, borderRadius: 0, mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5, background: THEME.gradient, color: '#fff' }}>
          <Typography fontWeight={800} fontSize={15}>{user?.displayName}</Typography>
          <Typography variant="caption" sx={{ opacity: 0.85 }}>{user?.email}</Typography>
        </Box>
        <MenuItem onClick={() => { setActiveTab('orders'); setUserMenuAnchor(null) }} sx={{ py: 1.25 }}>
          <ListItemIcon><ShoppingBagOutlinedIcon sx={{ color: THEME.primaryDark }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>{t('myOrders') || 'My Orders'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setActiveTab('wishlist'); setUserMenuAnchor(null) }} sx={{ py: 1.25 }}>
          <ListItemIcon><FavoriteBorderIcon sx={{ color: THEME.primaryDark }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>{t('wishlist') || 'Wishlist'}</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setActiveTab('profile'); setUserMenuAnchor(null) }} sx={{ py: 1.25 }}>
          <ListItemIcon><SettingsOutlinedIcon sx={{ color: THEME.primaryDark }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>{t('profileSettings') || 'Profile Settings'}</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleSignOut} sx={{ py: 1.25, color: 'error.main' }}>
          <ListItemIcon><LogoutOutlinedIcon sx={{ color: 'error.main' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontWeight: 600 }}>{t('signOut') || 'Sign Out'}</ListItemText>
        </MenuItem>
      </Menu>

      {/* ── Fixed Mobile Bottom Navigation Bar (Visible on phones & tablets < md) ── */}
      <Paper
        elevation={10}
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1150,
          display: { xs: 'flex', md: 'none' },
          justifyContent: 'space-around',
          alignItems: 'center',
          py: 0.75,
          px: 1,
          bgcolor: isDark ? 'rgba(10, 15, 29, 0.96)' : 'rgba(255, 255, 255, 0.96)',
          backdropFilter: 'blur(16px)',
          borderTop: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e2e8f0',
          borderRadius: 0,
          boxShadow: isDark ? '0 -4px 25px rgba(0, 0, 0, 0.6)' : '0 -4px 20px rgba(0, 0, 0, 0.06)',
        }}
      >
        <Button
          onClick={() => handleTabSwitch('products')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'products' ? (isDark ? THEME.goldLight : THEME.primary) : (isDark ? '#94A3B8' : 'text.secondary'),
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'products' ? 800 : 600,
            borderRadius: 0,
          }}
        >
          {effectiveTab === 'products' ? <HomeIcon sx={{ fontSize: 22 }} /> : <HomeOutlinedIcon sx={{ fontSize: 22 }} />}
          {t('exploreHome') || 'Home'}
        </Button>

        <Button
          onClick={() => handleTabSwitch('orders')}
          sx={{
            flexDirection: 'column',
            minWidth: 50,
            p: 0.5,
            color: effectiveTab === 'orders' ? (isDark ? THEME.goldLight : THEME.primary) : (isDark ? '#94A3B8' : 'text.secondary'),
            textTransform: 'none',
            fontSize: 10,
            fontWeight: effectiveTab === 'orders' ? 800 : 600,
            borderRadius: 0,
          }}
        >
          {effectiveTab === 'orders' ? <ShoppingBagIcon sx={{ fontSize: 20 }} /> : <ShoppingBagOutlinedIcon sx={{ fontSize: 20 }} />}
          {t('myOrders') || 'Orders'}
        </Button>

        <Button
          onClick={() => handleTabSwitch('taxi')}
          sx={{
            flexDirection: 'column',
            minWidth: 50,
            p: 0.5,
            color: effectiveTab === 'taxi' ? '#10B981' : (isDark ? '#94A3B8' : 'text.secondary'),
            textTransform: 'none',
            fontSize: 10,
            fontWeight: effectiveTab === 'taxi' ? 800 : 600,
            borderRadius: 0,
          }}
        >
          <LocalTaxiIcon sx={{ fontSize: 20 }} />
          Taxi
        </Button>

        <Button
          onClick={() => handleTabSwitch('secondhand')}
          sx={{
            flexDirection: 'column',
            minWidth: 50,
            p: 0.5,
            color: effectiveTab === 'secondhand' ? '#F59E0B' : (isDark ? '#94A3B8' : 'text.secondary'),
            textTransform: 'none',
            fontSize: 10,
            fontWeight: effectiveTab === 'secondhand' ? 800 : 600,
            borderRadius: 0,
          }}
        >
          <AutorenewIcon sx={{ fontSize: 20 }} />
          Used
        </Button>

        {/* Center Prominent Cart Button */}
        <Button
          onClick={() => handleTabSwitch('cart')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'cart' ? (isDark ? THEME.goldLight : THEME.primary) : (isDark ? '#94A3B8' : 'text.secondary'),
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: 800,
            borderRadius: 0,
          }}
        >
          <Badge
            badgeContent={getTotalItems()}
            sx={{ '& .MuiBadge-badge': { bgcolor: THEME.gold, color: '#000', fontWeight: 900, fontSize: 9, minWidth: 16, height: 16, borderRadius: '4px' } }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 22 }} />
          </Badge>
          {t('cart') || 'Cart'}
        </Button>

        <Button
          onClick={() => handleTabSwitch('wishlist')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'wishlist' ? (isDark ? THEME.goldLight : THEME.primary) : (isDark ? '#94A3B8' : 'text.secondary'),
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'wishlist' ? 800 : 600,
            borderRadius: 0,
          }}
        >
          {effectiveTab === 'wishlist' ? <FavoriteIcon sx={{ fontSize: 22 }} /> : <FavoriteBorderIcon sx={{ fontSize: 22 }} />}
          {t('wishlist') || 'Wishlist'}
        </Button>

        <Button
          onClick={() => isGuest ? router.push('/login') : handleTabSwitch('profile')}
          sx={{
            flexDirection: 'column',
            minWidth: 56,
            p: 0.5,
            color: effectiveTab === 'profile' ? (isDark ? THEME.goldLight : THEME.primary) : (isDark ? '#94A3B8' : 'text.secondary'),
            textTransform: 'none',
            fontSize: 10.5,
            fontWeight: effectiveTab === 'profile' ? 800 : 600,
            borderRadius: 0,
          }}
        >
          {effectiveTab === 'profile' ? <PersonIcon sx={{ fontSize: 22 }} /> : <PersonOutlineIcon sx={{ fontSize: 22 }} />}
          {isGuest ? (t('signIn') || 'Sign In') : (t('myAccount') || 'Account')}
        </Button>
      </Paper>

    </Box>
  )
}
