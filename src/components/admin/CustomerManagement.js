'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog           from '@mui/material/Dialog'
import DialogActions    from '@mui/material/DialogActions'
import DialogContent    from '@mui/material/DialogContent'
import DialogTitle      from '@mui/material/DialogTitle'
import Divider          from '@mui/material/Divider'
import FormControl      from '@mui/material/FormControl'
import FormControlLabel from '@mui/material/FormControlLabel'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Pagination       from '@mui/material/Pagination'
import Select           from '@mui/material/Select'
import Switch           from '@mui/material/Switch'
import Table            from '@mui/material/Table'
import TableBody        from '@mui/material/TableBody'
import TableCell        from '@mui/material/TableCell'
import TableContainer   from '@mui/material/TableContainer'
import TableHead        from '@mui/material/TableHead'
import TableRow         from '@mui/material/TableRow'
import TextField        from '@mui/material/TextField'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'

import AdminPanelSettingsOutlinedIcon from '@mui/icons-material/AdminPanelSettingsOutlined'
import CheckCircleOutlinedIcon        from '@mui/icons-material/CheckCircleOutlined'
import CloseIcon                      from '@mui/icons-material/Close'
import DeleteOutlinedIcon             from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon               from '@mui/icons-material/EditOutlined'
import EmailOutlinedIcon              from '@mui/icons-material/EmailOutlined'
import PeopleOutlinedIcon             from '@mui/icons-material/PeopleOutlined'
import PersonOutlinedIcon             from '@mui/icons-material/PersonOutlined'
import PhoneOutlinedIcon              from '@mui/icons-material/PhoneOutlined'
import SaveOutlinedIcon               from '@mui/icons-material/SaveOutlined'
import SearchIcon                     from '@mui/icons-material/Search'
import StoreOutlinedIcon              from '@mui/icons-material/StoreOutlined'
import VerifiedUserOutlinedIcon       from '@mui/icons-material/VerifiedUserOutlined'
import WarningAmberOutlinedIcon       from '@mui/icons-material/WarningAmberOutlined'

const BRAND      = '#D70F64'
const DROP_MIN_W = 300
const tf = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

const ROLE_CONFIG = {
  ADMIN:    { label: 'Admin',    bg: '#f3e8ff', color: '#7c3aed', icon: <AdminPanelSettingsOutlinedIcon sx={{ fontSize: 14 }} /> },
  VENDOR:   { label: 'Vendor',   bg: '#dbeafe', color: '#1d4ed8', icon: <StoreOutlinedIcon sx={{ fontSize: 14 }} /> },
  CUSTOMER: { label: 'Customer', bg: '#dcfce7', color: '#15803d', icon: <PersonOutlinedIcon sx={{ fontSize: 14 }} /> },
}

function RoleChip({ role }) {
  const cfg = ROLE_CONFIG[role] || { label: role, bg: '#f3f4f6', color: '#374151' }
  return (
    <Chip
      label={cfg.label}
      icon={cfg.icon}
      size="small"
      sx={{ bgcolor: cfg.bg, color: cfg.color, fontWeight: 700, borderRadius: 0, fontSize: 11,
        '& .MuiChip-icon': { color: cfg.color } }}
    />
  )
}

const STAT_CARDS = [
  { key: 'totalCustomers', label: 'Total Customers', color: '#10b981', icon: <PersonOutlinedIcon /> },
  { key: 'verifiedUsers',  label: 'Verified',        color: '#f59e0b', icon: <VerifiedUserOutlinedIcon /> },
]

