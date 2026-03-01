'use client'

import React from 'react'
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Divider,
  IconButton,
  Button,
  Container,
} from '@mui/material'
import {
  ShoppingCart,
  Store,
  TrendingUp,
  LocalShipping,
  Package,
  People,
  MoreVert,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material'
import { useAuth } from '@/contexts/AuthContext'

const MaterialDashboard = () => {
  const { user, userData } = useAuth()

  const getStats = () => {
    const userRole = userData?.role || 'CUSTOMER'
    
    if (userRole === 'ADMIN') {
      return [
        { title: 'Total Orders', value: '1,234', icon: ShoppingCart, color: 'primary', change: '+12%', trend: 'up' },
        { title: 'Active Vendors', value: '45', icon: Store, color: 'success', change: '+5%', trend: 'up' },
        { title: 'Total Revenue', value: '$12,345', icon: TrendingUp, color: 'secondary', change: '+18%', trend: 'up' },
        { title: 'Active Drivers', value: '23', icon: LocalShipping, color: 'warning', change: '+3%', trend: 'up' },
        { title: 'Products', value: '567', icon: Package, color: 'info', change: '+8%', trend: 'up' },
        { title: 'Customers', value: '890', icon: People, color: 'error', change: '+15%', trend: 'up' }
      ]
    }
    
    if (userRole === 'VENDOR') {
      return [
        { title: 'My Orders', value: '156', icon: ShoppingCart, color: 'primary', change: '+12%', trend: 'up' },
        { title: 'My Products', value: '89', icon: Package, color: 'success', change: '+5%', trend: 'up' },
        { title: 'Revenue', value: '$3,456', icon: TrendingUp, color: 'secondary', change: '+18%', trend: 'up' },
        { title: 'Pending Orders', value: '12', icon: ShoppingCart, color: 'warning', change: '+3%', trend: 'up' }
      ]
    }
    
    return [
      { title: 'My Orders', value: '23', icon: ShoppingCart, color: 'primary', change: '+2%', trend: 'up' },
      { title: 'Favorites', value: '8', icon: Package, color: 'success', change: '+1%', trend: 'up' },
      { title: 'Total Spent', value: '$1,234', icon: TrendingUp, color: 'secondary', change: '+5%', trend: 'up' }
    ]
  }

  const getRecentActivity = () => {
    const userRole = userData?.role || 'CUSTOMER'
    
    if (userRole === 'ADMIN') {
      return [
        { id: 1, type: 'order', message: 'New order #1234 received', time: '2 minutes ago', icon: ShoppingCart },
        { id: 2, type: 'vendor', message: 'Vendor "Fresh Foods" registered', time: '15 minutes ago', icon: Store },
        { id: 3, type: 'product', message: 'Product "Organic Apples" approved', time: '1 hour ago', icon: Package },
        { id: 4, type: 'driver', message: 'Driver John completed delivery', time: '2 hours ago', icon: LocalShipping },
        { id: 5, type: 'revenue', message: 'Daily revenue target reached', time: '3 hours ago', icon: TrendingUp }
      ]
    }
    
    if (userRole === 'VENDOR') {
      return [
        { id: 1, type: 'order', message: 'New order #1234 for your products', time: '5 minutes ago', icon: ShoppingCart },
        { id: 2, type: 'product', message: 'Product "Fresh Salad" approved', time: '1 hour ago', icon: Package },
        { id: 3, type: 'revenue', message: 'Payment received: $234.50', time: '2 hours ago', icon: TrendingUp },
        { id: 4, type: 'order', message: 'Order #1233 completed', time: '3 hours ago', icon: ShoppingCart }
      ]
    }
    
    return [
      { id: 1, type: 'order', message: 'Order #1234 confirmed', time: '10 minutes ago', icon: ShoppingCart },
      { id: 2, type: 'delivery', message: 'Your order is out for delivery', time: '1 hour ago', icon: LocalShipping },
      { id: 3, type: 'product', message: 'New products available in your area', time: '2 hours ago', icon: Package }
    ]
  }

  const stats = getStats()
  const recentActivity = getRecentActivity()

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              bgcolor: 'primary.main',
              fontSize: '1.5rem',
              fontWeight: 'bold'
            }}
          >
            {user?.displayName?.charAt(0) || 'U'}
          </Avatar>
          <Box>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome back, {user?.displayName || 'User'}!
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Here&apos;s what&apos;s happening with your {userData?.role?.toLowerCase() || 'customer'} account today.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
              <Card 
                sx={{ 
                  height: '100%',
                  transition: 'transform 0.2s ease-in-out',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3
                  }
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography color="text.secondary" gutterBottom variant="body2">
                        {stat.title}
                      </Typography>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {stat.value}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        {stat.trend === 'up' ? (
                          <ArrowUpward sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
                        ) : (
                          <ArrowDownward sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
                        )}
                        <Typography 
                          variant="body2" 
                          color={stat.trend === 'up' ? 'success.main' : 'error.main'}
                        >
                          {stat.change}
                        </Typography>
                      </Box>
                    </Box>
                    <Avatar sx={{ bgcolor: `${stat.color}.main`, width: 48, height: 48 }}>
                      <Icon sx={{ fontSize: 24 }} />
                    </Avatar>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )
        })}
      </Grid>

      {/* Recent Activity */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" component="h2">
                  Recent Activity
                </Typography>
                <IconButton size="small">
                  <MoreVert />
                </IconButton>
              </Box>
              <List>
                {recentActivity.map((activity, index) => {
                  const Icon = activity.icon
                  return (
                    <React.Fragment key={activity.id}>
                      <ListItem alignItems="flex-start">
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                            <Icon sx={{ fontSize: 20 }} />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={activity.message}
                          secondary={activity.time}
                        />
                      </ListItem>
                      {index < recentActivity.length - 1 && <Divider variant="inset" component="li" />}
                    </React.Fragment>
                  )
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" component="h2" gutterBottom>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Button variant="contained" fullWidth startIcon={<Package />}>
                  Manage Products
                </Button>
                <Button variant="outlined" fullWidth startIcon={<ShoppingCart />}>
                  View Orders
                </Button>
                <Button variant="outlined" fullWidth startIcon={<People />}>
                  Manage Users
                </Button>
                <Button variant="outlined" fullWidth startIcon={<TrendingUp />}>
                  View Analytics
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}

export default MaterialDashboard
