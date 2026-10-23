'use client'

import React, { useState } from 'react'
import { FileText, Upload, CheckCircle2, AlertCircle, Clock, ShieldCheck, X } from 'lucide-react'

export default function PharmacyPrescriptionModal({
  isOpen,
  onClose,
  userId,
  onPrescriptionApproved,
}) {
  const [patientName, setPatientName] = useState('')
  const [doctorName, setDoctorName] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [submittedRx, setSubmittedRx] = useState(null)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleSimulatedUpload = (e) => {
    // In production this uploads to S3/Cloud storage; we simulate the secure URL
    const file = e.target.files?.[0]
    if (file) {
      setFileUrl(`https://s3.ap-southeast-2.amazonaws.com/quickdelivery-rx/${Date.now()}_${file.name}`)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setUploading(true)

    try {
      const res = await fetch('/api/pharmacy/prescriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          patientName,
          doctorName,
          fileUrl: fileUrl || 'https://s3.ap-southeast-2.amazonaws.com/quickdelivery-rx/default_rx_sample.pdf',
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to upload prescription')

      setSubmittedRx(data.prescription)
      if (onPrescriptionApproved) {
        onPrescriptionApproved(data.prescription)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Licensed Prescription Upload
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Healthcare Regulatory Compliance & Pharmacist Verification
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/50 p-3 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!submittedRx ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-950/30 p-3 text-xs text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Prescription items cannot be dispensed without an authorized doctor's prescription. Our licensed pharmacist will review the order within 5 minutes.
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Patient Full Name *
              </label>
              <input
                type="text"
                required
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                placeholder="e.g. John Doe"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Doctor / Clinic Name
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={(e) => setDoctorName(e.target.value)}
                placeholder="e.g. Dr. Sarah Jenkins, MD"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Prescription File (PDF, PNG, JPG) *
              </label>
              <div className="mt-1 flex justify-center rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 px-6 pt-5 pb-6 hover:border-teal-500 transition">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-8 w-8 text-slate-400" />
                  <div className="flex text-sm text-slate-600 dark:text-slate-400">
                    <label className="relative cursor-pointer font-medium text-teal-600 hover:text-teal-500">
                      <span>Upload document</span>
                      <input type="file" className="sr-only" onChange={handleSimulatedUpload} accept="image/*,.pdf" />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">Up to 10MB file</p>
                  {fileUrl && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-teal-600 font-medium mt-2">
                      <FileText className="h-4 w-4" />
                      <span>Document attached successfully</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-xl bg-teal-600 py-3 text-sm font-bold text-white shadow-lg hover:bg-teal-700 disabled:opacity-50 transition"
            >
              {uploading ? 'Validating & Uploading...' : 'Submit for Pharmacist Review'}
            </button>
          </form>
        ) : (
          <div className="text-center py-6 space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Prescription Received #{submittedRx.id}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Patient: <span className="font-semibold text-slate-800 dark:text-slate-200">{submittedRx.patientName}</span>
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 rounded-xl bg-slate-100 dark:bg-slate-800 p-3 text-xs text-slate-600 dark:text-slate-300">
              <Clock className="h-4 w-4 text-teal-500 animate-spin" />
              <span>Status: <strong className="uppercase text-teal-600">{submittedRx.status.replace('_', ' ')}</strong></span>
            </div>

            <button
              onClick={onClose}
              className="w-full rounded-xl bg-slate-900 dark:bg-white py-2.5 text-sm font-semibold text-white dark:text-slate-900 hover:opacity-90 transition"
            >
              Return to Checkout
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
