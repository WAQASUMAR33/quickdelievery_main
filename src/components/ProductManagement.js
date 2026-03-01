'use client'

import CategoryManagement from './CategoryManagement'
import VendorProductManagement from './VendorProductManagement'
import SubcategoryManagement from './SubcategoryManagement'
import AdminProductManagement from './AdminProductManagement'
import ProductApprovalSystem from './ProductApprovalSystem'
import AnalyticsDashboard from './AnalyticsDashboard'
import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { 
  Package, 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  ShoppingCart,
  Users,
  DollarSign,
  Filter,
  Search,
  Grid,
  List
} from 'lucide-react'

const ProductManagement = () => {
  const { userData } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('overview')
  const [viewMode, setViewMode] = useState('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const userRole = userData?.role || 'CUSTOMER'

  // Role-based access control
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN'
  const isVendor = userRole === 'VENDOR'
  const canManageProducts = isAdmin || isVendor

  if (!canManageProducts) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don&apos;t have permission to access product management.</p>
        </div>
      </div>
    )
  }

  const adminTabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'categories', label: 'Categories', icon: Package },
    { id: 'subcategories', label: 'Subcategories', icon: Package },
    { id: 'products', label: 'All Products', icon: ShoppingCart },
    { id: 'pending', label: 'Pending Approval', icon: Clock },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp }
  ]

  const vendorTabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'categories', label: 'Categories', icon: Package },
    { id: 'subcategories', label: 'Subcategories', icon: Package },
    { id: 'my-products', label: 'My Products', icon: ShoppingCart },
    { id: 'add-product', label: 'Add Product', icon: Plus }
  ]

  const tabs = isAdmin ? adminTabs : vendorTabs

  const stats = [
    { label: 'Total Products', value: '1,234', icon: Package, color: 'blue' },
    { label: 'Pending Approval', value: '23', icon: Clock, color: 'yellow' },
    { label: 'Active Categories', value: '15', icon: Package, color: 'green' },
    { label: 'Revenue', value: '$12,345', icon: DollarSign, color: 'purple' }
  ]

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-xl p-6 shadow-sm border border-gray-200"
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {[
            { action: 'New product added', user: 'John Doe', time: '2 hours ago', status: 'pending' },
            { action: 'Category updated', user: 'Admin', time: '4 hours ago', status: 'completed' },
            { action: 'Product approved', user: 'Admin', time: '6 hours ago', status: 'completed' },
            { action: 'New vendor registered', user: 'Jane Smith', time: '1 day ago', status: 'pending' }
          ].map((activity, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'completed' ? 'bg-green-500' : 'bg-yellow-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">by {activity.user}</p>
                </div>
              </div>
              <span className="text-sm text-gray-500">{activity.time}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  )

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview()
      case 'categories':
        return <CategoryManagement />
      case 'subcategories':
        return <SubcategoryManagement />
      case 'products':
        return <AdminProductManagement />
      case 'my-products':
        return <VendorProductManagement />
      case 'add-product':
        return <VendorProductManagement />
      case 'pending':
        return <ProductApprovalSystem />
      case 'analytics':
        return <AnalyticsDashboard />
      default:
        return renderOverview()
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-600 mt-1">
            {isAdmin ? 'Manage all products, categories, and approvals' : 'Manage your products and view categories'}
          </p>
        </div>
        
        {/* View Controls */}
        <div className="flex items-center space-x-4 mt-4 sm:mt-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* View Mode */}
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-xl shadow-sm border border-gray-200"
      >
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {renderTabContent()}
        </div>
      </motion.div>
    </div>
  )
}

export default ProductManagement
