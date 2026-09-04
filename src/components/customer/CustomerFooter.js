'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Facebook, Instagram, Twitter, Youtube, Mail, Clock, ShieldCheck, Truck } from 'lucide-react'

const CustomerFooter = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-white border-t border-gray-100 mt-16">
            {/* Value Highlights */}
            <div className="border-b border-gray-100 py-8 bg-gray-50/60">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-pink-100 text-[#D70F64] flex items-center justify-center flex-shrink-0">
                                <Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-gray-900">Fast Doorstep Delivery</h4>
                                <p className="text-xs text-gray-500">Live order tracking with verified drivers</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-pink-100 text-[#D70F64] flex items-center justify-center flex-shrink-0">
                                <ShieldCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-gray-900">Verified Vendors</h4>
                                <p className="text-xs text-gray-500">Carefully curated restaurants and shops</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-3">
                            <div className="w-11 h-11 rounded-xl bg-pink-100 text-[#D70F64] flex items-center justify-center flex-shrink-0">
                                <Clock className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-sm text-gray-900">Always Open</h4>
                                <p className="text-xs text-gray-500">Order any time from local partners</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Footer Content */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <div className="flex items-center gap-2.5 mb-4">
                            <div className="w-10 h-10 bg-[#D70F64] rounded-xl flex items-center justify-center text-white font-black text-lg shadow-sm">
                                QD
                            </div>
                            <span className="text-2xl font-black text-[#D70F64] tracking-tight">QuickDelivery</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                            Your trusted on-demand platform for fresh meals, everyday groceries, and retail essentials delivered quickly.
                        </p>
                        <div className="flex gap-2.5">
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://facebook.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Facebook className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://instagram.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Instagram className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://twitter.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Twitter className="w-4 h-4" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="https://youtube.com"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-9 h-9 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Youtube className="w-4 h-4" />
                            </motion.a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link href="/" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                    Explore & Order
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                    Customer Login
                                </Link>
                            </li>
                            <li>
                                <Link href="/register" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                    Create Account
                                </Link>
                            </li>
                            <li>
                                <Link href="/customer/orders" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                    My Orders
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Partner With Us */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-wider">Partner With Us</h3>
                        <ul className="space-y-2.5 text-sm">
                            <li>
                                <Link href="/business-register" className="text-gray-600 hover:text-[#D70F64] transition-colors font-semibold">
                                    Register as Vendor
                                </Link>
                            </li>
                            <li>
                                <Link href="/driver/register" className="text-gray-600 hover:text-[#D70F64] transition-colors font-semibold">
                                    Register as Driver
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                    Vendor Portal Sign In
                                </Link>
                            </li>
                            <li>
                                <Link href="/login" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                    Driver Portal Sign In
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support & Contact Info */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-xs uppercase tracking-wider">Help & Support</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-2 text-gray-600">
                                <Mail className="w-4 h-4 text-[#D70F64] flex-shrink-0" />
                                <span>Support via Help Center & In-app Chat</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600">
                                <Clock className="w-4 h-4 text-[#D70F64] flex-shrink-0" />
                                <span>Delivery Hours: Mon – Sun (Live Dispatch)</span>
                            </li>
                        </ul>
                        <div className="mt-4 p-3 bg-pink-50/60 rounded-xl border border-pink-100">
                            <p className="text-xs text-gray-600">
                                Have an issue with an active order? Track status or contact support directly from your <Link href="/customer" className="font-bold text-[#D70F64] hover:underline">Orders</Link> tab.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-gray-50 border-t border-gray-100">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-5">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-500">
                        <p>
                            © {currentYear} QuickDelivery. All rights reserved.
                        </p>
                        <div className="flex flex-wrap items-center gap-6">
                            <Link href="/" className="hover:text-[#D70F64] transition-colors">
                                Privacy Policy
                            </Link>
                            <Link href="/" className="hover:text-[#D70F64] transition-colors">
                                Terms of Service
                            </Link>
                            <Link href="/" className="hover:text-[#D70F64] transition-colors">
                                Cookie Policy
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default CustomerFooter
