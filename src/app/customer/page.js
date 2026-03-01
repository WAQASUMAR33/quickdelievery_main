'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useCart } from '@/contexts/CartContext'
import { useWishlist } from '@/contexts/WishlistContext'
import { useRouter } from 'next/navigation'
import NextLink from 'next/link'
import { checkUserAccess, getUserRole } from '@/lib/authHelpers'
import ProductCatalog from '@/components/customer/ProductCatalog'
import OrderHistory from '@/components/customer/OrderHistory'
import CustomerProfile from '@/components/customer/CustomerProfile'
import CustomerHero from '@/components/customer/CustomerHero'
import CartPage from '@/components/customer/CartPage'
import WishlistPage from '@/components/customer/WishlistPage'
import CustomerFooter from '@/components/customer/CustomerFooter'
import toast from 'react-hot-toast'

import AppBar          from '@mui/material/AppBar'
import Avatar          from '@mui/material/Avatar'
import Badge           from '@mui/material/Badge'
import Box             from '@mui/material/Box'
import Button          from '@mui/material/Button'
import Card            from '@mui/material/Card'
import CardActions     from '@mui/material/CardActions'
import CardContent     from '@mui/material/CardContent'
import CardMedia       from '@mui/material/CardMedia'
import CircularProgress from '@mui/material/CircularProgress'
import Divider         from '@mui/material/Divider'
import Drawer          from '@mui/material/Drawer'
import IconButton      from '@mui/material/IconButton'
import InputAdornment  from '@mui/material/InputAdornment'
import List            from '@mui/material/List'
import ListItemButton  from '@mui/material/ListItemButton'
import ListItemIcon    from '@mui/material/ListItemIcon'
import ListItemText    from '@mui/material/ListItemText'
import Menu            from '@mui/material/Menu'
import MenuItem        from '@mui/material/MenuItem'
import Tab             from '@mui/material/Tab'
import Tabs            from '@mui/material/Tabs'
import TextField       from '@mui/material/TextField'
import Toolbar         from '@mui/material/Toolbar'
import Typography      from '@mui/material/Typography'

import CategoryOutlinedIcon    from '@mui/icons-material/CategoryOutlined'
import CloseIcon               from '@mui/icons-material/Close'
import ExpandMoreIcon          from '@mui/icons-material/ExpandMore'
import FavoriteIcon            from '@mui/icons-material/Favorite'
import FavoriteBorderIcon      from '@mui/icons-material/FavoriteBorder'
import InventoryOutlinedIcon   from '@mui/icons-material/InventoryOutlined'
import LogoutOutlinedIcon      from '@mui/icons-material/LogoutOutlined'
import MenuIcon                from '@mui/icons-material/Menu'
import PersonOutlineIcon       from '@mui/icons-material/PersonOutline'
import SearchIcon              from '@mui/icons-material/Search'
import SettingsOutlinedIcon    from '@mui/icons-material/SettingsOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import StarBorderIcon          from '@mui/icons-material/StarBorder'
import StarIcon                from '@mui/icons-material/Star'

const BRAND = '#D70F64'

