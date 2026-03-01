'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Button,
  Grid,
  Box,
  Chip,
  IconButton,
  Rating,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Slider,
  Switch,
  FormControlLabel,
  AppBar,
  Toolbar,
  Badge,
  Avatar,
  Menu,
  Container,
  Paper,
  Stack,
  Fab
} from '@mui/material'
import {
  Search,
  FilterList,
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  Star,
  Store,
  Person,
  Notifications,
  Menu as MenuIcon,
  Close,
  Logout
} from '@mui/icons-material'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const MaterialProductCatalog = ({ searchQuery, onAddToCart, onToggleFavorite, favorites }) => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [selectedVendor, setSelectedVendor] = useState('')
  const [priceRange, setPriceRange] = useState([0, 100000])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      console.log('Fetching products from database...')

      const response = await fetch('/api/products?type=products')
      const data = await response.json()
      
      console.log('API Response:', data)
      
      if (data.success && data.data) {
        console.log('Products found:', data.data.length)
        console.log('Raw products data:', data.data)
        // Filter for active and approved products only
        const activeProducts = data.data.filter(product => 
          product && 
          product.proName && 
          product.price && 
          product.status === true && 
          product.approvalStatus === 'Approved'
        )
        console.log('Active approved products:', activeProducts.length)
        console.log('Filtered products:', activeProducts)
        
        // If no approved products, show all products for debugging
        if (activeProducts.length === 0) {
          console.log('No approved products found, showing all products for debugging')
          const allProducts = data.data.filter(product => 
            product && product.proName && product.price
          )
          setProducts(allProducts)
        } else {
          setProducts(activeProducts)
        }
      } else {
        console.log('No products found in API response')
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('Fetching categories from original API...')
      const response = await fetch('/api/products?type=categories')
      const data = await response.json()
      
      console.log('Categories API Response:', data)
      
      if (data.success && data.data && data.data.length > 0) {
        console.log('Fetched categories from original API:', data.data.length)
        setCategories(data.data)
      } else {
        console.log('No real categories found')
    
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    
    }
  }

  // Fetch subcategories when category changes
  useEffect(() => {
    const fetchSubcategories = async () => {
      try {
        if (!selectedCategory) {
          setSubcategories([])
          setSelectedSubcategory('')
          return
        }
        const response = await fetch(`/api/products?type=subcategories&categoryId=${selectedCategory}`)
        const data = await response.json()
        if (data.success && Array.isArray(data.data)) {
          setSubcategories(data.data)
          setSelectedSubcategory('')
        } else {
          setSubcategories([])
        }
      } catch (err) {
        console.error('Error fetching subcategories:', err)
        setSubcategories([])
      }
    }
    fetchSubcategories()
  }, [selectedCategory])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.proName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = !selectedCategory || product.catId === selectedCategory
    const matchesSubcategory = !selectedSubcategory || product.subCatId === Number(selectedSubcategory)
    const matchesVendor = !selectedVendor || product.vendorId === selectedVendor
    const productPrice = parseFloat(product.price) || 0
    const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1]
    
    return matchesSearch && matchesCategory && matchesSubcategory && matchesVendor && matchesPrice
  })

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (parseFloat(a.price) || 0) - (parseFloat(b.price) || 0)
      case 'price-high':
        return (parseFloat(b.price) || 0) - (parseFloat(a.price) || 0)
      case 'rating':
        return (b.reviews?.length || 0) - (a.reviews?.length || 0)
      case 'newest':
      default:
        return new Date(b.createdAt) - new Date(a.createdAt)
    }
  })

  const ProductCard = ({ product, index }) => {
    const isFavorite = favorites.find(fav => fav.proId === product.proId)
    const averageRating = product.reviews?.length ? 
      product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length : 0

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        whileHover={{ y: -5 }}
      >
        <Card 
          sx={{ 
            height: '100%', 
            display: 'flex', 
            flexDirection: 'column',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-8px)',
              boxShadow: 6
            }
          }}
        >
          <Box sx={{ position: 'relative' }}>
            <CardMedia
              component="img"
              height="200"
              image={product.proImages?.[0] || '/placeholder-product.jpg'}
              alt={product.proName}
              sx={{ objectFit: 'cover' }}
            />
            <IconButton
              onClick={() => onToggleFavorite(product)}
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
              {isFavorite ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            {product.discount > 0 && (
              <Chip
                label={`-${product.discount}%`}
                color="error"
                size="small"
                sx={{ position: 'absolute', top: 8, left: 8 }}
              />
            )}
          </Box>
          
          <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {product.category?.name}
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {product.proName}
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              mb: 2
            }}>
              {product.description}
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating value={averageRating} readOnly size="small" />
              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                ({product.reviews?.length || 0})
              </Typography>
            </Box>
            
            <Box sx={{ mt: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="primary" fontWeight="bold">
                  ${product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price) ? parseFloat(product.salePrice) : parseFloat(product.price)}
                  {product.salePrice && parseFloat(product.salePrice) < parseFloat(product.price) && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ textDecoration: 'line-through', ml: 1 }}>
                      ${parseFloat(product.price)}
                    </Typography>
                  )}
                </Typography>
                
                <Button
                  variant="contained"
                  startIcon={<ShoppingCart />}
                  onClick={() => onAddToCart(product)}
                  size="small"
                >
                  Add
                </Button>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                  Sold by: <strong>{product.vendor?.businessName || 'Unknown Vendor'}</strong>
                </Typography>
                {product.vendor?.role === 'ADMIN' && (
                  <Chip label="Official Store" color="success" size="small" />
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <LoadingSpinner size="lg" text="Loading products..." />
      </Box>
    )
  }

  console.log('MaterialProductCatalog products:', products.length)
  console.log('MaterialProductCatalog categories:', categories.length)
  console.log('MaterialProductCatalog products data:', products)
  console.log('MaterialProductCatalog filtered products:', filteredProducts.length)
  console.log('MaterialProductCatalog sorted products:', sortedProducts.length)

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight="bold">
          Products
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {filteredProducts.length} products found
        </Typography>
      </Box>

      {/* Filters and Controls */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center" justifyContent="space-between">
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
              size="small"
              sx={{ minWidth: 300 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Sort by</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="Sort by"
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="price-low">Price: Low to High</MenuItem>
                <MenuItem value="price-high">Price: High to Low</MenuItem>
                <MenuItem value="rating">Highest Rated</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            Filters
          </Button>
        </Stack>
      </Paper>

      {/* Category and Subcategory Tabs */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        {/* Categories */}
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
          <Chip
            label="All"
            onClick={() => { setSelectedCategory(''); setSelectedSubcategory('') }}
            color={selectedCategory === '' ? 'primary' : 'default'}
            variant={selectedCategory === '' ? 'filled' : 'outlined'}
            clickable
          />
          {categories.map((cat) => (
            <Chip
              key={cat.id}
              label={cat.name}
              onClick={() => setSelectedCategory(cat.id)}
              color={selectedCategory === cat.id ? 'primary' : 'default'}
              variant={selectedCategory === cat.id ? 'filled' : 'outlined'}
              clickable
            />
          ))}
        </Stack>

        {/* Subcategories */}
        {selectedCategory && (
          <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 1 }}>
            <Chip
              label="All Subcategories"
              onClick={() => setSelectedSubcategory('')}
              color={selectedSubcategory === '' ? 'secondary' : 'default'}
              variant={selectedSubcategory === '' ? 'filled' : 'outlined'}
              clickable
              size="small"
            />
            {subcategories.map((sub) => (
              <Chip
                key={sub.subCatId}
                label={sub.subCatName}
                onClick={() => setSelectedSubcategory(String(sub.subCatId))}
                color={selectedSubcategory === String(sub.subCatId) ? 'secondary' : 'default'}
                variant={selectedSubcategory === String(sub.subCatId) ? 'filled' : 'outlined'}
                clickable
                size="small"
              />
            ))}
          </Stack>
        )}
      </Stack>

      <Box sx={{ display: 'flex', gap: 3 }}>
        {/* Filters Sidebar */}
        <Drawer
          anchor="left"
          open={showFilters}
          onClose={() => setShowFilters(false)}
          sx={{
            '& .MuiDrawer-paper': {
              width: 300,
              position: 'relative',
              height: 'auto',
              boxShadow: 'none',
              border: 'none'
            }
          }}
        >
          <Paper sx={{ p: 3, height: 'fit-content' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Filters</Typography>
              <IconButton onClick={() => setShowFilters(false)}>
                <Close />
              </IconButton>
            </Box>
            
            {/* Category Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Category</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  <MenuItem value="">All Categories</MenuItem>
                  {categories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      {category.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>

            {/* Vendor Filter */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>Vendor</Typography>
              <FormControl fullWidth size="small">
                <InputLabel>Vendor</InputLabel>
                <Select
                  value={selectedVendor}
                  onChange={(e) => setSelectedVendor(e.target.value)}
                  label="Vendor"
                >
                  <MenuItem value="">All Vendors</MenuItem>
                  {Array.from(new Set(products.map(p => p.vendor?.businessName).filter(Boolean))).map((vendorName) => {
                    const vendor = products.find(p => p.vendor?.businessName === vendorName)?.vendor
                    return (
                      <MenuItem key={vendor?.id} value={vendor?.id}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {vendorName}
                          {vendor?.role === 'ADMIN' && (
                            <Chip label="Official" color="success" size="small" />
                          )}
                        </Box>
                      </MenuItem>
                    )
                  })}
                </Select>
              </FormControl>
            </Box>
            
            {/* Price Range */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Price Range: ${priceRange[0]} - ${priceRange[1]}
              </Typography>
              <Slider
                value={priceRange}
                onChange={(e, newValue) => setPriceRange(newValue)}
                valueLabelDisplay="auto"
                min={0}
                max={100000}
                step={1000}
              />
            </Box>
          </Paper>
        </Drawer>

        {/* Products Grid */}
        <Box sx={{ flexGrow: 1 }}>
          {sortedProducts.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                No products found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search or filters
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {sortedProducts.map((product, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.proId}>
                  <ProductCard product={product} index={index} />
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      </Box>
    </Container>
  )
}

export default MaterialProductCatalog
