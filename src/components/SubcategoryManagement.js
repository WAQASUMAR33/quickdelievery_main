'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { 
  Package, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ArrowLeft,
  ArrowRight
} from 'lucide-react'

const SubcategoryManagement = () => {
  const [subcategories, setSubcategories] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')

  const [formData, setFormData] = useState({
    subCatCode: '',
    subCatName: '',
    catId: '',
    status: true
  })


  // Fetch subcategories from database
  const fetchSubcategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products?type=subcategories')
      const result = await response.json()
      
      if (result.success) {
        setSubcategories(result.data || [])
      } else {
        console.error('Failed to fetch subcategories:', result.error)
        setSubcategories([])
      }
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      setSubcategories([])
    } finally {
      setLoading(false)
    }
  }

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/products?type=categories')
      const result = await response.json()
      
      if (result.success) {
        setCategories(result.data || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  useEffect(() => {
    fetchSubcategories()
    fetchCategories()
  }, [])

  const handleAddSubcategory = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subcategory',
          subCatCode: formData.subCatCode,
          subCatName: formData.subCatName,
          catId: formData.catId,
          status: formData.status
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setShowAddModal(false)
        setFormData({ subCatCode: '', subCatName: '', catId: '', status: true })
        fetchSubcategories() // Refresh the list
      } else {
        console.error('Failed to add subcategory:', result.error)
        alert('Failed to add subcategory. Please try again.')
      }
    } catch (error) {
      console.error('Error adding subcategory:', error)
      alert('Error adding subcategory. Please try again.')
    }
  }

  const handleEditSubcategory = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'subcategory',
          id: selectedSubcategory.subCatId,
          subCatCode: formData.subCatCode,
          subCatName: formData.subCatName,
          catId: formData.catId,
          status: formData.status
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setShowEditModal(false)
        setSelectedSubcategory(null)
        setFormData({ subCatCode: '', subCatName: '', catId: '', status: true })
        fetchSubcategories() // Refresh the list
      } else {
        console.error('Failed to update subcategory:', result.error)
        alert('Failed to update subcategory. Please try again.')
      }
    } catch (error) {
      console.error('Error updating subcategory:', error)
      alert('Error updating subcategory. Please try again.')
    }
  }

  const handleDeleteSubcategory = async (id) => {
    try {
      const response = await fetch(`/api/products?type=subcategory&id=${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()
      
      if (result.success) {
        fetchSubcategories() // Refresh the list
      } else {
        console.error('Failed to delete subcategory:', result.error)
        alert('Failed to delete subcategory. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      alert('Error deleting subcategory. Please try again.')
    }
  }

  const handleEditClick = (subcategory) => {
    setSelectedSubcategory(subcategory)
    setFormData({
      subCatCode: subcategory.subCatCode,
      subCatName: subcategory.subCatName,
      catId: subcategory.catId,
      status: subcategory.status
    })
    setShowEditModal(true)
  }

  const filteredSubcategories = subcategories.filter(subcategory => {
    const matchesSearch = subcategory.subCatName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subcategory.subCatCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subcategory.category?.name?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && subcategory.status) ||
                         (filterStatus === 'inactive' && !subcategory.status)
    const matchesCategory = filterCategory === 'all' || subcategory.catId === filterCategory
    return matchesSearch && matchesStatus && matchesCategory
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <span className="ml-3 text-gray-600">Loading subcategories...</span>
      </div>
    )
  }

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.2
      }
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
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
          <h2 className="text-xl font-semibold text-gray-900">Subcategory Management</h2>
          <p className="text-gray-600 mt-1">Manage product subcategories and their settings</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="mt-4 sm:mt-0 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-all duration-300 shadow-lg hover:shadow-xl"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subcategory</span>
        </motion.button>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Subcategories</p>
              <p className="text-2xl font-bold">{subcategories.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active</p>
              <p className="text-2xl font-bold">{subcategories.filter(s => s.status).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-sm">Inactive</p>
              <p className="text-2xl font-bold">{subcategories.filter(s => !s.status).length}</p>
            </div>
            <XCircle className="w-8 h-8 text-yellow-200" />
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Total Products</p>
              <p className="text-2xl font-bold">{subcategories.reduce((sum, s) => sum + (s._count?.products || 0), 0)}</p>
            </div>
            <Package className="w-8 h-8 text-purple-200" />
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search subcategories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </motion.div>

      {/* Subcategories Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredSubcategories.map((subcategory, index) => (
          <motion.div
            key={subcategory.subCatId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + index * 0.1 }}
            whileHover={{ 
              scale: 1.02,
              y: -5,
              transition: { duration: 0.2 }
            }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{subcategory.subCatName}</h3>
                  <p className="text-sm text-gray-500">{subcategory.subCatCode}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleEditClick(subcategory)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDeleteSubcategory(subcategory.subCatId)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </motion.button>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Category:</span>
                <span className="text-sm font-medium text-gray-900">{subcategory.category?.name || 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Products:</span>
                <span className="text-sm font-medium text-gray-900">{subcategory._count?.products || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Created:</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date(subcategory.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  subcategory.status ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-700">
                  {subcategory.status ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="text-sm text-gray-500">
                ID: {subcategory.subCatId}
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Add Subcategory Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Add New Subcategory</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XCircle className="w-6 h-6" />
                </motion.button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Code</label>
                  <input
                    type="text"
                    value={formData.subCatCode}
                    onChange={(e) => setFormData({ ...formData, subCatCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-900"
                    placeholder="Enter subcategory code"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Name</label>
                  <input
                    type="text"
                    value={formData.subCatName}
                    onChange={(e) => setFormData({ ...formData, subCatName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-900"
                    placeholder="Enter subcategory name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
                  <select
                    value={formData.catId}
                    onChange={(e) => setFormData({ ...formData, catId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-900"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="status"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="status" className="text-sm font-medium text-gray-700">
                    Active Status
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddSubcategory}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-lg"
                >
                  Add Subcategory
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Subcategory Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Edit Subcategory</h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  <XCircle className="w-6 h-6" />
                </motion.button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Code</label>
                  <input
                    type="text"
                    value={formData.subCatCode}
                    onChange={(e) => setFormData({ ...formData, subCatCode: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subcategory Name</label>
                  <input
                    type="text"
                    value={formData.subCatName}
                    onChange={(e) => setFormData({ ...formData, subCatName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-900"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Parent Category</label>
                  <select
                    value={formData.catId}
                    onChange={(e) => setFormData({ ...formData, catId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-900"
                  >
                    <option value="">Select Category</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="edit-status"
                    checked={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.checked })}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
                    Active Status
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
                >
                  Cancel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleEditSubcategory}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white rounded-lg transition-all duration-300 shadow-lg"
                >
                  Update Subcategory
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SubcategoryManagement
