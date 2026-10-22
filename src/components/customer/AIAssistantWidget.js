'use client'

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  Bot,
  User,
  ArrowRight,
  Flame,
  CheckCircle2,
  Package,
  Layers,
  ChevronRight,
} from 'lucide-react'
import { useCart } from '@/contexts/CartContext'
import { useLanguage } from '@/contexts/LanguageContext'
import toast from 'react-hot-toast'

export default function AIAssistantWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [inputPrompt, setInputPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'Hello! I am QuickAI, your personal shopping concierge. I can find the best laptops, mobile tech, organic groceries, or build 1-click recipe cooking kits. What are you looking for today?',
      smartBundle: null,
      recommendations: [],
    },
  ])

  const { addToCart } = useCart()
  const { language, isRTL } = useLanguage()
  const chatBottomRef = useRef(null)

  // Listen to external triggers (e.g. from header button)
  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('openAI', handleOpen)
    return () => window.removeEventListener('openAI', handleOpen)
  }, [])

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const suggestedQuestions = [
    '🎮 Best Gaming Laptops with RTX/Ryzen',
    '⚡ 100W GaN Chargers & Braided Cables',
    '🍝 Italian Pasta Dinner Cooking Kit',
    '🥗 Fresh Organic Groceries for Breakfast',
    '🔥 What are the biggest Flash Drops today?',
  ]

  const handleSendPrompt = async (promptToSend) => {
    const prompt = (promptToSend || inputPrompt).trim()
    if (!prompt) return

    const userMsgId = Date.now().toString()
    setMessages(prev => [
      ...prev,
      { id: userMsgId, sender: 'user', text: prompt },
    ])
    setInputPrompt('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, language }),
      })
      const data = await res.json()

      if (data.success) {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: data.message || 'Here are my top curated recommendations for you:',
            recommendations: data.recommendations || [],
            smartBundle: data.smartBundle || null,
          },
        ])
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: 'I could not process your query at this moment. Please try asking about laptops, groceries, or accessories.',
          },
        ])
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: 'Network blip encountered. Please check your connection and try again.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleAddBundle = (bundle) => {
    if (!bundle?.items?.length) return
    bundle.items.forEach(item => {
      addToCart(item, 1)
    })
    toast.success(`Added ${bundle.items.length} items from ${bundle.title} to your basket!`, {
      icon: '🍝',
      duration: 3500,
    })
  }

  return (
    <>
      {/* Floating Launcher Button */}
      <div className={`fixed bottom-20 ${isRTL ? 'left-6' : 'right-6'} z-50`}>
        <motion.button
          type="button"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 hover:from-blue-700 hover:to-amber-600 text-white font-black text-xs shadow-xl shadow-indigo-600/30 border border-white/20"
          aria-label="Open AI Shopping Concierge"
        >
          <Sparkles className="w-5 h-5 text-amber-200 fill-amber-300 animate-pulse" />
          <span className="hidden sm:inline-block tracking-tight">
            ✦ QuickAI Concierge
          </span>
        </motion.button>
      </div>

      {/* Main Drawer / Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[88vh] flex flex-col text-left"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 p-4 sm:p-5 text-white border-b border-indigo-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-2 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                    <Sparkles className="w-6 h-6 text-amber-300" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black tracking-tight text-white">
                        QuickAI Shopping Concierge
                      </h2>
                      <span className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-[10px] font-black text-amber-300 uppercase">
                        AI 2.0
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 font-medium">
                      Smart product search, bundle creator & personalized meal kits
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                  aria-label="Close AI Concierge"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Message History */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70 dark:bg-slate-950/70">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 ${
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white font-medium rounded-tr-none shadow-md shadow-blue-600/20'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-tl-none border border-slate-200/80 dark:border-slate-700 shadow-sm'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.text}</p>

                      {/* Render Smart Bundle Card if present */}
                      {msg.smartBundle && (
                        <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-800 dark:to-slate-800 border border-amber-200/80 dark:border-amber-500/30">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="font-black text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              {msg.smartBundle.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white font-black text-[10px]">
                              Save Rs. {msg.smartBundle.savings}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 mb-2">
                            {msg.smartBundle.description}
                          </p>
                          <div className="flex items-center justify-between pt-2 border-t border-amber-200/50 dark:border-slate-700">
                            <span className="font-black text-sm text-slate-900 dark:text-white">
                              Total: Rs. {msg.smartBundle.totalPrice.toLocaleString()}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAddBundle(msg.smartBundle)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>1-Click Add Kit</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Render Product Recommendations Grid */}
                      {msg.recommendations && msg.recommendations.length > 0 && (
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {msg.recommendations.map((prod) => {
                            const img = prod.proImages?.[0] || null
                            const price = parseFloat(prod.salePrice || prod.price || 0)
                            return (
                              <div
                                key={prod.proId}
                                className="flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 shadow-2xs"
                              >
                                <div className="w-14 h-14 rounded-lg bg-white dark:bg-slate-800 p-1 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200/80 dark:border-slate-700">
                                  {img ? (
                                    <img
                                      src={img}
                                      alt={prod.proName}
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <Package className="w-6 h-6 text-slate-300" />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-extrabold text-[12px] text-slate-900 dark:text-slate-100 truncate">
                                    {prod.proName}
                                  </h4>
                                  <span className="text-[10px] text-slate-400 block truncate">
                                    {prod.vendor}
                                  </span>
                                  <div className="flex items-center justify-between mt-1">
                                    <span className="font-black text-xs text-blue-600 dark:text-blue-400">
                                      Rs. {price.toLocaleString()}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        addToCart(prod, 1)
                                        toast.success(`Added ${prod.proName} to basket!`)
                                      }}
                                      className="p-1 px-2 rounded-lg bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-600 text-blue-600 dark:text-blue-300 hover:text-white text-[11px] font-black transition-colors"
                                      title="Add to basket"
                                    >
                                      + Add
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {msg.sender === 'user' && (
                      <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}

                {/* Loading typing bubble */}
                {loading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-4 h-4 animate-spin" />
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-slate-500 text-xs ml-1 font-semibold">
                        QuickAI is searching live catalog…
                      </span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Suggested Prompts Pills */}
              <div className="p-3 bg-slate-100/60 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide flex gap-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendPrompt(q)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-slate-200 dark:border-slate-700 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shadow-2xs"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Prompt Input Box */}
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={inputPrompt}
                  onChange={(e) => setInputPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSendPrompt()
                    }
                  }}
                  placeholder="Ask QuickAI anything (e.g. 'I want a budget laptop for graphic design' or 'Italian recipe kit')…"
                  className="flex-1 text-xs py-2.5 px-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 focus:outline-none transition-all font-medium"
                />
                <button
                  type="button"
                  disabled={loading || !inputPrompt.trim()}
                  onClick={() => handleSendPrompt()}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs shadow-md shadow-blue-500/25 disabled:opacity-50 flex items-center gap-1.5 transition-all"
                >
                  <span>Search</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
