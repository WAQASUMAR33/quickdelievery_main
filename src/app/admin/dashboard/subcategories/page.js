'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { checkUserAccess } from '@/lib/authHelpers'

import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog           from '@mui/material/Dialog'
import DialogActions    from '@mui/material/DialogActions'
import DialogContent    from '@mui/material/DialogContent'
import DialogTitle      from '@mui/material/DialogTitle'
import Divider          from '@mui/material/Divider'
import FormControl      from '@mui/material/FormControl'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Paper            from '@mui/material/Paper'
import Select           from '@mui/material/Select'
import Table            from '@mui/material/Table'
import TableBody        from '@mui/material/TableBody'
import TableCell        from '@mui/material/TableCell'
import TableContainer   from '@mui/material/TableContainer'
import TableHead        from '@mui/material/TableHead'
import TableRow         from '@mui/material/TableRow'
import TextField        from '@mui/material/TextField'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'

import AddIcon              from '@mui/icons-material/Add'
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined'
import CloseIcon            from '@mui/icons-material/Close'
import DeleteOutlinedIcon   from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon     from '@mui/icons-material/EditOutlined'
import SaveOutlinedIcon     from '@mui/icons-material/SaveOutlined'
import SearchIcon           from '@mui/icons-material/Search'

const BRAND = '#D70F64'
const DROP_MIN_W = 300
const tf = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

export default function SubcategoriesPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSub, setEditingSub] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', categoryId: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) { router.push('/login'); return }
      fetchData()
    }
  }, [authLoading, user, userData])

  const fetchData = async () => {
    try {
      const [catRes, subRes] = await Promise.all([
        fetch('/api/products?type=categories'),
        fetch('/api/products?type=subcategories'),
      ])
      const catData = await catRes.json()
      const subData = await subRes.json()
      if (catData.success) setCategories(catData.data || [])
      if (subData.success) setSubcategories(subData.data || [])
    } catch { toast.error('Failed to load data') }
    finally { setLoading(false) }
  }

  const openAdd = () => {
    setEditingSub(null)
    setForm({ name: '', code: '', categoryId: '' })
    setShowModal(true)
  }

  const openEdit = (sub) => {
    setEditingSub(sub)
    setForm({ name: sub.subCatName, code: sub.subCatCode, categoryId: sub.catId.toString() })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.categoryId) { toast.error('Please select a parent category'); return }
    if (!form.name.trim()) { toast.error('Subcategory name is required'); return }
    setSaving(true)
    try {
      const body = editingSub
        ? { type: 'subcategory', id: editingSub.subCatId, subCatName: form.name, subCatCode: form.code, catId: parseInt(form.categoryId), status: true }
        : { type: 'subcategory', subCatName: form.name, subCatCode: form.code || form.name.toLowerCase().replace(/\s+/g, '-'), catId: parseInt(form.categoryId), status: true }

      const res = await fetch('/api/products', {
        method: editingSub ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingSub ? 'Subcategory updated' : 'Subcategory created')
        fetchData()
        setShowModal(false)
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch { toast.error('Error saving subcategory') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subcategory?')) return
    try {
      const res = await fetch(`/api/products?type=subcategory&id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Subcategory deleted'); fetchData() }
      else toast.error(data.error || 'Failed to delete')
    } catch { toast.error('Error deleting subcategory') }
  }

  const filtered = subcategories.filter(s =>
    s.subCatName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Assign a colour to each parent category
  const catColorMap = {}
  const palette = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', BRAND]
  categories.forEach((c, i) => { catColorMap[c.id] = palette[i % palette.length] })

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 2 }}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <Typography color="text.secondary">Loading…</Typography>
        </Box>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={700}>Subcategory Management</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {subcategories.length} subcategories across {categories.length} categories
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, px: 3 }}>
            Add Subcategory
          </Button>
        </Box>

        {/* ── Search + Stats ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <TextField size="small" placeholder="Search subcategories or parent category…"
            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
            sx={{ minWidth: 320, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
          />
          <Chip label={`${filtered.length} / ${subcategories.length}`} size="small"
            sx={{ bgcolor: '#fce7f3', color: BRAND, fontWeight: 700, borderRadius: 0 }} />
        </Box>

        {/* ── Table ── */}
        <TableContainer component={Paper} elevation={0}
          sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['#', 'Subcategory Name', 'Parent Category', 'Code', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 8 }}>
                    <AccountTreeOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">No subcategories found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((sub, idx) => {
                  const color = catColorMap[sub.catId] || '#6b7280'
                  return (
                    <TableRow key={sub.subCatId} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell sx={{ color: 'text.disabled', fontSize: 12, width: 48 }}>{idx + 1}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600}>{sub.subCatName}</Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip label={sub.category?.name || 'Unknown'} size="small"
                          sx={{ bgcolor: `${color}18`, color, fontWeight: 600, borderRadius: 0, fontSize: 11 }} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 1, py: 0.25, borderRadius: 0.5 }}>
                          {sub.subCatCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(sub)} sx={{ color: 'info.main' }}>
                              <EditOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(sub.subCatId)} sx={{ color: 'error.main' }}>
                              <DeleteOutlinedIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* ── Add / Edit Dialog ── */}
        <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 0 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccountTreeOutlinedIcon sx={{ color: BRAND }} />
              <Typography variant="h6" fontWeight={700}>
                {editingSub ? 'Edit Subcategory' : 'Add Subcategory'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowModal(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          <Divider />

          <DialogContent sx={{ pt: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

              {/* Parent Category dropdown — min-width 300 */}
              <FormControl size="small" fullWidth sx={{ minWidth: DROP_MIN_W }}>
                <InputLabel>Parent Category *</InputLabel>
                <Select value={form.categoryId} label="Parent Category *"
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  sx={{ borderRadius: 0 }}>
                  <MenuItem value=""><em>Select a category</em></MenuItem>
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id.toString()}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField size="small" fullWidth label="Subcategory Name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Smartphones" {...tf} />

              <TextField size="small" fullWidth label="Subcategory Code (unique)" value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="e.g., smartphones" {...tf} />
            </Box>
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={() => setShowModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0 }}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
              startIcon={saving ? <CircularProgress size={14} /> : <SaveOutlinedIcon />}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
              {editingSub ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </DashboardLayout>
  )
}
