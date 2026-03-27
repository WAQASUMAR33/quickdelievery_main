'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserVerification } from '@/lib/authHelpers'
import { uploadMultipleImages } from '@/lib/imageUpload'
import DashboardLayout from '@/components/layout/DashboardLayout'
import toast from 'react-hot-toast'

import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import CircularProgress from '@mui/material/CircularProgress'
import FormControl      from '@mui/material/FormControl'
import Grid             from '@mui/material/Grid'
import IconButton       from '@mui/material/IconButton'
import InputAdornment   from '@mui/material/InputAdornment'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Select           from '@mui/material/Select'
import Stack            from '@mui/material/Stack'
import Table            from '@mui/material/Table'
import TableBody        from '@mui/material/TableBody'
import TableCell        from '@mui/material/TableCell'
import TableContainer   from '@mui/material/TableContainer'
import TableHead        from '@mui/material/TableHead'
import TableRow         from '@mui/material/TableRow'
import TextField        from '@mui/material/TextField'
import Typography       from '@mui/material/Typography'

import AddOutlinedIcon       from '@mui/icons-material/AddOutlined'
import ArrowBackOutlinedIcon from '@mui/icons-material/ArrowBackOutlined'
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined'
import CloseOutlinedIcon     from '@mui/icons-material/CloseOutlined'
import DeleteOutlineIcon     from '@mui/icons-material/DeleteOutline'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import SaveOutlinedIcon      from '@mui/icons-material/SaveOutlined'
import TuneOutlinedIcon      from '@mui/icons-material/TuneOutlined'
import UploadOutlinedIcon    from '@mui/icons-material/UploadOutlined'

const BRAND = '#D70F64'
const tf    = { size: 'small', sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 0.75, bgcolor: '#fce7f3', color: BRAND, borderRadius: 1, display: 'flex' }}>{icon}</Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
          {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
        </Box>
      </Box>
      <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
    </Card>
  )
}

const EMPTY_VARIATION = { name: '', price: '', discount: '0' }

