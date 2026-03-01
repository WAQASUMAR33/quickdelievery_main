'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Search,
  Filter,
  Calendar,
  User,
  Package,
  AlertTriangle,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Star,
  Tag,
  Info
} from 'lucide-react'

const ProductApprovalSystem = () => {
  const { userData } = useAuth()
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState('pending')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterPriority, setFilterPriority] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterVendor, setFilterVendor] = useState('all')

  // Fetch products from database
  const fetchProducts = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products?type=products')
      const result = await response.json()
      
      if (result.success) {
        setProducts(result.data || [])
      } else {
        console.error('Failed to fetch products:', result.error)
        setProducts([])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const handleApproveProduct = async (productId, approvalStatus, notes = '') => {
    try {
      // Validate user data for approval
      if (approvalStatus === 'Approved' && !userData?.uid) {
        alert('Unable to approve product: User not authenticated')
        return
      }

      const requestBody = {
        type: 'approve-product',
        id: productId,
        approvalStatus: approvalStatus
      }

      // Only include approveById for approved products
      if (approvalStatus === 'Approved') {
        requestBody.approveById = userData?.uid
      }

      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      
      if (result.success) {
        fetchProducts() // Refresh the list
        setShowDetailsModal(false)
        setSelectedProduct(null)
        alert(`Product ${approvalStatus.toLowerCase()} successfully!`)
      } else {
        console.error('Failed to update approval status:', result.error)
        alert(`Failed to ${approvalStatus.toLowerCase()} product: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating approval status:', error)
      alert(`Error ${approvalStatus.toLowerCase()}ing product. Please try again.`)
    }
  }

  const handleViewDetails = (product) => {
    setSelectedProduct(product)
    setShowDetailsModal(true)
  }

  const getFilteredProducts = () => {
    return products.filter(product => {
      const matchesTab = 
        (activeTab === 'pending' && product.approvalStatus === 'Pending') ||
        (activeTab === 'approved' && product.approvalStatus === 'Approved') ||
        (activeTab === 'rejected' && product.approvalStatus === 'Rejected')
      
      const matchesSearch = 
        product.proName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesPriority = filterPriority === 'all' || true // Priority not in current schema
      const matchesCategory = filterCategory === 'all' || product.category?.id === filterCategory
      const matchesVendor = filterVendor === 'all' || product.vendor?.uid === filterVendor
      
      return matchesTab && matchesSearch && matchesPriority && matchesCategory && matchesVendor
    })
  }

  const filteredProducts = getFilteredProducts()

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="w-5 h-5 text-green-600" />
      case 'Pending': return <Clock className="w-5 h-5 text-yellow-600" />
      case 'Rejected': return <XCircle className="w-5 h-5 text-red-600" />
      default: return <Clock className="w-5 h-5 text-gray-600" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'Approved': return 'bg-green-100 text-green-800'
      case 'Pending': return 'bg-yellow-100 text-yellow-800'
      case 'Rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Loading products...</span>
      </div>
    )
  }

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: products.filter(p => p.approvalStatus === 'Pending').length },
    { id: 'approved', label: 'Approved', count: products.filter(p => p.approvalStatus === 'Approved').length },
    { id: 'rejected', label: 'Rejected', count: products.filter(p => p.approvalStatus === 'Rejected').length }
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Product Approval System</h2>
          <p className="text-gray-600">Review and approve vendor products</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex border-b">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              {tab.label}
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === tab.id ? 'bg-blue-200 text-blue-800' : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <div className="p-6 border-b bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Vendor Filter */}
            <div>
              <select
                value={filterVendor}
                onChange={(e) => setFilterVendor(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Vendors</option>
                {/* Add vendor options here */}
              </select>
            </div>
          </div>
        </div>

        {/* Products List */}
        <div className="p-6">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No {activeTab} products found
              </h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.proId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      {/* Product Image */}
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-gray-400" />
                      </div>

                      {/* Product Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 truncate">
                            {product.proName}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(product.approvalStatus)}`}>
                            {getStatusIcon(product.approvalStatus)}
                            {product.approvalStatus}
                          </span>
                        </div>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {product.description}
                        </p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">SKU:</span>
                            <span className="ml-1 font-medium text-gray-900">{product.sku}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Price:</span>
                            <span className="ml-1 font-medium text-gray-900">${product.price}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Stock:</span>
                            <span className="ml-1 font-medium text-gray-900">{product.stock}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Vendor:</span>
                            <span className="ml-1 font-medium text-gray-900">{product.vendor?.username || 'Unknown'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          <span>Submitted: {formatDate(product.createdAt)}</span>
                          {product.updatedAt && (
                            <span>Updated: {formatDate(product.updatedAt)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetails(product)}
                        className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                      >
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>

                      {product.approvalStatus === 'Pending' && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveProduct(product.proId, 'Approved')}
                            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleApproveProduct(product.proId, 'Rejected')}
                            className="flex items-center gap-1 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                          >
                            <XCircle className="w-4 h-4" />
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Product Details Modal */}
      <AnimatePresence>
        {showDetailsModal && selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 50 }}
              transition={{
                type: "spring",
                damping: 25,
                stiffness: 300
              }}
              className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Product Details</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Basic Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Product Name</label>
                        <p className="text-gray-900">{selectedProduct.proName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">SKU</label>
                        <p className="text-gray-900">{selectedProduct.sku}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <p className="text-gray-900">{selectedProduct.description}</p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing & Inventory */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Pricing & Inventory</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Price</label>
                        <p className="text-gray-900">${selectedProduct.price}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Cost</label>
                        <p className="text-gray-900">${selectedProduct.cost}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Quantity</label>
                        <p className="text-gray-900">{selectedProduct.qnty}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Stock</label>
                        <p className="text-gray-900">{selectedProduct.stock}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Status & Approval */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Status & Approval</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Current Status</label>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedProduct.approvalStatus)}`}>
                          {getStatusIcon(selectedProduct.approvalStatus)}
                          {selectedProduct.approvalStatus}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Submitted</label>
                        <p className="text-gray-900">{formatDate(selectedProduct.createdAt)}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Vendor</label>
                        <p className="text-gray-900">{selectedProduct.vendor?.username || 'Unknown'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Category Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-3">Category Information</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Category</label>
                        <p className="text-gray-900">{selectedProduct.category?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Subcategory</label>
                        <p className="text-gray-900">{selectedProduct.subCategory?.subCatName || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Approval Actions */}
              {selectedProduct.approvalStatus === 'Pending' && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Approval Actions</h4>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleApproveProduct(selectedProduct.proId, 'Approved')}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Approve Product
                    </button>
                    <button
                      onClick={() => handleApproveProduct(selectedProduct.proId, 'Rejected')}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject Product
                    </button>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-600 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default ProductApprovalSystem