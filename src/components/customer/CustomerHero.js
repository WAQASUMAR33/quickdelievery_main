'use client'

import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const CustomerHero = () => {
  return (
    <div className="bg-[#F7F7F7] pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-24 overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative">
          <div className="lg:w-1/2">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <span className="block xl:inline">It's the food and groceries you love,</span>{' '}
              <span className="block text-[#D70F64]">delivered</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mt-4 max-w-2xl text-xl text-gray-500"
            >
              Order from your favorite restaurants and shops. Fast delivery to your doorstep.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-8 flex gap-4"
            >
              <input
                type="text"
                placeholder="Enter your full address"
                className="flex-1 max-w-md px-6 py-4 rounded-xl border border-gray-200 shadow-sm focus:ring-2 focus:ring-[#D70F64] focus:border-transparent outline-none text-gray-600 bg-white"
              />
              <button className="px-8 py-4 bg-[#D70F64] text-white font-bold rounded-xl hover:bg-[#C20D5A] transition-colors shadow-lg hover:shadow-xl flex items-center gap-2">
                Find Food
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            className="mt-12 lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2 lg:mt-0 flex items-center justify-center lg:justify-end"
          >
            {/* Hero Image / Illustration */}
            <div className="relative w-full max-w-lg lg:max-w-xl">
              <div className="absolute top-0 -left-4 w-72 h-72 bg-[#D70F64] rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
              <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>

              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
                alt="Food Delivery"
                className="relative rounded-3xl shadow-2xl rotate-2 hover:rotate-0 transition-transform duration-500 border-8 border-white"
              />

              {/* Floating Cards */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="absolute -bottom-6 -left-6 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-3"
              >
                <div className="bg-green-100 p-2 rounded-full">
                  <ArrowRight className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase">Delivery Time</p>
                  <p className="text-sm font-bold text-gray-800">15-25 Min</p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default CustomerHero