export default function CustomerDashboard() {
  const { user, userData, logout } = useAuth()
  const { addToCart, getTotalItems } = useCart()
  const { getTotalWishlistItems } = useWishlist()
  const router = useRouter()

  const [activeTab,            setActiveTab]            = useState('products')
  const [searchQuery,          setSearchQuery]          = useState('')
  const [showMobileMenu,       setShowMobileMenu]       = useState(false)
  const [showCategoriesSidebar,setShowCategoriesSidebar] = useState(false)
  const [userMenuAnchor,       setUserMenuAnchor]       = useState(null)
  const [showCart,             setShowCart]             = useState(false)
  const [favorites,            setFavorites]            = useState([])
  const [categories,           setCategories]           = useState([])
  const [loading,              setLoading]              = useState(true)

  useEffect(() => {
    if (user && userData) {
      const access = checkUserAccess(user, userData, ['CUSTOMER'])
      if (!access.hasAccess) {
        const role = getUserRole(userData)
        if (role === 'ADMIN')  router.push('/admin/dashboard')
        else if (role === 'VENDOR') router.push('/vendor/dashboard')
        else router.push(access.redirectTo)
        return
      }
      setLoading(false)
    }
  }, [user, userData, router])

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

  const isGuest = userData?.role === 'GUEST'

  const tabs = [
    { id: 'products',  label: 'Products',   icon: <InventoryOutlinedIcon   fontSize="small" /> },
    { id: 'orders',    label: 'My Orders',  icon: <ShoppingBagOutlinedIcon fontSize="small" />, protected: true },
    { id: 'wishlist',  label: 'Wishlist',   icon: <FavoriteBorderIcon      fontSize="small" />, protected: true },
    { id: 'favorites', label: 'Favorites',  icon: <StarBorderIcon          fontSize="small" />, protected: true },
    { id: 'profile',   label: 'Profile',    icon: <PersonOutlineIcon       fontSize="small" />, protected: true },
  ].filter(tab => !isGuest || !tab.protected)

  const handleAddToCart = (product) => {
    addToCart(product)
    if (isGuest) toast.success('Item added! Create an account to save your cart.')
  }

  const handleToggleFavorite = (product) => {
    if (isGuest) { toast.error('Please sign in to save favorites'); return }
    const isFav = favorites.find(f => f.proId === product.proId)
    setFavorites(isFav ? favorites.filter(f => f.proId !== product.proId) : [...favorites, product])
  }

  const handleSignOut = async () => {
    setUserMenuAnchor(null)
    await logout()
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <>
            <CustomerHero />
            <Box sx={{ px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
              <ProductCatalog
                searchQuery={searchQuery}
                onToggleFavorite={handleToggleFavorite}
                favorites={favorites}
              />
            </Box>
          </>
        )
      case 'orders':
        return (
          <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
            <OrderHistory />
          </Box>
        )
      case 'wishlist':
        return (
          <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
            <WishlistPage />
          </Box>
        )
      case 'favorites':
        return (
          <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <FavoriteIcon sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" fontWeight={800} gutterBottom>My Favorites</Typography>
              <Typography color="text.secondary">Products you&apos;ve saved for later</Typography>
            </Box>

            {favorites.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <FavoriteBorderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>No favorites yet</Typography>
                <Typography color="text.disabled">Start adding products to your favorites!</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 3 }}>
                {favorites.map(product => (
                  <Card key={product.proId} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
                    <Box sx={{ position: 'relative' }}>
                      <CardMedia
                        component="img"
                        height={192}
                        image={product.proImages?.[0] || '/placeholder-product.jpg'}
                        alt={product.proName}
                        sx={{ objectFit: 'cover' }}
                      />
                      <IconButton
                        size="small"
                        onClick={() => handleToggleFavorite(product)}
                        sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper', '&:hover': { bgcolor: 'error.lighter' } }}
                      >
                        <FavoriteIcon sx={{ fontSize: 18, color: 'error.main' }} />
                      </IconButton>
                    </Box>
                    <CardContent sx={{ pb: 1 }}>
                      <Typography variant="body2" fontWeight={600} sx={{ mb: 1, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {product.proName}
                      </Typography>
                      <Typography variant="h6" fontWeight={800} sx={{ color: BRAND }}>${product.price}</Typography>
                    </CardContent>
                    <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                      <Button
                        fullWidth variant="contained" size="small"
                        onClick={() => handleAddToCart(product)}
                        sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' }, borderRadius: 0, textTransform: 'none', fontWeight: 700 }}
                      >
                        Add to Cart
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )
      case 'profile':
        return (
          <Box sx={{ maxWidth: 1400, mx: 'auto', px: { xs: 2, sm: 3, lg: 4 }, py: 4 }}>
            <CustomerProfile />
          </Box>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress size={56} sx={{ color: BRAND, mb: 3 }} />
          <Typography variant="h5" fontWeight={700} sx={{ color: BRAND }}>Loading Dashboard…</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>Preparing your shopping experience</Typography>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>

      {/* ── Sticky Header ── */}
      <AppBar position="sticky" elevation={0} sx={{
        bgcolor: 'background.paper',
        borderBottom: 1, borderColor: 'divider',
        color: 'text.primary',
      }}>
        <Toolbar sx={{
          maxWidth: 1400, width: '100%', mx: 'auto',
          px: { xs: 2, sm: 3 }, gap: 2,
          minHeight: { xs: 64, sm: 72 },
        }}>

          {/* Logo */}
          <Box
            onClick={() => setActiveTab('products')}
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flexShrink: 0 }}
          >
            <Box sx={{ width: 40, height: 40, bgcolor: BRAND, borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="body2" fontWeight={900} color="#fff" sx={{ fontSize: 13, letterSpacing: 0 }}>QD</Typography>
            </Box>
            <Typography variant="h6" fontWeight={900} sx={{ color: BRAND, display: { xs: 'none', sm: 'block' }, letterSpacing: -0.5 }}>
              QuickDelivery
            </Typography>
          </Box>

          {/* Delivery location chip */}
          <Box sx={{
            display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 0.75,
            bgcolor: 'grey.50', px: 2, py: 1, borderRadius: 6,
            border: '1px solid', borderColor: 'divider',
            cursor: 'pointer', flexShrink: 0,
            '&:hover': { borderColor: BRAND },
          }}>
            <Typography variant="caption" fontWeight={700} sx={{ color: BRAND }}>Delivery to</Typography>
            <Typography variant="caption" color="text.secondary">Home • Islamabad</Typography>
            <ExpandMoreIcon sx={{ fontSize: 16, color: BRAND }} />
          </Box>

          {/* Search bar */}
          <TextField
            size="small"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search for shops & restaurants"
            sx={{
              flex: 1, display: { xs: 'none', lg: 'block' },
              '& .MuiOutlinedInput-root': {
                borderRadius: 6, bgcolor: 'grey.50',
                '&:hover fieldset': { borderColor: BRAND },
                '&.Mui-focused fieldset': { borderColor: BRAND },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: 'action.active', fontSize: 20 }} />
                </InputAdornment>
              ),
            }}
          />

          <Box sx={{ flex: 1, display: { xs: 'block', lg: 'none' } }} />

          {/* Mobile search icon */}
          <IconButton sx={{ display: { xs: 'flex', lg: 'none' }, color: 'text.secondary' }}>
            <SearchIcon />
          </IconButton>

          {/* Cart */}
          <IconButton
            onClick={() => setShowCart(true)}
            sx={{ color: 'text.secondary', '&:hover': { color: BRAND, bgcolor: `${BRAND}10` } }}
          >
            <Badge
              badgeContent={getTotalItems() || null}
              sx={{ '& .MuiBadge-badge': { bgcolor: BRAND, color: '#fff', fontSize: 10, minWidth: 18, height: 18 } }}
            >
              <ShoppingBagOutlinedIcon />
            </Badge>
          </IconButton>

          {/* User menu trigger */}
          <Box
            onClick={e => setUserMenuAnchor(e.currentTarget)}
            sx={{
              display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer',
              border: '1px solid transparent', borderRadius: 6,
              pl: 0.5, pr: 1.5, py: 0.5,
              '&:hover': { borderColor: 'divider', bgcolor: 'grey.50' },
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'grey.100', color: 'text.secondary' }}>
              <PersonOutlineIcon sx={{ fontSize: 20 }} />
            </Avatar>
            <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
              <Typography variant="caption" color="text.disabled" sx={{ display: 'block', lineHeight: 1.2 }}>Hello,</Typography>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2, maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName || 'Guest'}
              </Typography>
            </Box>
            <ExpandMoreIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
          </Box>

          {/* Mobile hamburger */}
          <IconButton onClick={() => setShowMobileMenu(true)} sx={{ display: { lg: 'none' }, color: BRAND }}>
            <MenuIcon />
          </IconButton>

        </Toolbar>

        {/* Tab nav strip — desktop only */}
        <Box sx={{ borderTop: 1, borderColor: 'divider', display: { xs: 'none', md: 'block' } }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              maxWidth: 1400, mx: 'auto', px: 3, minHeight: 44,
              '& .MuiTab-root': { minHeight: 44, textTransform: 'none', fontWeight: 600, color: 'text.secondary', fontSize: 14 },
              '& .Mui-selected': { color: BRAND },
              '& .MuiTabs-indicator': { bgcolor: BRAND, height: 3 },
            }}
          >
            {tabs.map(tab => (
              <Tab key={tab.id} value={tab.id} label={tab.label} icon={tab.icon} iconPosition="start" />
            ))}
          </Tabs>
        </Box>
      </AppBar>

      {/* ── User dropdown Menu ── */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        PaperProps={{ elevation: 4, sx: { width: 280, borderRadius: 2, mt: 1 } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {!isGuest ? (
          <>
            <Box sx={{ px: 2, py: 2, bgcolor: BRAND, color: '#fff' }}>
              <Typography fontWeight={700} fontSize={16}>{user?.displayName}</Typography>
              <Typography variant="caption" sx={{ opacity: 0.9 }}>{user?.email}</Typography>
            </Box>
            <MenuItem onClick={() => { setActiveTab('orders');   setUserMenuAnchor(null) }}>
              <ListItemIcon><ShoppingBagOutlinedIcon sx={{ color: BRAND }} /></ListItemIcon>
              <ListItemText>Orders</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { setActiveTab('wishlist'); setUserMenuAnchor(null) }}>
              <ListItemIcon><FavoriteBorderIcon sx={{ color: BRAND }} /></ListItemIcon>
              <ListItemText>Wishlist</ListItemText>
            </MenuItem>
            <MenuItem onClick={() => { setActiveTab('profile');  setUserMenuAnchor(null) }}>
              <ListItemIcon><SettingsOutlinedIcon sx={{ color: BRAND }} /></ListItemIcon>
              <ListItemText>Settings</ListItemText>
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleSignOut}>
              <ListItemIcon><LogoutOutlinedIcon /></ListItemIcon>
              <ListItemText>Sign Out</ListItemText>
            </MenuItem>
          </>
        ) : (
          <Box sx={{ px: 2, py: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Login to access your orders &amp; profile
            </Typography>
            <Button
              component={NextLink} href="/login"
              fullWidth variant="contained"
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#C20D5A' }, borderRadius: 0, textTransform: 'none', fontWeight: 700 }}
            >
              Login / Sign Up
            </Button>
          </Box>
        )}
      </Menu>

      {/* ── Mobile Menu Drawer ── */}
      <Drawer anchor="left" open={showMobileMenu} onClose={() => setShowMobileMenu(false)} PaperProps={{ sx: { width: 300 } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography variant="h6" fontWeight={700}>Menu</Typography>
            <IconButton onClick={() => setShowMobileMenu(false)}><CloseIcon /></IconButton>
          </Box>

          {/* User info strip */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: `${BRAND}10`, borderRadius: 2, mb: 3 }}>
            <Avatar sx={{ bgcolor: BRAND, width: 48, height: 48, fontWeight: 700, fontSize: 20 }}>
              {user?.displayName?.charAt(0) || 'G'}
            </Avatar>
            <Box>
              <Typography fontWeight={600}>{user?.displayName || 'Guest'}</Typography>
              <Typography variant="caption" color="text.secondary">{isGuest ? 'Guest' : 'Customer'}</Typography>
            </Box>
          </Box>

          <List disablePadding>
            {tabs.map(tab => (
              <ListItemButton
                key={tab.id}
                selected={activeTab === tab.id}
                onClick={() => { setActiveTab(tab.id); setShowMobileMenu(false) }}
                sx={{
                  borderRadius: 2, mb: 0.5,
                  '&.Mui-selected': { bgcolor: `${BRAND}15`, color: BRAND },
                  '&.Mui-selected .MuiListItemIcon-root': { color: BRAND },
                }}
              >
                <ListItemIcon>{tab.icon}</ListItemIcon>
                <ListItemText primary={tab.label} primaryTypographyProps={{ fontWeight: 600 }} />
              </ListItemButton>
            ))}

            <ListItemButton
              onClick={() => { setShowCategoriesSidebar(true); setShowMobileMenu(false) }}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon><CategoryOutlinedIcon /></ListItemIcon>
              <ListItemText primary="Categories" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>

            <Divider sx={{ my: 1 }} />

            <ListItemButton
              onClick={() => { isGuest ? router.push('/login') : handleSignOut(); setShowMobileMenu(false) }}
              sx={{ borderRadius: 2, color: isGuest ? 'primary.main' : 'error.main' }}
            >
              <ListItemIcon sx={{ color: 'inherit' }}><LogoutOutlinedIcon /></ListItemIcon>
              <ListItemText
                primary={isGuest ? 'Sign In / Register' : 'Sign Out'}
                primaryTypographyProps={{ fontWeight: 600 }}
              />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>

      {/* ── Categories Drawer ── */}
      <Drawer anchor="left" open={showCategoriesSidebar} onClose={() => setShowCategoriesSidebar(false)} PaperProps={{ sx: { width: 300 } }}>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CategoryOutlinedIcon sx={{ color: BRAND }} />
              <Typography variant="h6" fontWeight={700}>Categories</Typography>
            </Box>
            <IconButton onClick={() => setShowCategoriesSidebar(false)}><CloseIcon /></IconButton>
          </Box>

          <List disablePadding>
            <ListItemButton
              onClick={() => { setSearchQuery(''); setShowCategoriesSidebar(false) }}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon><InventoryOutlinedIcon sx={{ color: BRAND }} /></ListItemIcon>
              <ListItemText primary="All Products" primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }} />
            </ListItemButton>

            {categories.map(cat => (
              <ListItemButton
                key={cat.id}
                onClick={() => { setSearchQuery(cat.name.toLowerCase()); setShowCategoriesSidebar(false) }}
                sx={{ borderRadius: 2, mb: 0.5 }}
              >
                <ListItemIcon><CategoryOutlinedIcon sx={{ color: BRAND }} /></ListItemIcon>
                <ListItemText primary={cat.name} primaryTypographyProps={{ fontWeight: 600, fontSize: 15 }} />
              </ListItemButton>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* ── Main content ── */}
      <Box component="main">
        {renderContent()}
      </Box>

      {/* Cart slide-over */}
      {showCart && <CartPage onClose={() => setShowCart(false)} />}

      {/* Footer */}
      <CustomerFooter />

    </Box>
  )
}
