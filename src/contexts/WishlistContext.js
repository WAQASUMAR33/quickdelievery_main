'use client'

import { createContext, useContext, useReducer, useEffect } from 'react'
import { useAuth } from './AuthContext'

const WishlistContext = createContext()

const wishlistReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_WISHLIST':
      const existingItem = state.items.find(item => item.proId === action.payload.proId)
      if (existingItem) {
        return state // Item already in wishlist
      }
      return {
        ...state,
        items: [...state.items, { ...action.payload, addedAt: new Date().toISOString() }]
      }
    
    case 'REMOVE_FROM_WISHLIST':
      return {
        ...state,
        items: state.items.filter(item => item.proId !== action.payload)
      }
    
    case 'CLEAR_WISHLIST':
      return {
        ...state,
        items: []
      }
    
    case 'LOAD_WISHLIST':
      return {
        ...state,
        items: action.payload || []
      }
    
    default:
      return state
  }
}

export const WishlistProvider = ({ children }) => {
  const { user, userData } = useAuth()
  const [state, dispatch] = useReducer(wishlistReducer, {
    items: []
  })

  // Load wishlist from database on mount
  useEffect(() => {
    if (userData?.id) {
      const fetchWishlist = async () => {
        try {
          const res = await fetch(`/api/customer/wishlist?userId=${userData.id}`)
          const data = await res.json()
          if (data.success) {
            dispatch({ type: 'LOAD_WISHLIST', payload: data.data })
          }
        } catch (error) {
          console.error('Error fetching wishlist from DB:', error)
        }
      }
      fetchWishlist()
    }
  }, [userData?.id])

  // Clear wishlist when user logs out
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'CLEAR_WISHLIST' })
    }
  }, [user])

  const addToWishlist = async (product) => {
    if (!user || !userData) {
      alert('Please login to add items to wishlist')
      return false
    }
    // Optimistic update
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product })
    
    // Sync with DB
    try {
      await fetch('/api/customer/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: userData.id, productId: product.proId, action: 'add' })
      })
    } catch (e) {
      console.error('Failed to save to DB', e)
    }
    return true
  }

  const removeFromWishlist = async (productId) => {
    // Optimistic update
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId })
    
    // Sync with DB
    if (userData?.id) {
      try {
        await fetch('/api/customer/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userData.id, productId, action: 'remove' })
        })
      } catch (e) {
        console.error('Failed to remove from DB', e)
      }
    }
  }

  const clearWishlist = async () => {
    dispatch({ type: 'CLEAR_WISHLIST' })
    if (userData?.id) {
      try {
        await fetch(`/api/customer/wishlist?userId=${userData.id}`, { method: 'DELETE' })
      } catch (e) {
        console.error('Failed to clear DB wishlist', e)
      }
    }
  }

  const isInWishlist = (productId) => {
    return state.items.some(item => item.proId === productId)
  }

  const getTotalWishlistItems = () => {
    return state.items.length
  }

  const value = {
    items: state.items,
    addToWishlist,
    removeFromWishlist,
    clearWishlist,
    isInWishlist,
    getTotalWishlistItems
  }

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const context = useContext(WishlistContext)
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider')
  }
  return context
}
