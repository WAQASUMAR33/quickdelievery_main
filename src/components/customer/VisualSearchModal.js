'use client'

import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Stack,
  Alert,
} from '@mui/material'
import {
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  CameraAlt as CameraIcon,
  Sparkles as SparklesIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { getProductUrl } from '@/lib/productSlug'

export default function VisualSearchModal({ open, onClose, isDark = true }) {
  const router = useRouter()
  const fileInputRef = useRef(null)

  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [matchedProducts, setMatchedProducts] = useState([])
  const [errorMsg, setErrorMsg] = useState('')
  const [needsApiKey, setNeedsApiKey] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleReset = () => {
    setImageFile(null)
    setImagePreview(null)
    setLoading(false)
    setAnalysis(null)
    setMatchedProducts([])
    setErrorMsg('')
    setNeedsApiKey(false)
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const processImageFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image (JPEG, PNG, WebP).')
      return
    }

    setErrorMsg('')
    setNeedsApiKey(false)
    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await fetch('/api/ai/image-search', {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()

      if (data.needsApiKey) {
        setNeedsApiKey(true)
        setErrorMsg(data.message || 'Gemini API key is required.')
      } else if (data.success) {
        setAnalysis(data.visualAnalysis)
        setMatchedProducts(data.products || [])
      } else {
        setErrorMsg(data.error || 'Could not analyze this photo. Please try another.')
      }
    } catch (err) {
      console.error('Visual search error:', err)
      setErrorMsg('Failed to process image. Please check your network and try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0])
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
          color: isDark ? '#F8FAFC' : '#0F172A',
          border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #E2E8F0',
          borderRadius: 0, // Sharp aesthetic
          boxShadow: isDark
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(37, 99, 235, 0.25)'
            : '0 20px 40px -10px rgba(0, 0, 0, 0.15)',
          overflow: 'hidden',
          p: 0,
        },
      }}
    >
      {/* ── Modal Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.2,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 36,
              height: 36,
              bgcolor: 'rgba(37, 99, 235, 0.15)',
              border: '1px solid rgba(37, 99, 235, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
            }}
          >
            <CameraIcon sx={{ fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: -0.2, lineHeight: 1.2 }}>
              Visual & Image Search
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 500 }}>
              Powered by Google Gemini Vision AI
            </Typography>
          </Box>
        </Stack>

        <IconButton
          onClick={handleClose}
          size="small"
          sx={{
            color: isDark ? '#94A3B8' : '#64748B',
            borderRadius: 0,
            '&:hover': { color: isDark ? '#FFFFFF' : '#0F172A', bgcolor: 'rgba(255,255,255,0.06)' },
          }}
        >
          <CloseIcon sx={{ fontSize: 20 }} />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
        />

        {/* ── Drag & Drop / Upload Area ── */}
        {!imagePreview ? (
          <Box
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              p: 5,
              textAlign: 'center',
              border: '2px dashed',
              borderColor: dragOver ? '#2563EB' : isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1',
              bgcolor: dragOver
                ? 'rgba(37, 99, 235, 0.08)'
                : isDark
                ? 'rgba(255,255,255,0.02)'
                : '#F8FAFC',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                borderColor: '#2563EB',
                bgcolor: 'rgba(37, 99, 235, 0.04)',
              },
            }}
          >
            <Box
              sx={{
                width: 64,
                height: 64,
                mx: 'auto',
                mb: 2,
                borderRadius: '50%',
                bgcolor: 'rgba(37, 99, 235, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563EB',
              }}
            >
              <UploadIcon sx={{ fontSize: 32 }} />
            </Box>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5, fontSize: 16 }}>
              Drop your product photo or screenshot here
            </Typography>
            <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 2 }}>
              Supports JPG, PNG, WebP up to 10MB
            </Typography>
            <Button
              variant="contained"
              size="small"
              sx={{
                bgcolor: '#2563EB',
                color: '#FFFFFF',
                borderRadius: 0,
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
                py: 1,
                boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                '&:hover': { bgcolor: '#1D4ED8' },
              }}
            >
              Select Image File
            </Button>
          </Box>
        ) : (
          <Box>
            {/* ── Active Scanning / Analysis Header ── */}
            <Box
              sx={{
                display: 'flex',
                flexDirection: { xs: 'column', md: 'row' },
                gap: 3,
                mb: 3,
                p: 2.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F1F5F9',
                border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
              }}
            >
              {/* Preview Thumbnail with Scanning Animation */}
              <Box
                sx={{
                  position: 'relative',
                  width: { xs: '100%', md: 160 },
                  height: 160,
                  flexShrink: 0,
                  overflow: 'hidden',
                  bgcolor: '#000000',
                  border: '1px solid rgba(37, 99, 235, 0.4)',
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Search upload"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />

                {/* Laser scan line animation while loading */}
                {loading && (
                  <Box
                    component={motion.div}
                    animate={{ y: [0, 155, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
                    sx={{
                      position: 'absolute',
                      left: 0,
                      right: 0,
                      height: 3,
                      bgcolor: '#00F0FF',
                      boxShadow: '0 0 12px #00F0FF, 0 0 24px #2563EB',
                    }}
                  />
                )}
              </Box>

              {/* Analysis details / Loader */}
              <Box sx={{ flex: 1 }}>
                {loading ? (
                  <Box sx={{ py: 3, textAlign: 'center' }}>
                    <CircularProgress size={32} sx={{ color: '#2563EB', mb: 1.5 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Analyzing visual features with Gemini Vision…
                    </Typography>
                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                      Detecting item category, brand logos, primary colors and textures
                    </Typography>
                  </Box>
                ) : analysis ? (
                  <Box>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <Chip
                        size="small"
                        icon={<CheckCircleIcon sx={{ fontSize: '14px !important', color: '#10B981 !important' }} />}
                        label="Visual Identification Complete"
                        sx={{
                          borderRadius: 0,
                          bgcolor: 'rgba(16, 185, 129, 0.12)',
                          color: '#10B981',
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      />
                      {analysis.brand && (
                        <Chip
                          size="small"
                          label={`Brand: ${analysis.brand}`}
                          sx={{ borderRadius: 0, bgcolor: 'rgba(37, 99, 235, 0.15)', color: '#3B82F6', fontWeight: 700 }}
                        />
                      )}
                      {analysis.color && (
                        <Chip
                          size="small"
                          label={`Color: ${analysis.color}`}
                          sx={{ borderRadius: 0, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', fontWeight: 600 }}
                        />
                      )}
                    </Stack>

                    <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 17, mb: 0.5 }}>
                      {analysis.itemName || 'Identified Product'}
                    </Typography>
                    <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', mb: 1.5, fontSize: 13 }}>
                      {analysis.description}
                    </Typography>

                    {/* Detected tags */}
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {(analysis.searchKeywords || []).map((tag, idx) => (
                        <Chip
                          key={idx}
                          size="small"
                          label={`#${tag}`}
                          sx={{
                            borderRadius: 0,
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                            fontSize: 11,
                            fontWeight: 600,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                ) : null}

                {/* Change photo button */}
                <Box sx={{ mt: 2 }}>
                  <Button
                    size="small"
                    onClick={() => fileInputRef.current?.click()}
                    sx={{
                      borderRadius: 0,
                      textTransform: 'none',
                      fontSize: 12,
                      fontWeight: 700,
                      color: isDark ? '#94A3B8' : '#64748B',
                      p: 0,
                      '&:hover': { color: '#2563EB', bgcolor: 'transparent' },
                    }}
                  >
                    ↺ Upload a different photo
                  </Button>
                </Box>
              </Box>
            </Box>

            {/* ── API Key Missing Alert ── */}
            {needsApiKey && (
              <Alert
                severity="info"
                sx={{
                  borderRadius: 0,
                  mb: 3,
                  bgcolor: 'rgba(37, 99, 235, 0.1)',
                  color: isDark ? '#E2E8F0' : '#1E293B',
                  border: '1px solid rgba(37, 99, 235, 0.3)',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 0.5 }}>
                  Gemini API Key Setup Required
                </Typography>
                <Typography variant="body2" sx={{ fontSize: 12.5, mb: 1 }}>
                  To activate real-time Gemini Vision image recognition:
                </Typography>
                <ol style={{ paddingLeft: 18, margin: 0, fontSize: 12.5, lineHeight: 1.6 }}>
                  <li>
                    Visit{' '}
                    <a
                      href="https://aistudio.google.com/app/apikey"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#3B82F6', fontWeight: 'bold' }}
                    >
                      Google AI Studio (aistudio.google.com/app/apikey)
                    </a>
                  </li>
                  <li>Click &quot;Create API Key&quot; (Free Tier)</li>
                  <li>Add to your project <code>.env</code> file: <code>GEMINI_API_KEY=your_key_here</code></li>
                </ol>
              </Alert>
            )}

            {/* Error Message */}
            {errorMsg && !needsApiKey && (
              <Alert severity="error" sx={{ borderRadius: 0, mb: 3 }}>
                {errorMsg}
              </Alert>
            )}

            {/* ── Matched Products Grid ── */}
            {!loading && matchedProducts.length > 0 && (
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, mb: 1.5, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 12 }}>
                  Visually Similar Catalog Items ({matchedProducts.length})
                </Typography>

                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                    gap: 1.5,
                    maxHeight: 340,
                    overflowY: 'auto',
                    pr: 0.5,
                  }}
                >
                  {matchedProducts.map((p) => {
                    const price = parseFloat(p.salePrice || p.price || 0)
                    const thumb = Array.isArray(p.proImages) && p.proImages.length > 0 ? p.proImages[0] : null
                    const productUrl = getProductUrl(p)

                    return (
                      <Box
                        key={p.proId}
                        onClick={() => {
                          handleClose()
                          router.push(productUrl)
                        }}
                        sx={{
                          p: 1.5,
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
                          border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          '&:hover': {
                            borderColor: '#2563EB',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: '100%',
                            height: 120,
                            bgcolor: isDark ? 'rgba(0,0,0,0.3)' : '#F1F5F9',
                            mb: 1,
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {thumb ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={thumb}
                              alt={p.proName}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Typography variant="caption" sx={{ color: '#94A3B8' }}>No Image</Typography>
                          )}
                        </Box>

                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 700,
                            fontSize: 13,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            mb: 0.5,
                          }}
                        >
                          {p.proName}
                        </Typography>

                        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 'auto' }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: '#2563EB' }}>
                            ${price.toFixed(2)}
                          </Typography>
                          {p.similarityScore > 0 && (
                            <Chip
                              size="small"
                              label={`${Math.min(99, p.similarityScore)}% Match`}
                              sx={{
                                borderRadius: 0,
                                height: 18,
                                fontSize: 10,
                                fontWeight: 800,
                                bgcolor: 'rgba(37, 99, 235, 0.15)',
                                color: '#3B82F6',
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    )
                  })}
                </Box>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>
    </Dialog>
  )
}
