'use client'

import React, { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Stack,
  Chip,
  IconButton,
  CircularProgress,
  Divider,
  Paper,
} from '@mui/material'
import {
  Close as CloseIcon,
  AccountBalanceWallet as WalletIcon,
  LockClock as LockClockIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Shield as ShieldIcon,
  VolunteerActivism as DonationIcon,
  ElectricBolt as BoltIcon,
} from '@mui/icons-material'

export default function UniversalRewardsWalletModal({ open, onClose, userId }) {
  const [walletData, setWalletData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchWallet = async () => {
    if (!userId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/wallet?userId=${userId}`)
      const json = await res.json()
      if (json.success) {
        setWalletData(json.data)
      }
    } catch (err) {
      console.error('Wallet fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchWallet()
    }
  }, [open, userId])

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'CASHBACK':
        return { label: 'Universal Cashback', color: '#10B981', bg: 'rgba(16, 185, 129, 0.12)' }
      case 'SLA_COMPENSATION':
        return { label: 'SLA Delay Guarantee', color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.12)' }
      case 'ROUNDUP_DONATION':
        return { label: 'Community Round-Up', color: '#EC4899', bg: 'rgba(236, 72, 153, 0.12)' }
      case 'PURCHASE':
        return { label: 'Order Payment', color: '#6366F1', bg: 'rgba(99, 102, 241, 0.12)' }
      default:
        return { label: cat, color: '#94A3B8', bg: 'rgba(148, 163, 184, 0.12)' }
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
      <DialogTitle sx={{ m: 0, p: 2.5, bgcolor: '#0f172a', color: '#ffffff' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: 2,
                bgcolor: 'rgba(37, 99, 235, 0.2)',
                color: '#60A5FA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <WalletIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} sx={{ fontSize: 18, lineHeight: 1.2 }}>
                Universal Rewards Wallet
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8' }}>
                Double-Entry Cross-Vertical Platform Ledger
              </Typography>
            </Box>
          </Stack>
          <IconButton onClick={onClose} sx={{ color: '#94A3B8' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress size={32} />
          </Box>
        ) : (
          <Stack spacing={2.5}>
            {/* Balance Overview Cards */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              {/* Available Immediately */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <BoltIcon sx={{ color: '#10B981', fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                    Available Balance
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a' }}>
                  ${walletData?.balance?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="caption" color="#10B981" fontWeight={600} sx={{ display: 'block', mt: 0.5 }}>
                  ✓ Usable across all verticals (Food, Pharmacy, Tech)
                </Typography>
              </Paper>

              {/* Escrow Hold (Pending Clearance) */}
              <Paper
                elevation={0}
                sx={{
                  flex: 1,
                  p: 2.5,
                  borderRadius: 2.5,
                  bgcolor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <LockClockIcon sx={{ color: '#F59E0B', fontSize: 18 }} />
                  <Typography variant="caption" fontWeight={700} color="text.secondary" textTransform="uppercase">
                    Pending Clearance
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} sx={{ color: '#64748b' }}>
                  ${walletData?.escrowBalance?.toFixed(2) || '0.00'}
                </Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ display: 'block', mt: 0.5 }}>
                  Clears when retail return window expires (72h)
                </Typography>
              </Paper>
            </Stack>

            {/* Double-Entry Ledger History */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5, color: '#1e293b' }}>
                Double-Entry Ledger Transactions
              </Typography>

              {!walletData?.transactions?.length ? (
                <Paper sx={{ p: 4, textAlign: 'center', bgcolor: '#ffffff', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No wallet transactions yet. Earn cashback and compensation credits on your orders!
                  </Typography>
                </Paper>
              ) : (
                <Stack spacing={1}>
                  {walletData.transactions.map((tx) => {
                    const badge = getCategoryBadge(tx.category)
                    const isCredit = tx.type === 'CREDIT'

                    return (
                      <Paper
                        key={tx.id}
                        elevation={0}
                        sx={{
                          p: 1.75,
                          borderRadius: 2,
                          bgcolor: '#ffffff',
                          border: '1px solid #edf2f7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              bgcolor: isCredit ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: isCredit ? '#10B981' : '#EF4444',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            {isCredit ? <ArrowDownwardIcon sx={{ fontSize: 16 }} /> : <ArrowUpwardIcon sx={{ fontSize: 16 }} />}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ fontSize: 13 }}>
                              {tx.description}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center" mt={0.3}>
                              <Chip
                                label={badge.label}
                                size="small"
                                sx={{
                                  height: 18,
                                  fontSize: 9.5,
                                  fontWeight: 800,
                                  bgcolor: badge.bg,
                                  color: badge.color,
                                  borderRadius: 1,
                                }}
                              />
                              <Typography variant="caption" color="text.disabled" sx={{ fontSize: 11 }}>
                                {new Date(tx.createdAt).toLocaleDateString()}
                              </Typography>
                            </Stack>
                          </Box>
                        </Stack>

                        <Box sx={{ textAlign: 'right' }}>
                          <Typography
                            variant="subtitle1"
                            fontWeight={900}
                            sx={{ color: isCredit ? '#10B981' : '#0f172a' }}
                          >
                            {isCredit ? '+' : '-'}${tx.amount.toFixed(2)}
                          </Typography>
                          <Typography variant="caption" color="text.disabled">
                            Bal: ${tx.balanceAfter.toFixed(2)}
                          </Typography>
                        </Box>
                      </Paper>
                    )
                  })}
                </Stack>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  )
}
