'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation'

const AuthContext = createContext({})

export const useAuth = () => useContext(AuthContext)

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [userData, setUserData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userDataLoadingTimeout, setUserDataLoadingTimeout] = useState(false)
  const router = useRouter()

  const buildGuestSession = () => {
    const guestUser = {
      uid: 'guest_' + Date.now(),
      email: 'guest@quickdelivery.com',
      displayName: 'Guest User',
      emailVerified: true,
      phoneNumber: '',
      getIdToken: async () => 'GUEST_SESSION'
    }
    const guestUserData = {
      id: 'guest',
      uid: guestUser.uid,
      username: 'Guest User',
      email: 'guest@quickdelivery.com',
      role: 'GUEST',
      emailVerification: true
    }
    return { guestUser, guestUserData }
  }

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('authToken')
    if (!token) {
      // No token — start as guest by default
      const { guestUser, guestUserData } = buildGuestSession()
      setUser(guestUser)
      setUserData(guestUserData)
      setLoading(false)
      return
    }

    // Handle Guest Session
    if (token === 'GUEST_SESSION') {
      const guestUser = {
        uid: 'guest_' + Date.now(),
        email: 'guest@quickdelivery.com',
        displayName: 'Guest User',
        emailVerified: true,
        phoneNumber: '',
        getIdToken: async () => 'GUEST_SESSION'
      }
      const guestUserData = {
        id: 'guest',
        uid: guestUser.uid,
        username: 'Guest User',
        email: 'guest@quickdelivery.com',
        role: 'GUEST',
        emailVerification: true
      }
      setUser(guestUser)
      setUserData(guestUserData)
      setLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      const result = await response.json()

      if (result.success) {
        const dbUser = result.user

        // Construct a Firebase-like user object for compatibility
        const firebaseLikeUser = {
          uid: dbUser.uid,
          email: dbUser.email,
          displayName: dbUser.username,
          emailVerified: dbUser.emailVerification,
          phoneNumber: dbUser.phoneNumber,
          getIdToken: async () => token // Mock getIdToken
        }

        setUser(firebaseLikeUser)
        setUserData(dbUser)
      } else {
        localStorage.removeItem('authToken')
        // Fall back to guest session so pages don't hang indefinitely
        const { guestUser, guestUserData } = buildGuestSession()
        setUser(guestUser)
        setUserData(guestUserData)
      }
    } catch (error) {
      console.error('Error loading user:', error)
      localStorage.removeItem('authToken')
      // Fall back to guest session so pages don't hang indefinitely
      const { guestUser, guestUserData } = buildGuestSession()
      setUser(guestUser)
      setUserData(guestUserData)
    } finally {
      setLoading(false)
      setUserDataLoadingTimeout(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const signUp = async (email, password, displayName, phoneNumber = '', role = 'CUSTOMER', type = 'local') => {
    try {
      setLoading(true)

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName, phoneNumber, role, type })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Registration failed')
      }

      const { user: dbUser, token } = result

      localStorage.setItem('authToken', token)

      const firebaseLikeUser = {
        uid: dbUser.uid,
        email: dbUser.email,
        displayName: dbUser.username,
        emailVerified: dbUser.emailVerification,
        phoneNumber: dbUser.phoneNumber,
        getIdToken: async () => token
      }

      setUser(firebaseLikeUser)
      setUserData(dbUser)

      toast.success('Account created!')
      return { success: true, user: firebaseLikeUser }
    } catch (error) {
      console.error('Sign up error:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Login failed')
      }

      const { user: dbUser, token } = result

      localStorage.setItem('authToken', token)

      const firebaseLikeUser = {
        uid: dbUser.uid,
        email: dbUser.email,
        displayName: dbUser.username,
        emailVerified: dbUser.emailVerification,
        phoneNumber: dbUser.phoneNumber,
        getIdToken: async () => token
      }

      setUser(firebaseLikeUser)
      setUserData(dbUser)

      toast.success('Welcome back!')
      return { success: true, user: firebaseLikeUser }
    } catch (error) {
      console.error('Sign in error:', error)
      toast.error(error.message)
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const loginAsGuest = async () => {
    setLoading(true)
    try {
      const token = 'GUEST_SESSION'
      localStorage.setItem('authToken', token)

      const guestUser = {
        uid: 'guest_' + Date.now(),
        email: 'guest@quickdelivery.com',
        displayName: 'Guest User',
        emailVerified: true,
        phoneNumber: '',
        getIdToken: async () => token
      }

      const guestUserData = {
        id: 'guest',
        uid: guestUser.uid,
        username: 'Guest User',
        email: 'guest@quickdelivery.com',
        role: 'GUEST',
        emailVerification: true
      }

      setUser(guestUser)
      setUserData(guestUserData)
      toast.success('Welcome Guest!')
      return { success: true, user: guestUser }
    } catch (error) {
      console.error('Guest login error:', error)
      toast.error('Failed to enter as guest')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      localStorage.removeItem('authToken')
      const { guestUser, guestUserData } = buildGuestSession()
      setUser(guestUser)
      setUserData(guestUserData)
      toast.success('Logged out successfully')
      router.push('/login')
    } catch (error) {
      console.error('Logout error:', error)
      toast.error('Failed to log out')
    }
  }

  const resendVerification = async () => {
    toast.error('Email verification is not currently supported.')
  }

  const loadUserData = async () => {
    await loadUser()
  }

  const value = {
    user,
    userData,
    loading,
    userDataLoadingTimeout,
    signUp,
    signIn,
    loginAsGuest,
    logout,
    resendVerification,
    loadUserData
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
