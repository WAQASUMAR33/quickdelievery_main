'use client'

import { motion } from 'framer-motion'

const AnimatedCard = ({ 
  children, 
  className = '', 
  hover = true,
  delay = 0,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      whileHover={hover ? { y: -5, scale: 1.02 } : {}}
      className={`
        bg-white rounded-xl shadow-lg border border-gray-100 
        transition-all duration-300 hover:shadow-xl
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export default AnimatedCard
