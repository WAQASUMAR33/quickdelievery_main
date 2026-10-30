'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

import { useTheme } from '@mui/material/styles'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogContentText from '@mui/material/DialogContentText'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import Stack from '@mui/material/Stack'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TablePagination from '@mui/material/TablePagination'
import TableRow from '@mui/material/TableRow'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'

import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GpsFixedIcon from '@mui/icons-material/GpsFixed'
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import RefreshIcon from '@mui/icons-material/Refresh'
import SearchIcon from '@mui/icons-material/Search'
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'

const BRAND = '#39772A'
const BRAND_DARK = '#4ade80'

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '&:hover fieldset': { borderColor: BRAND },
    '&.Mui-focused fieldset': { borderColor: BRAND },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
}

function parseGalleryCount(raw) {
  if (!raw) return 0
  if (Array.isArray(raw)) return raw.filter(Boolean).length
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return parsed.filter(Boolean).length
  } catch {
    return String(raw)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean).length
  }
  return 0
}

function StatCard({ label, value, sub, Icon, color }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        borderRadius: 2.5,
        borderTop: `3px solid ${color}`,
        height: '100%',
        bgcolor: 'background.paper',
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" spacing={1}>
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            fontWeight={700}
            textTransform="uppercase"
            letterSpacing={0.5}
            sx={{ fontSize: '0.68rem' }}
          >
            {label}
          </Typography>
          <Typography variant="h5" fontWeight={900} color="text.primary" sx={{ my: 0.5, lineHeight: 1.15 }} noWrap>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" noWrap>
            {sub}
          </Typography>
        </Box>
        <Box
          sx={{
            bgcolor: `${color}18`,
            color,
            borderRadius: 2,
            p: 1,
            display: 'flex',
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 22 }} />
        </Box>
      </Stack>
    </Paper>
  )
}

function BusinessKycChip({ status }) {
  const map = {
    APPROVED: {
      label: 'KYC Approved',
      bg: '#dcfce7',
      color: '#15803d',
      darkBg: 'rgba(34,197,94,0.18)',
      darkColor: '#4ade80',
    },
    PENDING: {
      label: 'KYC Pending',
      bg: '#fef3c7',
      color: '#b45309',
      darkBg: 'rgba(245,158,11,0.18)',
      darkColor: '#fbbf24',
    },
    REJECTED: {
      label: 'KYC Rejected',
      bg: '#fee2e2',
      color: '#b91c1c',
      darkBg: 'rgba(239,68,68,0.18)',
      darkColor: '#f87171',
    },
    NONE: {
      label: 'No Profile Yet',
      bg: '#f1f5f9',
      color: '#64748b',
      darkBg: 'rgba(148,163,184,0.14)',
      darkColor: '#94a3b8',
    },
  }
  const s = map[status] || map.NONE
  return (
    <Chip
      size="small"
      label={s.label}
      sx={{
        bgcolor: (t) => (t.palette.mode === 'dark' ? s.darkBg : s.bg),
        color: (t) => (t.palette.mode === 'dark' ? s.darkColor : s.color),
        fontWeight: 800,
        fontSize: '0.7rem',
        height: 23,
      }}
    />
  )
}

