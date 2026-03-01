'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'

const NotificationSystem = () => {
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info', duration = 5000) => {
    const id = Date.now() + Math.random()
    const notification = {
      id,
      message,
      type,
      duration
    }
    
    setNotifications(prev => [...prev, notification])
    
    // Auto remove after duration
    setTimeout(() => {
      removeNotification(id)
    }, duration)
  }, [])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />
    }
  }

  const getNotificationStyles = (type) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800'
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200 text-blue-800'
    }
  }

  // Expose addNotification globally
  useEffect(() => {
    window.addNotification = addNotification
    return () => {
      delete window.addNotification
    }
  }, [addNotification])

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 300,
              duration: 0.3 
            }}
            className={`max-w-sm w-full bg-white rounded-lg shadow-lg border-l-4 p-4 ${getNotificationStyles(notification.type)}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0">
                {getNotificationIcon(notification.type)}
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">
                  {notification.message}
                </p>
              </div>
              <div className="ml-4 flex-shrink-0">
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Progress bar */}
            <motion.div
              className={`absolute bottom-0 left-0 h-1 ${
                notification.type === 'success' ? 'bg-green-500' :
                notification.type === 'error' ? 'bg-red-500' :
                notification.type === 'warning' ? 'bg-yellow-500' :
                'bg-blue-500'
              }`}
              initial={{ width: '100%' }}
              animate={{ width: '0%' }}
              transition={{ duration: notification.duration / 1000, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

export default NotificationSystem
