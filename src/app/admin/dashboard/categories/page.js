'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { checkUserAccess } from '@/lib/authHelpers'
import { authFetch } from '@/lib/apiClient'
import { uploadProductImage } from '@/lib/imageUpload'

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
import Grid             from '@mui/material/Grid'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Select           from '@mui/material/Select'
import TextField        from '@mui/material/TextField'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'

import AddIcon                from '@mui/icons-material/Add'
import CloseIcon              from '@mui/icons-material/Close'
import DeleteOutlinedIcon     from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon       from '@mui/icons-material/EditOutlined'
import FolderOutlinedIcon     from '@mui/icons-material/FolderOutlined'
import SaveOutlinedIcon       from '@mui/icons-material/SaveOutlined'
import SearchIcon             from '@mui/icons-material/Search'

const BRAND = '#39772A'
const tf = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

export default function CategoriesPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [form, setForm] = useState({ name: '', code: '', description: '', image: '', status: 'ACTIVE', vertical: 'FOOD' })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) { router.push('/login'); return }
      fetchCategories()
    }
  }, [authLoading, user, userData])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products?type=categories')
      const data = await res.json()
      if (data.success) setCategories(data.data || [])
    } catch { toast.error('Failed to load categories') }
    finally { setLoading(false) }
  }

  const generateCode = () => Math.random().toString(36).substring(2, 10).toUpperCase()

  const openAdd = () => {
    setEditingCategory(null)
    setForm({ name: '', code: generateCode(), description: '', image: '', status: 'ACTIVE', vertical: 'FOOD' })
    setShowModal(true)
  }

  const openEdit = (cat) => {
    setEditingCategory(cat)
    setForm({ 
      name: cat.name, 
      code: cat.code, 
      description: cat.description || '', 
      image: cat.image || '', 
      status: cat.status || 'ACTIVE',
      vertical: cat.vertical || 'FOOD'
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Category name is required'); return }
    if (!form.image) { toast.error('Category image is required'); return }
    setSaving(true)
    try {
      const body = editingCategory
        ? { 
            type: 'category', 
            id: editingCategory.id, 
            catName: form.name, 
            catCode: form.code, 
            description: form.description, 
            image: form.image, 
            status: form.status,
            vertical: form.vertical 
          }
        : { 
            type: 'category', 
            catName: form.name, 
            catCode: form.code, 
            description: form.description, 
            image: form.image, 
            status: form.status,
            vertical: form.vertical,
            createdBy: userData?.uid || 'admin' 
          }

      const res = await authFetch('/api/products', {
        method: editingCategory ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingCategory ? 'Category updated' : 'Category created')
        fetchCategories()
        setShowModal(false)
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch { toast.error('Error saving category') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      const res = await authFetch(`/api/products?type=category&id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) { toast.success('Category deleted'); fetchCategories() }
      else toast.error(data.error || 'Failed to delete')
    } catch { toast.error('Error deleting category') }
  }

  const filtered = categories.filter(c =>
    c.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Palette of accent colours cycling through cards
  const accent = ['#39772A', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

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
            <Typography variant="h5" fontWeight={700}>Category Management</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {categories.length} categories total
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, px: 3 }}>
            Add Category
          </Button>
        </Box>

        {/* ── Search ── */}
        <TextField
          fullWidth size="small" placeholder="Search categories…"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 3, maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
        />

        {/* ── Stats Row ── */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`${categories.length} Total`} size="small" sx={{ bgcolor: '#D8E9D6', color: BRAND, fontWeight: 700, borderRadius: 0 }} />
          <Chip label={`${filtered.length} Shown`} size="small" variant="outlined" sx={{ borderRadius: 0 }} />
        </Box>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <FolderOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No categories found</Typography>
            <Typography variant="body2" color="text.disabled">Try a different search or add a new category</Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((cat, i) => {
              const color = accent[i % accent.length]
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={cat.id}>
                  <Card elevation={0} sx={{
                    border: '1px solid', borderColor: 'divider', borderRadius: 0,
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    '&:hover': { boxShadow: `0 4px 20px rgba(0,0,0,0.08)`, borderColor: color },
                    height: '100%',
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Top row */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        {cat.image ? (
                          <Box sx={{ width: 42, height: 42, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                            <img src={cat.image} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        ) : (
                          <Box sx={{ p: 1.25, bgcolor: `${color}15`, borderRadius: 1, display: 'flex', color }}>
                            <FolderOutlinedIcon fontSize="small" />
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(cat)} sx={{ color: 'info.main' }}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(cat.id)} sx={{ color: 'error.main' }}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Name */}
                      <Typography variant="subtitle1" fontWeight={700} noWrap>{cat.name}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, minHeight: 32, lineHeight: 1.4 }}>
                        {cat.description || 'No description provided'}
                      </Typography>

                      {/* Footer chips */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        <Chip label={cat.code} size="small" variant="outlined"
                          sx={{ borderRadius: 0, fontFamily: 'monospace', fontSize: 11 }} />
                        <Chip 
                          label={cat.status === 'INACTIVE' ? '🔴 Inactive' : '🟢 Active'} 
                          size="small"
                          sx={{ 
                            borderRadius: 0, 
                            bgcolor: cat.status === 'INACTIVE' ? '#fee2e2' : '#dcfce7', 
                            color: cat.status === 'INACTIVE' ? '#b91c1c' : '#15803d', 
                            fontWeight: 700, 
                            fontSize: 11 
                          }} 
                        />
                        <Chip 
                          label={cat.vertical === 'GROCERY' ? '🏬 Grocery' : '🍽️ Food'} 
                          size="small"
                          sx={{ 
                            borderRadius: 0, 
                            bgcolor: cat.vertical === 'GROCERY' ? '#FCE4EC' : '#E8F5E9', 
                            color: cat.vertical === 'GROCERY' ? '#C2185B' : '#2E7D32', 
                            fontWeight: 600, 
                            fontSize: 11 
                          }} 
                        />
                        {cat.products?.length > 0 && (
                          <Chip label={`${cat.products.length} products`} size="small" variant="outlined"
                            sx={{ borderRadius: 0, fontSize: 11 }} />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        )}

        {/* ── Add / Edit Dialog ── */}
        <Dialog open={showModal} onClose={() => setShowModal(false)} maxWidth="xs" fullWidth
          PaperProps={{ sx: { borderRadius: 0 } }}>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <FolderOutlinedIcon sx={{ color: BRAND }} />
              <Typography variant="h6" fontWeight={700}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowModal(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          <Divider />

          <DialogContent sx={{ pt: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField size="small" fullWidth label="Category Name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Electronics" {...tf} />
              <TextField size="small" fullWidth label="Category Code (Unique)" value={form.code}
                disabled
                helperText="System-generated unique identifier" {...tf} />
              <TextField size="small" fullWidth label="Description (optional)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Short description…" multiline rows={3} {...tf} />

              <FormControl size="small" fullWidth sx={{ ...tf.sx }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={form.status || 'ACTIVE'}
                  label="Status"
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="ACTIVE">🟢 Active</MenuItem>
                  <MenuItem value="INACTIVE">🔴 Inactive</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth sx={{ ...tf.sx }}>
                <InputLabel>Vertical (Order Type)</InputLabel>
                <Select
                  value={form.vertical || 'FOOD'}
                  label="Vertical (Order Type)"
                  onChange={e => setForm({ ...form, vertical: e.target.value })}
                  sx={{ borderRadius: 0 }}
                >
                  <MenuItem value="FOOD">🍽️ Food</MenuItem>
                  <MenuItem value="GROCERY">🏬 Grocery</MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  Category Image *
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {form.image ? (
                    <Box sx={{ position: 'relative', width: 60, height: 60, border: '1px solid', borderColor: 'divider' }}>
                      <img src={form.image} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <IconButton
                        size="small"
                        onClick={() => setForm({ ...form, image: '' })}
                        sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' }, p: 0.25 }}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Box>
                  ) : (
                    <Button
                      variant="outlined"
                      component="label"
                      disabled={uploadingImage}
                      size="small"
                      sx={{ borderColor: BRAND, color: BRAND, '&:hover': { borderColor: '#b00d52', bgcolor: 'rgba(57, 119, 42,0.04)' }, borderRadius: 0 }}
                    >
                      {uploadingImage ? <CircularProgress size={16} sx={{ mr: 1, color: BRAND }} /> : null}
                      {uploadingImage ? 'Uploading…' : 'Upload Image'}
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={async (e) => {
                          if (e.target.files?.[0]) {
                            setUploadingImage(true)
                            try {
                              const res = await uploadProductImage(e.target.files[0])
                              if (res.success) {
                                setForm(prev => ({ ...prev, image: res.url }))
                                toast.success('Image uploaded successfully')
                              } else {
                                toast.error(res.error || 'Upload failed')
                              }
                            } catch {
                              toast.error('Upload error')
                            } finally {
                              setUploadingImage(false)
                            }
                          }
                        }}
                      />
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <Divider />
          <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
            <Button onClick={() => setShowModal(false)} variant="outlined" size="small" sx={{ borderRadius: 0 }}>Cancel</Button>
            <Button onClick={handleSave} variant="contained" size="small" disabled={saving}
              startIcon={saving ? <CircularProgress size={14} /> : <SaveOutlinedIcon />}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}>
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </DashboardLayout>
  )
}
