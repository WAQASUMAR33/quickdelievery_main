'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Badge,
  Avatar,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Container,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Stack,
  Chip,
  Fab
} from '@mui/material'
import {
  Search,
  ShoppingCart,
  Favorite,
  Person,
  Notifications,
  Menu as MenuIcon,
  Close,
  Logout,
  Store,
  Inventory,
  ShoppingBag
} from '@mui/icons-material'
import MaterialProductCatalog from '@/components/customer/MaterialProductCatalog'
import OrderHistory from '@/components/customer/OrderHistory'
import CustomerProfile from '@/components/customer/CustomerProfile'
import CustomerHero from '@/components/customer/CustomerHero'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const MaterialCustomerDashboard = () => {
  const { user, userData, signOut } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('products')
  const [searchQuery, setSearchQuery] = useState('')
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [cartItems, setCartItems] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [anchorEl, setAnchorEl] = useState(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
    } else {
      setLoading(false)
    }
  }, [user, router])

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/login')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  const handleAddToCart = (product) => {
    const existingItem = cartItems.find(item => item.proId === product.proId)
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.proId === product.proId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCartItems([...cartItems, { ...product, quantity: 1 }])
    }
  }

  const handleToggleFavorite = (product) => {
    const isFavorite = favorites.find(fav => fav.proId === product.proId)
    if (isFavorite) {
      setFavorites(favorites.filter(fav => fav.proId !== product.proId))
    } else {
      setFavorites([...favorites, product])
    }
  }

  const tabs = [
    { id: 'products', label: 'Products', icon: Inventory },
    { id: 'orders', label: 'My Orders', icon: ShoppingBag },
    { id: 'favorites', label: 'Favorites', icon: Favorite },
    { id: 'profile', label: 'Profile', icon: Person }
  ]

  const renderContent = () => {
    switch (activeTab) {
      case 'products':
        return (
          <Box>
            <CustomerHero />
            <MaterialProductCatalog 
              searchQuery={searchQuery}
              onAddToCart={handleAddToCart}
              onToggleFavorite={handleToggleFavorite}
              favorites={favorites}
            />
          </Box>
        )
      case 'orders':
        return (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <OrderHistory />
          </Container>
        )
      case 'favorites':
        return (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Favorite sx={{ fontSize: 64, color: 'error.main', mb: 2 }} />
              <Typography variant="h4" component="h2" gutterBottom fontWeight="bold">
                My Favorites
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Products you&apos;ve saved for later
              </Typography>
            </Box>
            {favorites.length === 0 ? (
              <Paper sx={{ p: 8, textAlign: 'center' }}>
                <Favorite sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  No favorites yet
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Start adding products to your favorites!
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 3 }}>
                {favorites.map((product, index) => (
                  <motion.div
                    key={product.proId}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                  >
                    <Paper sx={{ overflow: 'hidden', height: '100%' }}>
                      <Box sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={product.proImages?.[0] || '/placeholder-product.jpg'}
                          alt={product.proName}
                          sx={{
                            width: '100%',
                            height: 200,
                            objectFit: 'cover'
                          }}
                        />
                        <IconButton
                          onClick={() => handleToggleFavorite(product)}
                          sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            '&:hover': {
                              backgroundColor: 'rgba(255, 255, 255, 1)',
                            }
                          }}
                        >
                          <Favorite color="error" />
                        </IconButton>
                      </Box>
                      <Box sx={{ p: 2 }}>
                        <Typography variant="h6" component="h3" gutterBottom>
                          {product.proName}
                        </Typography>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="h6" color="primary" fontWeight="bold">
                            ${product.price}
                          </Typography>
                          <Button
                            variant="contained"
                            startIcon={<ShoppingCart />}
                            onClick={() => handleAddToCart(product)}
                            size="small"
                          >
                            Add to Cart
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </motion.div>
                ))}
              </Box>
            )}
          </Container>
        )
      case 'profile':
        return (
          <Container maxWidth="xl" sx={{ py: 4 }}>
            <CustomerProfile />
          </Container>
        )
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Box sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: 'grey.50'
      }}>
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </Box>
    )
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="sticky" elevation={2}>
        <Toolbar>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
            <Store sx={{ mr: 1 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              QuickDelivery
            </Typography>
          </Box>

          {/* Search Bar */}
          <TextField
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            size="small"
            sx={{ 
              flexGrow: 1, 
              maxWidth: 600,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 1,
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'white',
                },
              },
              '& .MuiInputBase-input': {
                color: 'white',
                '&::placeholder': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
              },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
                </InputAdornment>
              ),
            }}
          />

          {/* Navigation Dropdown */}
          <Box sx={{ mx: 2 }}>
            <Button
              variant="outlined"
              sx={{ 
                color: 'white', 
                borderColor: 'rgba(255, 255, 255, 0.5)',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              {tabs.find(tab => tab.id === activeTab)?.label || 'Products'}
            </Button>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
            >
              {tabs.map((tab) => (
                <MenuItem 
                  key={tab.id} 
                  onClick={() => {
                    setActiveTab(tab.id)
                    setAnchorEl(null)
                  }}
                  selected={activeTab === tab.id}
                >
                  <ListItemIcon>
                    <tab.icon />
                  </ListItemIcon>
                  <ListItemText>{tab.label}</ListItemText>
                </MenuItem>
              ))}
            </Menu>
          </Box>

          <Box sx={{ flexGrow: 1 }} />

          {/* Right Side Actions */}
          <Stack direction="row" spacing={1} alignItems="center">
            {/* User Info */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
                {user?.displayName?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="body2" sx={{ color: 'white', fontWeight: 'medium' }}>
                  {user?.displayName || 'User'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                  Customer
                </Typography>
              </Box>
            </Box>

            {/* Cart */}
            <IconButton color="inherit">
              <Badge badgeContent={cartItems.length} color="error">
                <ShoppingCart />
              </Badge>
            </IconButton>

            {/* Notifications */}
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <Notifications />
              </Badge>
            </IconButton>

            {/* Sign Out */}
            <IconButton color="inherit" onClick={handleSignOut}>
              <Logout />
            </IconButton>

            {/* Mobile Menu Button */}
            <IconButton
              color="inherit"
              onClick={() => setShowMobileMenu(true)}
              sx={{ display: { xs: 'block', md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
          </Stack>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Box>

      {/* Mobile Menu Drawer */}
      <Drawer
        anchor="right"
        open={showMobileMenu}
        onClose={() => setShowMobileMenu(false)}
      >
        <Box sx={{ width: 280, p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">Menu</Typography>
            <IconButton onClick={() => setShowMobileMenu(false)}>
              <Close />
            </IconButton>
          </Box>
          
          <List>
            {tabs.map((tab) => (
              <ListItem
                key={tab.id}
                button
                onClick={() => {
                  setActiveTab(tab.id)
                  setShowMobileMenu(false)
                }}
                selected={activeTab === tab.id}
              >
                <ListItemIcon>
                  <tab.icon />
                </ListItemIcon>
                <ListItemText primary={tab.label} />
              </ListItem>
            ))}
            
            <Divider sx={{ my: 1 }} />
            
            <ListItem button onClick={handleSignOut}>
              <ListItemIcon>
                <Logout color="error" />
              </ListItemIcon>
              <ListItemText primary="Sign Out" sx={{ color: 'error.main' }} />
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Floating Action Button for Mobile */}
      <Fab
        color="primary"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }
        }}
        onClick={() => setShowMobileMenu(true)}
      >
        <MenuIcon />
      </Fab>
    </Box>
  )
}

export default MaterialCustomerDashboard
