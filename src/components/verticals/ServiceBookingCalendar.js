'use client'

import React, { useState } from 'react'
import { Calendar, Clock, MapPin, CheckCircle, ShieldCheck, Wrench, AlertTriangle } from 'lucide-react'

export default function ServiceBookingCalendar({
  service = {
    name: 'Home Deep Cleaning & AC Sanitization',
    vendorName: 'RapidClean Pro Services',
    baseQuote: 45.00,
    maxRadiusKm: 15,
  },
  customerLocation = { lat: 31.5204, lng: 74.3587 },
  vendorLocation = { lat: 31.5100, lng: 74.3400 },
  onConfirmBooking,
}) {
  const [selectedDate, setSelectedDate] = useState(
    new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [selectedSlot, setSelectedSlot] = useState('Morning (10:00 AM – 12:00 PM)')
  const [quotationAccepted, setQuotationAccepted] = useState(true)

  const slots = [
    { id: 'morning', label: 'Morning (10:00 AM – 12:00 PM)', icon: '☀️' },
    { id: 'afternoon', label: 'Afternoon (02:00 PM – 04:00 PM)', icon: '🌤️' },
    { id: 'evening', label: 'Evening (06:00 PM – 08:00 PM)', icon: '🌙' },
  ]

  // Distance computation (Haversine approx in km)
  const dLat = ((customerLocation.lat - vendorLocation.lat) * Math.PI) / 180
  const dLon = ((customerLocation.lng - vendorLocation.lng) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((vendorLocation.lat * Math.PI) / 180) *
      Math.cos((customerLocation.lat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const distKm = (6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)
  const isWithinRadius = parseFloat(distKm) <= (service.maxRadiusKm || 15)

  const handleBooking = () => {
    if (onConfirmBooking) {
      onConfirmBooking({
        serviceName: service.name,
        slotDate: selectedDate,
        slotWindow: selectedSlot,
        quotationAmount: service.baseQuote,
        quotationAccepted,
        distKm,
      })
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-xl max-w-lg w-full">
      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Wrench className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white">{service.name}</h3>
          <p className="text-xs text-slate-500">{service.vendorName}</p>
        </div>
      </div>

      {/* Geolocation Radius Check */}
      <div className="my-4">
        {isWithinRadius ? (
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>
              Address verified within service zone (<strong>{distKm} km away</strong>; max radius {service.maxRadiusKm} km).
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-red-600" />
            <span>Address is outside verified service radius ({distKm} km &gt; {service.maxRadiusKm} km limit).</span>
          </div>
        )}
      </div>

      {/* Date Picker */}
      <div className="space-y-2 mb-4">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Calendar className="h-4 w-4 text-blue-500" /> Select Appointment Date
        </label>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Time Slot Picker */}
      <div className="space-y-2 mb-4">
        <label className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
          <Clock className="h-4 w-4 text-blue-500" /> Select Time Window
        </label>
        <div className="grid grid-cols-1 gap-2">
          {slots.map((slot) => {
            const isSelected = selectedSlot === slot.label
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlot(slot.label)}
                className={`flex items-center justify-between rounded-xl p-3 text-sm font-medium border transition ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200 shadow-sm'
                    : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{slot.icon}</span>
                  <span>{slot.label}</span>
                </div>
                {isSelected && <CheckCircle className="h-4 w-4 text-blue-600" />}
              </button>
            )
          })}
        </div>
      </div>

      {/* Upfront Quotation */}
      <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4 mb-5 border border-slate-200 dark:border-slate-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Upfront Fixed Quotation
          </span>
          <span className="text-xl font-black text-slate-900 dark:text-white">
            ${service.baseQuote.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Includes certified technician visit, standard diagnostics, labor, and safety sanitization.
        </p>

        <label className="flex items-center gap-2 pt-2 border-t border-slate-200 dark:border-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={quotationAccepted}
            onChange={(e) => setQuotationAccepted(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            I accept this upfront quotation and agree to technician dispatch.
          </span>
        </label>
      </div>

      <button
        onClick={handleBooking}
        disabled={!isWithinRadius || !quotationAccepted}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-blue-700 disabled:opacity-50 transition"
      >
        Confirm Service Booking
      </button>
    </div>
  )
}
