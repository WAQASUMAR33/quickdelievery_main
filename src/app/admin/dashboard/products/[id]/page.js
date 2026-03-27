'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { checkUserAccess } from '@/lib/authHelpers'
import DashboardLayout from '@/components/layout/DashboardLayout'
import toast from 'react-hot-toast'

import Box              from '@mui/material/Box'
import Button           from '@mui/material/Button'
import Card             from '@mui/material/Card'
import CardContent      from '@mui/material/CardContent'
import Chip             from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Divider          from '@mui/material/Divider'
import FormControl      from '@mui/material/FormControl'
import Grid             from '@mui/material/Grid'
import IconButton       from '@mui/material/IconButton'
import InputLabel       from '@mui/material/InputLabel'
import MenuItem         from '@mui/material/MenuItem'
import Select           from '@mui/material/Select'
import Stack            from '@mui/material/Stack'
import Switch           from '@mui/material/Switch'
import TextField        from '@mui/material/TextField'
import Typography       from '@mui/material/Typography'
import FormControlLabel from '@mui/material/FormControlLabel'

import ArrowBackIcon            from '@mui/icons-material/ArrowBack'
import CheckCircleOutlinedIcon  from '@mui/icons-material/CheckCircleOutlined'
import CancelOutlinedIcon       from '@mui/icons-material/CancelOutlined'
import PendingOutlinedIcon      from '@mui/icons-material/PendingOutlined'
import SaveOutlinedIcon         from '@mui/icons-material/SaveOutlined'
import Inventory2OutlinedIcon   from '@mui/icons-material/Inventory2Outlined'
import AttachMoneyOutlinedIcon  from '@mui/icons-material/AttachMoneyOutlined'
import CategoryOutlinedIcon     from '@mui/icons-material/CategoryOutlined'
import StorefrontOutlinedIcon   from '@mui/icons-material/StorefrontOutlined'
import CameraAltOutlinedIcon    from '@mui/icons-material/CameraAltOutlined'
import CloseOutlinedIcon        from '@mui/icons-material/CloseOutlined'
import InfoOutlinedIcon         from '@mui/icons-material/InfoOutlined'

const BRAND = '#D70F64'
const tf = { size: 'small', sx: { '& .MuiOutlinedInput-root': { borderRadius: 0 } } }

function SectionCard({ icon, title, children }) {
  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
      <Box sx={{ px: 2.5, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ p: 0.75, bgcolor: '#fce7f3', color: BRAND, borderRadius: 1, display: 'flex' }}>{icon}</Box>
        <Typography variant="subtitle2" fontWeight={700}>{title}</Typography>
      </Box>
      <CardContent sx={{ p: 2.5 }}>{children}</CardContent>
    </Card>
  )
}

const ApprovalChip = ({ status }) => {
  if (status === 'Approved') return <Chip label="Approved" size="small" icon={<CheckCircleOutlinedIcon />} color="success" variant="outlined" sx={{ borderRadius: 0 }} />
  if (status === 'Pending')  return <Chip label="Pending"  size="small" icon={<PendingOutlinedIcon />}    color="warning" variant="outlined" sx={{ borderRadius: 0 }} />
  if (status === 'Rejected') return <Chip label="Rejected" size="small" icon={<CancelOutlinedIcon />}     color="error"   variant="outlined" sx={{ borderRadius: 0 }} />
  return <Chip label={status || '—'} size="small" variant="outlined" sx={{ borderRadius: 0 }} />
}

