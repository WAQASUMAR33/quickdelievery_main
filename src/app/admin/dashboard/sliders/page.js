'use client'

import { useState, useEffect, useMemo } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '@/components/layout/DashboardLayout'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { checkUserAccess } from '@/lib/authHelpers'
import { authFetch } from '@/lib/apiClient'
import { fileToBase64DataUrl, uploadBase64Image } from '@/lib/imageUpload'

import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import Grid from '@mui/material/Grid'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import Switch from '@mui/material/Switch'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import Stack from '@mui/material/Stack'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined'
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined'
import SearchIcon from '@mui/icons-material/Search'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import VisibilityIcon from '@mui/icons-material/Visibility'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import LinkIcon from '@mui/icons-material/Link'
import ImageIcon from '@mui/icons-material/Image'

const BRAND = '#39772A'
const tf = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 1.5 } } }

const INITIAL_FORM = {
  title: '',
  image: '',
  ctaLink: '/customer',
  deptId: '',
  order: 1,
  status: 'ACTIVE',
}

export default function SlidersManagementPage() {
  const { user, userData, loading: authLoading } = useAuth()
  const router = useRouter()

  const [slides, setSlides] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [form, setForm] = useState(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [previewSlideIndex, setPreviewSlideIndex] = useState(0)

  useEffect(() => {
    if (!authLoading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) {
        router.push('/login')
        return
      }
      fetchSlides()
      fetchCategories()
    }
  }, [authLoading, user, userData])

  const fetchSlides = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/sliders?admin=true')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setSlides(data.data)
      } else {
        toast.error(data.error || 'Failed to fetch slides')
      }
    } catch {
      toast.error('Network error loading slides')
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/products?type=categories')
      const data = await res.json()
      if (data.success && Array.isArray(data.data)) {
        setCategories(data.data)
      }
    } catch {
      // Non-blocking
    }
  }

  const openAdd = () => {
    setEditingSlide(null)
    setForm({
      ...INITIAL_FORM,
      order: slides.length + 1,
    })
    setShowModal(true)
  }

  const openEdit = (slide) => {
    setEditingSlide(slide)
    setForm({
      title: slide.title || '',
      image: slide.image || '',
      ctaLink: slide.ctaLink || '/customer',
      deptId: slide.deptId ? String(slide.deptId) : '',
      order: slide.order ?? 1,
      status: slide.status || 'ACTIVE',
    })
    setShowModal(true)
  }

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingImage(true)
      const base64 = await fileToBase64DataUrl(file)
      const res = await uploadBase64Image(base64, file.name, 'sliders')
      if (res.success && res.url) {
        setForm(prev => ({ ...prev, image: res.url }))
        toast.success('Banner image uploaded!')
      } else {
        toast.error(res.error || 'Failed to upload image')
      }
    } catch (err) {
      toast.error('Image upload failed: ' + err.message)
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!form.image.trim()) {
      toast.error('Please upload or enter a banner image URL')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim() || 'Storefront Banner',
        image: form.image.trim(),
        ctaLink: form.ctaLink ? form.ctaLink.trim() : '/customer',
        deptId: form.deptId ? Number(form.deptId) : null,
        order: Number(form.order) || 0,
        status: form.status,
      }

      let res
      if (editingSlide) {
        res = await authFetch('/api/sliders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingSlide.id, ...payload }),
        })
      } else {
        res = await authFetch('/api/sliders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }

      const data = await res.json()
      if (data.success) {
        toast.success(editingSlide ? 'Banner updated successfully' : 'Banner created successfully')
        setShowModal(false)
        fetchSlides()
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch (err) {
      toast.error('Error saving banner: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (slide) => {
    if (!window.confirm(`Delete this banner?`)) return
    try {
      const res = await authFetch(`/api/sliders?id=${slide.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Banner removed')
        fetchSlides()
      } else {
        toast.error(data.error || 'Failed to delete banner')
      }
    } catch {
      toast.error('Error deleting banner')
    }
  }

  const handleToggleStatus = async (slide) => {
    const newStatus = slide.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      const res = await authFetch('/api/sliders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: slide.id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Banner is now ${newStatus.toLowerCase()}`)
        setSlides(prev =>
          prev.map(s => (s.id === slide.id ? { ...s, status: newStatus } : s))
        )
      } else {
        toast.error(data.error || 'Status update failed')
      }
    } catch {
      toast.error('Failed to change status')
    }
  }

  const handleReorder = async (slide, direction) => {
    const currentIndex = slides.findIndex(s => s.id === slide.id)
    if (currentIndex < 0) return
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    if (targetIndex < 0 || targetIndex >= slides.length) return

    const targetSlide = slides[targetIndex]
    const currentOrder = slide.order ?? currentIndex + 1
    const targetOrder = targetSlide.order ?? targetIndex + 1

    try {
      await Promise.all([
        authFetch('/api/sliders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: slide.id, order: targetOrder }),
        }),
        authFetch('/api/sliders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetSlide.id, order: currentOrder }),
        }),
      ])
      toast.success('Order updated')
      fetchSlides()
    } catch {
      toast.error('Order update failed')
    }
  }

  const filteredSlides = useMemo(() => {
    if (!searchQuery.trim()) return slides
    const q = searchQuery.toLowerCase()
    return slides.filter(
      s =>
        (s.title || '').toLowerCase().includes(q) ||
        (s.ctaLink || '').toLowerCase().includes(q)
    )
  }, [slides, searchQuery])

  const activeSlides = useMemo(() => slides.filter(s => s.status === 'ACTIVE'), [slides])

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
              <ViewCarouselOutlinedIcon sx={{ color: BRAND, fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                Storefront Banner Slider
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Upload your promotional banner images and set where they navigate when clicked.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{
              bgcolor: BRAND,
              color: '#fff',
              fontWeight: 700,
              textTransform: 'none',
              px: 3,
              py: 1.2,
              borderRadius: 2,
              boxShadow: '0 4px 14px 0 rgba(57,119,42,0.3)',
              '&:hover': { bgcolor: '#2d5e21' },
            }}
          >
            Add New Banner
          </Button>
        </Box>

        {/* Live Banner Carousel Preview */}
        {activeSlides.length > 0 && (
          <Card
            sx={{
              mb: 4,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
              border: '1px solid #CBD5E1',
            }}
          >
            <Box
              sx={{
                px: 2.5,
                py: 1.2,
                bgcolor: '#0F172A',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                  LIVE CAROUSEL PREVIEW ({previewSlideIndex + 1} of {activeSlides.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5 }}>
                <IconButton
                  size="small"
                  onClick={() =>
                    setPreviewSlideIndex(prev => (prev === 0 ? activeSlides.length - 1 : prev - 1))
                  }
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                  <ChevronLeftIcon fontSize="small" />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() =>
                    setPreviewSlideIndex(prev => (prev + 1) % activeSlides.length)
                  }
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }}
                >
                  <ChevronRightIcon fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Simulated Live Banner (Amazon/Shopify pure banner style) */}
            {(() => {
              const currentSlide = activeSlides[previewSlideIndex % activeSlides.length] || activeSlides[0]
              if (!currentSlide) return null
              return (
                <div className="relative w-full aspect-[21/9] sm:aspect-[2.4/1] max-h-[380px] overflow-hidden bg-slate-900 flex items-center justify-center">
                  <img
                    src={currentSlide.image}
                    alt={currentSlide.title || 'Banner'}
                    className="w-full h-full object-cover"
                  />
                  {/* Bottom bar info indicator */}
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-white/90 text-xs drop-shadow-md">
                    <span className="font-semibold px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                      {currentSlide.title || 'Untitled Banner'}
                    </span>
                    <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-black/50 backdrop-blur-sm">
                      Link: {currentSlide.ctaLink || '/customer'}
                    </span>
                  </div>
                </div>
              )
            })()}
          </Card>
        )}

        {/* Search & Counter */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            mb: 3,
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <TextField
            placeholder="Search banners by name or link..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="small"
            sx={{ maxWidth: 400, width: '100%', bgcolor: '#fff', ...tf.sx }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
            {slides.length} total banner{slides.length === 1 ? '' : 's'} ({activeSlides.length} active)
          </Typography>
        </Box>

        {/* Banners Grid List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: BRAND }} />
          </Box>
        ) : filteredSlides.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 3, border: '1px dashed #CBD5E1' }}>
            <ImageIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>
              No Banners Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
              Click below to upload your first storefront banner image.
            </Typography>
            <Button variant="contained" onClick={openAdd} sx={{ bgcolor: BRAND, textTransform: 'none', borderRadius: 2 }}>
              Upload Your First Banner
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredSlides.map((slide, idx) => (
              <Grid item xs={12} sm={6} key={slide.id}>
                <Card
                  sx={{
                    borderRadius: 2.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {/* Banner Image Preview */}
                  <div className="relative w-full aspect-[2.2/1] bg-slate-100 overflow-hidden">
                    <img
                      src={slide.image}
                      alt={slide.title || 'Banner'}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 flex items-center gap-1.5">
                      <Chip
                        label={`#${slide.order ?? idx + 1}`}
                        size="small"
                        sx={{ bgcolor: 'rgba(0,0,0,0.65)', color: '#fff', fontWeight: 800, height: 22 }}
                      />
                      <Chip
                        label={slide.status}
                        size="small"
                        sx={{
                          bgcolor: slide.status === 'ACTIVE' ? '#10B981' : '#64748B',
                          color: '#fff',
                          fontWeight: 700,
                          height: 22,
                        }}
                      />
                    </div>
                  </div>

                  {/* Banner Info */}
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0F172A', lineHeight: 1.3 }}>
                      {slide.title || 'Untitled Banner'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#64748B', fontSize: '0.8rem' }}>
                      <LinkIcon sx={{ fontSize: 16, color: '#94A3B8' }} />
                      <span className="font-mono text-xs truncate">
                        {slide.ctaLink || '/customer'}
                      </span>
                    </Box>

                    {/* Bottom Action Strip */}
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        pt: 1.5,
                        mt: 'auto',
                        borderTop: '1px solid #F1F5F9',
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, mr: 0.5 }}>
                          Active:
                        </Typography>
                        <Switch
                          size="small"
                          checked={slide.status === 'ACTIVE'}
                          onChange={() => handleToggleStatus(slide)}
                          color="success"
                        />
                        <IconButton
                          size="small"
                          disabled={idx === 0}
                          onClick={() => handleReorder(slide, 'up')}
                          title="Move Up"
                        >
                          <ArrowUpwardIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={idx === filteredSlides.length - 1}
                          onClick={() => handleReorder(slide, 'down')}
                          title="Move Down"
                        >
                          <ArrowDownwardIcon fontSize="small" />
                        </IconButton>
                      </Box>

                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<EditOutlinedIcon />}
                          onClick={() => openEdit(slide)}
                          sx={{ textTransform: 'none', color: '#1E293B', borderColor: '#CBD5E1', borderRadius: 1.5 }}
                        >
                          Edit
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(slide)}
                          sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}
                          title="Delete Banner"
                        >
                          <DeleteOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* ─── Ultra Simple Add/Edit Banner Dialog ─── */}
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: '1px solid #E2E8F0',
              pb: 1.5,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#0F172A' }}>
              {editingSlide ? 'Edit Banner' : 'Upload New Banner'}
            </Typography>
            <IconButton size="small" onClick={() => setShowModal(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={2.5}>
              {/* Live Preview Box */}
              {form.image ? (
                <Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>
                    BANNER PREVIEW
                  </Typography>
                  <div className="relative w-full aspect-[2.2/1] rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-inner">
                    <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                </Box>
              ) : null}

              {/* Banner Image Upload / URL */}
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>
                  1. Banner Image *
                </Typography>
                <Grid container spacing={1.5} alignItems="center">
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="Paste Image URL or click upload"
                      value={form.image}
                      onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                      {...tf}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Button
                      variant="contained"
                      component="label"
                      fullWidth
                      startIcon={uploadingImage ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <CloudUploadIcon />}
                      disabled={uploadingImage}
                      sx={{
                        textTransform: 'none',
                        bgcolor: BRAND,
                        py: 0.9,
                        borderRadius: 1.5,
                        '&:hover': { bgcolor: '#2d5e21' },
                      }}
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Image'}
                      <input type="file" accept="image/*" hidden onChange={handleImageFileChange} />
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Banner Name / Title */}
              <TextField
                fullWidth
                label="Banner Name / Title"
                placeholder="e.g. Weekend Flash Sale, Electronics Promo"
                value={form.title}
                onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                helperText="Internal title for identifying this banner"
                {...tf}
              />

              {/* Destination Link */}
              <TextField
                fullWidth
                label="Target Link (Where clicking goes)"
                placeholder="e.g. /customer or /shop or custom URL"
                value={form.ctaLink}
                onChange={e => setForm(prev => ({ ...prev, ctaLink: e.target.value }))}
                helperText="URL or page route customers open when clicking this banner"
                {...tf}
              />

              {/* Link Shortcut to Category (Optional) */}
              {categories.length > 0 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Or select a Category to link to</InputLabel>
                  <Select
                    value={form.deptId}
                    label="Or select a Category to link to"
                    onChange={e => {
                      const val = e.target.value
                      setForm(prev => ({
                        ...prev,
                        deptId: val,
                        ctaLink: val ? `/customer?category=${val}` : prev.ctaLink,
                      }))
                    }}
                  >
                    <MenuItem value="">Custom Link (Use Target Link above)</MenuItem>
                    {categories.map(cat => (
                      <MenuItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {/* Order and Status */}
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Display Order"
                    value={form.order}
                    onChange={e => setForm(prev => ({ ...prev, order: e.target.value }))}
                    {...tf}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.status}
                      label="Status"
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="ACTIVE">Active (Live)</MenuItem>
                      <MenuItem value="INACTIVE">Inactive (Hidden)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Stack>
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #E2E8F0' }}>
            <Button onClick={() => setShowModal(false)} sx={{ textTransform: 'none', color: '#64748B' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveOutlinedIcon />}
              onClick={handleSave}
              disabled={saving}
              sx={{
                bgcolor: BRAND,
                fontWeight: 700,
                textTransform: 'none',
                px: 3,
                borderRadius: 1.5,
                '&:hover': { bgcolor: '#2d5e21' },
              }}
            >
              {saving ? 'Saving...' : editingSlide ? 'Update Banner' : 'Create Banner'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  )
}
