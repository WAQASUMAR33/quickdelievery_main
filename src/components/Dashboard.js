'use client'

import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { ShoppingCart, Package, TrendingUp, Users, Store, Truck, CreditCard, AlertCircle } from 'lucide-react'

const Dashboard = () => {
  const { user, userData } = useAuth()

  const getStats = () => {
    const userRole = userData?.role || 'CUSTOMER'
    
    if (userRole === 'ADMIN') {
      return [
        { title: 'Total Orders', value: '1,234', icon: ShoppingCart, color: 'from-blue-500 to-blue-600', change: '+12%' },
        { title: 'Active Vendors', value: '45', icon: Store, color: 'from-green-500 to-green-600', change: '+5%' },
        { title: 'Total Revenue', value: '$12,345', icon: TrendingUp, color: 'from-purple-500 to-purple-600', change: '+18%' },
        { title: 'Active Drivers', value: '23', icon: Truck, color: 'from-orange-500 to-orange-600', change: '+3%' },
        { title: 'Products', value: '567', icon: Package, color: 'from-pink-500 to-pink-600', change: '+8%' },
        { title: 'Customers', value: '890', icon: Users, color: 'from-indigo-500 to-indigo-600', change: '+15%' }
      ]
    }
    
    if (userRole === 'VENDOR') {
      return [
        { title: 'My Orders', value: '156', icon: ShoppingCart, color: 'from-blue-500 to-blue-600', change: '+12%' },
        { title: 'My Products', value: '89', icon: Package, color: 'from-green-500 to-green-600', change: '+5%' },
        { title: 'Revenue', value: '$3,456', icon: TrendingUp, color: 'from-purple-500 to-purple-600', change: '+18%' },
        { title: 'Pending Orders', value: '12', icon: AlertCircle, color: 'from-orange-500 to-orange-600', change: '+3%' }
      ]
    }
    
    if (userRole === 'DRIVER') {
      return [
        { title: 'Deliveries Today', value: '8', icon: Truck, color: 'from-blue-500 to-blue-600', change: '+2' },
        { title: 'Completed', value: '6', icon: ShoppingCart, color: 'from-green-500 to-green-600', change: '+1' },
        { title: 'Pending', value: '2', icon: AlertCircle, color: 'from-orange-500 to-orange-600', change: '+1' },
        { title: 'Earnings', value: '$156', icon: CreditCard, color: 'from-purple-500 to-purple-600', change: '+$24' }
      ]
    }
    
    // CUSTOMER
    return [
      { title: 'My Orders', value: '12', icon: ShoppingCart, color: 'from-blue-500 to-blue-600', change: '+1' },
      { title: 'Favorites', value: '8', icon: Package, color: 'from-green-500 to-green-600', change: '+2' },
      { title: 'Total Spent', value: '$456', icon: CreditCard, color: 'from-purple-500 to-purple-600', change: '+$89' }
    ]
  }

  const stats = getStats()

  const getRecentActivity = () => {
    const userRole = userData?.role || 'CUSTOMER'
    
    if (userRole === 'ADMIN') {
      return [
        { action: 'New vendor registration', time: '2 minutes ago', status: 'success' },
        { action: 'Order #1234 completed', time: '5 minutes ago', status: 'success' },
        { action: 'Driver assigned to delivery', time: '10 minutes ago', status: 'info' },
        { action: 'Payment dispute resolved', time: '15 minutes ago', status: 'success' },
        { action: 'Low inventory alert', time: '20 minutes ago', status: 'warning' }
      ]
    }
    
    if (userRole === 'VENDOR') {
      return [
        { action: 'New order received', time: '2 minutes ago', status: 'success' },
        { action: 'Product approved', time: '15 minutes ago', status: 'success' },
        { action: 'Payment received', time: '1 hour ago', status: 'success' },
        { action: 'Customer review', time: '2 hours ago', status: 'info' },
        { action: 'Inventory low warning', time: '3 hours ago', status: 'warning' }
      ]
    }
    
    if (userRole === 'DRIVER') {
      return [
        { action: 'New delivery assigned', time: '5 minutes ago', status: 'success' },
        { action: 'Delivery completed', time: '30 minutes ago', status: 'success' },
        { action: 'Route optimized', time: '1 hour ago', status: 'info' },
        { action: 'Payment received', time: '2 hours ago', status: 'success' }
      ]
    }
    
    // CUSTOMER
    return [
      { action: 'Order placed successfully', time: '1 hour ago', status: 'success' },
      { action: 'Order out for delivery', time: '2 hours ago', status: 'info' },
      { action: 'Payment processed', time: '2 hours ago', status: 'success' },
      { action: 'Product added to favorites', time: '1 day ago', status: 'info' }
    ]
  }

  const recentActivity = getRecentActivity()

  return (
    <div>
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-4">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
            className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center"
          >
            <span className="text-white font-bold text-xl">
              {user?.displayName?.charAt(0) || 'U'}
            </span>
          </motion.div>
          <div>
            <h2 className="text-3xl font-bold text-gray-800">
              Welcome back, {user?.displayName || 'User'}!
            </h2>
            <p className="text-gray-600">
              Here&apos;s what&apos;s happening with your {userData?.role?.toLowerCase() || 'customer'} account today.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8"
      >
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-gray-50 to-transparent rounded-full blur-xl" />
            
            <div className="relative z-10">
              <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-1">
                    {stat.value}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {stat.title}
                  </p>
                </div>
                <span className="text-green-600 text-sm font-semibold">
                  {stat.change}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <h3 className="text-xl font-bold text-gray-800 mb-6">Recent Activity</h3>
        
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-400' :
                  activity.status === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                }`} />
                <span className="text-gray-700 font-medium">{activity.action}</span>
              </div>
              <span className="text-gray-500 text-sm">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}

export default Dashboard
