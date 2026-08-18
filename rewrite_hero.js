const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'components', 'customer', 'CustomerHero.js');

const newHero = `
'use client'

import { motion } from 'framer-motion'

const CustomerHero = () => {
  return (
    <div className="bg-[#39772A] relative w-full h-[85vh] min-h-[600px] overflow-hidden flex flex-col items-center justify-center font-sans">
      
      {/* Background Pattern (Triangles / Pizza slices) */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         {/* Scattered pizza slice shapes */}
         <svg className="absolute top-12 left-[15%] w-16 h-16 text-[#1A4514] fill-current -rotate-12" viewBox="0 0 100 100">
            <polygon points="50,15 85,85 15,85" />
            <circle cx="50" cy="65" r="6" fill="#39772A" />
            <circle cx="40" cy="50" r="5" fill="#39772A" />
            <circle cx="65" cy="70" r="5" fill="#39772A" />
         </svg>
         
         <svg className="absolute bottom-24 left-[20%] w-12 h-12 text-[#1A4514] fill-current rotate-45" viewBox="0 0 100 100">
            <polygon points="50,15 85,85 15,85" />
            <circle cx="50" cy="65" r="6" fill="#39772A" />
         </svg>

         <svg className="absolute top-32 right-[18%] w-14 h-14 text-[#1A4514] fill-current rotate-[120deg]" viewBox="0 0 100 100">
            <polygon points="50,15 85,85 15,85" />
            <circle cx="45" cy="55" r="7" fill="#39772A" />
         </svg>

         <svg className="absolute bottom-16 right-[25%] w-20 h-20 text-[#1A4514] fill-current rotate-[210deg]" viewBox="0 0 100 100">
            <polygon points="50,15 85,85 15,85" />
            <circle cx="50" cy="65" r="6" fill="#39772A" />
            <circle cx="40" cy="45" r="4" fill="#39772A" />
            <circle cx="65" cy="75" r="5" fill="#39772A" />
         </svg>
      </div>

      {/* Plates of food protruding from edges */}
      <div className="absolute -left-20 top-1/4 w-48 h-48 rounded-full shadow-2xl bg-white p-2">
         <img src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop" className="w-full h-full rounded-full object-cover" alt="salad" />
      </div>
      
      <div className="absolute -right-16 bottom-1/4 w-44 h-44 rounded-full shadow-2xl bg-white p-2">
         <img src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop" className="w-full h-full rounded-full object-cover" alt="pancake" />
      </div>

      <div className="absolute -left-12 bottom-[10%] w-32 h-32 rounded-full shadow-xl bg-white p-1.5 opacity-80">
         <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=400&auto=format&fit=crop" className="w-full h-full rounded-full object-cover" alt="bowl" />
      </div>

      {/* Logo & Text */}
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.4 }} className="relative z-10 flex flex-col items-center">
         
         <div className="w-16 h-16 mb-2">
            <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="48" fill="white" />
              {/* Ears */}
              <circle cx="28" cy="30" r="12" fill="#39772A" />
              <circle cx="72" cy="30" r="12" fill="#39772A" />
              {/* Head shape / Face mask */}
              <path d="M20 50 C 20 20, 80 20, 80 50 C 80 80, 20 80, 20 50 Z" fill="#39772A" />
              {/* Eye patches */}
              <path d="M30 45 C 20 60, 45 70, 45 50 C 45 40, 35 35, 30 45 Z" fill="white" />
              <path d="M70 45 C 80 60, 55 70, 55 50 C 55 40, 65 35, 70 45 Z" fill="white" />
              {/* Eyeballs */}
              <circle cx="35" cy="52" r="4" fill="#39772A" />
              <circle cx="65" cy="52" r="4" fill="#39772A" />
              {/* Nose */}
              <path d="M47 62 L 53 62 L 50 66 Z" fill="white" />
            </svg>
         </div>
         
         <h1 className="text-[2.5rem] font-bold text-white tracking-tight mb-8" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
           foodpanda
         </h1>

         <button
           onClick={() => document.getElementById('catalog-section')?.scrollIntoView({ behavior: 'smooth' })}
           className="px-8 py-3 bg-white text-[#39772A] font-bold text-sm rounded-lg shadow-xl hover:bg-gray-50 transition-colors"
         >
           Start Ordering
         </button>
      </motion.div>
    </div>
  )
}

export default CustomerHero;
`;

fs.writeFileSync(file, newHero.trim(), 'utf8');
console.log("Successfully replaced CustomerHero with pixel perfect version!");
