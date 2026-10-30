'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import {
  Navigation,
  MapPin,
  Clock,
  Car,
  Package,
  CheckCircle,
  XCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Phone,
  User,
  ArrowRight,
} from 'lucide-react'
import toast from 'react-hot-toast'

export default function RidesHistoryList({ onRebook }) {
  const { user, userData } = useAuth()
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRides = useCallback(async (isRefresh = false) => {
    const userRef = userData?.id || userData?.uid || user?.id
    try {
      if (isRefresh) setRefreshing(true)
      else setLoading(true)

      const url = userRef
        ? `/api/rides/history?role=CUSTOMER&customerId=${encodeURIComponent(userRef)}`
        : '/api/rides/history?role=CUSTOMER'

      const res = await fetch(url)
      const data = await res.json()
      if (data.success) {
        setRides(data.data || [])
      } else {
        toast.error(data.error || 'Failed to load ride history')
      }
    } catch (err) {
      console.error('Error fetching ride history:', err)
      toast.error('Unable to fetch ride history')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userData, user])

  useEffect(() => {
    fetchRides()
  }, [fetchRides])

  // Filter & Search Logic
  const filteredRides = rides.filter((ride) => {
    const matchesFilter =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'COMPLETED'
        ? ride.status === 'COMPLETED'
        : filterStatus === 'CANCELLED'
        ? ride.status === 'CANCELLED'
        : ['IN_PROGRESS', 'ACCEPTED', 'DRIVER_ARRIVED', 'SEARCHING'].includes(ride.status)

    const q = searchQuery.trim().toLowerCase()
    const matchesSearch =
      q === ''
        ? true
        : String(ride.id).includes(q) ||
          (ride.pickupAddress && ride.pickupAddress.toLowerCase().includes(q)) ||
          (ride.dropoffAddress && ride.dropoffAddress.toLowerCase().includes(q)) ||
          (ride.driver?.name && ride.driver.name.toLowerCase().includes(q))

    return matchesFilter && matchesSearch
  })

  const counts = {
    all: rides.length,
    active: rides.filter((r) => ['IN_PROGRESS', 'ACCEPTED', 'DRIVER_ARRIVED', 'SEARCHING'].includes(r.status)).length,
    completed: rides.filter((r) => r.status === 'COMPLETED').length,
    cancelled: rides.filter((r) => r.status === 'CANCELLED').length,
  }

  return (
    <div className="w-full space-y-6">
      {/* ── Subheader Controls ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              RapidRide & Taxi Trips
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#43046C]/10 text-[#43046C] dark:bg-[#FDB600]/20 dark:text-[#FDB600]">
              {rides.length} trips
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            View your ride history, fares, driver details, and re-book previous routes.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pickup, dropoff, or driver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:border-[#43046C] w-48 sm:w-56"
            />
          </div>

          <button
            type="button"
            onClick={() => fetchRides(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 shadow-2xs active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-[#43046C]' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── Status Pills ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-slate-800">
        {[
          { id: 'ALL', label: 'All Trips', count: counts.all },
          { id: 'ACTIVE', label: 'In Transit', count: counts.active },
          { id: 'COMPLETED', label: 'Completed', count: counts.completed },
          { id: 'CANCELLED', label: 'Cancelled', count: counts.cancelled },
        ].map((tab) => {
          const isActive = filterStatus === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilterStatus(tab.id)}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[#43046C] text-[#FDB600] shadow-sm font-black'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-[#FDB600] text-[#43046C]' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {/* ── Rides List ── */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          ))}
        </div>
      ) : filteredRides.length === 0 ? (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-[#43046C] dark:text-[#FDB600] flex items-center justify-center mx-auto mb-4 border border-[#FDB600]/30">
            <Car className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">
            {searchQuery ? 'No matching trips found' : 'No trips in this category'}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5">
            {searchQuery
              ? `We couldn't find any trips matching "${searchQuery}".`
              : 'When you book rides or luggage dispatches, they will be saved here with complete route details and fares.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredRides.map((ride) => {
            const isCompleted = ride.status === 'COMPLETED'
            const isCancelled = ride.status === 'CANCELLED'
            const statusConfig = isCompleted
              ? { label: 'Completed', bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-300/60', icon: <CheckCircle className="w-3.5 h-3.5" /> }
              : isCancelled
              ? { label: 'Cancelled', bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-300/60', icon: <XCircle className="w-3.5 h-3.5" /> }
              : { label: ride.status, bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-300/60', icon: <Clock className="w-3.5 h-3.5" /> }

            const dateStr = ride.createdAt
              ? new Date(ride.createdAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
              : 'Recently'

            return (
              <motion.div
                key={ride.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:border-[#FDB600]/70 hover:shadow-md transition-all"
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-black text-slate-500">
                      Trip #{ride.id}
                    </span>
                    <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      {ride.serviceType === 'LUGGAGE' ? <Package className="w-3 h-3 text-purple-500" /> : <Car className="w-3 h-3 text-emerald-500" />}
                      {ride.serviceType === 'LUGGAGE' ? 'Luggage Drop' : 'City Taxi'}
                    </span>
                    <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusConfig.bg}`}>
                      {statusConfig.icon}
                      {statusConfig.label}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {dateStr}
                  </span>
                </div>

                {/* Route Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-3">
                  <div className="space-y-2 p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Pickup Location</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{ride.pickupAddress}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5 pt-2 border-t border-slate-200/50 dark:border-slate-700/50">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 mt-1 flex-shrink-0" />
                      <div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Dropoff Destination</span>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-xs leading-relaxed">{ride.dropoffAddress}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-500 dark:text-slate-400 text-xs">Trip Fare:</span>
                        <span className="font-black text-lg text-slate-900 dark:text-white">
                          Rs. {Number(ride.finalFare || ride.customerFare || 0).toLocaleString()}
                        </span>
                      </div>
                      {ride.estimatedDistanceKm && (
                        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs">
                          <span>Route Distance:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{ride.estimatedDistanceKm} km</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mt-1">
                        <span>Payment Method:</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{ride.paymentMethod || 'Cash'}</span>
                      </div>
                    </div>

                    {ride.driver && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                            {ride.driver.name}
                          </span>
                          {ride.driver.vehicleNumber && ride.driver.vehicleNumber !== 'N/A' && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                              {ride.driver.vehicleNumber}
                            </span>
                          )}
                        </div>
                        {ride.driver.phoneNumber && (
                          <span className="text-xs text-slate-400 font-mono">
                            {ride.driver.phoneNumber}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer action */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 mt-2">
                  <span className="text-[11px] text-slate-400">
                    Category: <strong className="text-slate-600 dark:text-slate-300">{ride.rideCategory || 'Standard'}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      if (onRebook) {
                        onRebook(ride)
                      } else {
                        // Switch to taxi tab
                        window.dispatchEvent(new CustomEvent('openTaxiWithRoute', { detail: ride }))
                        toast.success('Route loaded! Switching to Book a Ride...')
                      }
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-black text-[#43046C] dark:text-[#FDB600] bg-[#43046C]/10 dark:bg-[#FDB600]/15 hover:bg-[#43046C]/20 rounded-xl transition-all active:scale-95"
                  >
                    <span>Re-book Route</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}