export default function CustomerManagement() {
  const [customers,        setCustomers]        = useState([])
  const [loading,          setLoading]          = useState(true)
  const [searchTerm,       setSearchTerm]       = useState('')
  const [verifiedFilter,   setVerifiedFilter]   = useState('')
  const [currentPage,      setCurrentPage]      = useState(1)
  const [totalPages,       setTotalPages]       = useState(1)
  const [stats,            setStats]            = useState({})
  const [editingCustomer,  setEditingCustomer]  = useState(null)
  const [showModal,        setShowModal]        = useState(false)

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page:     currentPage.toString(),
        limit:    '10',
        search:   searchTerm,
        ...(verifiedFilter !== '' ? { verified: verifiedFilter } : {}),
      })
      const res  = await fetch(`/api/admin/customers?${params}`)
      const data = await res.json()
      if (data.success) {
        setCustomers(data.data || [])
        setTotalPages(data.pagination?.pages || 1)
        setStats({
          totalUsers:     data.stats?.totalUsers     || 0,
          totalCustomers: data.stats?.totalCustomers || 0,
          totalVendors:   data.stats?.totalVendors   || 0,
          verifiedUsers:  data.stats?.verifiedUsers  || 0,
        })
      }
    } catch (err) {
      console.error('Error fetching customers:', err)
      toast.error('Failed to load customers')
    } finally {
      setLoading(false)
    }
  }, [currentPage, searchTerm, verifiedFilter])

  useEffect(() => { fetchCustomers() }, [fetchCustomers])

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this customer?')) return
    try {
      const res  = await fetch(`/api/admin/customers?id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Customer deleted'); fetchCustomers() }
      else toast.error('Failed to delete customer')
    } catch { toast.error('Error deleting customer') }
  }

  const handleSave = async (formData) => {
    try {
      const res  = await fetch('/api/admin/customers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingCustomer.id, ...formData }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Customer updated')
        setShowModal(false)
        setEditingCustomer(null)
        fetchCustomers()
      } else {
        toast.error('Failed to update customer')
      }
    } catch { toast.error('Error updating customer') }
  }

  return (
    <Box sx={{ p: 3 }}>

      {/* ── Header ── */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Customer Management</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Manage registered customers
        </Typography>
      </Box>

      {/* ── Stats Cards ── */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2.5, mb: 3 }}>
        {STAT_CARDS.map(({ key, label, color, icon }) => (
          <Card key={key} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                    {label}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ color, mt: 0.5 }}>
                    {stats[key] || 0}
                  </Typography>
                </Box>
                <Box sx={{ p: 1, bgcolor: `${color}18`, color, borderRadius: 1, display: 'flex' }}>
                  {icon}
                </Box>
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* ── Filters ── */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search customers…"
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1) }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ minWidth: 280, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
        />

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Verification</InputLabel>
          <Select value={verifiedFilter} label="Verification" onChange={e => { setVerifiedFilter(e.target.value); setCurrentPage(1) }} sx={{ borderRadius: 0 }}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="true">Verified</MenuItem>
            <MenuItem value="false">Unverified</MenuItem>
          </Select>
        </FormControl>

        <Button variant="outlined" size="small" onClick={() => { setSearchTerm(''); setVerifiedFilter(''); setCurrentPage(1) }}
          sx={{ borderRadius: 0, color: 'text.secondary', borderColor: 'divider', whiteSpace: 'nowrap' }}>
          Clear Filters
        </Button>

        <Chip label={`${customers.length} shown`} size="small"
          sx={{ bgcolor: '#fce7f3', color: BRAND, fontWeight: 700, borderRadius: 0 }} />
      </Box>

      {/* ── Table ── */}
      <TableContainer sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {['#', 'Customer', 'Email', 'Phone', 'Verified', 'Joined', 'Actions'].map(h => (
                <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.5 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 6 }}>
                  <CircularProgress size={28} sx={{ color: BRAND }} />
                  <Typography variant="body2" color="text.secondary" mt={1}>Loading customers…</Typography>
                </TableCell>
              </TableRow>
            ) : customers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 8 }}>
                  <PeopleOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">No customers found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              customers.map((c, idx) => (
                <TableRow key={c.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell sx={{ color: 'text.disabled', fontSize: 12 }}>{idx + 1}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 30, height: 30, borderRadius: '50%', bgcolor: BRAND, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Typography variant="caption" color="white" fontWeight={700}>
                          {(c.username || 'U').charAt(0).toUpperCase()}
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{c.username || 'N/A'}</Typography>
                        <Typography variant="caption" color="text.disabled" sx={{ fontFamily: 'monospace' }}>
                          {c.uid?.substring(0, 8)}…
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                      <EmailOutlinedIcon sx={{ fontSize: 13 }} />
                      <Typography variant="caption">{c.email}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {c.phoneNumber ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                        <PhoneOutlinedIcon sx={{ fontSize: 13 }} />
                        <Typography variant="caption">{c.phoneNumber}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {c.emailVerification
                      ? <Chip icon={<CheckCircleOutlinedIcon sx={{ fontSize: 13 }} />} label="Verified" size="small" color="success" variant="outlined" sx={{ borderRadius: 0, fontSize: 11 }} />
                      : <Chip icon={<WarningAmberOutlinedIcon sx={{ fontSize: 13 }} />} label="Unverified" size="small" color="warning" variant="outlined" sx={{ borderRadius: 0, fontSize: 11 }} />
                    }
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Edit">
                        <IconButton size="small" sx={{ color: 'info.main' }} onClick={() => { setEditingCustomer(c); setShowModal(true) }}>
                          <EditOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" sx={{ color: 'error.main' }} onClick={() => handleDelete(c.id)}>
                          <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={(_, val) => setCurrentPage(val)}
            size="small"
            sx={{
              '& .MuiPaginationItem-root': { borderRadius: 0 },
              '& .Mui-selected': { bgcolor: BRAND, color: 'white', '&:hover': { bgcolor: '#b00d52' } },
            }}
          />
        </Box>
      )}

      {/* ── Edit Dialog ── */}
      <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PersonOutlinedIcon sx={{ color: BRAND }} />
            <Typography variant="h6" fontWeight={700}>Edit Customer</Typography>
          </Box>
          <IconButton size="small" onClick={() => setShowModal(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <Divider />

        {editingCustomer && (
          <EditCustomerForm
            customer={editingCustomer}
            onSave={handleSave}
            onCancel={() => setShowModal(false)}
          />
        )}
      </Dialog>

    </Box>
  )
}

function EditCustomerForm({ customer, onSave, onCancel }) {
  const [form, setForm] = useState({
    username:          customer.username          || '',
    email:             customer.email             || '',
    phoneNumber:       customer.phoneNumber       || '',
    role:              customer.role              || 'CUSTOMER',
    emailVerification: customer.emailVerification || false,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(form)
  }

  return (
    <form onSubmit={handleSubmit}>
      <DialogContent sx={{ pt: 2.5 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField size="small" fullWidth label="Username" value={form.username}
              onChange={e => setForm({ ...form, username: e.target.value })}
              placeholder="Enter username" {...tf} />
            <TextField size="small" fullWidth label="Email" type="email" value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="Enter email" {...tf} />
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField size="small" fullWidth label="Phone Number" value={form.phoneNumber}
              onChange={e => setForm({ ...form, phoneNumber: e.target.value })}
              placeholder="Enter phone" {...tf} />

            <FormControl size="small" fullWidth sx={{ minWidth: DROP_MIN_W }}>
              <InputLabel>Role</InputLabel>
              <Select value={form.role} label="Role"
                onChange={e => setForm({ ...form, role: e.target.value })}
                sx={{ borderRadius: 0 }}>
                <MenuItem value="CUSTOMER">Customer</MenuItem>
                <MenuItem value="VENDOR">Vendor</MenuItem>
                <MenuItem value="ADMIN">Admin</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid', borderColor: 'divider', bgcolor: 'grey.50' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.emailVerification}
                  onChange={e => setForm({ ...form, emailVerification: e.target.checked })}
                  size="small"
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND } }}
                />
              }
              label={<Typography variant="body2" fontWeight={600}>Email Verified</Typography>}
            />
          </Box>

        </Box>
      </DialogContent>

      <Divider />
      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        <Button type="button" onClick={onCancel} variant="outlined" size="small" sx={{ borderRadius: 0 }}>
          Cancel
        </Button>
        <Button type="submit" variant="contained" size="small" startIcon={<SaveOutlinedIcon />}
          sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
          Save Changes
        </Button>
      </DialogActions>
    </form>
  )
}
