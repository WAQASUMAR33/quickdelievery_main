'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  Users, 
  Store, 
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Filter,
  Calendar,
  Download,
  RefreshCw,
  AlertTriangle,
  Star,
  Zap
} from 'lucide-react'

const AdminProductAnalytics = () => {
  const { userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [analyticsData, setAnalyticsData] = useState({
    products: [],
    categories: [],
    vendors: [],
    orders: [],
    revenue: 0,
    totalProducts: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    totalVendors: 0,
    activeVendors: 0,
    totalRevenue: 0,
    monthlyRevenue: [],
    categoryStats: [],
    vendorStats: [],
    recentActivity: []
  })

  const [timeFilter, setTimeFilter] = useState('7d')
  const [categoryFilter, setCategoryFilter] = useState('all')

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setRefreshing(true)
      
      // Fetch all products
      const productsResponse = await fetch('/api/products?type=products')
      const productsResult = await productsResponse.json()
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/products?type=categories')
      const categoriesResult = await categoriesResponse.json()
      
      // Fetch users (vendors)
      const usersResponse = await fetch('/api/users')
      const usersResult = await usersResponse.json()
      
      if (productsResult.success && categoriesResult.success && usersResult.success) {
        const products = productsResult.data || []
        const categories = categoriesResult.data || []
        const vendors = usersResult.data?.filter(user => user.role === 'VENDOR') || []
        
        // Calculate analytics
        const totalProducts = products.length
        const approvedProducts = products.filter(p => p.approvalStatus === 'Approved').length
        const pendingProducts = products.filter(p => p.approvalStatus === 'Pending').length
        const rejectedProducts = products.filter(p => p.approvalStatus === 'Rejected').length
        const activeVendors = vendors.filter(v => v.status === 'active').length
        const totalRevenue = products.reduce((sum, p) => sum + (p.price * p.stock), 0)
        
        // Calculate category statistics
        const categoryStats = categories.map(category => {
          const categoryProducts = products.filter(p => p.catId === category.id)
          const categoryRevenue = categoryProducts.reduce((sum, p) => sum + (p.price * p.stock), 0)
          return {
            id: category.id,
            name: category.name,
            productCount: categoryProducts.length,
            revenue: categoryRevenue,
            approvedCount: categoryProducts.filter(p => p.approvalStatus === 'Approved').length,
            pendingCount: categoryProducts.filter(p => p.approvalStatus === 'Pending').length
          }
        }).sort((a, b) => b.revenue - a.revenue)
        
        // Calculate vendor statistics
        const vendorStats = vendors.map(vendor => {
          const vendorProducts = products.filter(p => p.vendorId === vendor.uid)
          const vendorRevenue = vendorProducts.reduce((sum, p) => sum + (p.price * p.stock), 0)
          return {
            id: vendor.uid,
            name: vendor.username,
            productCount: vendorProducts.length,
            revenue: vendorRevenue,
            approvedCount: vendorProducts.filter(p => p.approvalStatus === 'Approved').length,
            pendingCount: vendorProducts.filter(p => p.approvalStatus === 'Pending').length,
            status: vendor.status
          }
        }).sort((a, b) => b.revenue - a.revenue)
        
        // Generate recent activity
        const recentActivity = [
          ...products.slice(0, 5).map(product => ({
            type: 'product',
            action: `Product "${product.proName}" ${product.approvalStatus.toLowerCase()}`,
            time: new Date(product.createdAt || Date.now()).toLocaleString(),
            status: product.approvalStatus === 'Approved' ? 'success' : 
                   product.approvalStatus === 'Pending' ? 'warning' : 'error',
            icon: product.approvalStatus === 'Approved' ? CheckCircle : 
                  product.approvalStatus === 'Pending' ? Clock : XCircle
          })),
          ...vendors.slice(0, 3).map(vendor => ({
            type: 'vendor',
            action: `Vendor "${vendor.username}" ${vendor.status === 'active' ? 'activated' : 'registered'}`,
            time: new Date(vendor.createdAt || Date.now()).toLocaleString(),
            status: vendor.status === 'active' ? 'success' : 'info',
            icon: Store
          }))
        ].sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8)
        
        setAnalyticsData({
          products,
          categories,
          vendors,
          orders: [],
          revenue: totalRevenue,
          totalProducts,
          approvedProducts,
          pendingProducts,
          rejectedProducts,
          totalVendors: vendors.length,
          activeVendors,
          totalRevenue,
          monthlyRevenue: [],
          categoryStats,
          vendorStats,
          recentActivity
        })
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error)
      if (window.addNotification) {
        window.addNotification('Failed to load analytics data', 'error')
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100'
      case 'warning': return 'text-yellow-600 bg-yellow-100'
      case 'error': return 'text-red-600 bg-red-100'
      case 'info': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4" />
      case 'warning': return <Clock className="w-4 h-4" />
      case 'error': return <XCircle className="w-4 h-4" />
      case 'info': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Product Analytics</h2>
          <p className="text-gray-600 mt-1">Comprehensive insights into your product ecosystem</p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={fetchAnalyticsData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Products</p>
              <p className="text-3xl font-bold">{formatNumber(analyticsData.totalProducts)}</p>
              <p className="text-blue-100 text-sm mt-1">
                {analyticsData.approvedProducts} approved
              </p>
            </div>
            <Package className="w-12 h-12 text-blue-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Approval Rate</p>
              <p className="text-3xl font-bold">
                {analyticsData.totalProducts > 0 
                  ? Math.round((analyticsData.approvedProducts / analyticsData.totalProducts) * 100)
                  : 0}%
              </p>
              <p className="text-green-100 text-sm mt-1">
                {analyticsData.pendingProducts} pending
              </p>
            </div>
            <CheckCircle className="w-12 h-12 text-green-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Total Revenue</p>
              <p className="text-3xl font-bold">{formatCurrency(analyticsData.totalRevenue)}</p>
              <p className="text-purple-100 text-sm mt-1">
                From {analyticsData.totalProducts} products
              </p>
            </div>
            <DollarSign className="w-12 h-12 text-purple-200" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02, y: -2 }}
          className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white shadow-lg"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Active Vendors</p>
              <p className="text-3xl font-bold">{analyticsData.activeVendors}</p>
              <p className="text-orange-100 text-sm mt-1">
                Out of {analyticsData.totalVendors} total
              </p>
            </div>
            <Store className="w-12 h-12 text-orange-200" />
          </div>
        </motion.div>
      </motion.div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Product Status Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Product Status</h3>
            <PieChart className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-medium text-gray-900">Approved</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-600">{analyticsData.approvedProducts}</p>
                <p className="text-sm text-gray-500">
                  {analyticsData.totalProducts > 0 
                    ? Math.round((analyticsData.approvedProducts / analyticsData.totalProducts) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Clock className="w-6 h-6 text-yellow-600" />
                <span className="font-medium text-gray-900">Pending</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-yellow-600">{analyticsData.pendingProducts}</p>
                <p className="text-sm text-gray-500">
                  {analyticsData.totalProducts > 0 
                    ? Math.round((analyticsData.pendingProducts / analyticsData.totalProducts) * 100)
                    : 0}%
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="font-medium text-gray-900">Rejected</span>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-red-600">{analyticsData.rejectedProducts}</p>
                <p className="text-sm text-gray-500">
                  {analyticsData.totalProducts > 0 
                    ? Math.round((analyticsData.rejectedProducts / analyticsData.totalProducts) * 100)
                    : 0}%
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Top Categories */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Top Categories</h3>
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {analyticsData.categoryStats.slice(0, 5).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-sm">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    <p className="text-sm text-gray-500">{category.productCount} products</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-900">{formatCurrency(category.revenue)}</p>
                  <p className="text-sm text-gray-500">{category.approvedCount} approved</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Vendors */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Top Performing Vendors</h3>
          <Users className="w-6 h-6 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analyticsData.vendorStats.slice(0, 6).map((vendor, index) => (
            <motion.div
              key={vendor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="p-4 bg-gray-50 rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {vendor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="font-medium text-gray-900">{vendor.name}</span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  vendor.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {vendor.status}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Products:</span>
                  <span className="font-medium">{vendor.productCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Revenue:</span>
                  <span className="font-bold text-green-600">{formatCurrency(vendor.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Approved:</span>
                  <span className="font-medium text-green-600">{vendor.approvedCount}</span>
                </div>
                {vendor.pendingCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Pending:</span>
                    <span className="font-medium text-yellow-600">{vendor.pendingCount}</span>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
          <Activity className="w-6 h-6 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          {analyticsData.recentActivity.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(activity.status)}`}>
                  {getStatusIcon(activity.status)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.time}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                {activity.status}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default AdminProductAnalytics
