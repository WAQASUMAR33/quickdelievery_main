'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

import Box               from '@mui/material/Box'
import Paper             from '@mui/material/Paper'
import Typography        from '@mui/material/Typography'
import Stack             from '@mui/material/Stack'
import Grid              from '@mui/material/Grid'
import Button            from '@mui/material/Button'
import IconButton        from '@mui/material/IconButton'
import TextField         from '@mui/material/TextField'
import InputAdornment    from '@mui/material/InputAdornment'
import FormControl       from '@mui/material/FormControl'
import InputLabel        from '@mui/material/InputLabel'
import Select            from '@mui/material/Select'
import MenuItem          from '@mui/material/MenuItem'
import Avatar            from '@mui/material/Avatar'
import Chip              from '@mui/material/Chip'
import Tooltip           from '@mui/material/Tooltip'
import Dialog            from '@mui/material/Dialog'
import DialogTitle       from '@mui/material/DialogTitle'
import DialogContent     from '@mui/material/DialogContent'
import DialogActions     from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import FormControlLabel  from '@mui/material/FormControlLabel'
import Switch            from '@mui/material/Switch'
import Alert             from '@mui/material/Alert'
import Divider           from '@mui/material/Divider'
import Card              from '@mui/material/Card'
import CardContent       from '@mui/material/CardContent'
import CircularProgress  from '@mui/material/CircularProgress'
import Table             from '@mui/material/Table'
import TableHead         from '@mui/material/TableHead'
import TableBody         from '@mui/material/TableBody'
import TableRow          from '@mui/material/TableRow'
import TableCell         from '@mui/material/TableCell'
import TablePagination   from '@mui/material/TablePagination'
import TableContainer    from '@mui/material/TableContainer'

import SearchIcon               from '@mui/icons-material/Search'
import AddIcon                  from '@mui/icons-material/Add'
import EditOutlinedIcon         from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon        from '@mui/icons-material/DeleteOutline'
import VisibilityOutlinedIcon   from '@mui/icons-material/VisibilityOutlined'
import CloseIcon                from '@mui/icons-material/Close'
import RefreshIcon              from '@mui/icons-material/Refresh'
import StorefrontOutlinedIcon   from '@mui/icons-material/StorefrontOutlined'
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'
import HourglassEmptyIcon       from '@mui/icons-material/HourglassEmpty'
import PeopleOutlinedIcon       from '@mui/icons-material/PeopleOutlined'
import PersonOutlinedIcon       from '@mui/icons-material/PersonOutlined'
import EmailOutlinedIcon        from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon        from '@mui/icons-material/PhoneOutlined'
import Inventory2OutlinedIcon   from '@mui/icons-material/Inventory2Outlined'
import AttachMoneyIcon          from '@mui/icons-material/AttachMoney'
import CheckCircleOutlineIcon   from '@mui/icons-material/CheckCircleOutline'
import BlockOutlinedIcon        from '@mui/icons-material/BlockOutlined'
import InfoOutlinedIcon         from '@mui/icons-material/InfoOutlined'
import DomainOutlinedIcon       from '@mui/icons-material/DomainOutlined'
import ThumbUpOutlinedIcon      from '@mui/icons-material/ThumbUpOutlined'
import ThumbDownOutlinedIcon    from '@mui/icons-material/ThumbDownOutlined'

import VendorBusinessProfile    from '@/components/vendor/VendorBusinessProfile'

const BRAND = '#39772A'

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset':       { borderColor: BRAND },
    '&.Mui-focused fieldset': { borderColor: BRAND },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
}

const EMPTY_FORM = { username: '', email: '', phoneNumber: '', emailVerification: false }

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, Icon, color }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 0,
        borderTop: `3px solid ${color}`,
        height: '100%',
        bgcolor: '#ffffff',
      }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={800} color="#111827" sx={{ my: 0.5, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">{sub}</Typography>
        </Box>
        <Box sx={{ bgcolor: `${color}15`, color, borderRadius: 0, p: 1, display: 'flex' }}>
          <Icon sx={{ fontSize: 22 }} />
        </Box>
      </Stack>
    </Paper>
  )
}

