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

const BRAND = '#D70F64'

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
      sx={{ p: 2, borderRadius: 0, borderTop: `3px solid ${color}`, height: '100%' }}
    >
      <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
        <Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
            {label}
          </Typography>
          <Typography variant="h4" fontWeight={700} sx={{ my: 0.5, lineHeight: 1 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.disabled">{sub}</Typography>
        </Box>
        <Box sx={{ bgcolor: `${color}15`, borderRadius: 1, p: 1, display: 'flex' }}>
          <Icon sx={{ color, fontSize: 22 }} />
        </Box>
      </Stack>
    </Paper>
  )
}

// ── Profile field ─────────────────────────────────────────────────────────────
function ProfileField({ label, value }) {
  return (
    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0, height: '100%' }}>
      <Typography variant="caption" color="text.disabled" fontWeight={600} textTransform="uppercase" letterSpacing={0.4} display="block" mb={0.25}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
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
          <Button
            variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, textTransform: 'none', borderRadius: 0, fontWeight: 600 }}
          >
            Add Vendor
          </Button>
        </Stack>
      </Stack>

      {/* ── Stats ── */}
      <Grid container spacing={2} mb={3}>
        {[
          { label: 'Total Vendors',  value: stats.total,    sub: `${stats.verified} verified`,    Icon: PeopleOutlinedIcon,         color: '#2563eb' },
          { label: 'Verified',       value: stats.verified, sub: `${stats.pending} still pending`, Icon: VerifiedUserOutlinedIcon,   color: '#16a34a' },
          { label: 'Total Products', value: stats.products, sub: 'across all vendors',             Icon: Inventory2OutlinedIcon,     color: '#7c3aed' },
          { label: 'Est. Revenue',   value: `$${stats.revenue.toLocaleString('en', { maximumFractionDigits: 0 })}`, sub: 'from vendor stock', Icon: AttachMoneyIcon, color: BRAND },
        ].map(c => (
          <Grid item xs={12} sm={6} lg={3} key={c.label}>
            <StatCard {...c} />
          </Grid>
        ))}
      </Grid>

      {/* ── Filters ── */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            size="small" placeholder="Search by name or email…" value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
            sx={{ flex: 1, ...fieldSx }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: 'text.disabled' }} /></InputAdornment> }}
          />
          <FormControl size="small" sx={{ minWidth: 160, ...fieldSx }}>
            <InputLabel>Verification</InputLabel>
            <Select label="Verification" value={filterVerification} onChange={e => { setFilterVerification(e.target.value); setPage(0) }}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="verified">Verified</MenuItem>
              <MenuItem value="unverified">Pending</MenuItem>
            </Select>
          </FormControl>
          <Chip
            label={`${filtered.length} result${filtered.length !== 1 ? 's' : ''}`}
            size="small"
            sx={{ bgcolor: `${BRAND}15`, color: BRAND, fontWeight: 600, borderRadius: 1 }}
          />
        </Stack>
      </Paper>

      {/* ── Table ── */}
      <Paper variant="outlined" sx={{ borderRadius: 0 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f9fafb' }}>
                {['Vendor', 'Phone', 'Verification', 'Joined', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 12, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5, py: 1.5 }}>
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
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(vendor)} sx={{ color: 'text.secondary', '&:hover': { color: BRAND } }}>
                          <EditOutlinedIcon sx={{ fontSize: 18 }} />
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

      {/* ── Add / Edit Dialog ── */}
      <Dialog open={editOpen} onClose={() => !saving && setEditOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
          {editTarget ? 'Edit Vendor' : 'Add New Vendor'}
        </DialogTitle>
        <DialogContent sx={{ pt: '20px !important' }}>
          <Stack spacing={2.5}>
            <TextField autoFocus fullWidth label="Username" value={formData.username}
              onChange={e => setFormData(p => ({ ...p, username: e.target.value }))} sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><PersonOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            />
            <TextField fullWidth label="Email" type="email" value={formData.email}
              onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            />
            <TextField fullWidth label="Phone Number" value={formData.phoneNumber}
              onChange={e => setFormData(p => ({ ...p, phoneNumber: e.target.value }))} sx={fieldSx}
              InputProps={{ startAdornment: <InputAdornment position="start"><PhoneOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} /></InputAdornment> }}
            />
            <FormControlLabel
              control={
                <Switch checked={formData.emailVerification}
                  onChange={e => setFormData(p => ({ ...p, emailVerification: e.target.checked }))}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND } }}
                />
              }
              label={<Typography variant="body2">Mark as Verified</Typography>}
            />
            {!editTarget && (
              <Alert severity="info" icon={<InfoOutlinedIcon fontSize="small" />} sx={{ borderRadius: 0, py: 0.75 }}>
                <Typography variant="caption">An invitation email will be sent to the vendor to set their password.</Typography>
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={() => setEditOpen(false)} disabled={saving} sx={{ textTransform: 'none', color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, textTransform: 'none', fontWeight: 600, minWidth: 100 }}
            startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}>
            {saving ? 'Saving…' : editTarget ? 'Update' : 'Add Vendor'}
          </Button>
        </DialogActions>
      </Dialog>

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
                  ? <Chip label="Verified" size="small" sx={{ bgcolor: '#dcfce7', color: '#16a34a', fontWeight: 600 }} />
                  : <Chip label="Pending"  size="small" sx={{ bgcolor: '#fef9c3', color: '#854d0e', fontWeight: 600 }} />
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
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0 }}>
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
          <Button onClick={() => setViewTarget(null)} sx={{ textTransform: 'none' }}>Close</Button>
          <Button variant="outlined" onClick={() => { openEdit(viewTarget); setViewTarget(null) }}
            startIcon={<EditOutlinedIcon />}
            sx={{ textTransform: 'none', borderRadius: 0, borderColor: BRAND, color: BRAND }}>
            Edit Vendor
          </Button>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setToggleTarget(null)} disabled={toggling} sx={{ textTransform: 'none' }}>Cancel</Button>
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
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: 'none' }}>Cancel</Button>
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
        <DialogTitle sx={{ fontWeight: 700, borderBottom: '1px solid', borderColor: 'divider', py: 1.5, flexShrink: 0 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box sx={{ bgcolor: `${BRAND}15`, p: 0.75, borderRadius: 1, display: 'flex' }}>
                <DomainOutlinedIcon sx={{ color: BRAND, fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700} lineHeight={1.2}>Business Profile</Typography>
                {businessVendor && (
                  <Typography variant="caption" color="text.secondary">
                    {businessVendor.username} · {businessVendor.email}
                  </Typography>
                )}
              </Box>
            </Stack>
            {businessData && <BusinessStatusChip status={businessData.verificationStatus} />}
          </Stack>
        </DialogTitle>

        <DialogContent dividers sx={{ p: 0, flex: '1 1 auto', overflow: 'auto', minHeight: 0 }}>
          {/* ── Loading ── */}
          {businessLoading && (
            <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10} gap={2}>
              <CircularProgress sx={{ color: BRAND }} />
              <Typography color="text.secondary" variant="body2">Loading business profile…</Typography>
            </Box>
          )}

          {/* ── No Profile ── */}
          {!businessLoading && !businessData && (
            <Box py={10} textAlign="center">
              <DomainOutlinedIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={500}>No Business Profile</Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5}>
                This vendor has not registered a business profile yet.
              </Typography>
            </Box>
          )}

          {/* ── Full Profile ── */}
          {!businessLoading && businessData && (() => {
            const restaurantImages = parseImages(businessData.urlRestaurantImages)
            const fmtDate = (d) => new Date(d).toLocaleDateString('en-PK', { dateStyle: 'medium' })
            const fmtDateTime = (d) => new Date(d).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })

            return (
              <>
                {/* ══ HERO: Cover Photo ══ */}
                <Box sx={{ height: 190, overflow: 'hidden', position: 'relative', bgcolor: `${BRAND}0d`, flexShrink: 0 }}>
                  {businessData.urlCoverPhoto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={businessData.urlCoverPhoto} alt="Cover"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <Box sx={{
                      width: '100%', height: '100%',
                      background: `linear-gradient(135deg, ${BRAND}22 0%, ${BRAND}06 100%)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <StorefrontOutlinedIcon sx={{ fontSize: 90, color: `${BRAND}20` }} />
                    </Box>
                  )}
                  {/* gradient overlay */}
                  <Box sx={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.52))' }} />
                  {/* Business name + category overlaid on cover */}
                  <Box sx={{ position: 'absolute', bottom: 12, right: 16, textAlign: 'right', maxWidth: '60%' }}>
                    <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: 17, lineHeight: 1.25, textShadow: '0 1px 5px rgba(0,0,0,0.6)' }}>
                      {businessData.businessName}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.88)', fontSize: 12, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                      {businessData.businessCategory?.categoryTitle} · {businessData.businessType?.typeTitle}
                    </Typography>
                  </Box>
                </Box>

                {/* Logo Avatar — negative margin pulls it up to overlap cover; stays in flow so scroll works */}
                <Box sx={{ px: 3, mt: '-39px', mb: 0.5, position: 'relative', zIndex: 1 }}>
                  <Avatar
                    src={businessData.urlLogo || undefined}
                    sx={{ width: 78, height: 78, bgcolor: '#fff', border: '3px solid #fff', boxShadow: '0 2px 14px rgba(0,0,0,0.18)', fontSize: 28, fontWeight: 800, color: BRAND }}
                  >
                    {!businessData.urlLogo && businessData.businessName?.charAt(0)?.toUpperCase()}
                  </Avatar>
                </Box>

                {/* ══ CONTENT ══ */}
                <Stack spacing={3} sx={{ px: 3, pt: 2, pb: 3 }}>

                  {/* Quick-info chips row */}
                  <Stack direction="row" flexWrap="wrap" gap={1} alignItems="center">
                    <Chip
                      icon={<EmailOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                      label={businessData.email} size="small" variant="outlined"
                      sx={{ fontSize: 12 }}
                    />
                    <Chip
                      icon={<PhoneOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                      label={businessData.phoneNumber1} size="small" variant="outlined"
                      sx={{ fontSize: 12 }}
                    />
                    {businessData.phoneNumber2 && (
                      <Chip
                        icon={<PhoneOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                        label={businessData.phoneNumber2} size="small" variant="outlined"
                        sx={{ fontSize: 12 }}
                      />
                    )}
                    {businessData.ntnNo && (
                      <Chip label={`NTN: ${businessData.ntnNo}`} size="small" variant="outlined" sx={{ fontSize: 12 }} />
                    )}
                    <Chip
                      label={`Registered ${fmtDate(businessData.createdAt)}`}
                      size="small"
                      sx={{ bgcolor: `${BRAND}12`, color: BRAND, fontWeight: 600, fontSize: 12 }}
                    />
                  </Stack>

                  <Divider />

                  {/* ── 1. Business Information ── */}
                  <Box>
                    <SectionHeading label="Business Information" />
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <ProfileField label="Business Name" value={businessData.businessName} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ProfileField label="Business Category" value={businessData.businessCategory?.categoryTitle} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="Business Type" value={businessData.businessType?.typeTitle} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="NTN Number" value={businessData.ntnNo} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="Registered On" value={fmtDate(businessData.createdAt)} />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* ── 2. Owner / CNIC Details ── */}
                  <Box>
                    <SectionHeading label="Owner / CNIC Details" />
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="First Name" value={businessData.firstName} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="Last Name" value={businessData.lastName} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="CNIC Number" value={businessData.cnicNo} />
                      </Grid>
                    </Grid>

                    {/* CNIC images */}
                    {(businessData.urlCnicFront || businessData.urlCnicBack) && (
                      <Grid container spacing={1.5} mt={0.5}>
                        {businessData.urlCnicFront && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.75}>
                              CNIC — Front Side
                            </Typography>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={businessData.urlCnicFront} alt="CNIC Front"
                              style={{ width: '100%', maxHeight: 160, objectFit: 'cover', border: '1px solid #e5e7eb', display: 'block' }} />
                          </Grid>
                        )}
                        {businessData.urlCnicBack && (
                          <Grid item xs={12} sm={6}>
                            <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.75}>
                              CNIC — Back Side
                            </Typography>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={businessData.urlCnicBack} alt="CNIC Back"
                              style={{ width: '100%', maxHeight: 160, objectFit: 'cover', border: '1px solid #e5e7eb', display: 'block' }} />
                          </Grid>
                        )}
                      </Grid>
                    )}
                  </Box>

                  <Divider />

                  {/* ── 3. Contact Information ── */}
                  <Box>
                    <SectionHeading label="Contact Information" />
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={6}>
                        <ProfileField label="Email Address" value={businessData.email} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <ProfileField label="Phone Number 1" value={businessData.phoneNumber1} />
                      </Grid>
                      <Grid item xs={12} sm={3}>
                        <ProfileField label="Phone Number 2" value={businessData.phoneNumber2} />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* ── 4. Business Address ── */}
                  <Box>
                    <SectionHeading label="Business Address" />
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={8}>
                        <ProfileField label="Street Address" value={businessData.streetAddress} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="House / Unit No." value={businessData.houseNumber} />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <ProfileField label="Building / Place Name" value={businessData.buildingPlaceName} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <ProfileField label="City" value={businessData.city} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <ProfileField label="State" value={businessData.state} />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <ProfileField label="Postal Code" value={businessData.postalCode} />
                      </Grid>
                      <Grid item xs={12}>
                        <ProfileField label="Billing Address" value={businessData.billingAddress} />
                      </Grid>
                    </Grid>
                  </Box>

                  <Divider />

                  {/* ── 5. Bank Details ── */}
                  <Box>
                    <SectionHeading label="Bank Details" />
                    <Grid container spacing={1.5}>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="Bank Name" value={businessData.bankName} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="Account Title" value={businessData.bankAccountTitle} />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <ProfileField label="IBAN / Account No." value={businessData.bankIbanNo} />
                      </Grid>
                    </Grid>
                  </Box>

                  {/* ── 6. Logo & Cover Photo ── */}
                  {(businessData.urlLogo || businessData.urlCoverPhoto) && (
                    <>
                      <Divider />
                      <Box>
                        <SectionHeading label="Logo & Cover Photo" />
                        <Grid container spacing={1.5}>
                          {businessData.urlLogo && (
                            <Grid item xs={12} sm={4}>
                              <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.75}>
                                Business Logo
                              </Typography>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={businessData.urlLogo} alt="Logo"
                                style={{ width: '100%', maxHeight: 130, objectFit: 'contain', border: '1px solid #e5e7eb', display: 'block', background: '#f9fafb' }} />
                            </Grid>
                          )}
                          {businessData.urlCoverPhoto && (
                            <Grid item xs={12} sm={8}>
                              <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.75}>
                                Cover Photo
                              </Typography>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={businessData.urlCoverPhoto} alt="Cover Photo"
                                style={{ width: '100%', maxHeight: 130, objectFit: 'cover', border: '1px solid #e5e7eb', display: 'block' }} />
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </>
                  )}

                  {/* ── 7. Restaurant Images Gallery ── */}
                  {restaurantImages.length > 0 && (
                    <>
                      <Divider />
                      <Box>
                        <SectionHeading label={`Restaurant Images (${restaurantImages.length})`} />
                        <Grid container spacing={1.5}>
                          {restaurantImages.map((url, i) => (
                            <Grid item xs={6} sm={4} key={i}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img src={url} alt={`Restaurant ${i + 1}`}
                                style={{ width: '100%', height: 120, objectFit: 'cover', border: '1px solid #e5e7eb', display: 'block' }} />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    </>
                  )}

                  {/* ── Timestamps ── */}
                  <Divider />
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0, flex: 1 }}>
                      <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.25}>
                        Registered On
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>{fmtDateTime(businessData.createdAt)}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0, flex: 1 }}>
                      <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.25}>
                        Last Updated
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>{fmtDateTime(businessData.updatedAt)}</Typography>
                    </Paper>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 0, flex: 1 }}>
                      <Typography variant="caption" color="text.disabled" fontWeight={700} textTransform="uppercase" letterSpacing={0.5} display="block" mb={0.25}>
                        Profile ID
                      </Typography>
                      <Typography variant="body2" fontWeight={500}>#{businessData.id}</Typography>
                    </Paper>
                  </Stack>

                </Stack>
              </>
            )
          })()}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', gap: 1, flexShrink: 0 }}>
          <Button onClick={() => setBusinessOpen(false)} sx={{ textTransform: 'none', color: 'text.secondary' }}>
            Close
          </Button>
          {businessData && (
            <>
              <Box flex={1} />
              <Button
                variant="outlined"
                color="error"
                onClick={() => handleVerifyBusiness('REJECTED')}
                disabled={verifying || businessData.verificationStatus === 'REJECTED'}
                startIcon={verifying ? <CircularProgress size={14} color="inherit" /> : <ThumbDownOutlinedIcon />}
                sx={{ textTransform: 'none', borderRadius: 0, fontWeight: 600 }}
              >
                Reject
              </Button>
              <Button
                variant="contained"
                onClick={() => handleVerifyBusiness('APPROVED')}
                disabled={verifying || businessData.verificationStatus === 'APPROVED'}
                startIcon={verifying ? <CircularProgress size={14} color="inherit" /> : <ThumbUpOutlinedIcon />}
                sx={{ bgcolor: '#16a34a', '&:hover': { bgcolor: '#15803d' }, textTransform: 'none', borderRadius: 0, fontWeight: 600 }}
              >
                Approve
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

    </Box>
  )
}
