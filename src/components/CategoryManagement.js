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
  MoreVertical
} from 'lucide-react'

const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    status: 'ACTIVE'
  })

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/products?type=categories')
      const result = await response.json()
      
      if (result.success) {
        setCategories(result.data || [])
      } else {
        console.error('Failed to fetch categories:', result.error)
        setCategories([])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleAddCategory = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'category',
          catCode: formData.code,
          catName: formData.name,
          description: formData.description,
          status: formData.status === 'ACTIVE'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setShowAddModal(false)
        setFormData({ name: '', code: '', description: '', status: 'ACTIVE' })
        fetchCategories() // Refresh the list
      } else {
        console.error('Failed to add category:', result.error)
        alert('Failed to add category. Please try again.')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      alert('Error adding category. Please try again.')
    }
  }

  const handleEditCategory = async () => {
    try {
      const response = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'category',
          id: selectedCategory.id,
          catCode: formData.code,
          catName: formData.name,
          description: formData.description,
          status: formData.status === 'ACTIVE'
        })
      })

      const result = await response.json()
      
      if (result.success) {
        setShowEditModal(false)
        setSelectedCategory(null)
        setFormData({ name: '', code: '', description: '', status: 'ACTIVE' })
        fetchCategories() // Refresh the list
      } else {
        console.error('Failed to update category:', result.error)
        alert('Failed to update category. Please try again.')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      alert('Error updating category. Please try again.')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`/api/products?type=category&id=${id}`, {
          method: 'DELETE'
        })

        const result = await response.json()
        
        if (result.success) {
          fetchCategories() // Refresh the list
        } else {
          console.error('Failed to delete category:', result.error)
          alert('Failed to delete category. Please try again.')
        }
      } catch (error) {
        console.error('Error deleting category:', error)
        alert('Error deleting category. Please try again.')
      }
    }
  }

  const handleEditClick = (category) => {
    setSelectedCategory(category)
    setFormData({
      name: category.name,
      code: category.code,
      description: category.description,
      status: category.status
    })
    setShowEditModal(true)
  }

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         category.code.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || category.status === filterStatus
    return matchesSearch && matchesFilter
  })

  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="ml-3 text-gray-600">Loading categories...</span>
        </div>
      ) : (
        <>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Category Management</h2>
              <p className="text-gray-600 mt-1">Manage product categories and their settings</p>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowAddModal(true)}
              className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </motion.button>
          </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </motion.div>

      {/* Categories Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        {filteredCategories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-300"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{category.name}</h3>
                  <p className="text-sm text-gray-500">{category.code}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleEditClick(category)}
                  className="p-1 text-gray-400 hover:text-blue-600 transition-colors duration-200"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-gray-600 text-sm mb-4">{category.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  category.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                }`} />
                <span className="text-sm font-medium text-gray-700">{category.status}</span>
              </div>
              <div className="text-sm text-gray-500">
                {category.productCount} products
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Add Category Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter category name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter category code"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  rows="3"
                  placeholder="Enter category description"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Add Category
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Category Modal */}
      <AnimatePresence>
        {showEditModal && (
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
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Category</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleEditCategory}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200"
              >
                Update Category
              </button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
        </>
      )}
    </div>
  )
}

export default CategoryManagement
