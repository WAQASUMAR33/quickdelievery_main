'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Facebook, Instagram, Twitter, Youtube, Mail, Clock, ShieldCheck, Truck, Headphones, RotateCcw } from 'lucide-react'

const CustomerFooter = () => {
    const { t } = useLanguage()
    const { isDark } = useTheme()
    const currentYear = new Date().getFullYear()

    return (
        <footer className={`mt-12 w-full transition-colors duration-300 border-t ${
            isDark 
                ? 'bg-[#0A0F1D] border-slate-800/80 text-slate-300' 
                : 'bg-slate-50 border-slate-200 text-slate-600'
        }`}>
            {/* Value Highlights */}
            <div className={`py-8 w-full border-b transition-colors duration-300 ${
                isDark 
                    ? 'bg-[#060A14] border-slate-800/80' 
                    : 'bg-white border-slate-200'
            }`}>
                <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center sm:text-left">
                        {/* 1. Express Delivery */}
                        <div className="flex items-center justify-center sm:justify-start gap-3.5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                isDark 
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25' 
                                    : 'bg-blue-50 text-blue-600 border border-blue-100 shadow-sm'
                            }`}>
                                <Truck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('expressFastDelivery')}</h4>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('expressFastDeliverySub')}</p>
                            </div>
                        </div>

                        {/* 2. Genuine Brands */}
                        <div className="flex items-center justify-center sm:justify-start gap-3.5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                isDark 
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25' 
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm'
                            }`}>
                                <ShieldCheck className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('genuineBrands')}</h4>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('genuineBrandsSub')}</p>
                            </div>
                        </div>

                        {/* 3. Easy Returns */}
                        <div className="flex items-center justify-center sm:justify-start gap-3.5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                isDark 
                                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25' 
                                    : 'bg-amber-50 text-amber-600 border border-amber-100 shadow-sm'
                            }`}>
                                <RotateCcw className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('easyReturns')}</h4>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('easyReturnsSub')}</p>
                            </div>
                        </div>

                        {/* 4. Priority Support */}
                        <div className="flex items-center justify-center sm:justify-start gap-3.5">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-colors ${
                                isDark 
                                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/25' 
                                    : 'bg-cyan-50 text-cyan-600 border border-cyan-100 shadow-sm'
                            }`}>
                                <Headphones className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{t('support247')}</h4>
                                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t('supportSub')}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Marketplace Brand Info */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-500 to-amber-500 rounded-xl flex items-center justify-center text-white font-black text-lg shadow-md">
                                QD
                            </div>
                            <div>
                                <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                    Quick<span className="text-blue-500">Delivery</span>
                                </span>
                                <span className={`block text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                                    Multi-Vendor Marketplace
                                </span>
                            </div>
                        </div>
                        <p className={`text-xs sm:text-sm mb-4 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            {t('footerAbout')}
                        </p>
                        <div className="flex gap-2.5">
                            <motion.a
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    isDark 
                                        ? 'bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700' 
                                        : 'bg-white hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 shadow-sm'
                                }`}
                            >
                                <Facebook className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    isDark 
                                        ? 'bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700' 
                                        : 'bg-white hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 shadow-sm'
                                }`}
                            >
                                <Instagram className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    isDark 
                                        ? 'bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700' 
                                        : 'bg-white hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 shadow-sm'
                                }`}
                            >
                                <Twitter className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.08 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${
                                    isDark 
                                        ? 'bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700' 
                                        : 'bg-white hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 shadow-sm'
                                }`}
                            >
                                <Youtube className="w-4 h-4" />
                            </motion.a>
                        </div>
                    </div>

                    {/* Quick Marketplace Links */}
                    <div>
                        <h3 className={`font-black mb-4 text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {t('quickNav')}
                        </h3>
                        <ul className="space-y-2.5 text-xs sm:text-sm">
                            <li>
                                <Link href="/" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>
                                    {t('flashDrops')} & {t('allCollections')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>
                                    {t('customerAccountSignIn') || 'Customer Account & Sign In'}
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>
                                    {t('createCustomerAccount') || 'Create Free Customer Account'}
                                </Link>
                            </li>
                            <li>
                                <Link href="/customer" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>
                                    {t('trackActiveOrders') || 'Track Active Orders'}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Multi-Vendor Partner Programs */}
                    <div>
                        <h3 className={`font-black mb-4 text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {t('becomePartner')}
                        </h3>
                        <ul className="space-y-2.5 text-xs sm:text-sm">
                            <li>
                                <Link href="/business-register" className={`transition-colors font-bold ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}>
                                    {t('sellZeroComm')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/driver/register" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>
                                    {t('registerDriver')}
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>
                                    {t('vendorPortal') || 'Vendor Merchant Portal'}
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className={`transition-colors ${isDark ? 'text-slate-400 hover:text-blue-400' : 'text-slate-600 hover:text-blue-600'}`}>
                                    {t('driverPortal') || 'Driver Operations Login'}
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Guarantee */}
                    <div>
                        <h3 className={`font-black mb-4 text-xs uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {t('customerCare')}
                        </h3>
                        <ul className="space-y-3 text-xs sm:text-sm">
                            <li className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <Mail className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-indigo-400' : 'text-blue-600'}`} />
                                <span>support@quickdelivery.com</span>
                            </li>
                            <li className={`flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                <Clock className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-indigo-400' : 'text-blue-600'}`} />
                                <span>{t('liveDispatchHours') || 'Live Dispatch Hours: 24/7 Nationwide'}</span>
                            </li>
                        </ul>
                        <div className={`mt-4 p-3.5 rounded-2xl border transition-colors ${
                            isDark 
                                ? 'bg-slate-800/80 border-slate-700/80 text-slate-300' 
                                : 'bg-white border-slate-200 shadow-sm text-slate-600'
                        }`}>
                            <p className="text-xs leading-relaxed">
                                {t('footerOrderHelp') || 'Need help with an existing order? Access live tracking or message customer care directly in your'} <Link href="/customer" className={`font-bold hover:underline ${isDark ? 'text-indigo-400' : 'text-blue-600'}`}>{t('myOrders') || 'Orders'}</Link>.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className={`border-t transition-colors duration-300 ${
                isDark 
                    ? 'bg-slate-950 border-slate-800/80 text-slate-500' 
                    : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
                <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12 py-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                        <p>
                            © {currentYear} {t('copyright')}
                        </p>
                        <div className="flex flex-wrap items-center gap-6">
                            <Link href="/" className={`transition-colors ${isDark ? 'hover:text-indigo-400' : 'hover:text-blue-600'}`}>
                                {t('privacyPolicy') || 'Privacy Policy'}
                            </Link>
                            <Link href="/" className={`transition-colors ${isDark ? 'hover:text-indigo-400' : 'hover:text-blue-600'}`}>
                                {t('termsOfService') || 'Terms of Service'}
                            </Link>
                            <Link href="/" className={`transition-colors ${isDark ? 'hover:text-indigo-400' : 'hover:text-blue-600'}`}>
                                {t('merchantAgreement') || 'Merchant Agreement'}
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default CustomerFooter