// ── Profile field ─────────────────────────────────────────────────────────────
function ProfileField({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0, height: '100%', bgcolor: 'grey.50' }}>
      <Typography variant="caption" color="text.disabled" fontWeight={600} textTransform="uppercase" letterSpacing={0.4} display="block" mb={0.5}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={600} color="text.primary">{value || '—'}</Typography>
    </Paper>
  )
}

// ── Status chip helper ────────────────────────────────────────────────────────
function BusinessStatusChip({ status }) {
  const map = {
    APPROVED: { label: 'Approved', bg: '#dcfce7', color: '#16a34a' },
    REJECTED: { label: 'Rejected', bg: '#fee2e2', color: '#dc2626' },
    PENDING:  { label: 'Pending',  bg: '#fef9c3', color: '#854d0e' },
  }
  const s = map[status] || map.PENDING
  return (
    <Chip label={s.label} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: 12 }} />
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const parseImages = (raw) => {
  if (!raw) return []
  try { const p = JSON.parse(raw); return Array.isArray(p) ? p : [] }
  catch { return [] }
}

const SectionHeading = ({ label }) => (
  <Typography variant="overline" sx={{ color: BRAND, fontWeight: 700, letterSpacing: 1, fontSize: 11, display: 'block', mb: 1.5 }}>
    {label}
  </Typography>
)

