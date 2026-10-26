'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, ShieldCheck, Clock, CheckCheck, Sparkles } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const SUPPORT_PHONE = '923001234567' // Official Support Helpline

export default function WhatsAppWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const { t, isRTL } = useLanguage()

  const quickPrompts = [
    '📦 Where is my order?',
    '⚡ Are there any active discount vouchers?',
    '💻 Can you recommend a high-spec laptop?',
    '🏬 How do I register my business as a vendor?',
  ]

  const handleSend = (textToSend) => {
    const msg = textToSend || message || 'Hello MARTZONA, I need assistance with shopping.'
    const url = `https://wa.me/${SUPPORT_PHONE}?text=${encodeURIComponent(msg)}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setMessage('')
  }

  return (
    <div className={`fixed bottom-18 md:bottom-6 ${isRTL ? 'left-4 sm:left-6' : 'right-4 sm:right-6'} z-40 flex flex-col items-end`}>
      {/* Interactive Popover Card */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="mb-4 w-[360px] max-w-[calc(100vw-32px)] rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden text-left"
            dir={isRTL ? 'rtl' : 'ltr'}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 p-4 text-white relative">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute top-3.5 right-3.5 p-1 rounded-full bg-black/20 hover:bg-black/30 text-white transition-colors"
                aria-label="Close WhatsApp chat"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md p-1 border border-white/30 flex items-center justify-center">
                    <MessageCircle className="w-7 h-7 text-white fill-white/20" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-300 border-2 border-emerald-600 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-black text-sm text-white tracking-tight">
                      MARTZONA Support
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-emerald-200 fill-emerald-100" />
                  </div>
                  <p className="text-[11px] text-emerald-100 flex items-center gap-1 font-medium">
                    <Clock className="w-3 h-3" /> Replies typically in &lt; 2 minutes
                  </p>
                </div>
              </div>
            </div>

            {/* Chat Body */}
            <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 max-h-[300px] overflow-y-auto space-y-3 text-xs">
              {/* Automated Greeting Bubble */}
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 flex items-center justify-center text-white font-black text-[10px] flex-shrink-0">
                  MZ
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl rounded-tl-none border border-slate-200/80 dark:border-slate-700 shadow-sm text-slate-800 dark:text-slate-100 leading-relaxed">
                  <p className="font-semibold mb-1">
                    👋 Welcome to MARTZONA Live Concierge!
                  </p>
                  <p className="text-slate-600 dark:text-slate-300 text-[11.5px]">
                    How can our dispatch & shopping team help you today? Pick a quick option below or send your query directly to WhatsApp:
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-1 text-[10px] text-slate-400 font-mono">
                    <span>Just now</span>
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Quick action chips */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Quick Topics
                </span>
                <div className="flex flex-col gap-1.5">
                  {quickPrompts.map((prompt, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleSend(prompt)}
                      className="text-left w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 hover:border-emerald-500 dark:hover:border-emerald-500 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:text-emerald-600 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <span>{prompt}</span>
                      <Send className="w-3 h-3 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleSend()
                  }
                }}
                placeholder="Type your message…"
                className="flex-1 text-xs py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-transparent focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => handleSend()}
                className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/30 transition-transform active:scale-95"
                title="Send via WhatsApp"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Launcher Button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center justify-center gap-2 p-2.5 sm:px-3.5 sm:py-2.5 rounded-none bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs shadow-xl shadow-emerald-500/25 border border-emerald-400/40 cursor-pointer"
        aria-label="Open WhatsApp Chat Support"
      >
        <span className="relative flex items-center justify-center">
          <MessageCircle className="w-5 h-5 fill-white/20" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-none bg-emerald-300 animate-ping" />
        </span>
        <span className="hidden sm:inline-block font-black tracking-tight">
          WhatsApp Support
        </span>
      </motion.button>
    </div>
  )
}