export default function AddProductPage() {
  const router = useRouter()
  const { userData, user, loading } = useAuth()
  const fileInputRef = useRef(null)

  const [categories,      setCategories]      = useState([])
  const [subcategories,   setSubcategories]   = useState([])
  const [vendors,         setVendors]         = useState([])
  const [uploadingImages, setUploadingImages] = useState(false)
  const [isSubmitting,    setIsSubmitting]    = useState(false)
  const [dragOver,        setDragOver]        = useState(false)

  const isAdmin = userData?.role === 'ADMIN' || userData?.role === 'SUPER_ADMIN'

  const [form, setForm] = useState({
    name:        '',
    description: '',
    price:       '',
    discount:    '0',
    catId:       '',
    subCatId:    '',
    vendorId:    '',
    images:      [],
    stock:       '0',
  })
  const [variations, setVariations] = useState([])
  const [errors,     setErrors]     = useState({})

  useEffect(() => {
    if (!loading) {
      const v = checkUserVerification(user, userData)
      if (!v.isVerified) { router.push('/login'); return }
      if (!['ADMIN', 'SUPER_ADMIN', 'VENDOR'].includes(userData?.role)) {
        router.push('/admin/dashboard'); return
      }
    }
  }, [user, userData, loading, router])

  useEffect(() => {
    if (!userData?.uid) return
    const adminUser = userData?.role === 'ADMIN' || userData?.role === 'SUPER_ADMIN'
    const isVendor  = userData?.role === 'VENDOR'

    // Auto-set vendor for logged-in vendor
    if (isVendor) setForm(p => ({ ...p, vendorId: userData.uid }))

    const fetches = [
      fetch('/api/products?type=categories').then(r => r.json()),
      fetch('/api/products?type=subcategories').then(r => r.json()),
    ]
    if (adminUser) fetches.push(fetch('/api/users/all').then(r => r.json()))
    Promise.all(fetches).then(([cats, subs, usersRes]) => {
      // Filter to restaurant categories only
      const allCats = cats.success ? cats.data || [] : []
      const restaurantCats = allCats.filter(c => c.name.toLowerCase().includes('restaurant'))
      setCategories(restaurantCats)
      // Auto-select if only one restaurant category exists
      if (restaurantCats.length === 1) {
        setForm(p => ({ ...p, catId: restaurantCats[0].id, subCatId: '' }))
      }
      if (subs.success) setSubcategories(subs.data || [])
      if (usersRes?.success) setVendors((usersRes.data || []).filter(u => u.role === 'VENDOR'))
    }).catch(() => {})
  }, [userData?.uid, userData?.role])

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  // ── Variations helpers ──────────────────────────────────────────────────────
  const addVariation    = () => setVariations(v => [...v, { ...EMPTY_VARIATION }])
  const removeVariation = (i) => setVariations(v => v.filter((_, idx) => idx !== i))
  const setVariation    = (i, field, value) =>
    setVariations(v => v.map((row, idx) => idx === i ? { ...row, [field]: value } : row))

  // ── Image upload ────────────────────────────────────────────────────────────
  const handleImageUpload = async (files) => {
    if (!files?.length) return
    setUploadingImages(true)
    try {
      const result = await uploadMultipleImages(files, 'product_images')
      if (result.success) {
        set('images', [...form.images, ...result.urls])
        toast.success(`Uploaded ${result.urls.length} image(s)`)
      } else {
        toast.error(`Upload failed: ${result.error}`)
      }
    } catch (e) {
      toast.error(e.message)
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (idx) => set('images', form.images.filter((_, i) => i !== idx))

  // ── Validation ──────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {}
    if (!form.name.trim())                           e.name     = 'Item name is required'
    if (!form.catId)                                 e.catId    = 'Category is required'
    if (form.catId && !form.subCatId)                e.subCatId = 'Sub-category is required'
    if (!form.price || parseFloat(form.price) <= 0) e.price    = 'Valid price is required'
    if (isAdmin && !form.vendorId)                   e.vendorId = 'Vendor is required'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) { toast.error('Please fix the errors before submitting'); return }
    setIsSubmitting(true)
    try {
      // auto-generate a SKU from the name + timestamp
      const sku = `${form.name.replace(/\s+/g, '-').toUpperCase().slice(0, 12)}-${Date.now().toString(36).toUpperCase()}`

      const validVariations = variations.filter(v => v.name.trim() && v.price)

      const resolvedVendorId = isAdmin ? form.vendorId : userData.uid

      const res = await fetch('/api/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:        'product',
          proName:      form.name,
          description:  form.description,
          catId:        parseInt(form.catId),
          subCatId:     parseInt(form.subCatId),
          price:        parseFloat(form.price),
          cost:         parseFloat(form.price),   // cost = price for restaurants
          discount:     parseFloat(form.discount) || 0,
          sku,
          barcode:      sku,
          stock:        parseInt(form.stock) || 0,
          qnty:         parseInt(form.stock) || 0,
          proImages:    form.images,
          vendorId:     resolvedVendorId,
          createdById:  userData.uid,
          variations:   validVariations.length > 0 ? validVariations : null,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Item added successfully!')
        router.push('/admin/dashboard/products')
      } else {
        toast.error(data.error || 'Failed to add item')
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <Box sx={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <CircularProgress size={32} sx={{ color: BRAND }} />
          <Typography color="text.secondary">Loading…</Typography>
        </Box>
      </DashboardLayout>
    )
  }

  const filteredSubs = subcategories.filter(s => String(s.catId) === String(form.catId))

  return (
    <DashboardLayout>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => router.back()}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
              <ArrowBackOutlinedIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700}>Add Menu Item</Typography>
              <Typography variant="body2" color="text.secondary">Create a new restaurant listing</Typography>
            </Box>
          </Box>
          <Button type="submit" variant="contained" disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, textTransform: 'none', fontWeight: 700, px: 3 }}>
            {isSubmitting ? 'Saving…' : 'Save Item'}
          </Button>
        </Box>

        <Stack spacing={2.5}>

          {/* ── Basic Info ── */}
          <SectionCard icon={<Inventory2OutlinedIcon fontSize="small" />} title="Basic Information" subtitle="Name, description and category">
            <Stack spacing={2}>

              <TextField {...tf} fullWidth required label="Item Name"
                value={form.name} onChange={e => set('name', e.target.value)}
                error={!!errors.name} helperText={errors.name}
                placeholder="e.g. Chicken Biryani" />

              <TextField {...tf} fullWidth multiline rows={3} label="Description"
                value={form.description} onChange={e => set('description', e.target.value)}
                placeholder="Describe the item, ingredients, serving size…" />

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl {...tf} fullWidth required error={!!errors.catId} sx={{ minWidth: 300 }}>
                    <InputLabel>Category</InputLabel>
                    <Select label="Category" value={form.catId}
                      onChange={e => { set('catId', e.target.value); set('subCatId', '') }}>
                      <MenuItem value=""><em>Select category…</em></MenuItem>
                      {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                    </Select>
                    {errors.catId && <Typography variant="caption" color="error" mt={0.5}>{errors.catId}</Typography>}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl {...tf} fullWidth required disabled={!form.catId} error={!!errors.subCatId} sx={{ minWidth: 300 }}>
                    <InputLabel>Sub-category</InputLabel>
                    <Select label="Sub-category" value={form.subCatId}
                      onChange={e => set('subCatId', e.target.value)}>
                      <MenuItem value=""><em>Select sub-category…</em></MenuItem>
                      {filteredSubs.map(s => <MenuItem key={s.subCatId} value={s.subCatId}>{s.subCatName}</MenuItem>)}
                    </Select>
                    {errors.subCatId && <Typography variant="caption" color="error" mt={0.5}>{errors.subCatId}</Typography>}
                  </FormControl>
                </Grid>
              </Grid>

              {isAdmin && (
                <FormControl {...tf} fullWidth required error={!!errors.vendorId} sx={{ minWidth: 300 }}>
                  <InputLabel>Vendor</InputLabel>
                  <Select label="Vendor" value={form.vendorId}
                    onChange={e => set('vendorId', e.target.value)}>
                    <MenuItem value=""><em>Select vendor…</em></MenuItem>
                    {vendors.map(v => <MenuItem key={v.uid} value={v.uid}>{v.username} — {v.email}</MenuItem>)}
                  </Select>
                  {errors.vendorId && <Typography variant="caption" color="error" mt={0.5}>{errors.vendorId}</Typography>}
                </FormControl>
              )}

            </Stack>
          </SectionCard>

          {/* ── Pricing ── */}
          <SectionCard icon={<LocalOfferOutlinedIcon fontSize="small" />} title="Pricing" subtitle="Base price and discount">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField {...tf} fullWidth required label="Base Price" type="number"
                  inputProps={{ step: '0.01', min: 0 }}
                  value={form.price} onChange={e => set('price', e.target.value)}
                  error={!!errors.price} helperText={errors.price}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField {...tf} fullWidth label="Discount %" type="number"
                  inputProps={{ step: '0.01', min: 0, max: 100 }}
                  value={form.discount} onChange={e => set('discount', e.target.value)}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField {...tf} fullWidth label="Stock / Quantity" type="number"
                  inputProps={{ min: 0 }}
                  value={form.stock} onChange={e => set('stock', e.target.value)} />
              </Grid>
            </Grid>
          </SectionCard>

          {/* ── Variations ── */}
          <SectionCard
            icon={<TuneOutlinedIcon fontSize="small" />}
            title="Variations"
            subtitle="Add sizes or options with individual pricing (e.g. Small, Medium, Large)"
          >
            <Stack spacing={1.5}>
              {variations.length > 0 && (
                <TableContainer sx={{ border: '1px solid', borderColor: 'divider' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        {['Variation Name', 'Price ($)', 'Discount (%)', ''].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary', letterSpacing: 0.5, py: 1.25 }}>
                            {h}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {variations.map((row, i) => (
                        <TableRow key={i} sx={{ '&:last-child td': { border: 0 } }}>
                          <TableCell sx={{ py: 0.75, minWidth: 180 }}>
                            <TextField {...tf} fullWidth placeholder="e.g. Small, Large, Spicy"
                              value={row.name} onChange={e => setVariation(i, 'name', e.target.value)} />
                          </TableCell>
                          <TableCell sx={{ py: 0.75, minWidth: 120 }}>
                            <TextField {...tf} fullWidth type="number" placeholder="0.00"
                              inputProps={{ step: '0.01', min: 0 }}
                              value={row.price} onChange={e => setVariation(i, 'price', e.target.value)}
                              InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
                          </TableCell>
                          <TableCell sx={{ py: 0.75, minWidth: 110 }}>
                            <TextField {...tf} fullWidth type="number" placeholder="0"
                              inputProps={{ step: '0.01', min: 0, max: 100 }}
                              value={row.discount} onChange={e => setVariation(i, 'discount', e.target.value)}
                              InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }} />
                          </TableCell>
                          <TableCell sx={{ py: 0.75, width: 40 }}>
                            <IconButton size="small" onClick={() => removeVariation(i)} sx={{ color: 'error.main' }}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              <Button variant="outlined" size="small" startIcon={<AddOutlinedIcon />}
                onClick={addVariation}
                sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: 0, borderColor: BRAND, color: BRAND, '&:hover': { bgcolor: '#fce7f3', borderColor: BRAND } }}>
                Add Variation
              </Button>
            </Stack>
          </SectionCard>

          {/* ── Images ── */}
          <SectionCard icon={<CameraAltOutlinedIcon fontSize="small" />} title="Images" subtitle="Upload photos of this item">
            <Stack spacing={2}>

              {/* Upload zone */}
              <Box
                onClick={() => fileInputRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/')); if (files.length) handleImageUpload(files) }}
                sx={{
                  border: '2px dashed', borderColor: dragOver ? BRAND : 'divider',
                  bgcolor: dragOver ? '#fce7f3' : 'grey.50',
                  borderRadius: 0, p: 3, textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: BRAND, bgcolor: '#fce7f3' },
                }}
              >
                {uploadingImages ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: BRAND }} />
                    <Typography variant="body2" color="text.secondary">Uploading…</Typography>
                  </Box>
                ) : (
                  <>
                    <UploadOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      Drag & drop images here, or <Box component="span" sx={{ color: BRAND, fontWeight: 600 }}>browse</Box>
                    </Typography>
                    <Typography variant="caption" color="text.disabled">JPG, PNG or WebP</Typography>
                  </>
                )}
                <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }}
                  onChange={e => { if (e.target.files?.length) handleImageUpload(Array.from(e.target.files)) }} />
              </Box>

              {/* Thumbnails */}
              {form.images.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {form.images.map((img, i) => (
                    <Box key={i} sx={{ position: 'relative', width: 80, height: 80 }}>
                      <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      <IconButton size="small" onClick={() => removeImage(i)} sx={{
                        position: 'absolute', top: -6, right: -6,
                        bgcolor: 'error.main', color: '#fff', width: 18, height: 18,
                        '&:hover': { bgcolor: 'error.dark' },
                      }}>
                        <CloseOutlinedIcon sx={{ fontSize: 11 }} />
                      </IconButton>
                    </Box>
                  ))}
                </Box>
              )}
            </Stack>
          </SectionCard>

          {/* ── Submit (bottom) ── */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', pb: 2 }}>
            <Button type="submit" variant="contained" disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, textTransform: 'none', fontWeight: 700, px: 4, py: 1.2 }}>
              {isSubmitting ? 'Saving…' : 'Save Item'}
            </Button>
          </Box>

        </Stack>
      </Box>
    </DashboardLayout>
  )
}
