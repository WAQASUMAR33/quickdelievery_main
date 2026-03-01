'use client'

import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  TrendingDown,
  Package, 
  Users,
  DollarSign,
  ShoppingCart,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  PieChart,
  Activity,
  Eye,
  Star,
  Calendar,
  Filter
} from 'lucide-react'

const AnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    totalCategories: 0,
    totalSubcategories: 0,
    pendingApprovals: 0,
    approvedProducts: 0,
    rejectedProducts: 0,
    lowStockProducts: 0,
    totalValue: 0,
    categoryDistribution: [],
    approvalTrends: [],
    topProducts: [],
    recentActivity: []
  })
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7d')
  const [chartType, setChartType] = useState('line')

  // Fetch analytics data from database
  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all data in parallel
      const [productsRes, categoriesRes, subcategoriesRes] = await Promise.all([
        fetch('/api/products?type=products'),
        fetch('/api/products?type=categories'),
        fetch('/api/products?type=subcategories')
      ])

      const [productsResult, categoriesResult, subcategoriesResult] = await Promise.all([
        productsRes.json(),
        categoriesRes.json(),
        subcategoriesRes.json()
      ])

      if (productsResult.success && categoriesResult.success && subcategoriesResult.success) {
        const products = productsResult.data || []
        const categories = categoriesResult.data || []
        const subcategories = subcategoriesResult.data || []

        // Calculate analytics
        const totalProducts = products.length
        const totalCategories = categories.length
        const totalSubcategories = subcategories.length
        const pendingApprovals = products.filter(p => p.approvalStatus === 'Pending').length
        const approvedProducts = products.filter(p => p.approvalStatus === 'Approved').length
        const rejectedProducts = products.filter(p => p.approvalStatus === 'Rejected').length
        const lowStockProducts = products.filter(p => p.stock < 10).length
        const totalValue = products.reduce((sum, p) => sum + (parseFloat(p.price) * p.stock), 0)

        // Category distribution
        const categoryDistribution = categories.map(category => {
          const productCount = products.filter(p => p.catId === category.id).length
          const percentage = totalProducts > 0 ? (productCount / totalProducts) * 100 : 0
          return {
            name: category.name,
            count: productCount,
            percentage: parseFloat(percentage.toFixed(1))
          }
        }).sort((a, b) => b.count - a.count)

        // Top products by price
        const topProducts = products
          .sort((a, b) => parseFloat(b.price) - parseFloat(a.price))
          .slice(0, 5)
          .map(product => ({
            name: product.proName,
            sales: Math.floor(Math.random() * 300) + 50, // Mock sales data
            revenue: parseFloat(product.price) * (Math.floor(Math.random() * 300) + 50)
          }))

        // Recent activity (mock data for now)
        const recentActivity = [
          { action: 'Product Approved', product: 'Latest Product', user: 'Admin User', time: '2 hours ago' },
          { action: 'Product Added', product: 'New Item', user: 'Vendor', time: '4 hours ago' },
          { action: 'Category Updated', product: 'Electronics', user: 'Admin User', time: '6 hours ago' }
        ]

        setAnalytics({
          totalProducts,
          totalCategories,
          totalSubcategories,
          pendingApprovals,
          approvedProducts,
          rejectedProducts,
          lowStockProducts,
          totalValue,
          categoryDistribution,
          approvalTrends: [], // Would need time-series data
          topProducts,
          recentActivity
        })
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  const statsCards = [
    {
      title: 'Total Products',
      value: analytics.totalProducts,
      icon: Package,
      color: 'blue',
      trend: '+12.5%'
    },
    {
      title: 'Categories',
      value: analytics.totalCategories,
      icon: BarChart3,
      color: 'green',
      trend: '+8.3%'
    },
    {
      title: 'Subcategories',
      value: analytics.totalSubcategories,
      icon: PieChart,
      color: 'purple',
      trend: '+15.7%'
    },
    {
      title: 'Pending Approvals',
      value: analytics.pendingApprovals,
      icon: Clock,
      color: 'yellow',
      trend: '-5.2%'
    },
    {
      title: 'Approved Products',
      value: analytics.approvedProducts,
      icon: CheckCircle,
      color: 'green',
      trend: '+23.1%'
    },
    {
      title: 'Low Stock Items',
      value: analytics.lowStockProducts,
      icon: TrendingDown,
      color: 'red',
      trend: '+3.4%'
    }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Product management insights and statistics</p>
        </div>
        
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          
          <select
            value={chartType}
            onChange={(e) => setChartType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900"
          >
            <option value="line">Line Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = {
            blue: 'bg-blue-500 text-blue-100',
            green: 'bg-green-500 text-green-100',
            purple: 'bg-purple-500 text-purple-100',
            yellow: 'bg-yellow-500 text-yellow-100',
            red: 'bg-red-500 text-red-100'
          }
          
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm border p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                    {stat.trend.startsWith('+') ? (
                      <TrendingUp className="w-3 h-3 text-green-500" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-red-500" />
                    )}
                    <span className={stat.trend.startsWith('+') ? 'text-green-500' : 'text-red-500'}>
                      {stat.trend}
                    </span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Charts and Data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Category Distribution</h3>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {analytics.categoryDistribution.map((category, index) => (
              <div key={category.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    index === 0 ? 'bg-blue-500' :
                    index === 1 ? 'bg-green-500' :
                    index === 2 ? 'bg-yellow-500' :
                    index === 3 ? 'bg-red-500' : 'bg-purple-500'
                  }`} />
                  <span className="text-sm font-medium text-gray-700">{category.name}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{category.count}</span>
                  <span className="text-xs text-gray-500 ml-2">({category.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl shadow-sm border p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Products</h3>
            <Star className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {analytics.topProducts.map((product, index) => (
              <div key={product.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-gray-600">{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.sales} sales</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  ${product.revenue.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Approval Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl shadow-sm border p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Approval Status Overview</h3>
          <Activity className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">{analytics.approvedProducts}</h4>
            <p className="text-sm text-gray-600">Approved Products</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">{analytics.pendingApprovals}</h4>
            <p className="text-sm text-gray-600">Pending Approval</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900">{analytics.rejectedProducts}</h4>
            <p className="text-sm text-gray-600">Rejected Products</p>
          </div>
        </div>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-xl shadow-sm border p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
          <Eye className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="space-y-4">
          {analytics.recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Activity className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                <p className="text-xs text-gray-600">{activity.product} • {activity.user}</p>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default AnalyticsDashboard