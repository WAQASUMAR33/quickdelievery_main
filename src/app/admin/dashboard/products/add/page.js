'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserVerification } from '@/lib/authHelpers'
import { authFetch } from '@/lib/apiClient'
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
import NotesOutlinedIcon      from '@mui/icons-material/NotesOutlined'
import SaveOutlinedIcon      from '@mui/icons-material/SaveOutlined'
import StraightenOutlinedIcon from '@mui/icons-material/StraightenOutlined'
import TuneOutlinedIcon      from '@mui/icons-material/TuneOutlined'
import UploadOutlinedIcon    from '@mui/icons-material/UploadOutlined'

const BRAND = '#39772A'
const tf    = { size: 'small', sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

function SectionCard({ icon, title, subtitle, children }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 0.75, bgcolor: '#D8E9D6', color: BRAND, borderRadius: 1, display: 'flex' }}>{icon}</Box>
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

  const [productCategories, setProductCategories] = useState([])
  const [subcategories,     setSubcategories]     = useState([])
  const [uploadingImages,   setUploadingImages]   = useState(false)
  const [isSubmitting,      setIsSubmitting]      = useState(false)
  const [dragOver,          setDragOver]          = useState(false)

  const [form, setForm] = useState({
    name:              '',
    description:       '',
    price:             '',
    discount:          '0',
    productCategoryId: '',
    catId:             '',
    subCatId:          '',
    images:            [],
    stock:             '0',
    // Product details
    brandName:         '',
    manufacturer:      '',
    productType:       '',
    modelNumber:       '',
    // Physical details
    sizeName:          '',
    size:              '',
    color:             '',
    conditionType:     '',
    productDimensions: '',
    packageWeight:     '',
    warranty:          '',
    // Ingredients / notes
    ingredients:       '',
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
    Promise.all([
      fetch('/api/products?type=productcategories').then(r => r.json()),
      fetch('/api/products?type=subcategories').then(r => r.json()),
      fetch('/api/products?type=categories').then(r => r.json()),
    ]).then(([pcData, subsData, catsData]) => {
      if (pcData.success && pcData.data?.length > 0) {
        setProductCategories(pcData.data)
      } else if (catsData.success) {
        setProductCategories(catsData.data.map(c => ({
          productCategoryId: c.id,
          productCategoryName: c.name,
          categoryId: c.id,
        })))
      }
      if (subsData.success) setSubcategories(subsData.data || [])
    }).catch(e => console.error('Categories fetch error:', e))
  }, [userData?.uid])

  const set = (field, value) => {
    setForm(p => ({ ...p, [field]: value }))
    if (errors[field]) setErrors(p => ({ ...p, [field]: '' }))
  }

  const handleCategoryChange = (e) => {
    const selectedPCId = e.target.value
    const selectedPC = productCategories.find(pc => String(pc.productCategoryId) === String(selectedPCId))
    setForm(p => ({
      ...p,
      productCategoryId: selectedPCId,
      catId: selectedPC?.categoryId ? String(selectedPC.categoryId) : (selectedPCId ? String(selectedPCId) : ''),
      subCatId: '',
    }))
    if (errors.catId || errors.productCategoryId) {
      setErrors(p => ({ ...p, catId: '', productCategoryId: '' }))
    }
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
        const msg = result.error || (result.errors && result.errors[0]) || 'Upload failed'
        toast.error(msg)
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
    if (!form.name.trim())                                           e.name     = 'Item name is required'
    if (!form.productCategoryId && !form.catId)                      e.catId    = 'Category is required'
    if ((form.productCategoryId || form.catId) && !form.subCatId)   e.subCatId = 'Sub-category is required'
    if (!form.price || parseFloat(form.price) <= 0)                  e.price    = 'Valid price is required'
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

      const res = await authFetch('/api/products', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:              'product',
          proName:            form.name,
          description:        form.description,
          catId:              parseInt(form.catId) || 12,
          subCatId:           parseInt(form.subCatId),
          productCategoryId:  form.productCategoryId ? parseInt(form.productCategoryId) : null,
          price:              parseFloat(form.price),
          cost:               parseFloat(form.price),   // cost = price for restaurants
          discount:           parseFloat(form.discount) || 0,
          sku,
          barcode:            sku,
          stock:              parseInt(form.stock) || 0,
          qnty:               parseInt(form.stock) || 0,
          proImages:          form.images,
          vendorId:           userData.uid,
          createdById:        userData.uid,
          variations:         validVariations.length > 0 ? validVariations : null,
          // Product details
          brandName:          form.brandName    || null,
          manufacturer:       form.manufacturer || null,
          productType:        form.productType   || null,
          modelNumber:        form.modelNumber   || null,
          // Physical details
          sizeName:           form.sizeName        || null,
          size:               form.size            || null,
          color:              form.color           || null,
          conditionType:      form.conditionType   || null,
          productDimensions:  form.productDimensions || null,
          packageWeight:      form.packageWeight   || null,
          warranty:           form.warranty        || null,
          // Ingredients / notes
          ingredients:        form.ingredients     || null,
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

  // Filter subcategories by catId of the selected product category
  const filteredSubs = (() => {
    if (!form.catId && !form.productCategoryId) return []
    const matched = subcategories.filter(s => String(s.catId) === String(form.catId))
    if (matched.length > 0) return matched
    return subcategories
  })()

  return (
    <DashboardLayout>
      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <IconButton size="small" onClick={() => router.back()}
              sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1.5 }}>
              <ArrowBackOutlinedIcon fontSize="small" />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight={700}>Add Menu Item</Typography>
              <Typography variant="body2" color="text.secondary">Create a new product or restaurant listing</Typography>
            </Box>
          </Box>
          <Button type="submit" variant="contained" disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#2e5f22' }, borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3 }}>
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
                    <InputLabel>Product Category</InputLabel>
                    <Select label="Product Category" value={form.productCategoryId}
                      onChange={handleCategoryChange}>
                      <MenuItem value=""><em>Select category…</em></MenuItem>
                      {productCategories.map(c => (
                        <MenuItem key={c.productCategoryId} value={c.productCategoryId}>
                          {c.productCategoryName}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.catId && <Typography variant="caption" color="error" mt={0.5}>{errors.catId}</Typography>}
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl {...tf} fullWidth required disabled={!form.productCategoryId} error={!!errors.subCatId} sx={{ minWidth: 300 }}>
                    <InputLabel>Sub-category</InputLabel>
                    <Select label="Sub-category" value={form.subCatId}
                      onChange={e => set('subCatId', e.target.value)}>
                      <MenuItem value=""><em>Select sub-category…</em></MenuItem>
                      {filteredSubs.map(s => (
                        <MenuItem key={s.subCatId} value={s.subCatId}>
                          {s.subCatName}
                        </MenuItem>
                      ))}
                    </Select>
                    {errors.subCatId && <Typography variant="caption" color="error" mt={0.5}>{errors.subCatId}</Typography>}
                  </FormControl>
                </Grid>
              </Grid>

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField {...tf} fullWidth label="Brand"
                    value={form.brandName} onChange={e => set('brandName', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...tf} fullWidth label="Manufacturer"
                    value={form.manufacturer} onChange={e => set('manufacturer', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...tf} fullWidth label="Product Type"
                    value={form.productType} onChange={e => set('productType', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField {...tf} fullWidth label="Model Number"
                    value={form.modelNumber} onChange={e => set('modelNumber', e.target.value)} />
                </Grid>
              </Grid>

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
                  InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }} />
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
                        {['Variation Name', 'Price (Rs.)', 'Discount (%)', ''].map(h => (
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
                              InputProps={{ startAdornment: <InputAdornment position="start">Rs.</InputAdornment> }} />
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
                sx={{ alignSelf: 'flex-start', textTransform: 'none', borderRadius: 0, borderColor: BRAND, color: BRAND, '&:hover': { bgcolor: '#D8E9D6', borderColor: BRAND } }}>
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
                  bgcolor: dragOver ? '#D8E9D6' : 'grey.50',
                  borderRadius: 0, p: 3, textAlign: 'center', cursor: 'pointer',
                  transition: 'all 0.2s',
                  '&:hover': { borderColor: BRAND, bgcolor: '#D8E9D6' },
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

          {/* ── Physical Details ── */}
          <SectionCard icon={<StraightenOutlinedIcon fontSize="small" />} title="Physical Details" subtitle="Size, colour, condition and dimensions">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField {...tf} fullWidth label="Size Name"
                  value={form.sizeName} onChange={e => set('sizeName', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField {...tf} fullWidth label="Size"
                  value={form.size} onChange={e => set('size', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField {...tf} fullWidth label="Color"
                  value={form.color} onChange={e => set('color', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField {...tf} fullWidth label="Condition"
                  value={form.conditionType} onChange={e => set('conditionType', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField {...tf} fullWidth label="Dimensions"
                  value={form.productDimensions} onChange={e => set('productDimensions', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField {...tf} fullWidth label="Weight"
                  value={form.packageWeight} onChange={e => set('packageWeight', e.target.value)} />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <TextField {...tf} fullWidth label="Warranty"
                  value={form.warranty} onChange={e => set('warranty', e.target.value)} />
              </Grid>
            </Grid>
          </SectionCard>

          {/* ── Ingredients / Notes ── */}
          <SectionCard icon={<NotesOutlinedIcon fontSize="small" />} title="Ingredients / Notes" subtitle="Ingredients, allergens or preparation notes">
            <TextField {...tf} fullWidth multiline rows={4} label="Ingredients"
              value={form.ingredients} onChange={e => set('ingredients', e.target.value)}
              placeholder="e.g. Chicken, rice, spices, yoghurt…" />
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
