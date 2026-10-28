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
import Tooltip from '@mui/material/Tooltip'
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
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'

const BRAND = '#39772A'
const tf = { sx: { '& .MuiOutlinedInput-root': { borderRadius: 1 } } }

const GRADIENT_PRESETS = [
  {
    name: 'Electric Violet (Tech)',
    gradient: 'from-[#0B0F19] via-[#1E1B4B] to-[#312E81]',
    accent: '#818CF8',
    previewBg: 'linear-gradient(135deg, #0B0F19 0%, #1E1B4B 50%, #312E81 100%)',
  },
  {
    name: 'Emerald Forest (Groceries)',
    gradient: 'from-[#061A14] via-[#064E3B] to-[#042F2C]',
    accent: '#10B981',
    previewBg: 'linear-gradient(135deg, #061A14 0%, #064E3B 50%, #042F2C 100%)',
  },
  {
    name: 'Warm Amber (Bakery & Pastry)',
    gradient: 'from-[#1F1300] via-[#78350F] to-[#451A03]',
    accent: '#F59E0B',
    previewBg: 'linear-gradient(135deg, #1F1300 0%, #78350F 50%, #451A03 100%)',
  },
  {
    name: 'Ruby Crimson (Dining & Chef)',
    gradient: 'from-[#1A0B16] via-[#4C0519] to-[#3B0764]',
    accent: '#F43F5E',
    previewBg: 'linear-gradient(135deg, #1A0B16 0%, #4C0519 50%, #3B0764 100%)',
  },
  {
    name: 'Slate Ocean (Premium Essentials)',
    gradient: 'from-[#0B0F19] via-[#1E293B] to-[#334155]',
    accent: '#38BDF8',
    previewBg: 'linear-gradient(135deg, #0B0F19 0%, #1E293B 50%, #334155 100%)',
  },
  {
    name: 'Royal Magenta (Fashion & Trends)',
    gradient: 'from-[#1E0B19] via-[#4A0E2E] to-[#701A75]',
    accent: '#E879F9',
    previewBg: 'linear-gradient(135deg, #1E0B19 0%, #4A0E2E 50%, #701A75 100%)',
  },
]