export default function ProductEditPage() {
  const { user, userData, loading } = useAuth()
  const router = useRouter()
  const params = useParams()
  const id     = params.id

  const [fetching,  setFetching]  = useState(true)
  const [saving,    setSaving]    = useState(false)
  const [approving, setApproving] = useState(false)
  const [activeImg, setActiveImg] = useState(0)

  const [categories,    setCategories]    = useState([])
  const [subcategories, setSubcategories] = useState([])

  const [form, setForm] = useState({
    proName: '', description: '', catId: '', subCatId: '',
    price: '', cost: '', discount: '0', sku: '', barcode: '',
    qnty: '0', stock: '0', status: true,
    brandName: '', manufacturer: '', productType: '', modelNumber: '',
    productDimensions: '', packageWeight: '', conditionType: '',
    warranty: '', ingredients: '', sizeName: '', size: '', color: '',
    salePrice: '', saleStartDate: '', saleEndDate: '', currency: 'USD',
    proImages: [], approvalStatus: 'Pending',
  })

  useEffect(() => {
    if (!loading) {
      const access = checkUserAccess(user, userData, ['ADMIN', 'SUPER_ADMIN', 'VENDOR'])
      if (!access.hasAccess) { router.push(access.redirectTo); return }
      Promise.all([
        fetch(`/api/products/${id}`).then(r => r.json()),
        fetch('/api/products?type=categories').then(r => r.json()),
        fetch('/api/products?type=subcategories').then(r => r.json()),
      ]).then(([prod, cats, subs]) => {
        if (!prod.success) { toast.error('Product not found'); return }
        const p = prod.data
        setForm({
          proName:           p.proName         || '',
          description:       p.description     || '',
          catId:             p.catId           || '',
          subCatId:          p.subCatId        || '',
          price:             p.price           || '',
          cost:              p.cost            || '',
          discount:          p.discount        ?? '0',
          sku:               p.sku             || '',
          barcode:           p.barcode         || '',
          qnty:              p.qnty            ?? '0',
          stock:             p.stock           ?? '0',
          status:            p.status          ?? true,
          brandName:         p.brandName       || '',
          manufacturer:      p.manufacturer    || '',
          productType:       p.productType     || '',
          modelNumber:       p.modelNumber     || '',
          productDimensions: p.productDimensions || '',
          packageWeight:     p.packageWeight   || '',
          conditionType:     p.conditionType   || '',
          warranty:          p.warranty        || '',
          ingredients:       p.ingredients     || '',
          sizeName:          p.sizeName        || '',
          size:              p.size            || '',
          color:             p.color           || '',
          salePrice:         p.salePrice       || '',
          saleStartDate:     p.saleStartDate ? p.saleStartDate.slice(0, 10) : '',
          saleEndDate:       p.saleEndDate   ? p.saleEndDate.slice(0, 10)   : '',
          currency:          p.currency        || 'USD',
          proImages:         Array.isArray(p.proImages) ? p.proImages : [],
          approvalStatus:    p.approvalStatus  || 'Pending',
          vendor:            p.vendor,
          creator:           p.creator,
          approver:          p.approver,
        })
        if (cats.success) setCategories(cats.data || [])
        if (subs.success) setSubcategories(subs.data || [])
      }).catch(() => toast.error('Failed to load product'))
        .finally(() => setFetching(false))
    }
  }, [loading])

  const set = (field, value) => setForm(p => ({ ...p, [field]: value }))

  const filteredSubs = subcategories.filter(s => String(s.catId) === String(form.catId))

  const handleSave = async () => {
    if (!form.proName.trim()) { toast.error('Product name is required'); return }
    if (!form.price || parseFloat(form.price) <= 0) { toast.error('Valid price is required'); return }
    setSaving(true)
    try {
      const res  = await fetch('/api/products', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type:              'product',
          id:                parseInt(id),
          proName:           form.proName,
          description:       form.description,
          catId:             parseInt(form.catId),
          subCatId:          parseInt(form.subCatId),
          price:             parseFloat(form.price),
          cost:              parseFloat(form.cost),
          discount:          parseFloat(form.discount) || 0,
          sku:               form.sku,
          barcode:           form.barcode || form.sku,
          qnty:              parseInt(form.qnty) || 0,
          stock:             parseInt(form.stock) || 0,
          status:            form.status,
          proImages:         form.proImages,
          brandName:         form.brandName       || null,
          manufacturer:      form.manufacturer    || null,
          productType:       form.productType     || null,
          modelNumber:       form.modelNumber     || null,
          productDimensions: form.productDimensions || null,
          packageWeight:     form.packageWeight   || null,
          conditionType:     form.conditionType   || null,
          warranty:          form.warranty        || null,
          ingredients:       form.ingredients     || null,
          sizeName:          form.sizeName        || null,
          size:              form.size            || null,
          color:             form.color           || null,
          salePrice:         form.salePrice ? parseFloat(form.salePrice) : null,
          saleStartDate:     form.saleStartDate   || null,
          saleEndDate:       form.saleEndDate     || null,
          currency:          form.currency        || 'USD',
        }),
      })
      const data = await res.json()
      if (data.success) toast.success('Product saved successfully!')
      else toast.error(data.error || 'Save failed')
    } catch { toast.error('Something went wrong') }
    finally { setSaving(false) }
  }

  const handleApproval = async (status) => {
    setApproving(true)
    try {
      const res  = await fetch('/api/products', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'approve-product', id: parseInt(id), approvalStatus: status, approveById: userData?.uid }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`Product ${status.toLowerCase()}`)
        set('approvalStatus', status)
      } else toast.error(data.error || 'Failed')
    } catch { toast.error('Something went wrong') }
    finally { setApproving(false) }
  }

  const removeImage = (idx) => {
    setForm(p => ({ ...p, proImages: p.proImages.filter((_, i) => i !== idx) }))
    if (activeImg >= idx && activeImg > 0) setActiveImg(a => a - 1)
  }

  if (loading || fetching) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 }}>
        <CircularProgress size={32} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading product…</Typography>
      </Box>
    )
  }

  const isAdmin = userData?.role === 'ADMIN' || userData?.role === 'SUPER_ADMIN'

  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>

        {/* ── Header ── */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button component={Link} href="/admin/dashboard/products"
              startIcon={<ArrowBackIcon />} variant="outlined" size="small"
              sx={{ borderRadius: 0, borderColor: 'divider', color: 'text.secondary' }}>
              Back
            </Button>
            <Box>
              <Typography variant="h5" fontWeight={700}>Edit Product</Typography>
              <Typography variant="body2" color="text.secondary">SKU: {form.sku}</Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
            <ApprovalChip status={form.approvalStatus} />
            {isAdmin && form.approvalStatus !== 'Approved' && (
              <Button size="small" variant="contained" disabled={approving}
                startIcon={<CheckCircleOutlinedIcon />}
                onClick={() => handleApproval('Approved')}
                sx={{ bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, borderRadius: 0, textTransform: 'none' }}>
                Approve
              </Button>
            )}
            {isAdmin && form.approvalStatus !== 'Rejected' && (
              <Button size="small" variant="outlined" color="error" disabled={approving}
                startIcon={<CancelOutlinedIcon />}
                onClick={() => handleApproval('Rejected')}
                sx={{ borderRadius: 0, textTransform: 'none' }}>
                Reject
              </Button>
            )}
            <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
              onClick={handleSave} disabled={saving}
              sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, textTransform: 'none', fontWeight: 700, px: 3 }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </Box>

        <Grid container spacing={3}>

          {/* ══ LEFT COLUMN ══ */}
          <Grid item xs={12} md={4}>
            <Stack spacing={2.5}>

              {/* Images */}
              <SectionCard icon={<CameraAltOutlinedIcon fontSize="small" />} title="Product Images">
                {form.proImages.length > 0 ? (
                  <>
                    <Box sx={{ aspectRatio: '1', bgcolor: 'grey.100', overflow: 'hidden', mb: 1.5, position: 'relative' }}>
                      <img src={form.proImages[activeImg]} alt="product"
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {form.proImages.map((img, i) => (
                        <Box key={i} sx={{ position: 'relative', width: 52, height: 52 }}>
                          <Box onClick={() => setActiveImg(i)} sx={{
                            width: '100%', height: '100%', cursor: 'pointer', overflow: 'hidden',
                            border: '2px solid', borderColor: activeImg === i ? BRAND : 'transparent',
                          }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </Box>
                          <IconButton size="small" onClick={() => removeImage(i)} sx={{
                            position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: '#fff',
                            width: 18, height: 18, '&:hover': { bgcolor: 'error.dark' },
                          }}>
                            <CloseOutlinedIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  </>
                ) : (
                  <Box sx={{ aspectRatio: '1', bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1 }}>
                    <Inventory2OutlinedIcon sx={{ fontSize: 56, color: 'text.disabled' }} />
                    <Typography variant="caption" color="text.secondary">No images</Typography>
                  </Box>
                )}
              </SectionCard>

              {/* Status */}
              <SectionCard icon={<InfoOutlinedIcon fontSize="small" />} title="Status">
                <FormControlLabel
                  control={<Switch checked={form.status} onChange={e => set('status', e.target.checked)} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND } }} />}
                  label={<Typography variant="body2">{form.status ? 'Active' : 'Inactive'}</Typography>}
                />
              </SectionCard>

              {/* Vendor info (read-only) */}
              {form.vendor && (
                <SectionCard icon={<StorefrontOutlinedIcon fontSize="small" />} title="Vendor">
                  <Stack spacing={0.5}>
                    <Typography variant="body2" fontWeight={600}>{form.vendor.username}</Typography>
                    <Typography variant="caption" color="text.secondary">{form.vendor.email}</Typography>
                    {form.creator && <Typography variant="caption" color="text.disabled">Created by: {form.creator.username}</Typography>}
                    {form.approver && <Typography variant="caption" color="text.disabled">Approved by: {form.approver.username}</Typography>}
                  </Stack>
                </SectionCard>
              )}

            </Stack>
          </Grid>

          {/* ══ RIGHT COLUMN ══ */}
          <Grid item xs={12} md={8}>
            <Stack spacing={2.5}>

              {/* Basic Info */}
              <SectionCard icon={<Inventory2OutlinedIcon fontSize="small" />} title="Basic Information">
                <Stack spacing={2}>
                  <TextField {...tf} fullWidth required label="Product Name"
                    value={form.proName} onChange={e => set('proName', e.target.value)} />
                  <TextField {...tf} fullWidth multiline rows={3} label="Description"
                    value={form.description} onChange={e => set('description', e.target.value)} />
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField {...tf} fullWidth required label="SKU"
                        value={form.sku} onChange={e => set('sku', e.target.value)} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField {...tf} fullWidth label="Barcode"
                        value={form.barcode} onChange={e => set('barcode', e.target.value)} />
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
                  </Grid>
                  <Grid container spacing={2}>
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

              {/* Category */}
              <SectionCard icon={<CategoryOutlinedIcon fontSize="small" />} title="Category">
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl {...tf} fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select label="Category" value={form.catId}
                        onChange={e => { set('catId', e.target.value); set('subCatId', '') }}>
                        {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <FormControl {...tf} fullWidth required disabled={!form.catId}>
                      <InputLabel>Sub-category</InputLabel>
                      <Select label="Sub-category" value={form.subCatId} onChange={e => set('subCatId', e.target.value)}>
                        {filteredSubs.map(s => <MenuItem key={s.subCatId} value={s.subCatId}>{s.subCatName}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </SectionCard>

              {/* Pricing */}
              <SectionCard icon={<AttachMoneyOutlinedIcon fontSize="small" />} title="Pricing & Stock">
                <Grid container spacing={2}>
                  {[
                    { label: 'Price',      field: 'price',    type: 'number', required: true },
                    { label: 'Cost',       field: 'cost',     type: 'number' },
                    { label: 'Discount %', field: 'discount', type: 'number' },
                    { label: 'Sale Price', field: 'salePrice',type: 'number' },
                    { label: 'Stock',      field: 'stock',    type: 'number' },
                    { label: 'Quantity',   field: 'qnty',     type: 'number' },
                  ].map(({ label, field, type, required }) => (
                    <Grid item xs={6} sm={4} key={field}>
                      <TextField {...tf} fullWidth required={required} label={label} type={type}
                        value={form[field]} onChange={e => set(field, e.target.value)} />
                    </Grid>
                  ))}
                  <Grid item xs={6} sm={4}>
                    <FormControl {...tf} fullWidth>
                      <InputLabel>Currency</InputLabel>
                      <Select label="Currency" value={form.currency} onChange={e => set('currency', e.target.value)}>
                        {['USD', 'PKR', 'EUR', 'GBP', 'AED'].map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField {...tf} fullWidth label="Sale Start" type="date"
                      value={form.saleStartDate} onChange={e => set('saleStartDate', e.target.value)}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                  <Grid item xs={6} sm={4}>
                    <TextField {...tf} fullWidth label="Sale End" type="date"
                      value={form.saleEndDate} onChange={e => set('saleEndDate', e.target.value)}
                      InputLabelProps={{ shrink: true }} />
                  </Grid>
                </Grid>
              </SectionCard>

              {/* Physical Details */}
              <SectionCard icon={<InfoOutlinedIcon fontSize="small" />} title="Physical Details">
                <Grid container spacing={2}>
                  {[
                    { label: 'Size Name',   field: 'sizeName' },
                    { label: 'Size',        field: 'size' },
                    { label: 'Color',       field: 'color' },
                    { label: 'Condition',   field: 'conditionType' },
                    { label: 'Dimensions',  field: 'productDimensions' },
                    { label: 'Weight',      field: 'packageWeight' },
                    { label: 'Warranty',    field: 'warranty' },
                  ].map(({ label, field }) => (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField {...tf} fullWidth label={label}
                        value={form[field]} onChange={e => set(field, e.target.value)} />
                    </Grid>
                  ))}
                </Grid>
              </SectionCard>

              {/* Ingredients */}
              <SectionCard icon={<InfoOutlinedIcon fontSize="small" />} title="Ingredients / Notes">
                <TextField {...tf} fullWidth multiline rows={3} label="Ingredients"
                  value={form.ingredients} onChange={e => set('ingredients', e.target.value)} />
              </SectionCard>

              {/* Save button (bottom) */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button variant="contained" startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <SaveOutlinedIcon />}
                  onClick={handleSave} disabled={saving}
                  sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, textTransform: 'none', fontWeight: 700, px: 4, py: 1.2 }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </Button>
              </Box>

            </Stack>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  )
}
