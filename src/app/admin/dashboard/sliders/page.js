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
import FormControlLabel from '@mui/material/FormControlLabel'
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
import Tabs from '@mui/material/Tabs'
import Tab from '@mui/material/Tab'

import AddIcon from '@mui/icons-material/Add'
import CloseIcon from '@mui/icons-material/Close'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ViewCarouselOutlinedIcon from '@mui/icons-material/ViewCarouselOutlined'
import WidgetsOutlinedIcon from '@mui/icons-material/WidgetsOutlined'
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment'
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
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

  // Side Promo Bento Widgets State
  const [activeTab, setActiveTab] = useState(0)
  const [widgets, setWidgets] = useState({
    widget_1: {
      key: 'widget_1',
      badge: 'LIMITED DROPS',
      title: 'Curated Drop Discounts',
      subtitle: 'Flash deals with up to 50% discount across verified tech, pantry, and gourmet dining.',
      buttonText: 'Explore Drops',
      buttonLink: '/deals',
      showTimer: true,
      status: 'ACTIVE',
    },
    widget_2: {
      key: 'widget_2',
      badge: 'FEATURED STORES & RESTAURANTS',
      title: '100% Authentic Brand Guarantees',
      subtitle: 'Direct partner merchants with certified authenticity, direct fulfillment, and official warranties.',
      buttonText: 'View Boutiques',
      buttonLink: '/customer',
      footerTag: '7-Day Easy Returns',
      footerLinkText: 'View Boutiques →',
      footerLink: '/customer',
      status: 'ACTIVE',
    },
  })
  const [widgetsLoading, setWidgetsLoading] = useState(false)
  const [savingWidgetKey, setSavingWidgetKey] = useState(null)

  useEffect(() => {
    if (!authLoading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN'])
      if (!access.hasAccess) {
        router.push('/login')
        return
      }
      fetchSlides()
      fetchCategories()
      fetchWidgets()
    }
  }, [authLoading, user, userData])

  const fetchWidgets = async () => {
    try {
      setWidgetsLoading(true)
      const res = await fetch('/api/promo-widgets?admin=true')
      const data = await res.json()
      if (data.success && data.data) {
        setWidgets(prev => ({
          widget_1: { ...prev.widget_1, ...(data.data.widget_1 || {}) },
          widget_2: { ...prev.widget_2, ...(data.data.widget_2 || {}) },
        }))
      }
    } catch {
      // Non-blocking
    } finally {
      setWidgetsLoading(false)
    }
  }

  const handleWidgetChange = (key, field, value) => {
    setWidgets(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value,
      },
    }))
  }

  const handleSaveWidget = async (key) => {
    setSavingWidgetKey(key)
    try {
      const payload = widgets[key]
      const res = await authFetch('/api/promo-widgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(key === 'widget_1' ? 'Limited Drops card updated successfully!' : 'Brand Guarantee card updated successfully!')
        fetchWidgets()
      } else {
        toast.error(data.error || 'Failed to update widget')
      }
    } catch (err) {
      toast.error('Error saving widget: ' + err.message)
    } finally {
      setSavingWidgetKey(null)
    }
  }

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
        {/* Navigation Tabs */}
        <Box sx={{ borderBottom: '2px solid #E2E8F0', mb: 3.5 }}>
          <Tabs
            value={activeTab}
            onChange={(_, val) => setActiveTab(val)}
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '0.95rem',
                minHeight: 52,
                color: '#64748B',
                '&.Mui-selected': {
                  color: BRAND,
                },
              },
              '& .MuiTabs-indicator': {
                backgroundColor: BRAND,
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
            }}
          >
            <Tab icon={<ViewCarouselOutlinedIcon />} iconPosition="start" label="Hero Banner Slider" />
            <Tab icon={<WidgetsOutlinedIcon />} iconPosition="start" label="Side Promo Cards (2 Dynamic Bento Widgets)" />
          </Tabs>
        </Box>

        {/* ═══════════════════════════════════════════════════════════════════════════
            TAB 0: HERO BANNER SLIDER
        ═══════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 0 && (
          <>
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
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════════
            TAB 1: SIDE PROMO BENTO CARDS (2 DYNAMIC WIDGETS)
        ═══════════════════════════════════════════════════════════════════════════ */}
        {activeTab === 1 && (
          <Box>
            {/* Header */}
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <WidgetsOutlinedIcon sx={{ color: BRAND, fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#0F172A' }}>
                  Storefront Side Promo Bento Cards
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ color: '#64748B' }}>
                Customize the 2 cards shown adjacent to the hero slider on the homepage. Edit titles, badges, countdown, and destination links with real-time live preview.
              </Typography>
            </Box>

            {widgetsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                <CircularProgress sx={{ color: BRAND }} />
              </Box>
            ) : (
              <Grid container spacing={3.5}>
                {/* ─── CARD 1: FLASH DROPS & COUNTDOWN ─── */}
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      {/* Widget 1 Top Label & Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip
                          icon={<LocalFireDepartmentIcon sx={{ color: '#F43F5E !important', fontSize: 18 }} />}
                          label="BENTO CARD 1: FLASH DROPS"
                          sx={{
                            bgcolor: '#FFE4E6',
                            color: '#9F1239',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            letterSpacing: 0.5,
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={widgets.widget_1?.status === 'ACTIVE'}
                              onChange={e =>
                                handleWidgetChange('widget_1', 'status', e.target.checked ? 'ACTIVE' : 'INACTIVE')
                              }
                              color="success"
                            />
                          }
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>{widgets.widget_1?.status || 'ACTIVE'}</Typography>}
                        />
                      </Box>

                      {/* Live Storefront Preview Box */}
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 1, letterSpacing: 0.5 }}>
                        STOREFRONT PREVIEW (HOW CUSTOMERS SEE IT)
                      </Typography>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #0c0f1d 0%, #1a1438 50%, #2d124d 100%)',
                          border: '1px solid rgba(139, 92, 246, 0.35)',
                          color: '#fff',
                          position: 'relative',
                          overflow: 'hidden',
                          mb: 3,
                          boxShadow: '0 10px 25px -5px rgba(45, 18, 77, 0.5)',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 0.8,
                              px: 1.5,
                              py: 0.5,
                              borderRadius: 999,
                              bgcolor: 'rgba(244, 63, 94, 0.2)',
                              border: '1px solid rgba(244, 63, 94, 0.4)',
                              color: '#FDA4AF',
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                            }}
                          >
                            <LocalFireDepartmentIcon sx={{ fontSize: 14, color: '#FB7185' }} />
                            <span>{widgets.widget_1?.badge || 'LIMITED DROPS'}</span>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#34D399' }} />
                            <Typography sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#C4B5FD', letterSpacing: 0.5 }}>
                              CLOSING IN
                            </Typography>
                          </Box>
                        </Box>

                        {widgets.widget_1?.showTimer !== false && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, my: 1.5 }}>
                            {['04', '59', '36'].map((val, idx) => (
                              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Box sx={{ textAlign: 'center' }}>
                                  <Box
                                    sx={{
                                      px: 1.2,
                                      py: 0.5,
                                      borderRadius: 1.5,
                                      bgcolor: 'rgba(0,0,0,0.6)',
                                      border: '1px solid rgba(255,255,255,0.15)',
                                      minWidth: 38,
                                      color: '#67E8F9',
                                      fontFamily: 'monospace',
                                      fontWeight: 900,
                                      fontSize: '0.85rem',
                                    }}
                                  >
                                    {val}
                                  </Box>
                                  <Typography sx={{ fontSize: '0.55rem', fontWeight: 900, color: '#94A3B8', mt: 0.2 }}>
                                    {idx === 0 ? 'HRS' : idx === 1 ? 'MIN' : 'SEC'}
                                  </Typography>
                                </Box>
                                {idx < 2 && (
                                  <Typography sx={{ fontWeight: 900, color: '#A78BFA', fontSize: '0.9rem', mb: 1.5 }}>
                                    :
                                  </Typography>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}

                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff', mb: 0.5 }}>
                          {widgets.widget_1?.title || 'Curated Drop Discounts'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(203, 213, 225, 0.9)', mb: 2 }}>
                          {widgets.widget_1?.subtitle || 'Flash deals with up to 50% discount across verified tech, pantry, and gourmet dining.'}
                        </Typography>

                        <Box
                          sx={{
                            py: 1,
                            px: 2,
                            borderRadius: 2,
                            background: 'linear-gradient(90deg, #4F46E5 0%, #9333EA 50%, #4F46E5 100%)',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 1,
                            boxShadow: '0 4px 14px rgba(79, 70, 229, 0.4)',
                          }}
                        >
                          <span>{widgets.widget_1?.buttonText || 'Explore Drops'}</span>
                          <ArrowForwardIcon sx={{ fontSize: 14 }} />
                        </Box>
                      </Box>

                      {/* Form Inputs */}
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Badge Pill Text"
                          placeholder="e.g. LIMITED DROPS or FLASH SALE"
                          value={widgets.widget_1?.badge || ''}
                          onChange={e => handleWidgetChange('widget_1', 'badge', e.target.value)}
                          {...tf}
                        />

                        <FormControlLabel
                          control={
                            <Switch
                              checked={widgets.widget_1?.showTimer !== false}
                              onChange={e => handleWidgetChange('widget_1', 'showTimer', e.target.checked)}
                              color="primary"
                            />
                          }
                          label={<Typography variant="body2" sx={{ fontWeight: 600 }}>Display Digital Countdown Timer</Typography>}
                        />

                        <TextField
                          fullWidth
                          size="small"
                          label="Headline Title"
                          placeholder="e.g. Curated Drop Discounts"
                          value={widgets.widget_1?.title || ''}
                          onChange={e => handleWidgetChange('widget_1', 'title', e.target.value)}
                          {...tf}
                        />

                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          label="Subtitle / Description"
                          placeholder="e.g. upToOff 29% (Electronics & Tech, Bakery & Desserts, Fresh Groceries)!"
                          value={widgets.widget_1?.subtitle || ''}
                          onChange={e => handleWidgetChange('widget_1', 'subtitle', e.target.value)}
                          {...tf}
                        />

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Button Text"
                              placeholder="e.g. Explore Drops"
                              value={widgets.widget_1?.buttonText || ''}
                              onChange={e => handleWidgetChange('widget_1', 'buttonText', e.target.value)}
                              {...tf}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Button Target Link"
                              placeholder="e.g. /deals or /customer"
                              value={widgets.widget_1?.buttonLink || ''}
                              onChange={e => handleWidgetChange('widget_1', 'buttonLink', e.target.value)}
                              {...tf}
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={savingWidgetKey === 'widget_1' ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveOutlinedIcon />}
                      onClick={() => handleSaveWidget('widget_1')}
                      disabled={savingWidgetKey === 'widget_1'}
                      sx={{
                        mt: 3,
                        bgcolor: BRAND,
                        color: '#fff',
                        fontWeight: 700,
                        textTransform: 'none',
                        py: 1.2,
                        borderRadius: 2,
                        boxShadow: '0 4px 14px 0 rgba(57,119,42,0.25)',
                        '&:hover': { bgcolor: '#2d5e21' },
                      }}
                    >
                      {savingWidgetKey === 'widget_1' ? 'Saving Card 1...' : 'Save Drops Card'}
                    </Button>
                  </Card>
                </Grid>

                {/* ─── CARD 2: BRAND GUARANTEES & VERIFIED STORES ─── */}
                <Grid item xs={12} md={6}>
                  <Card
                    sx={{
                      p: { xs: 2.5, sm: 3 },
                      borderRadius: 3,
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      {/* Widget 2 Top Label & Status */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Chip
                          icon={<ShieldOutlinedIcon sx={{ color: '#059669 !important', fontSize: 18 }} />}
                          label="BENTO CARD 2: BRAND GUARANTEE"
                          sx={{
                            bgcolor: '#D1FAE5',
                            color: '#065F46',
                            fontWeight: 800,
                            fontSize: '0.75rem',
                            letterSpacing: 0.5,
                          }}
                        />
                        <FormControlLabel
                          control={
                            <Switch
                              checked={widgets.widget_2?.status === 'ACTIVE'}
                              onChange={e =>
                                handleWidgetChange('widget_2', 'status', e.target.checked ? 'ACTIVE' : 'INACTIVE')
                              }
                              color="success"
                            />
                          }
                          label={<Typography variant="caption" sx={{ fontWeight: 700 }}>{widgets.widget_2?.status || 'ACTIVE'}</Typography>}
                        />
                      </Box>

                      {/* Live Storefront Preview Box */}
                      <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748B', display: 'block', mb: 1, letterSpacing: 0.5 }}>
                        STOREFRONT PREVIEW (HOW CUSTOMERS SEE IT)
                      </Typography>
                      <Box
                        sx={{
                          p: 2.5,
                          borderRadius: 3,
                          background: 'linear-gradient(135deg, #061412 0%, #09221d 50%, #043329 100%)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#fff',
                          position: 'relative',
                          overflow: 'hidden',
                          mb: 3,
                          boxShadow: '0 10px 25px -5px rgba(4, 51, 41, 0.5)',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 0.8,
                            px: 1.5,
                            py: 0.5,
                            borderRadius: 999,
                            bgcolor: 'rgba(16, 185, 129, 0.2)',
                            border: '1px solid rgba(16, 185, 129, 0.4)',
                            color: '#6EE7B7',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            mb: 1.5,
                          }}
                        >
                          <ShieldOutlinedIcon sx={{ fontSize: 14, color: '#34D399' }} />
                          <span>{widgets.widget_2?.badge || 'FEATURED STORES & RESTAURANTS'}</span>
                        </Box>

                        <Typography sx={{ fontWeight: 800, fontSize: '0.95rem', color: '#F1F5F9', mb: 0.5 }}>
                          {widgets.widget_2?.title || '100% Authentic Brand Guarantees'}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'rgba(203, 213, 225, 0.8)', mb: 2 }}>
                          {widgets.widget_2?.subtitle || 'Direct partner merchants with certified authenticity, direct fulfillment, and official warranties.'}
                        </Typography>

                        {/* Partner badge mockup */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                          <Box sx={{ display: 'flex', ml: 0.5 }}>
                            {['M', 'E', 'A', 'K'].map((init, i) => (
                              <Box
                                key={i}
                                sx={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: '50%',
                                  bgcolor: '#064E3B',
                                  border: '2px solid #061412',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 800,
                                  color: '#6EE7B7',
                                  ml: i > 0 ? -0.8 : 0,
                                }}
                              >
                                {init}
                              </Box>
                            ))}
                          </Box>
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#6EE7B7' }}>
                            Verified Partner Merchants
                          </Typography>
                        </Box>

                        <Box
                          sx={{
                            pt: 1.5,
                            borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Box
                            sx={{
                              px: 1.2,
                              py: 0.3,
                              borderRadius: 1,
                              bgcolor: 'rgba(6, 78, 59, 0.6)',
                              border: '1px solid rgba(16, 185, 129, 0.3)',
                              color: '#6EE7B7',
                              fontSize: '0.68rem',
                              fontWeight: 800,
                            }}
                          >
                            {widgets.widget_2?.footerTag || '7-Day Easy Returns'}
                          </Box>
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              fontWeight: 800,
                              color: '#34D399',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                            }}
                          >
                            <span>{widgets.widget_2?.footerLinkText || 'View Boutiques →'}</span>
                          </Typography>
                        </Box>
                      </Box>

                      {/* Form Inputs */}
                      <Stack spacing={2}>
                        <TextField
                          fullWidth
                          size="small"
                          label="Badge Pill Text"
                          placeholder="e.g. FEATURED STORES & RESTAURANTS"
                          value={widgets.widget_2?.badge || ''}
                          onChange={e => handleWidgetChange('widget_2', 'badge', e.target.value)}
                          {...tf}
                        />

                        <TextField
                          fullWidth
                          size="small"
                          label="Headline Title"
                          placeholder="e.g. 100% Authentic Brand Guarantees"
                          value={widgets.widget_2?.title || ''}
                          onChange={e => handleWidgetChange('widget_2', 'title', e.target.value)}
                          {...tf}
                        />

                        <TextField
                          fullWidth
                          size="small"
                          multiline
                          rows={2}
                          label="Subtitle / Description"
                          placeholder="e.g. Verified boutiques: ElectroZone, Apex Computers, Metro Fresh, and gourmet kitchens."
                          value={widgets.widget_2?.subtitle || ''}
                          onChange={e => handleWidgetChange('widget_2', 'subtitle', e.target.value)}
                          {...tf}
                        />

                        <TextField
                          fullWidth
                          size="small"
                          label="Footer Tag / Trust Badge"
                          placeholder="e.g. 7-Day Easy Returns or Official Warranties"
                          value={widgets.widget_2?.footerTag || ''}
                          onChange={e => handleWidgetChange('widget_2', 'footerTag', e.target.value)}
                          {...tf}
                        />

                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Footer Link Text"
                              placeholder="e.g. View Boutiques →"
                              value={widgets.widget_2?.footerLinkText || ''}
                              onChange={e => handleWidgetChange('widget_2', 'footerLinkText', e.target.value)}
                              {...tf}
                            />
                          </Grid>
                          <Grid item xs={6}>
                            <TextField
                              fullWidth
                              size="small"
                              label="Footer Target Link"
                              placeholder="e.g. /customer or /vendors"
                              value={widgets.widget_2?.footerLink || ''}
                              onChange={e => handleWidgetChange('widget_2', 'footerLink', e.target.value)}
                              {...tf}
                            />
                          </Grid>
                        </Grid>
                      </Stack>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={savingWidgetKey === 'widget_2' ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : <SaveOutlinedIcon />}
                      onClick={() => handleSaveWidget('widget_2')}
                      disabled={savingWidgetKey === 'widget_2'}
                      sx={{
                        mt: 3,
                        bgcolor: BRAND,
                        color: '#fff',
                        fontWeight: 700,
                        textTransform: 'none',
                        py: 1.2,
                        borderRadius: 2,
                        boxShadow: '0 4px 14px 0 rgba(57,119,42,0.25)',
                        '&:hover': { bgcolor: '#2d5e21' },
                      }}
                    >
                      {savingWidgetKey === 'widget_2' ? 'Saving Card 2...' : 'Save Brand Guarantee Card'}
                    </Button>
                  </Card>
                </Grid>
              </Grid>
            )}
          </Box>
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
