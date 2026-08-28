'use client'

import { createContext, useContext, useReducer, useEffect, useState } from 'react'

const CartContext = createContext()

const getItemKey = (item) => `${item.proId}${item.selectedVariation ? '_' + item.selectedVariation.name : ''}`

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'ADD_TO_CART': {
      const qtyToAdd = Math.max(1, Math.floor(Number(action.qtyToAdd) || 1))
      const product = action.payload
      const key = getItemKey(product)
      const existingItemIndex = state.items.findIndex(item => getItemKey(item) === key)
      
      if (existingItemIndex >= 0) {
        const newItems = [...state.items]
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity: newItems[existingItemIndex].quantity + qtyToAdd
        }
        return { ...state, items: newItems }
      }
      return {
        ...state,
        items: [...state.items, { ...product, quantity: qtyToAdd }]
      }
    }
    
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        items: state.items.filter(item => getItemKey(item) !== action.payload)
      }
    
    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          getItemKey(item) === action.payload.key
            ? { ...item, quantity: Math.max(0, action.payload.quantity) }
            : item
        ).filter(item => item.quantity > 0)
      }
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: []
      }
    
    case 'LOAD_CART':
      return {
        ...state,
        items: action.payload || []
      }
    
    default:
      return state
  }
}

export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, {
    items: []
  })

  const [heldBills, setHeldBills] = useState([])

  // Load cart & held bills from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart)
        dispatch({ type: 'LOAD_CART', payload: cartData })
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }

    const savedHeld = localStorage.getItem('quickdelivery_held_bills')
    if (savedHeld) {
      try {
        const parsedHeld = JSON.parse(savedHeld)
        if (Array.isArray(parsedHeld)) setHeldBills(parsedHeld)
      } catch (e) {
        console.error('Error loading held bills:', e)
      }
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(state.items))
  }, [state.items])

  // Save held bills to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('quickdelivery_held_bills', JSON.stringify(heldBills))
  }, [heldBills])

  const addToCart = (product, quantity = 1) => {
    const qtyToAdd = Math.max(1, Math.floor(Number(quantity) || 1))
    dispatch({ type: 'ADD_TO_CART', payload: product, qtyToAdd })
  }

  const removeFromCart = (itemKey) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: itemKey })
  }

  const updateQuantity = (itemKey, quantity) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { key: itemKey, quantity } })
  }

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' })
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => {
      const price = parseFloat(item.salePrice) || parseFloat(item.price) || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const isInCart = (productId) => {
    return state.items.some(item => item.proId === productId)
  }

  /**
   * Hold Current Bill: Saves current cart items to held bills and clears active cart
   */
  const holdCurrentBill = (note = '', customerName = '') => {
    if (!state.items || state.items.length === 0) return null

    const total = getTotalPrice()
    const totalCount = getTotalItems()
    const billId = `HB-${Date.now().toString().slice(-6)}`

    const newHeldBill = {
      id: billId,
      billNumber: billId,
      items: [...state.items],
      totalAmount: total,
      totalItems: totalCount,
      note: note.trim() || 'General Customer',
      customerName: customerName.trim() || '',
      heldAt: new Date().toISOString(),
    }

    setHeldBills(prev => [newHeldBill, ...prev])
    clearCart()
    return newHeldBill
  }

  /**
   * Recall Held Bill: Restores items from held bill into active cart and removes from held list
   */
  const recallHeldBill = (billId) => {
    const targetBill = heldBills.find(b => b.id === billId)
    if (!targetBill) return false

    dispatch({ type: 'LOAD_CART', payload: targetBill.items })
    setHeldBills(prev => prev.filter(b => b.id !== billId))
    return true
  }

  /**
   * Delete a Held Bill
   */
  const deleteHeldBill = (billId) => {
    setHeldBills(prev => prev.filter(b => b.id !== billId))
  }

  /**
   * Clear all Held Bills
   */
  const clearAllHeldBills = () => {
    setHeldBills([])
  }

  const value = {
    items: state.items,
    heldBills,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotalPrice,
    getTotalItems,
    isInCart,
    holdCurrentBill,
    recallHeldBill,
    deleteHeldBill,
    clearAllHeldBills,
  }

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