export default function VendorManagement() {
  const router = useRouter()
  const theme = useTheme()
  const isDark = theme.palette.mode === 'dark'
  const accent = isDark ? BRAND_DARK : BRAND

  const [vendors, setVendors] = useState([])
  const [businessMap, setBusinessMap] = useState({})
  const [productCountMap, setProductCountMap] = useState({})
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Search & filters
  const [search, setSearch] = useState('')
  const [filterKyc, setFilterKyc] = useState('all')
  const [filterEmail, setFilterEmail] = useState('all')

  // Pagination
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    kycApproved: 0,
    kycPending: 0,
    products: 0,
    revenue: 0,
  })

  // Confirmation dialogs for destructive/quick actions
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toggling, setToggling] = useState(false)

  const fetchVendors = useCallback(async () => {
    setRefreshing(true)
    try {
      const [usersRes, businessesRes, productsRes] = await Promise.all([
        fetch('/api/users/all'),
        fetch('/api/admin/businesses?all=true'),
        fetch('/api/products?type=products'),
      ])
      const [usersData, businessesData, productsData] = await Promise.all([
        usersRes.json(),
        businessesRes.json(),
        productsRes.json(),
      ])

      const vendorUsers = usersData.success
        ? (usersData.data || []).filter((u) => u.role === 'VENDOR')
        : []
      const businesses = businessesData.success ? businessesData.data || [] : []
      const products = productsData.success ? productsData.data || [] : []

      const bMap = {}
      businesses.forEach((b) => {
        if (b.email) bMap[b.email.trim().toLowerCase()] = b
      })

      const pCount = {}
      products.forEach((p) => {
        if (p.vendorId) pCount[p.vendorId] = (pCount[p.vendorId] || 0) + 1
      })

      const vProducts = products.filter((p) => vendorUsers.some((v) => v.uid === p.vendorId))
      const stockVal = vProducts.reduce((s, p) => s + parseFloat(p.price || 0) * (p.stock || 0), 0)

      let kycApproved = 0
      let kycPending = 0
      vendorUsers.forEach((v) => {
        const biz = bMap[(v.email || '').trim().toLowerCase()]
        if (biz?.verificationStatus === 'APPROVED') kycApproved += 1
        else if (biz?.verificationStatus === 'PENDING') kycPending += 1
      })

      setVendors(vendorUsers)
      setBusinessMap(bMap)
      setProductCountMap(pCount)
      setStats({
        total: vendorUsers.length,
        kycApproved,
        kycPending,
        products: vProducts.length,
        revenue: stockVal,
      })
    } catch {
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchVendors()
  }, [fetchVendors])

  const enrichedVendors = useMemo(() => {
    return vendors.map((v) => {
      const biz = businessMap[(v.email || '').trim().toLowerCase()] || null
      const docCount = biz
        ? [biz.urlCnicFront, biz.urlCnicBack, biz.urlLogo, biz.urlCoverPhoto].filter(Boolean).length +
          parseGalleryCount(biz.urlRestaurantImages)
        : 0
      return {
        ...v,
        business: biz,
        productCount: productCountMap[v.uid] || 0,
        docCount,
      }
    })
  }, [vendors, businessMap, productCountMap])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return enrichedVendors.filter((v) => {
      const biz = v.business
      const matchSearch =
        !q ||
        (v.username || '').toLowerCase().includes(q) ||
        (v.email || '').toLowerCase().includes(q) ||
        (v.phoneNumber || '').toLowerCase().includes(q) ||
        (biz?.businessName || '').toLowerCase().includes(q) ||
        (biz?.city || '').toLowerCase().includes(q) ||
        (biz?.cnicNo || '').toLowerCase().includes(q)

      const kycStatus = biz?.verificationStatus || 'NONE'
      const matchKyc = filterKyc === 'all' || kycStatus === filterKyc

      const matchEmail =
        filterEmail === 'all' ||
        (filterEmail === 'verified' && v.emailVerification) ||
        (filterEmail === 'unverified' && !v.emailVerification)

      return matchSearch && matchKyc && matchEmail
    })
  }, [enrichedVendors, search, filterKyc, filterEmail])

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/users?uid=${deleteTarget.uid}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Vendor deleted')
        setDeleteTarget(null)
        fetchVendors()
      } else {
        toast.error(data.error || 'Delete failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      const res = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: toggleTarget.uid, emailVerification: !toggleTarget.emailVerification }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(toggleTarget.emailVerification ? 'Verification revoked' : 'Vendor verified')
        setToggleTarget(null)
        fetchVendors()
      } else {
        toast.error(data.error || 'Update failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setToggling(false)
    }
  }

  const goToVendorPage = (vendor, tab = 0) => {
    const query = tab > 0 ? `?tab=${tab}` : ''
    router.push(`/admin/dashboard/vendors/${vendor.id}${query}`)
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={340} gap={2}>
        <CircularProgress size={30} sx={{ color: accent }} />
        <Typography color="text.secondary" fontWeight={600}>
          Loading vendors & business profiles…
        </Typography>
      </Box>
    )
  }

  return (
    <Box>
      {/* ── Page Header ── */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              p: 1.1,
              borderRadius: 2.5,
              bgcolor: isDark ? 'rgba(74,222,128,0.14)' : 'rgba(57,119,42,0.1)',
              color: accent,
              display: 'flex',
            }}
          >
            <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={800} lineHeight={1.2}>
              Vendor & Merchant Directory
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Click any vendor to open their complete Business Profile, KYC documents, images, and GPS storefront map
            </Typography>
          </Box>
        </Stack>

        <Button
          variant="outlined"
          size="small"
          startIcon={refreshing ? <CircularProgress size={14} /> : <RefreshIcon />}
          onClick={fetchVendors}
          disabled={refreshing}
          sx={{
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 2,
            borderColor: 'divider',
            color: 'text.secondary',
          }}
        >
          Refresh
        </Button>
      </Stack>

      {/* ── Executive KPI Strip ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        <StatCard
          label="Total Vendors"
          value={stats.total}
          sub={`${vendors.filter((v) => v.emailVerification).length} email verified`}
          Icon={PeopleOutlinedIcon}
          color="#2563eb"
        />
        <StatCard
          label="KYC Approved"
          value={stats.kycApproved}
          sub="Active verified storefronts"
          Icon={VerifiedUserOutlinedIcon}
          color="#16a34a"
        />
        <StatCard
          label="Pending KYC Review"
          value={stats.kycPending}
          sub="Awaiting document review"
          Icon={HourglassEmptyIcon}
          color="#d97706"
        />
        <StatCard
          label="Catalog Products"
          value={stats.products}
          sub="Across all vendor stores"
          Icon={Inventory2OutlinedIcon}
          color="#7c3aed"
        />
        <StatCard
          label="Inventory Value"
          value={`Rs. ${stats.revenue.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`}
          sub="Active listed vendor stock"
          Icon={AttachMoneyIcon}
          color={BRAND}
        />
      </Box>

      {/* ── Search & Multi-Filter Bar ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2.5, borderRadius: 2.5 }}>
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
          <TextField
            size="small"
            placeholder="Search business name, vendor, email, phone, CNIC, or city…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(0)
            }}
            sx={{ flex: 1, ...fieldSx }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                </InputAdornment>
              ),
            }}
          />

          <FormControl size="small" sx={{ minWidth: 185, ...fieldSx }}>
            <InputLabel>Business KYC Status</InputLabel>
            <Select
              label="Business KYC Status"
              value={filterKyc}
              onChange={(e) => {
                setFilterKyc(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="all">All KYC Statuses</MenuItem>
              <MenuItem value="APPROVED">KYC Approved</MenuItem>
              <MenuItem value="PENDING">KYC Pending Review</MenuItem>
              <MenuItem value="REJECTED">KYC Rejected</MenuItem>
              <MenuItem value="NONE">No Business Profile</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 165, ...fieldSx }}>
            <InputLabel>Account Email</InputLabel>
            <Select
              label="Account Email"
              value={filterEmail}
              onChange={(e) => {
                setFilterEmail(e.target.value)
                setPage(0)
              }}
            >
              <MenuItem value="all">All Accounts</MenuItem>
              <MenuItem value="verified">Email Verified</MenuItem>
              <MenuItem value="unverified">Email Unverified</MenuItem>
            </Select>
          </FormControl>

          <Chip
            label={`${filtered.length} vendor${filtered.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{
              bgcolor: isDark ? 'rgba(74,222,128,0.16)' : `${BRAND}15`,
              color: accent,
              fontWeight: 800,
              px: 0.75,
              height: 28,
            }}
          />
        </Stack>
      </Paper>

      {/* ── Vendors Directory Table ── */}
      <Paper variant="outlined" sx={{ borderRadius: 2.5, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc' }}>
                {[
                  'Storefront & Vendor',
                  'Category & City',
                  'Contact & Media',
                  'Verification Status',
                  'Joined',
                  'Actions',
                ].map((h) => (
                  <TableCell
                    key={h}
                    sx={{
                      fontWeight: 800,
                      fontSize: '0.72rem',
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      py: 1.75,
                    }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 7 }}>
                    <StorefrontOutlinedIcon sx={{ fontSize: 42, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary" fontWeight={600}>
                      No vendors match your search criteria
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((vendor) => {
                  const biz = vendor.business
                  const hasGps = biz?.latitude != null && biz?.longitude != null
                  return (
                    <TableRow
                      key={vendor.id}
                      hover
                      onClick={() => goToVendorPage(vendor, 0)}
                      sx={{
                        cursor: 'pointer',
                        transition: 'background-color 0.15s ease',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(74,222,128,0.05)' : 'rgba(57,119,42,0.04)',
                        },
                      }}
                    >
                      {/* Storefront & Vendor */}
                      <TableCell sx={{ py: 1.75 }}>
                        <Stack direction="row" alignItems="center" spacing={1.75}>
                          <Avatar
                            src={biz?.urlLogo || vendor.image}
                            sx={{
                              width: 44,
                              height: 44,
                              bgcolor: BRAND,
                              color: '#fff',
                              fontSize: 16,
                              fontWeight: 800,
                              flexShrink: 0,
                              border: '1px solid',
                              borderColor: 'divider',
                            }}
                          >
                            {(biz?.businessName || vendor.username || 'V').charAt(0).toUpperCase()}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={800} color="text.primary" noWrap>
                              {biz?.businessName || vendor.username}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" display="block" noWrap>
                              {biz?.businessName ? `${vendor.username} • ` : ''}
                              {vendor.email}
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Category & City */}
                      <TableCell sx={{ py: 1.75 }}>
                        {biz ? (
                          <Stack spacing={0.4}>
                            <Typography variant="body2" fontWeight={700} color="text.primary">
                              {biz.businessCategory?.categoryTitle || biz.category?.name || biz.vertical || 'Store'}
                              {biz.businessType?.typeTitle ? ` • ${biz.businessType.typeTitle}` : ''}
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.3 }}
                              >
                                <LocationOnOutlinedIcon sx={{ fontSize: 13 }} />
                                {biz.city}, {biz.state}
                              </Typography>
                              {hasGps && (
                                <Chip
                                  size="small"
                                  icon={<GpsFixedIcon sx={{ fontSize: '11px !important' }} />}
                                  label="GPS"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    goToVendorPage(vendor, 1)
                                  }}
                                  sx={{
                                    height: 19,
                                    fontSize: '0.64rem',
                                    fontWeight: 800,
                                    bgcolor: isDark ? 'rgba(59,130,246,0.18)' : '#eff6ff',
                                    color: isDark ? '#60a5fa' : '#2563eb',
                                    '& .MuiChip-icon': { color: 'inherit' },
                                  }}
                                />
                              )}
                            </Stack>
                          </Stack>
                        ) : (
                          <Typography variant="caption" color="text.disabled">
                            Profile not submitted
                          </Typography>
                        )}
                      </TableCell>

                      {/* Contact & Media */}
                      <TableCell sx={{ py: 1.75 }}>
                        <Stack spacing={0.5}>
                          <Typography
                            variant="body2"
                            color="text.primary"
                            fontWeight={600}
                            sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}
                          >
                            <PhoneOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                            {biz?.phoneNumber1 || vendor.phoneNumber || '—'}
                          </Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center">
                            <Chip
                              size="small"
                              icon={<CollectionsOutlinedIcon sx={{ fontSize: '12px !important' }} />}
                              label={`${vendor.docCount} files`}
                              onClick={(e) => {
                                e.stopPropagation()
                                goToVendorPage(vendor, 2)
                              }}
                              sx={{
                                height: 20,
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                bgcolor: 'action.hover',
                                '& .MuiChip-icon': { color: 'text.secondary' },
                              }}
                            />
                            <Chip
                              size="small"
                              label={`${vendor.productCount} items`}
                              onClick={(e) => {
                                e.stopPropagation()
                                goToVendorPage(vendor, 3)
                              }}
                              sx={{
                                height: 20,
                                fontSize: '0.66rem',
                                fontWeight: 700,
                                bgcolor: 'action.hover',
                              }}
                            />
                          </Stack>
                        </Stack>
                      </TableCell>

                      {/* Verification Status */}
                      <TableCell sx={{ py: 1.75 }}>
                        <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
                          <BusinessKycChip status={biz?.verificationStatus || 'NONE'} />
                          <Chip
                            size="small"
                            label={vendor.emailVerification ? 'Email Verified' : 'Email Pending'}
                            sx={{
                              height: 23,
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              bgcolor: vendor.emailVerification
                                ? isDark
                                  ? 'rgba(34,197,94,0.14)'
                                  : '#f0fdf4'
                                : isDark
                                ? 'rgba(245,158,11,0.14)'
                                : '#fefce8',
                              color: vendor.emailVerification
                                ? isDark
                                  ? '#4ade80'
                                  : '#16a34a'
                                : isDark
                                ? '#fbbf24'
                                : '#a16207',
                            }}
                          />
                        </Stack>
                      </TableCell>

                      {/* Joined */}
                      <TableCell sx={{ py: 1.75 }}>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(vendor.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                        </Typography>
                      </TableCell>

                      {/* Actions */}
                      <TableCell sx={{ py: 1.75 }} onClick={(e) => e.stopPropagation()}>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <Button
                            size="small"
                            variant="contained"
                            endIcon={<ArrowForwardIcon sx={{ fontSize: '15px !important' }} />}
                            onClick={() => goToVendorPage(vendor, 0)}
                            sx={{
                              bgcolor: BRAND,
                              '&:hover': { bgcolor: '#2d5e21' },
                              color: '#fff',
                              textTransform: 'none',
                              fontWeight: 800,
                              fontSize: '0.76rem',
                              borderRadius: 1.75,
                              px: 1.5,
                              py: 0.55,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            View Profile
                          </Button>

                          <Tooltip title={vendor.emailVerification ? 'Revoke email verification' : 'Verify email'}>
                            <IconButton
                              size="small"
                              onClick={() => setToggleTarget(vendor)}
                              sx={{
                                color: 'text.secondary',
                                '&:hover': { color: vendor.emailVerification ? '#d97706' : '#16a34a' },
                              }}
                            >
                              {vendor.emailVerification ? (
                                <BlockOutlinedIcon sx={{ fontSize: 18 }} />
                              ) : (
                                <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                              )}
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Delete vendor">
                            <IconButton
                              size="small"
                              onClick={() => setDeleteTarget(vendor)}
                              sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                            >
                              <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10))
            setPage(0)
          }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* ── Toggle Email Verification Confirm ── */}
      <Dialog
        open={!!toggleTarget}
        onClose={() => !toggling && setToggleTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>
          {toggleTarget?.emailVerification ? 'Revoke Email Verification' : 'Verify Vendor Email'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toggleTarget?.emailVerification ? (
              <>
                <strong>{toggleTarget?.username}</strong> will be marked as unverified.
              </>
            ) : (
              <>
                <strong>{toggleTarget?.username}</strong> will be marked as email-verified.
              </>
            )}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setToggleTarget(null)} disabled={toggling} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleToggle}
            disabled={toggling}
            sx={{
              bgcolor: toggleTarget?.emailVerification ? '#b45309' : '#16a34a',
              '&:hover': { bgcolor: toggleTarget?.emailVerification ? '#92400e' : '#15803d' },
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
            }}
            startIcon={toggling ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {toggling ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Vendor Confirm ── */}
      <Dialog
        open={!!deleteTarget}
        onClose={() => !deleting && setDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2.5 } }}
      >
        <DialogTitle sx={{ fontWeight: 800 }}>Delete Vendor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.username}</strong>? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: 'none', borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