const INITIAL_FORM = {
  title: '',
  badge: '',
  subtitle: '',
  ctaText: 'Explore Collection',
  ctaLink: '/customer',
  discount: 'UP TO 20% OFF',
  bgGradient: 'from-[#0B0F19] via-[#1E1B4B] to-[#312E81]',
  accentColor: '#818CF8',
  image: '',
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
      badge: slide.badge || '',
      subtitle: slide.subtitle || '',
      ctaText: slide.ctaText || 'Explore Collection',
      ctaLink: slide.ctaLink || '/customer',
      discount: slide.discount || '',
      bgGradient: slide.bgGradient || 'from-[#0B0F19] via-[#1E1B4B] to-[#312E81]',
      accentColor: slide.accentColor || '#818CF8',
      image: slide.image || '',
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
        toast.success('Slide image uploaded successfully!')
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
    if (!form.title.trim()) {
      toast.error('Slide title is required')
      return
    }
    if (!form.image.trim()) {
      toast.error('Slide banner image URL or file is required')
      return
    }

    setSaving(true)
    try {
      const payload = {
        title: form.title,
        badge: form.badge,
        subtitle: form.subtitle,
        ctaText: form.ctaText,
        ctaLink: form.ctaLink,
        discount: form.discount,
        bgGradient: form.bgGradient,
        accentColor: form.accentColor,
        image: form.image,
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
        toast.success(editingSlide ? 'Slide updated successfully' : 'Slide created successfully')
        setShowModal(false)
        fetchSlides()
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch (err) {
      toast.error('Error saving slide: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (slide) => {
    if (!window.confirm(`Are you sure you want to delete slide "${slide.title}"?`)) return
    try {
      const res = await authFetch(`/api/sliders?id=${slide.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Slide removed')
        fetchSlides()
      } else {
        toast.error(data.error || 'Failed to delete slide')
      }
    } catch {
      toast.error('Error deleting slide')
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
        toast.success(`Slide is now ${newStatus.toLowerCase()}`)
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
      toast.success('Slide order updated')
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
        (s.badge || '').toLowerCase().includes(q) ||
        (s.subtitle || '').toLowerCase().includes(q)
    )
  }, [slides, searchQuery])

  const activeSlides = useMemo(() => slides.filter(s => s.status === 'ACTIVE'), [slides])

  return (
    <DashboardLayout>
      <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
        {/* Top Header */}
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
                Hero Carousel & Slider Management
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#64748B' }}>
              Manage dynamic hero banners, promotional copy, discount badges, and navigation links displayed on the storefront.
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
              borderRadius: 1.5,
              boxShadow: '0 4px 14px 0 rgba(57,119,42,0.3)',
              '&:hover': { bgcolor: '#2d5e21' },
            }}
          >
            Create New Slide
          </Button>
        </Box>

        {/* Stats Row */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600 }}>
                  TOTAL SLIDES
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#0F172A', mt: 0.5 }}>
                  {slides.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#059669', fontWeight: 600 }}>
                  ACTIVE ON STOREFRONT
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#059669', mt: 0.5 }}>
                  {activeSlides.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" sx={{ color: '#E11D48', fontWeight: 600 }}>
                  INACTIVE / DRAFT
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#64748B', mt: 0.5 }}>
                  {slides.length - activeSlides.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Interactive Storefront Live Preview Hub */}
        {activeSlides.length > 0 && (
          <Card
            sx={{
              mb: 4,
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
              border: '1px solid #CBD5E1',
            }}
          >
            <Box
              sx={{
                px: 3,
                py: 1.5,
                bgcolor: '#0F172A',
                color: '#fff',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <VisibilityIcon sx={{ color: '#38BDF8', fontSize: 18 }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700, letterSpacing: 0.5 }}>
                  LIVE STOREFRONT CAROUSEL PREVIEW ({previewSlideIndex + 1} of {activeSlides.length})
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
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

            {/* Simulated Banner Carousel Card */}
            {(() => {
              const currentSlide = activeSlides[previewSlideIndex % activeSlides.length] || activeSlides[0]
              if (!currentSlide) return null
              return (
                <div
                  className={`relative overflow-hidden p-6 sm:p-10 text-white min-h-[280px] sm:min-h-[320px] flex flex-col justify-between bg-gradient-to-r ${currentSlide.bgGradient}`}
                >
                  {/* Background Image Ambient */}
                  <div className="absolute right-0 top-0 bottom-0 w-full sm:w-1/2 opacity-30 mix-blend-overlay overflow-hidden pointer-events-none">
                    <img
                      src={currentSlide.image}
                      alt={currentSlide.title}
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                  <div className="absolute -left-12 -bottom-12 w-64 h-64 rounded-full bg-white/5 blur-3xl pointer-events-none" />

                  {/* Content */}
                  <div className="relative z-10 max-w-xl">
                    {currentSlide.badge && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-xs font-black tracking-wider uppercase mb-3">
                        <AutoAwesomeIcon sx={{ fontSize: 14, color: '#FCD34D' }} />
                        <span>{currentSlide.badge}</span>
                      </div>
                    )}

                    <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight mb-2 drop-shadow-sm">
                      {currentSlide.title}
                    </h2>

                    {currentSlide.subtitle && (
                      <p className="text-slate-200 text-xs sm:text-sm font-medium mb-6 line-clamp-2 max-w-lg leading-relaxed">
                        {currentSlide.subtitle}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <span>{currentSlide.ctaText || 'Shop Now'}</span>
                        <ArrowForwardIcon sx={{ fontSize: 16 }} />
                      </button>

                      {currentSlide.discount && (
                        <span className="px-3.5 py-2 rounded-xl bg-white/15 backdrop-blur-md text-white font-extrabold text-xs border border-white/20">
                          {currentSlide.discount}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pagination dots simulator */}
                  <div className="relative z-10 flex items-center justify-between pt-4 mt-6 border-t border-white/10">
                    <div className="flex gap-1.5">
                      {activeSlides.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setPreviewSlideIndex(i)}
                          className={`h-2 rounded-full transition-all ${
                            previewSlideIndex === i ? 'w-8 bg-indigo-400' : 'w-2 bg-white/40'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[11px] font-mono text-slate-300">
                      Destination Link: {currentSlide.ctaLink || '/customer'}
                    </span>
                  </div>
                </div>
              )
            })()}
          </Card>
        )}

        {/* Filter and Search Bar */}
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
            placeholder="Search slides by title, badge, or subtitle..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            size="small"
            sx={{ maxWidth: 450, width: '100%', bgcolor: '#fff', ...tf.sx }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94A3B8' }} />
                </InputAdornment>
              ),
            }}
          />

          <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>
            Showing {filteredSlides.length} of {slides.length} slides
          </Typography>
        </Box>

        {/* Sliders Grid List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: BRAND }} />
          </Box>
        ) : filteredSlides.length === 0 ? (
          <Card sx={{ p: 6, textAlign: 'center', borderRadius: 2, border: '1px dashed #CBD5E1' }}>
            <ViewCarouselOutlinedIcon sx={{ fontSize: 48, color: '#94A3B8', mb: 1 }} />
            <Typography variant="h6" sx={{ color: '#475569', fontWeight: 700 }}>
              No Hero Slides Found
            </Typography>
            <Typography variant="body2" sx={{ color: '#94A3B8', mb: 3 }}>
              {searchQuery ? 'Try clearing your search query' : 'Get started by creating your first dynamic hero banner'}
            </Typography>
            <Button variant="contained" onClick={openAdd} sx={{ bgcolor: BRAND, textTransform: 'none' }}>
              Add Your First Slide
            </Button>
          </Card>
        ) : (
          <Grid container spacing={3}>
            {filteredSlides.map((slide, idx) => (
              <Grid item xs={12} md={6} key={slide.id}>
                <Card
                  sx={{
                    borderRadius: 2.5,
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    height: '100%',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
                    },
                  }}
                >
                  {/* Card Mini Banner Header */}
                  <div
                    className={`relative p-5 text-white min-h-[140px] flex flex-col justify-between bg-gradient-to-r ${slide.bgGradient}`}
                  >
                    <div className="absolute right-0 top-0 bottom-0 w-2/5 opacity-30 mix-blend-overlay overflow-hidden pointer-events-none">
                      <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="relative z-10 flex justify-between items-start gap-2">
                      <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20">
                        {slide.badge || 'PROMO'}
                      </span>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={`#${slide.order ?? idx + 1}`}
                          size="small"
                          sx={{ bgcolor: 'rgba(0,0,0,0.4)', color: '#fff', fontWeight: 800, height: 22 }}
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
                      </Box>
                    </div>

                    <div className="relative z-10 mt-2">
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                        {slide.title}
                      </Typography>
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Typography variant="body2" sx={{ color: '#475569', minHeight: 40, lineClamp: 2 }}>
                      {slide.subtitle || 'No description provided.'}
                    </Typography>

                    <Divider />

                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.8rem' }}>
                      <Box>
                        <span className="text-slate-400 block text-[11px] font-bold">BUTTON TEXT</span>
                        <span className="font-semibold text-slate-800">{slide.ctaText || 'Shop Now'}</span>
                      </Box>
                      <Box>
                        <span className="text-slate-400 block text-[11px] font-bold">DISCOUNT PILL</span>
                        <span className="font-semibold text-slate-800">{slide.discount || 'None'}</span>
                      </Box>
                      <Box sx={{ gridColumn: 'span 2' }}>
                        <span className="text-slate-400 block text-[11px] font-bold">TARGET URL</span>
                        <span className="font-mono text-slate-600 text-xs truncate block">{slide.ctaLink || '/customer'}</span>
                      </Box>
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
                          sx={{ textTransform: 'none', color: '#1E293B', borderColor: '#CBD5E1', borderRadius: 1 }}
                        >
                          Edit
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(slide)}
                          sx={{ color: '#EF4444', '&:hover': { bgcolor: '#FEE2E2' } }}
                          title="Delete Slide"
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

        {/* Create / Edit Slide Dialog */}
        <Dialog
          open={showModal}
          onClose={() => setShowModal(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 2.5 } }}
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
              {editingSlide ? 'Edit Hero Slide' : 'Create New Hero Slide'}
            </Typography>
            <IconButton size="small" onClick={() => setShowModal(false)}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>

          <DialogContent sx={{ py: 3 }}>
            <Stack spacing={2.5}>
              {/* Real-time Interactive Preview inside Dialog */}
              <Box>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748B', display: 'block', mb: 1 }}>
                  LIVE CAROUSEL CARD PREVIEW
                </Typography>
                <div
                  className={`relative rounded-2xl overflow-hidden p-6 text-white min-h-[220px] flex flex-col justify-between bg-gradient-to-r ${form.bgGradient}`}
                >
                  {form.image && (
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 opacity-30 mix-blend-overlay overflow-hidden pointer-events-none">
                      <img src={form.image} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="relative z-10 max-w-md">
                    {form.badge && (
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-[10px] font-black tracking-wider uppercase mb-2">
                        <AutoAwesomeIcon sx={{ fontSize: 12, color: '#FCD34D' }} />
                        <span>{form.badge}</span>
                      </div>
                    )}
                    <h3 className="text-xl sm:text-2xl font-black leading-tight mb-1">
                      {form.title || 'Slide Title Headline'}
                    </h3>
                    <p className="text-xs text-slate-200 line-clamp-2 mb-4">
                      {form.subtitle || 'Supporting promotional text describing the banner offer or product highlights.'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 shadow">
                        <span>{form.ctaText || 'Shop Now'}</span>
                        <ArrowForwardIcon sx={{ fontSize: 13 }} />
                      </div>
                      {form.discount && (
                        <span className="px-2.5 py-1 rounded-lg bg-white/20 text-white font-extrabold text-[11px] border border-white/20">
                          {form.discount}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Box>

              <Divider />

              {/* Title & Badge */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={8}>
                  <TextField
                    fullWidth
                    label="Slide Title *"
                    placeholder="e.g. Power Up with Official Mobile Gear"
                    value={form.title}
                    onChange={e => setForm(prev => ({ ...prev, title: e.target.value }))}
                    {...tf}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Promo Badge Tag"
                    placeholder="e.g. TECH & NEXT-GEN MOBILITY"
                    value={form.badge}
                    onChange={e => setForm(prev => ({ ...prev, badge: e.target.value }))}
                    {...tf}
                  />
                </Grid>
              </Grid>

              {/* Subtitle */}
              <TextField
                fullWidth
                multiline
                rows={2}
                label="Subtitle / Description"
                placeholder="e.g. GaN 100W Fast Chargers, Braided Type-C Cables, ANC Earbuds & Smartwatch Bands"
                value={form.subtitle}
                onChange={e => setForm(prev => ({ ...prev, subtitle: e.target.value }))}
                {...tf}
              />

              {/* CTA Button Text, Link & Discount Badge */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CTA Button Text"
                    placeholder="e.g. Explore Mobile Tech"
                    value={form.ctaText}
                    onChange={e => setForm(prev => ({ ...prev, ctaText: e.target.value }))}
                    {...tf}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="Discount Tag Pill"
                    placeholder="e.g. UP TO 20% OFF or VERIFIED MENUS"
                    value={form.discount}
                    onChange={e => setForm(prev => ({ ...prev, discount: e.target.value }))}
                    {...tf}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    fullWidth
                    label="CTA Destination Link"
                    placeholder="e.g. /customer or /shop?category=..."
                    value={form.ctaLink}
                    onChange={e => setForm(prev => ({ ...prev, ctaLink: e.target.value }))}
                    {...tf}
                  />
                </Grid>
              </Grid>

              {/* Image Upload & Direct URL */}
              <Box sx={{ p: 2, bgcolor: '#F8FAFC', borderRadius: 2, border: '1px solid #E2E8F0' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1 }}>
                  Slide Banner Image *
                </Typography>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={7}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Image URL"
                      placeholder="https://... or upload from your device"
                      value={form.image}
                      onChange={e => setForm(prev => ({ ...prev, image: e.target.value }))}
                      {...tf}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <Button
                      variant="outlined"
                      component="label"
                      fullWidth
                      startIcon={uploadingImage ? <CircularProgress size={16} /> : <CloudUploadIcon />}
                      disabled={uploadingImage}
                      sx={{ textTransform: 'none', py: 1, borderColor: '#CBD5E1', color: '#1E293B' }}
                    >
                      {uploadingImage ? 'Uploading...' : 'Upload Image File'}
                      <input type="file" accept="image/*" hidden onChange={handleImageFileChange} />
                    </Button>
                  </Grid>
                </Grid>
              </Box>

              {/* Gradient Color Presets */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155', mb: 1.5 }}>
                  Background Theme & Gradient
                </Typography>
                <Grid container spacing={1.5}>
                  {GRADIENT_PRESETS.map((preset, idx) => {
                    const isSelected = form.bgGradient === preset.gradient
                    return (
                      <Grid item xs={12} sm={4} key={idx}>
                        <Box
                          onClick={() =>
                            setForm(prev => ({
                              ...prev,
                              bgGradient: preset.gradient,
                              accentColor: preset.accent,
                            }))
                          }
                          sx={{
                            p: 1.5,
                            borderRadius: 2,
                            cursor: 'pointer',
                            border: isSelected ? `2px solid ${BRAND}` : '1px solid #CBD5E1',
                            bgcolor: isSelected ? '#F0FDF4' : '#fff',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            '&:hover': { borderColor: BRAND },
                          }}
                        >
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: 1,
                              background: preset.previewBg,
                              flexShrink: 0,
                            }}
                          />
                          <Box sx={{ overflow: 'hidden' }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: '#1E293B' }}>
                              {preset.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#94A3B8', fontSize: 10 }}>
                              {preset.accent}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              </Box>

              {/* Department Link, Order & Status */}
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Link To Category (Optional)</InputLabel>
                    <Select
                      value={form.deptId}
                      label="Link To Category (Optional)"
                      onChange={e => setForm(prev => ({ ...prev, deptId: e.target.value }))}
                    >
                      <MenuItem value="">None / Custom URL</MenuItem>
                      {categories.map(cat => (
                        <MenuItem key={cat.id} value={String(cat.id)}>
                          {cat.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={4}>
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

                <Grid item xs={12} sm={4}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={form.status}
                      label="Status"
                      onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <MenuItem value="ACTIVE">Active (Live)</MenuItem>
                      <MenuItem value="INACTIVE">Inactive (Draft)</MenuItem>
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
                '&:hover': { bgcolor: '#2d5e21' },
              }}
            >
              {saving ? 'Saving...' : editingSlide ? 'Update Slide' : 'Create Slide'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </DashboardLayout>
  )
}
