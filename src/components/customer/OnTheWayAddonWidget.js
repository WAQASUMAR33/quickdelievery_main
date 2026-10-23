'use client'

import React, { useState, useEffect } from 'react'
import {
  Box,
  Typography,
  Stack,
  Chip,
  Button,
  Card,
  CircularProgress,
  IconButton,
  Alert,
} from '@mui/material'
import {
  Bolt as BoltIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Timer as TimerIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'

export default function OnTheWayAddonWidget({ subOrderId, onAddSuccess }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState(null)
  const [addedIds, setAddedIds] = useState([])
  const [secondsLeft, setSecondsLeft] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  // Fetch On-the-way add-on status and nearby items
  const fetchAddons = async () => {
    if (!subOrderId) return
    try {
      const res = await fetch(`/api/orders/on-the-way-addons?subOrderId=${subOrderId}`)
      const json = await res.json()
      if (json.success && json.isActive) {
        setData(json)
        setSecondsLeft(json.remainingSeconds)
      } else {
        setData(null)
      }
    } catch (err) {
      console.error('Error fetching on-the-way addons:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAddons()
  }, [subOrderId])

  // Live countdown timer
  useEffect(() => {
    if (secondsLeft <= 0) return
    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [secondsLeft])

  const handleAddItem = async (item) => {
    setAddingId(item.proId)
    try {
      const res = await fetch('/api/orders/on-the-way-addons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subOrderId,
          productId: item.proId,
          quantity: 1,
        }),
      })
      const result = await res.json()
      if (result.success) {
        setAddedIds((prev) => [...prev, item.proId])
        if (onAddSuccess) onAddSuccess(item)
      } else {
        alert(result.error || 'Failed to add item')
      }
    } catch (err) {
      console.error('Error adding addon item:', err)
    } finally {
      setAddingId(null)
    }
  }

  if (dismissed || loading || !data || secondsLeft <= 0 || !data.items?.length) {
    return null
  }

  const minutes = Math.floor(secondsLeft / 60)
  const seconds = secondsLeft % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #064e3b 100%)',
            color: '#ffffff',
            boxShadow: '0 8px 30px rgba(16, 185, 129, 0.25)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Dismiss button */}
          <IconButton
            size="small"
            onClick={() => setDismissed(true)}
            sx={{ position: 'absolute', top: 12, right: 12, color: 'rgba(255,255,255,0.6)' }}
          >
            <CloseIcon sx={{ fontSize: 18 }} />
          </IconButton>

          {/* Header & Live Countdown Badge */}
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} spacing={1} mb={2}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
                <Chip
                  icon={<BoltIcon sx={{ color: '#10B981 !important', fontSize: 16 }} />}
                  label="ON-THE-WAY ADD-ON"
                  size="small"
                  sx={{
                    bgcolor: 'rgba(16, 185, 129, 0.2)',
                    color: '#34D399',
                    fontWeight: 800,
                    fontSize: 10.5,
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                  }}
                />
                <Chip
                  icon={<TimerIcon sx={{ color: '#F59E0B !important', fontSize: 15 }} />}
                  label={`Window closes in ${formattedTime}`}
                  size="small"
                  sx={{
                    bgcolor: 'rgba(245, 158, 11, 0.15)',
                    color: '#FBBF24',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                  }}
                />
              </Stack>
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: -0.3, fontSize: 17 }}>
                Add small essentials with $0 Delivery Fee!
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>
                Courier is headed your way. Grab snacks, drinks, or items from nearby merchants (&lt;800m).
              </Typography>
            </Box>
          </Stack>

          {/* Horizontal Add-on Items Scroll */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              overflowX: 'auto',
              pb: 1,
              pt: 0.5,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 4 },
            }}
          >
            {data.items.map((item) => {
              const isAdded = addedIds.includes(item.proId)
              const isBusy = addingId === item.proId

              return (
                <Card
                  key={item.proId}
                  sx={{
                    minWidth: 175,
                    maxWidth: 175,
                    p: 1.5,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 2,
                    color: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box>
                    {item.image && (
                      <Box
                        component="img"
                        src={item.image}
                        alt={item.proName}
                        sx={{
                          width: '100%',
                          height: 85,
                          objectFit: 'cover',
                          borderRadius: 1.5,
                          mb: 1,
                        }}
                      />
                    )}
                    <Typography variant="subtitle2" fontWeight={700} noWrap sx={{ fontSize: 13 }}>
                      {item.proName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 0.5 }}>
                      {item.vendorName}
                    </Typography>
                  </Box>

                  <Box sx={{ mt: 1 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                      <Typography variant="body2" fontWeight={800} sx={{ color: '#34D399' }}>
                        ${item.price.toFixed(2)}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#10B981', fontWeight: 700, fontSize: 10 }}>
                        +$0.00 Fee
                      </Typography>
                    </Stack>

                    <Button
                      fullWidth
                      size="small"
                      variant="contained"
                      disabled={isAdded || isBusy}
                      onClick={() => handleAddItem(item)}
                      startIcon={isAdded ? <CheckIcon /> : isBusy ? <CircularProgress size={12} color="inherit" /> : <AddIcon />}
                      sx={{
                        textTransform: 'none',
                        fontSize: 11,
                        fontWeight: 700,
                        borderRadius: 1.5,
                        bgcolor: isAdded ? '#059669' : '#10B981',
                        color: '#ffffff',
                        '&:hover': { bgcolor: '#047857' },
                      }}
                    >
                      {isAdded ? 'Added!' : 'Add to Route'}
                    </Button>
                  </Box>
                </Card>
              )
            })}
          </Stack>
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}