// ── Main component ────────────────────────────────────────────────────────────
export default function VendorManagement() {
  const [vendors,    setVendors]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // search / filter
  const [search,             setSearch]             = useState('')
  const [filterVerification, setFilterVerification] = useState('all')

  // pagination
  const [page,     setPage]     = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // stats
  const [stats, setStats] = useState({ total: 0, verified: 0, pending: 0, products: 0, revenue: 0 })

  // dialogs
  const [viewTarget,   setViewTarget]   = useState(null)
  const [editTarget,   setEditTarget]   = useState(null)
  const [editOpen,     setEditOpen]     = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toggleTarget, setToggleTarget] = useState(null)
  const [formData,     setFormData]     = useState(EMPTY_FORM)
  const [saving,       setSaving]       = useState(false)
  const [deleting,     setDeleting]     = useState(false)
  const [toggling,     setToggling]     = useState(false)

  // business profile dialog
  const [businessOpen,    setBusinessOpen]    = useState(false)
  const [businessVendor,  setBusinessVendor]  = useState(null)
  const [businessData,    setBusinessData]    = useState(null)
  const [businessLoading, setBusinessLoading] = useState(false)
  const [verifying,       setVerifying]       = useState(false)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchVendors = useCallback(async () => {
    setRefreshing(true)
    try {
      const [usersRes, productsRes] = await Promise.all([
        fetch('/api/users/all'),
        fetch('/api/products?type=products'),
      ])
      const usersData    = await usersRes.json()
      const productsData = await productsRes.json()

      if (usersData.success) {
        const list = (usersData.data || []).filter(u => u.role === 'VENDOR')
        setVendors(list)
        const products     = productsData.success ? (productsData.data || []) : []
        const vProducts    = products.filter(p => list.some(v => v.uid === p.vendorId))
        const revenue      = vProducts.reduce((s, p) => s + parseFloat(p.price) * p.stock, 0)
        setStats({
          total:    list.length,
          verified: list.filter(v => v.emailVerification).length,
          pending:  list.filter(v => !v.emailVerification).length,
          products: vProducts.length,
          revenue,
        })
      }
    } catch {
      toast.error('Failed to load vendors')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => { fetchVendors() }, [fetchVendors])

  // ── Filtered rows ─────────────────────────────────────────────────────────
  const filtered = vendors.filter(v => {
    const q = search.toLowerCase()
    const matchSearch = !q || v.username.toLowerCase().includes(q) || v.email.toLowerCase().includes(q)
    const matchVerify =
      filterVerification === 'all' ||
      (filterVerification === 'verified'   && v.emailVerification) ||
      (filterVerification === 'unverified' && !v.emailVerification)
    return matchSearch && matchVerify
  })

  const paginated = filtered.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)

  // ── Add / Edit ────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditTarget(null)
    setFormData(EMPTY_FORM)
    setEditOpen(true)
  }
  const openEdit = (row) => {
    setEditTarget(row)
    setFormData({ username: row.username, email: row.email, phoneNumber: row.phoneNumber, emailVerification: row.emailVerification })
    setEditOpen(true)
  }

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.phoneNumber.trim()) {
      toast.error('All fields are required')
      return
    }
    setSaving(true)
    try {
      const method = editTarget ? 'PUT' : 'POST'
      const body   = editTarget
        ? { ...formData, uid: editTarget.uid }
        : { ...formData, role: 'VENDOR', sendInvitationEmail: true }
      const res  = await fetch('/api/users', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await res.json()
      if (data.success) {
        toast.success(editTarget ? 'Vendor updated' : 'Vendor added — invitation email sent')
        setEditOpen(false)
        fetchVendors()
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch { toast.error('Network error') }
    finally  { setSaving(false) }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res  = await fetch(`/api/users?uid=${deleteTarget.uid}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Vendor deleted')
        setDeleteTarget(null)
        fetchVendors()
      } else { toast.error(data.error || 'Delete failed') }
    } catch { toast.error('Network error') }
    finally  { setDeleting(false) }
  }

  // ── Toggle verification ───────────────────────────────────────────────────
  const handleToggle = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      const res  = await fetch('/api/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: toggleTarget.uid, emailVerification: !toggleTarget.emailVerification }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(toggleTarget.emailVerification ? 'Verification revoked' : 'Vendor verified')
        setToggleTarget(null)
        fetchVendors()
      } else { toast.error(data.error || 'Update failed') }
    } catch { toast.error('Network error') }
    finally  { setToggling(false) }
  }

  // ── Business Profile ──────────────────────────────────────────────────────
  const openBusinessProfile = async (vendor) => {
    setBusinessVendor(vendor)
    setBusinessData(null)
    setBusinessOpen(true)
    setBusinessLoading(true)
    try {
      const res  = await fetch(`/api/admin/businesses?email=${encodeURIComponent(vendor.email)}`)
      const data = await res.json()
      if (data.success) setBusinessData(data.data)
      else toast.error(data.error || 'Failed to load business profile')
    } catch { toast.error('Network error') }
    finally  { setBusinessLoading(false) }
  }

  const handleVerifyBusiness = async (status) => {
    if (!businessData) return
    setVerifying(true)
    try {
      const res  = await fetch('/api/admin/businesses', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id: businessData.id, verificationStatus: status }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(status === 'APPROVED' ? 'Business approved' : 'Business rejected')
        setBusinessData(prev => ({ ...prev, verificationStatus: status }))
        fetchVendors()
      } else { toast.error(data.error || 'Update failed') }
    } catch { toast.error('Network error') }
    finally  { setVerifying(false) }
  }

  // ─────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" minHeight={320} gap={2}>
        <CircularProgress size={28} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading vendors…</Typography>
      </Box>
    )
  }

  return (
    <Box>

      {/* ── Header ── */}
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <StorefrontOutlinedIcon sx={{ color: BRAND, fontSize: 30 }} />
          <Box>
            <Typography variant="h5" fontWeight={700} lineHeight={1.2}>Vendor Management</Typography>
            <Typography variant="body2" color="text.secondary">Manage all vendors on the platform</Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button
            variant="outlined" size="small"
            startIcon={refreshing ? <CircularProgress size={13} /> : <RefreshIcon />}
            onClick={fetchVendors} disabled={refreshing}
            sx={{ textTransform: 'none', borderRadius: 0, borderColor: 'divider', color: 'text.secondary', '&:hover': { borderColor: 'text.secondary' } }}
          >
            Refresh
          </Button>
        </Stack>
      </Stack>

      {/* ── Stats ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>
        {[
          { label: 'Total Vendors',  value: stats.total,    sub: `${stats.verified} verified`,    Icon: PeopleOutlinedIcon,         color: '#2563eb' },
          { label: 'Verified',       value: stats.verified, sub: `${stats.pending} still pending`, Icon: VerifiedUserOutlinedIcon,   color: '#16a34a' },
          { label: 'Total Products', value: stats.products, sub: 'across all vendors',             Icon: Inventory2OutlinedIcon,     color: '#7c3aed' },
          { label: 'Est. Revenue',   value: `Rs. ${stats.revenue.toLocaleString('en', { maximumFractionDigits: 0 })}`, sub: 'from vendor stock', Icon: AttachMoneyIcon, color: BRAND },
        ].map(c => (
          <StatCard key={c.label} {...c} />
        ))}
      </Box>

      {/* ── Filters ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            size="small" placeholder="Search by name or email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            sx={{ flex: 1, ...fieldSx, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160, ...fieldSx, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}>
            <InputLabel>Verification</InputLabel>
            <Select label="Verification" value={filterVerification} onChange={e => { setFilterVerification(e.target.value); setPage(0) }}>
              <MenuItem value="all">All Vendors</MenuItem>
              <MenuItem value="verified">Verified Only</MenuItem>
              <MenuItem value="unverified">Pending Only</MenuItem>
            </Select>
          </FormControl>
          <Chip
            label={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: `${BRAND}15`, color: BRAND, fontWeight: 700, borderRadius: 0, px: 0.5 }}
          />
        </Stack>
      </Paper>

      {/* ── Table ── */}
      <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table size="medium">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Vendor', 'Phone', 'Verification', 'Joined', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.75 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.disabled">No vendors found</Typography>
                  </TableCell>
                </TableRow>
              ) : paginated.map(vendor => (
                <TableRow
                  key={vendor.id}
                  hover
                  sx={{ '&:hover': { bgcolor: `${BRAND}05` }, '& td': { borderColor: 'grey.100' } }}
                >
                  {/* Vendor */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ width: 36, height: 36, bgcolor: BRAND, fontSize: 14, fontWeight: 700, flexShrink: 0 }}>
                        {vendor.username?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{vendor.username}</Typography>
                        <Typography variant="caption" color="text.secondary">{vendor.email}</Typography>
                      </Box>
                    </Stack>
                  </TableCell>

                  {/* Phone */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">{vendor.phoneNumber || '—'}</Typography>
                  </TableCell>

                  {/* Verification */}
                  <TableCell sx={{ py: 1.5 }}>
                    {vendor.emailVerification
                      ? <Chip label="Verified" size="small" icon={<VerifiedUserOutlinedIcon />} sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600, '& .MuiChip-icon': { color: '#16a34a', fontSize: 14 } }} />
                      : <Chip label="Pending"  size="small" icon={<HourglassEmptyIcon />}       sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 600, '& .MuiChip-icon': { color: '#854d0e', fontSize: 14 } }} />
                    }
                  </TableCell>

                  {/* Joined */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(vendor.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' })}
                    </Typography>
                  </TableCell>

                  {/* Actions */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="View details">
                        <IconButton size="small" onClick={() => setViewTarget(vendor)} sx={{ color: 'text.secondary', '&:hover': { color: '#2563eb' } }}>
                          <VisibilityOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Business Profile">
                        <IconButton size="small" onClick={() => openBusinessProfile(vendor)} sx={{ color: 'text.secondary', '&:hover': { color: '#7c3aed' } }}>
                          <DomainOutlinedIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={vendor.emailVerification ? 'Revoke verification' : 'Mark verified'}>
                        <IconButton size="small" onClick={() => setToggleTarget(vendor)}
                          sx={{ color: 'text.secondary', '&:hover': { color: vendor.emailVerification ? '#a16207' : '#16a34a' } }}>
                          {vendor.emailVerification
                            ? <BlockOutlinedIcon sx={{ fontSize: 18 }} />
                            : <CheckCircleOutlineIcon sx={{ fontSize: 18 }} />
                          }
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteTarget(vendor)} sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}>
                          <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filtered.length}
          page={page}
          rowsPerPage={rowsPerPage}
          onPageChange={(_, p) => setPage(p)}
          onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value)); setPage(0) }}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>



      {/* ── View Dialog ── */}
      <Dialog open={!!viewTarget} onClose={() => setViewTarget(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>Vendor Details</DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          {viewTarget && (
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar sx={{ width: 52, height: 52, bgcolor: BRAND, fontSize: 20, fontWeight: 700 }}>
                  {viewTarget.username?.charAt(0).toUpperCase()}
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={700} lineHeight={1.2}>{viewTarget.username}</Typography>
                  <Typography variant="caption" color="text.secondary">UID: {viewTarget.uid}</Typography>
                </Box>
                {viewTarget.emailVerification
                  ? <Chip label="Verified" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600, borderRadius: 0 }} />
                  : <Chip label="Pending"  size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 600, borderRadius: 0 }} />
                }
              </Stack>
              <Divider />
              <Grid container spacing={1.5}>
                {[
                  { label: 'Email',       value: viewTarget.email,       Icon: EmailOutlinedIcon },
                  { label: 'Phone',       value: viewTarget.phoneNumber, Icon: PhoneOutlinedIcon },
                  { label: 'Joined',      value: new Date(viewTarget.createdAt).toLocaleDateString('en-PK', { dateStyle: 'medium' }), Icon: StorefrontOutlinedIcon },
                  { label: 'Account Status', value: viewTarget.status !== 'inactive' ? 'Active' : 'Inactive', Icon: VerifiedUserOutlinedIcon },
                ].map(({ label, value, Icon }) => (
                  <Grid item xs={12} sm={6} key={label}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0, bgcolor: 'grey.50' }}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.25}>
                        <Icon sx={{ fontSize: 14, color: 'text.disabled' }} />
                        <Typography variant="caption" color="text.disabled" fontWeight={600} textTransform="uppercase" letterSpacing={0.4}>{label}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setViewTarget(null)} variant="outlined" sx={{ textTransform: 'none', borderRadius: 0 }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Toggle Verification Confirm ── */}
      <Dialog open={!!toggleTarget} onClose={() => !toggling && setToggleTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {toggleTarget?.emailVerification ? 'Revoke Verification' : 'Verify Vendor'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {toggleTarget?.emailVerification
              ? <><strong>{toggleTarget?.username}</strong> will be marked as unverified.</>
              : <><strong>{toggleTarget?.username}</strong> will be marked as verified.</>
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setToggleTarget(null)} disabled={toggling} sx={{ textTransform: 'none', borderRadius: 0 }}>Cancel</Button>
          <Button variant="contained" onClick={handleToggle} disabled={toggling}
            sx={{ bgcolor: toggleTarget?.emailVerification ? '#b45309' : '#16a34a', '&:hover': { bgcolor: toggleTarget?.emailVerification ? '#92400e' : '#15803d' }, borderRadius: 0, textTransform: 'none', fontWeight: 600 }}
            startIcon={toggling ? <CircularProgress size={14} color="inherit" /> : null}>
            {toggling ? 'Updating…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Vendor</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.username}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: 'none', borderRadius: 0 }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
            sx={{ borderRadius: 0, textTransform: 'none', fontWeight: 600 }}
            startIcon={deleting ? <CircularProgress size={14} color="inherit" /> : null}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Business Profile Dialog ── */}
      <Dialog
        open={businessOpen}
        onClose={() => !verifying && setBusinessOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
        PaperProps={{ sx: { borderRadius: 0 } }}
        sx={{
          '& .MuiDialog-paper': {
            height: '90vh',
            maxHeight: '90vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Title bar */}
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', py: 1.5, flexShrink: 0, bgcolor: '#0f1724', color: 'white' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ bgcolor: `${BRAND}22`, p: 0.75, borderRadius: 1, display: 'flex' }}>
                <DomainOutlinedIcon sx={{ color: BRAND, fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2} color="white">Vendor Business Profile (Read-Only)</Typography>
                {businessVendor && (
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                    {businessVendor.username} · {businessVendor.email}
                  </Typography>
                )}
              </Box>
            </Stack>
            <IconButton size="small" onClick={() => setBusinessOpen(false)} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, flex: '1 1 auto', overflow: 'auto', minHeight: 0, bgcolor: '#f8fafc' }}>
          {/* Loading */}
          {businessLoading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
              <CircularProgress sx={{ color: BRAND }} />
              <Typography color="text.secondary" variant="body2">Loading business profile…</Typography>
            </Box>
          )}

          {/* No Profile */}
          {!businessLoading && !businessData && (
            <Box py={10} textAlign="center">
              <DomainOutlinedIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={500}>No Business Profile</Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5}>
                This vendor has not registered a business profile yet.
              </Typography>
            </Box>
          )}

          {/* Full Profile */}
          {!businessLoading && businessData && (
            <Box sx={{ width: '100%', p: { xs: 2, md: 3 } }}>
              <VendorAdminProfileView
                vendor={businessVendor}
                business={businessData}
                onVerify={handleVerifyBusiness}
                verifying={verifying}
              />
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
          <Button onClick={() => setBusinessOpen(false)} variant="outlined" sx={{ textTransform: 'none', borderRadius: 0 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  )
}

function VendorAdminProfileView({ vendor, business, onVerify, verifying }) {
  if (!business) return null

  let restaurantImages = []
  if (business.urlRestaurantImages) {
    try {
      restaurantImages = typeof business.urlRestaurantImages === 'string'
        ? JSON.parse(business.urlRestaurantImages)
        : business.urlRestaurantImages
    } catch {
      restaurantImages = business.urlRestaurantImages.split(',').map(s => s.trim()).filter(Boolean)
    }
  }

  const statusColor = {
    APPROVED: '#10b981',
    PENDING:  '#f59e0b',
    REJECTED: '#ef4444',
  }[business.verificationStatus] || '#6b7280'

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header Banner */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, mb: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            height: 140,
            bgcolor: '#0f1724',
            backgroundImage: business.urlCoverPhoto ? `url(${business.urlCoverPhoto})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative'
          }}
        />

        <Box sx={{ p: 3, bgcolor: '#0f1724', color: 'white', mt: -2 }}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', gap: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5 }}>
              <Avatar
                src={business.urlLogo}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: BRAND,
                  fontSize: 28,
                  fontWeight: 800,
                  border: '2px solid white',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}
              >
                {(business.businessName || vendor?.username || 'V').charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                  <Typography variant="h5" fontWeight={800} color="white">
                    {business.businessName}
                  </Typography>
                  <Chip
                    label={business.verificationStatus}
                    size="small"
                    sx={{ bgcolor: statusColor, color: 'white', fontWeight: 800, borderRadius: 0, fontSize: 11 }}
                  />

                </Box>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <EmailOutlinedIcon sx={{ fontSize: 15 }} /> {business.email || vendor?.email}
                  </Box>
                  <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                    <PhoneOutlinedIcon sx={{ fontSize: 15 }} /> {business.phoneNumber1 || vendor?.phoneNumber}
                  </Box>
                </Typography>
              </Box>
            </Box>

            {/* Admin Verification Quick Actions */}
            <Box sx={{ display: 'flex', gap: 1.5, alignSelf: { xs: 'stretch', sm: 'center' } }}>
              {business.verificationStatus !== 'APPROVED' && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  disabled={verifying}
                  onClick={() => onVerify('APPROVED')}
                  startIcon={<CheckCircleOutlineIcon />}
                  sx={{ borderRadius: 0, fontWeight: 700 }}
                >
                  Approve Vendor
                </Button>
              )}
              {business.verificationStatus !== 'REJECTED' && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  disabled={verifying}
                  onClick={() => onVerify('REJECTED')}
                  startIcon={<BlockOutlinedIcon />}
                  sx={{ borderRadius: 0, fontWeight: 700 }}
                >
                  Reject Vendor
                </Button>
              )}
            </Box>
          </Box>
        </Box>

        {/* Sub-bar */}
        <Box sx={{ px: 3, py: 1.5, bgcolor: 'grey.100', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              NTN: <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{business.ntnNo || 'N/A'}</Box>
            </Typography>
            <Divider orientation="vertical" flexItem />
            <Typography variant="caption" color="text.secondary" fontWeight={600}>
              Owner CNIC: <Box component="span" sx={{ fontFamily: 'monospace', color: 'text.primary' }}>{business.cnicNo || 'N/A'}</Box>
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            Registered: {business.createdAt ? new Date(business.createdAt).toLocaleDateString() : 'N/A'}
          </Typography>
        </Box>
      </Card>

      {/* KPI Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(5, 1fr)' }, gap: 2, mb: 3 }}>
        {[
          { label: 'Status', value: business.verificationStatus, color: statusColor },
          { label: 'Vertical', value: business.vertical || 'FOOD', color: '#3b82f6' },
          { label: 'Bank Name', value: business.bankName || 'N/A', color: '#10b981' },
          { label: 'City', value: business.city || 'N/A', color: BRAND },
        ].map(({ label, value, color }) => (
          <Card key={label} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5}>
                {label}
              </Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color, mt: 0.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Detailed Sections */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0, p: 3 }}>
        {/* Section 1: Owner & Business Info */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5, mb: 3 }}>
          Business & Owner Details
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 4 }}>
          <TextField label="Business Name" value={business.businessName || ''} disabled size="small" fullWidth />
          <TextField label="Owner First Name" value={business.firstName || ''} disabled size="small" fullWidth />
          <TextField label="Owner Last Name" value={business.lastName || ''} disabled size="small" fullWidth />
          <TextField label="Owner CNIC Number" value={business.cnicNo || ''} disabled size="small" fullWidth />
          <TextField label="NTN Number" value={business.ntnNo || 'Not provided'} disabled size="small" fullWidth />
        </Box>

        {/* Section 2: Contact & Location */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5, mb: 3 }}>
          Contact Information & Location
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 4 }}>
          <TextField label="Primary Phone" value={business.phoneNumber1 || ''} disabled size="small" fullWidth />
          <TextField label="Secondary Phone" value={business.phoneNumber2 || 'None'} disabled size="small" fullWidth />
          <TextField label="Business Email" value={business.email || ''} disabled size="small" fullWidth sx={{ gridColumn: { md: 'span 2' } }} />
          <TextField label="Street Address" value={business.streetAddress || ''} disabled size="small" fullWidth sx={{ gridColumn: { md: 'span 2' } }} />
          <TextField label="Building / Place Name" value={business.buildingPlaceName || ''} disabled size="small" fullWidth />
          <TextField label="House / Shop Number" value={business.houseNumber || ''} disabled size="small" fullWidth />
          <TextField label="City" value={business.city || ''} disabled size="small" fullWidth />
          <TextField label="State" value={business.state || ''} disabled size="small" fullWidth />
          <TextField label="Postal Code" value={business.postalCode || ''} disabled size="small" fullWidth />
          <TextField label="Billing Address" value={business.billingAddress || ''} disabled size="small" fullWidth />
          <TextField label="Latitude" value={business.latitude || 'Not set'} disabled size="small" fullWidth />
          <TextField label="Longitude" value={business.longitude || 'Not set'} disabled size="small" fullWidth />
        </Box>

        {/* Section 3: Financial & Payout */}
        <Typography variant="subtitle1" fontWeight={700} sx={{ borderLeft: `4px solid ${BRAND}`, pl: 1.5, mb: 3 }}>
          Financial Account & Payout Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2.5, mb: 4 }}>
          <TextField label="Bank Name" value={business.bankName || ''} disabled size="small" fullWidth />
          <TextField label="Bank Account Title" value={business.bankAccountTitle || ''} disabled size="small" fullWidth />
          <TextField label="Bank IBAN / Account Number" value={business.bankIbanNo || ''} disabled size="small" fullWidth sx={{ gridColumn: { md: 'span 2' } }} />
        </Box>

        {/* Section 4: Document Uploads & Images */}
        {restaurantImages.length > 0 && (
          <>
            <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Restaurant / Business Gallery Photos</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5 }}>
              {restaurantImages.map((url, idx) => (
                <Box key={idx} component="img" src={url} alt={`Gallery ${idx + 1}`} sx={{ width: '100%', height: 120, objectFit: 'cover', border: '1px solid #e2e8f0' }} />
              ))}
            </Box>
          </>
        )}
      </Card>
    </Box>
  )
}
