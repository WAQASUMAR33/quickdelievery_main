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

  // Load wishlist from localStorage on mount
  useEffect(() => {
    if (userData?.id) {
      const savedWishlist = localStorage.getItem(`wishlist_${userData.id}`)
      if (savedWishlist) {
        try {
          const wishlistData = JSON.parse(savedWishlist)
          dispatch({ type: 'LOAD_WISHLIST', payload: wishlistData })
        } catch (error) {
          console.error('Error loading wishlist from localStorage:', error)
        }
      }
    }
  }, [userData?.id])

  // Save wishlist to localStorage whenever it changes
  useEffect(() => {
    if (userData?.id) {
      localStorage.setItem(`wishlist_${userData.id}`, JSON.stringify(state.items))
    }
  }, [state.items, userData?.id])

  // Clear wishlist when user logs out
  useEffect(() => {
    if (!user) {
      dispatch({ type: 'CLEAR_WISHLIST' })
    }
  }, [user])

  const addToWishlist = (product) => {
    if (!user || !userData) {
      alert('Please login to add items to wishlist')
      return false
    }
    dispatch({ type: 'ADD_TO_WISHLIST', payload: product })
    return true
  }

  const removeFromWishlist = (productId) => {
    dispatch({ type: 'REMOVE_FROM_WISHLIST', payload: productId })
  }

  const clearWishlist = () => {
    dispatch({ type: 'CLEAR_WISHLIST' })
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
