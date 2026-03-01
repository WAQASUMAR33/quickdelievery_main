'use client'

import { motion } from 'framer-motion'
import { Facebook, Instagram, Twitter, Youtube, Smartphone, Mail, MapPin } from 'lucide-react'

const CustomerFooter = () => {
    const currentYear = new Date().getFullYear()

    return (
        <footer className="bg-white border-t border-gray-100 mt-16">
            {/* Main Footer Content */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <div className="w-10 h-10 bg-[#D70F64] rounded-xl flex items-center justify-center text-white font-bold text-xl">
                                FP
                            </div>
                            <span className="text-2xl font-bold text-[#D70F64] tracking-tight">foodpanda</span>
                        </div>
                        <p className="text-gray-600 text-sm mb-4">
                            Your favorite food and groceries, delivered fast to your doorstep.
                        </p>
                        <div className="flex gap-3">
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                href="#"
                                className="w-10 h-10 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Facebook className="w-5 h-5" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                href="#"
                                className="w-10 h-10 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Instagram className="w-5 h-5" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                href="#"
                                className="w-10 h-10 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Twitter className="w-5 h-5" />
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.95 }}
                                href="#"
                                className="w-10 h-10 bg-gray-100 hover:bg-[#D70F64] rounded-full flex items-center justify-center text-gray-600 hover:text-white transition-all"
                            >
                                <Youtube className="w-5 h-5" />
                            </motion.a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Quick Links</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    About Us
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Careers
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Press
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Blog
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Help & Support
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Partner With Us */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Partner With Us</h3>
                        <ul className="space-y-2">
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Become a Vendor
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Become a Rider
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Corporate Partnerships
                                </a>
                            </li>
                            <li>
                                <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors text-sm">
                                    Advertise With Us
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 text-sm uppercase tracking-wider">Contact Us</h3>
                        <ul className="space-y-3">
                            <li className="flex items-start gap-2 text-gray-600 text-sm">
                                <MapPin className="w-4 h-4 text-[#D70F64] mt-0.5 flex-shrink-0" />
                                <span>123 Food Street, Islamabad, Pakistan</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600 text-sm">
                                <Smartphone className="w-4 h-4 text-[#D70F64] flex-shrink-0" />
                                <span>+92 300 1234567</span>
                            </li>
                            <li className="flex items-center gap-2 text-gray-600 text-sm">
                                <Mail className="w-4 h-4 text-[#D70F64] flex-shrink-0" />
                                <span>support@foodpanda.pk</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* App Download Section */}
                <div className="mt-12 pt-8 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div>
                            <h3 className="font-bold text-gray-900 mb-2">Download the App</h3>
                            <p className="text-gray-600 text-sm">Get exclusive deals and faster checkout</p>
                        </div>
                        <div className="flex gap-4">
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="#"
                                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] opacity-80">Download on the</div>
                                    <div className="text-sm font-bold">App Store</div>
                                </div>
                            </motion.a>
                            <motion.a
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                href="#"
                                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl hover:bg-gray-800 transition-colors"
                            >
                                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.53,12.9 20.18,13.18L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z" />
                                </svg>
                                <div className="text-left">
                                    <div className="text-[10px] opacity-80">GET IT ON</div>
                                    <div className="text-sm font-bold">Google Play</div>
                                </div>
                            </motion.a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="bg-gray-50 border-t border-gray-100">
                <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                        <p className="text-gray-600 text-sm">
                            © {currentYear} foodpanda. All rights reserved.
                        </p>
                        <div className="flex flex-wrap items-center gap-6 text-sm">
                            <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                Privacy Policy
                            </a>
                            <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                Terms of Service
                            </a>
                            <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                Cookie Policy
                            </a>
                            <a href="#" className="text-gray-600 hover:text-[#D70F64] transition-colors">
                                Sitemap
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    )
}

export default CustomerFooter
