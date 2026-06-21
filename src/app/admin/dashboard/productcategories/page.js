'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { checkUserAccess } from '@/lib/authHelpers'
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
import Grid             from '@mui/material/Grid'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import TextField        from '@mui/material/TextField'
import Tooltip          from '@mui/material/Tooltip'
import Typography       from '@mui/material/Typography'
import FormControl      from '@mui/material/FormControl'
import InputLabel       from '@mui/material/InputLabel'
import Select           from '@mui/material/Select'
import MenuItem         from '@mui/material/MenuItem'

import AddIcon                from '@mui/icons-material/Add'
import CloseIcon              from '@mui/icons-material/Close'
import DeleteOutlinedIcon     from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon       from '@mui/icons-material/EditOutlined'
import FolderOutlinedIcon     from '@mui/icons-material/FolderOutlined'
import SaveOutlinedIcon       from '@mui/icons-material/SaveOutlined'
import SearchIcon             from '@mui/icons-material/Search'
import TagIcon                from '@mui/icons-material/Tag'

const BRAND = '#D70F64'
const tf = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

export default function ProductCategoriesPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()
  const [productCategories, setProductCategories] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingPC, setEditingPC] = useState(null)
  const [form, setForm] = useState({ name: '', categoryId: '', description: '', image: '' })
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) { router.push('/login'); return }
      fetchData()
    }
  }, [authLoading, user, userData])

  const fetchData = async () => {
    try {
      const [pcRes, catRes] = await Promise.all([
        fetch('/api/products?type=productcategories'),
        fetch('/api/products?type=categories')
      ])
      const pcData = await pcRes.json()
      const catData = await catRes.json()

      if (pcData.success && catData.success) {
        setProductCategories(pcData.data || [])
        setCategories(catData.data || [])
      } else {
        toast.error('Failed to load product category data')
      }
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  };

  const openAdd = () => {
    setEditingPC(null)
    setForm({ name: '', categoryId: '', description: '', image: '' })
    setShowModal(true)
  }

  const openEdit = (pc) => {
    setEditingPC(pc)
    setForm({
      name: pc.productCategoryName,
      categoryId: pc.categoryId,
      description: pc.productCategoryDescription || '',
      image: pc.image || ''
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Product category name is required'); return }
    if (!form.categoryId) { toast.error('Base Category selection is required'); return }
    setSaving(true)
    try {
      const body = editingPC
        ? { type: 'productcategory', id: editingPC.productCategoryId, productCategoryName: form.name, categoryId: form.categoryId, productCategoryDescription: form.description, image: form.image }
        : { type: 'productcategory', productCategoryName: form.name, categoryId: form.categoryId, productCategoryDescription: form.description, image: form.image }

      const res = await fetch('/api/products', {
        method: editingPC ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editingPC ? 'Product Category updated' : 'Product Category created')
        fetchData()
        setShowModal(false)
      } else {
        toast.error(data.error || 'Operation failed')
      }
    } catch { toast.error('Error saving product category') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this product category?')) return
    try {
      const res = await fetch(`/api/products?type=productcategory&id=${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Product Category deleted')
        fetchData()
      } else {
        toast.error(data.error || 'Failed to delete')
      }
    } catch { toast.error('Error deleting product category') }
  }

  const filtered = productCategories.filter(pc =>
    pc.productCategoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pc.category?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const accent = ['#D70F64', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444']

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
            <Typography variant="h5" fontWeight={700}>Product Categories</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {productCategories.length} product categories total
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, px: 3 }}>
            Add Product Category
          </Button>
        </Box>

        {/* ── Search ── */}
        <TextField
          fullWidth size="small" placeholder="Search product categories…"
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 3, maxWidth: 400, '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
        />

        {/* ── Stats Row ── */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Chip label={`${productCategories.length} Total`} size="small" sx={{ bgcolor: '#fce7f3', color: BRAND, fontWeight: 700, borderRadius: 0 }} />
          <Chip label={`${filtered.length} Shown`} size="small" variant="outlined" sx={{ borderRadius: 0 }} />
        </Box>

        {/* ── Grid ── */}
        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <FolderOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">No product categories found</Typography>
            <Typography variant="body2" color="text.disabled">Try a different search or add a new category</Typography>
          </Box>
        ) : (
          <Grid container spacing={2.5}>
            {filtered.map((pc, i) => {
              const color = accent[i % accent.length]
              return (
                <Grid item xs={12} sm={6} md={4} lg={3} key={pc.productCategoryId}>
                  <Card elevation={0} sx={{
                    border: '1px solid', borderColor: 'divider', borderRadius: 0,
                    transition: 'box-shadow 0.2s, border-color 0.2s',
                    '&:hover': { boxShadow: `0 4px 20px rgba(0,0,0,0.08)`, borderColor: color },
                    height: '100%',
                  }}>
                    <CardContent sx={{ p: 2.5 }}>
                      {/* Top row */}
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        {pc.image ? (
                          <Box sx={{ width: 42, height: 42, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
                            <img src={pc.image} alt={pc.productCategoryName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                        ) : (
                          <Box sx={{ p: 1.25, bgcolor: `${color}15`, borderRadius: 1, display: 'flex', color }}>
                            <TagIcon fontSize="small" />
                          </Box>
                        )}
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openEdit(pc)} sx={{ color: 'info.main' }}>
                              <EditOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete">
                            <IconButton size="small" onClick={() => handleDelete(pc.productCategoryId)} sx={{ color: 'error.main' }}>
                              <DeleteOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      {/* Name */}
                      <Typography variant="subtitle1" fontWeight={700} noWrap>{pc.productCategoryName}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5, minHeight: 32, lineHeight: 1.4 }}>
                        {pc.productCategoryDescription || 'No description provided'}
                      </Typography>

                      {/* Footer chips */}
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {pc.category && (
                          <Chip label={pc.category.name} size="small" variant="outlined"
                            sx={{ borderRadius: 0, fontSize: 11 }} />
                        )}
                        {pc._count?.products > 0 && (
                          <Chip label={`${pc._count.products} products`} size="small"
                            sx={{ borderRadius: 0, bgcolor: `${color}15`, color, fontWeight: 600, fontSize: 11 }} />
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
              <TagIcon sx={{ color: BRAND }} />
              <Typography variant="h6" fontWeight={700}>
                {editingPC ? 'Edit Product Category' : 'Add Product Category'}
              </Typography>
            </Box>
            <IconButton size="small" onClick={() => setShowModal(false)}><CloseIcon /></IconButton>
          </DialogTitle>
          <Divider />

          <DialogContent sx={{ pt: 2.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField size="small" fullWidth label="Product Category Name *" value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Deformed Iron Bars" {...tf} />

              <FormControl fullWidth size="small" required {...tf}>
                <InputLabel>Base Category *</InputLabel>
                <Select
                  value={form.categoryId}
                  label="Base Category *"
                  onChange={e => setForm({ ...form, categoryId: e.target.value })}
                  sx={{ borderRadius: 0 }}
                >
                  {categories.map(c => (
                    <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField size="small" fullWidth label="Description (optional)" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Short description…" multiline rows={3} {...tf} />

              <Box>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, fontWeight: 600 }}>
                  Product Category Image
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
                      sx={{ borderColor: BRAND, color: BRAND, '&:hover': { borderColor: '#b00d52', bgcolor: 'rgba(215,15,100,0.04)' }, borderRadius: 0 }}
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
              {editingPC ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
    </DashboardLayout>
  )
}
