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
  Divider,
  Paper,
  FormControlLabel,
  Checkbox,
  RadioGroup,
  Radio,
  Alert,
  TextField,
} from '@mui/material'
import {
  Bolt as BoltIcon,
  Schedule as ScheduleIcon,
  LocalShipping as ShippingIcon,
  Storefront as StorefrontIcon,
  VolunteerActivism as DonationIcon,
  AccountBalanceWallet as WalletIcon,
  DeleteOutline as DeleteIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'

export default function SuperAppUnifiedCart({
  cartItems = [],
  currentUser = null,
  onUpdateQuantity,
  onRemoveItem,
  onCheckoutSuccess,
}) {
  const router = useRouter()
  const [breakdown, setBreakdown] = useState(null)
  const [loadingBreakdown, setLoadingBreakdown] = useState(true)
  const [checkingOut, setCheckingOut] = useState(false)
  const [roundUpEnabled, setRoundUpEnabled] = useState(true)
  const [useWallet, setUseWallet] = useState(false)
  const [walletBalance, setWalletBalance] = useState(0)
  const [shippingAddress, setShippingAddress] = useState('123 Central Boulevard, Suite 4A, Lahore')
  const [orderCompleteData, setOrderCompleteData] = useState(null)

  // Fetch decomposition calculation
  const calculateCart = async () => {
    if (!cartItems.length) {
      setBreakdown(null)
      setLoadingBreakdown(false)
      return
    }

    setLoadingBreakdown(true)
    try {
      const res = await fetch('/api/cart/decompose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cartItems,
          options: {
            enableRoundUpDonation: roundUpEnabled,
          },
        }),
      })
      const json = await res.json()
      if (json.success) {
        setBreakdown(json.data)
      }
    } catch (err) {
      console.error('Error decomposing cart:', err)
    } finally {
      setLoadingBreakdown(false)
    }
  }

  // Fetch user's wallet balance
  const fetchWallet = async () => {
    if (!currentUser?.id) return
    try {
      const res = await fetch(`/api/wallet?userId=${currentUser.id}`)
      const json = await res.json()
      if (json.success) {
        setWalletBalance(json.data.balance || 0)
      }
    } catch (err) {
      console.error('Error fetching wallet:', err)
    }
  }

  useEffect(() => {
    calculateCart()
  }, [cartItems, roundUpEnabled])

  useEffect(() => {
    fetchWallet()
  }, [currentUser])

  // Process master order checkout
  const handleMasterCheckout = async () => {
    if (!currentUser?.id) {
      alert('Please log in to proceed with checkout')
      router.push('/login')
      return
    }

    setCheckingOut(true)
    try {
      const res = await fetch('/api/orders/checkout-master', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          items: cartItems,
          shippingAddress,
          deliveryLatitude: 31.5204,
          deliveryLongitude: 74.3587,
          paymentMethod: useWallet ? 'WALLET_AND_CARD' : 'CREDIT_CARD',
          useWalletBalance: useWallet,
          enableRoundUpDonation: roundUpEnabled,
        }),
      })

      const json = await res.json()
      if (json.success) {
        setOrderCompleteData(json.data)
        if (onCheckoutSuccess) onCheckoutSuccess(json.data)
      } else {
        alert(json.error || 'Checkout failed')
      }
    } catch (err) {
      console.error('Checkout error:', err)
      alert('An unexpected error occurred during checkout.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (orderCompleteData) {
    const { masterOrder, subOrders, onTheWayAddonAvailable } = orderCompleteData

    return (
      <Paper sx={{ p: 4, borderRadius: 3, textAlign: 'center', bgcolor: '#ffffff' }}>
        <Box
          sx={{
            width: 60,
            height: 60,
            borderRadius: '50%',
            bgcolor: 'rgba(16, 185, 129, 0.12)',
            color: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 36 }} />
        </Box>

        <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5, mb: 1 }}>
          Master Order Placed Successfully!
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Order #{masterOrder.masterOrderNumber} has been split into {subOrders.length} independent fulfillment streams.
        </Typography>

        <Stack spacing={2} sx={{ maxWidth: 540, mx: 'auto', mb: 3, textAlign: 'left' }}>
          {subOrders.map((sub, i) => (
            <Card key={sub.id || i} sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="subtitle2" fontWeight={800}>
                    Sub-Order #{sub.subOrderNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Track: {sub.fulfillmentTrack}
                  </Typography>
                </Box>
                <Chip
                  label={sub.status}
                  size="small"
                  sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 800, fontSize: 10 }}
                />
              </Stack>
            </Card>
          ))}
        </Stack>

        <Button
          variant="contained"
          onClick={() => {
            setOrderCompleteData(null)
            router.push('/customer')
          }}
          sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 4 }}
        >
          Continue Shopping
        </Button>
      </Paper>
    )
  }

  if (!cartItems.length) {
    return (
      <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed #cbd5e1' }}>
        <Typography variant="h6" fontWeight={700} color="text.secondary" mb={1}>
          Your Super App cart is currently empty
        </Typography>
        <Typography variant="body2" color="text.disabled" mb={3}>
          Browse restaurants, supermarkets, pharmacies, and tech electronics to build your unified cart.
        </Typography>
        <Button
          variant="outlined"
          onClick={() => router.push('/customer')}
          sx={{ textTransform: 'none', fontWeight: 700 }}
        >
          Explore Catalog
        </Button>
      </Paper>
    )
  }

  return (
    <Box>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} alignItems="flex-start">
        {/* Left Column: Split-Fulfillment Streams */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" fontWeight={900} sx={{ letterSpacing: -0.5 }}>
                Unified Single Checkout
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Auto-decomposed across {breakdown?.subOrders?.length || 1} Merchant Fulfillment Tracks
              </Typography>
            </Box>
            <Chip
              label={`${breakdown?.totalItemsCount || cartItems.length} ITEMS`}
              size="small"
              sx={{ fontWeight: 800, bgcolor: '#0f172a', color: '#fff', fontSize: 11 }}
            />
          </Stack>

          {loadingBreakdown && !breakdown ? (
            <Box sx={{ py: 6, textAlign: 'center' }}>
              <CircularProgress size={30} />
            </Box>
          ) : (
            <Stack spacing={2.5}>
              {breakdown?.subOrders?.map((subOrder, idx) => (
                <Card
                  key={idx}
                  sx={{
                    p: 2.5,
                    borderRadius: 2.5,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Track Ribbon */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography fontSize={18}>{subOrder.trackIcon}</Typography>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                          {subOrder.trackTitle}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Merchant: <strong>{subOrder.vendorName}</strong>
                        </Typography>
                      </Box>
                    </Stack>
                    <Chip
                      label={subOrder.trackBadge}
                      size="small"
                      sx={{
                        fontWeight: 800,
                        fontSize: 10,
                        bgcolor:
                          subOrder.fulfillmentTrack.includes('HYPERLOCAL')
                            ? '#FEF3C7'
                            : subOrder.fulfillmentTrack.includes('SCHEDULED')
                            ? '#DBEAFE'
                            : '#F1F5F9',
                        color:
                          subOrder.fulfillmentTrack.includes('HYPERLOCAL')
                            ? '#B45309'
                            : subOrder.fulfillmentTrack.includes('SCHEDULED')
                            ? '#1E40AF'
                            : '#475569',
                      }}
                    />
                  </Stack>

                  {/* Scheduled Slot Selector if Track B */}
                  {subOrder.fulfillmentTrack.includes('SCHEDULED') && (
                    <Box sx={{ p: 1.5, mb: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px dashed #cbd5e1' }}>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" display="block" mb={0.5}>
                        Select Grocery / Service Delivery Slot:
                      </Typography>
                      <Chip
                        label="Morning Slot (10:00 AM – 12:00 PM)"
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 700, fontSize: 11 }}
                      />
                    </Box>
                  )}

                  {/* Item Rows */}
                  <Stack spacing={1.5}>
                    {subOrder.items.map((item, itmIdx) => (
                      <Stack
                        key={item.proId || itmIdx}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}
                      >
                        <Box sx={{ flex: 1, minWidth: 0, pr: 2 }}>
                          <Typography variant="body2" fontWeight={700} noWrap>
                            {item.proName || item.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ${item.unitPrice.toFixed(2)} × {item.quantity}
                          </Typography>
                        </Box>

                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="subtitle2" fontWeight={800} color="#0f172a">
                            ${item.lineTotal.toFixed(2)}
                          </Typography>
                          {onRemoveItem && (
                            <IconButton
                              size="small"
                              onClick={() => onRemoveItem(item.proId || item.id)}
                              sx={{ color: '#94a3b8', '&:hover': { color: '#ef4444' } }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </Stack>
                    ))}
                  </Stack>

                  {/* Sub-order Subtotal Footer */}
                  <Stack direction="row" justifyContent="space-between" alignItems="center" pt={1.5} mt={0.5}>
                    <Typography variant="caption" color="text.secondary">
                      Delivery: <strong>${subOrder.deliveryFee.toFixed(2)}</strong>
                    </Typography>
                    <Typography variant="subtitle2" fontWeight={800}>
                      Subtotal: ${subOrder.total.toFixed(2)}
                    </Typography>
                  </Stack>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* Right Column: Master Order Summary & Payment */}
        <Box sx={{ width: { xs: '100%', md: 360 }, flexShrink: 0 }}>
          <Card sx={{ p: 3, borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: '0 4px 18px rgba(0,0,0,0.04)' }}>
            <Typography variant="h6" fontWeight={800} mb={2}>
              Order Summary
            </Typography>

            {/* Price Lines */}
            <Stack spacing={1.2} mb={2.5}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Items Subtotal
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ${breakdown?.cartSubtotal?.toFixed(2) || '0.00'}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Total Delivery Fees
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ${breakdown?.totalDeliveryFee?.toFixed(2) || '0.00'}
                </Typography>
              </Stack>

              <Stack direction="row" justifyContent="space-between">
                <Typography variant="body2" color="text.secondary">
                  Platform Service (2.5%)
                </Typography>
                <Typography variant="body2" fontWeight={700}>
                  ${breakdown?.serviceCharge?.toFixed(2) || '0.00'}
                </Typography>
              </Stack>

              {/* Round-up Donation Checkbox */}
              <Box sx={{ p: 1.5, bgcolor: '#fdf2f8', borderRadius: 2, border: '1px solid #fbcfe8', my: 1 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={roundUpEnabled}
                      onChange={(e) => setRoundUpEnabled(e.target.checked)}
                      sx={{ color: '#db2777', '&.Mui-checked': { color: '#db2777' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="caption" fontWeight={800} color="#be185d">
                        Round Up for Community Food Bank
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        Add ${breakdown?.roundUpDonation?.toFixed(2) || '0.00'} to support local meals
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              {/* Universal Rewards Wallet Deduction */}
              {walletBalance > 0 && (
                <Box sx={{ p: 1.5, bgcolor: '#f0fdf4', borderRadius: 2, border: '1px solid #bbf7d0', my: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        size="small"
                        checked={useWallet}
                        onChange={(e) => setUseWallet(e.target.checked)}
                        sx={{ color: '#16a34a', '&.Mui-checked': { color: '#16a34a' } }}
                      />
                    }
                    label={
                      <Box>
                        <Typography variant="caption" fontWeight={800} color="#15803d">
                          Apply Universal Rewards Balance
                        </Typography>
                        <Typography variant="caption" color="text.secondary" display="block">
                          Available: ${walletBalance.toFixed(2)} (Earned across all verticals)
                        </Typography>
                      </Box>
                    }
                  />
                </Box>
              )}
            </Stack>

            <Divider sx={{ my: 2 }} />

            {/* Master Total */}
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" mb={3}>
              <Typography variant="subtitle1" fontWeight={900}>
                Master Total
              </Typography>
              <Typography variant="h5" fontWeight={900} color="#0f172a">
                ${breakdown?.finalMasterTotal?.toFixed(2) || '0.00'}
              </Typography>
            </Stack>

            {/* Delivery Address Field */}
            <TextField
              fullWidth
              size="small"
              label="Delivery Address"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Master Checkout CTA */}
            <Button
              fullWidth
              variant="contained"
              size="large"
              disabled={checkingOut || !cartItems.length}
              onClick={handleMasterCheckout}
              endIcon={checkingOut ? <CircularProgress size={18} color="inherit" /> : <ArrowForwardIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: 900,
                fontSize: 14,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                bgcolor: '#0f172a',
                color: '#ffffff',
                '&:hover': { bgcolor: '#1e293b' },
              }}
            >
              {checkingOut ? 'Placing Master Order…' : '1-Click Master Checkout'}
            </Button>
          </Card>
        </Box>
      </Stack>
    </Box>
  )
}
