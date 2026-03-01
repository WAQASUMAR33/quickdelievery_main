'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmailVerificationPage() {
  const router = useRouter()

  useEffect(() => {
    // Bypass email verification - automatically redirect to login
    toast.success('Account created successfully! Please log in.')

    // Redirect after a short delay
    const timer = setTimeout(() => {
      router.push('/login')
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-12 h-12 bg-[#D70F64] rounded-xl flex items-center justify-center">
                <span className="text-xl font-bold text-white">FP</span>
              </div>
              <span className="text-2xl font-bold text-[#D70F64] tracking-tight">foodpanda</span>
            </div>
          </div>

          {/* Success Message */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-12 h-12 text-green-600" />
            </motion.div>

            <h2 className="text-3xl font-bold text-gray-900 mb-4">Account Created!</h2>
            <p className="text-gray-600 mb-4">Your account has been successfully created.</p>
            <p className="text-sm text-[#D70F64] font-medium mb-6 flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirecting to login page...
            </p>

            <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
              <p className="text-sm text-gray-700">
                <strong className="text-gray-900">Next Steps:</strong><br />
                <span className="text-gray-600">You'll be redirected to the login page where you can sign in with your credentials.</span>
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push('/login')}
              className="w-full bg-[#D70F64] text-white py-4 rounded-xl hover:bg-[#C20D5A] transition-all font-bold shadow-lg hover:shadow-xl"
            >
              Go to Login Now
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}
