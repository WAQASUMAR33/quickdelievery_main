'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

import Alert             from '@mui/material/Alert'
import Autocomplete     from '@mui/material/Autocomplete'
import Box               from '@mui/material/Box'
import Button            from '@mui/material/Button'
import Chip              from '@mui/material/Chip'
import CircularProgress  from '@mui/material/CircularProgress'
import Dialog            from '@mui/material/Dialog'
import DialogActions     from '@mui/material/DialogActions'
import DialogContent     from '@mui/material/DialogContent'
import DialogTitle       from '@mui/material/DialogTitle'
import Divider           from '@mui/material/Divider'
import FormLabel         from '@mui/material/FormLabel'
import Radio             from '@mui/material/Radio'
import RadioGroup        from '@mui/material/RadioGroup'
import Stack             from '@mui/material/Stack'
import FormControl       from '@mui/material/FormControl'
import FormControlLabel  from '@mui/material/FormControlLabel'
import IconButton        from '@mui/material/IconButton'
import InputLabel        from '@mui/material/InputLabel'
import MenuItem          from '@mui/material/MenuItem'
import Paper             from '@mui/material/Paper'
import Select            from '@mui/material/Select'
import Switch            from '@mui/material/Switch'
import Table             from '@mui/material/Table'
import TableBody         from '@mui/material/TableBody'
import TableCell         from '@mui/material/TableCell'
import TableContainer    from '@mui/material/TableContainer'
import TableHead         from '@mui/material/TableHead'
import TableRow          from '@mui/material/TableRow'
import TextField         from '@mui/material/TextField'
import Tooltip           from '@mui/material/Tooltip'
import Typography        from '@mui/material/Typography'

import AddIcon            from '@mui/icons-material/Add'
import CloseIcon          from '@mui/icons-material/Close'
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon   from '@mui/icons-material/EditOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import SaveOutlinedIcon   from '@mui/icons-material/SaveOutlined'
import ImageUploadField from '@/components/ui/ImageUploadField'

const BRAND = '#39772A'

function authHeadersJson() {
  if (typeof window === 'undefined') return {}
  const t = localStorage.getItem('authToken')
  if (!t || t === 'GUEST_SESSION') return {}
  return { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' }
}

function toLocalInputValue(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function FoodDealsManagement({ mode = 'admin' }) {
  const { userData } = useAuth()
  const [deals, setDeals] = useState([])
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [schemaWarning, setSchemaWarning] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    dealKind: 'catalog',
    productId: '',
    sortOrder: 0,
    active: true,
    badgeLabel: '',
    startAt: '',
    endAt: '',
    customTitle: '',
    customLines: [{ name: '' }],
    customImageUrl: '',
    customPriceLabel: '',
    vendorUid: '',
  })

  const loadDeals = useCallback(async () => {
    const res = await fetch('/api/deals?scope=manage', {
      headers: { ...authHeadersJson(), 'Content-Type': 'application/json' },
    })
    let data = {}
    try {
      data = await res.json()
    } catch {
      data = {}
    }
    if (!res.ok) {
      if (data.code === 'MISSING_DEALS_TABLE') {
        setSchemaWarning(data.error || 'Run database migrations to enable food deals.')
        setDeals([])
        return
      }
      setSchemaWarning(null)
      toast.error(data.error || 'Failed to load deals')
      setDeals([])
      return
    }
    setSchemaWarning(null)
    setDeals(data.data || [])
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const headers = { ...authHeadersJson() }
      const url = mode === 'vendor' && userData?.uid
        ? `/api/products?type=products&vendorId=${encodeURIComponent(userData.uid)}`
        : '/api/products?type=products'
      const res = await fetch(url, { headers })
      const data = await res.json().catch(() => ({}))
      if (!data.success || !data.data) {
        setProducts([])
        return
      }
      let list = data.data
      if (mode === 'vendor' && userData?.uid) {
        const uid = userData.uid
        list = list.filter((p) => String(p.vendorId ?? p.vendor_id ?? '') === String(uid))
      }
      const eligible = list.filter((p) => p?.proName && p?.price != null)
      setProducts(eligible)
    } catch {
      setProducts([])
    }
  }, [mode, userData?.uid])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      setLoading(true)
      try {
        await Promise.all([loadDeals(), loadProducts()])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [loadDeals, loadProducts])

  const openCreate = () => {
    setEditingId(null)
    setForm({
      dealKind: 'catalog',
      productId: '',
      sortOrder: 0,
      active: true,
      badgeLabel: '',
      startAt: '',
      endAt: '',
      customTitle: '',
      customLines: [{ name: '' }],
      customImageUrl: '',
      customPriceLabel: '',
      vendorUid: '',
    })
    setDialogOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.dealId)
    const custom = row.isCustom
    setForm({
      dealKind: custom ? 'custom' : 'catalog',
      productId: row.productId != null ? String(row.productId) : '',
      sortOrder: row.sortOrder ?? 0,
      active: !!row.active,
      badgeLabel: row.badgeLabel || '',
      startAt: toLocalInputValue(row.startAt),
      endAt: toLocalInputValue(row.endAt),
      customTitle: row.customTitle || '',
      customLines:
        custom && row.customItems?.length
          ? row.customItems.map((x) => ({ name: x.name || '' }))
          : [{ name: '' }],
      customImageUrl: row.customImageUrl || '',
      customPriceLabel: row.customPriceLabel || '',
      vendorUid: row.vendorUid || '',
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    const creatingCatalog = !editingId && form.dealKind === 'catalog'
    if (creatingCatalog && !form.productId) {
      toast.error('Select a product')
      return
    }
    const savingCustom = form.dealKind === 'custom'
    if (savingCustom) {
      if (!form.customTitle.trim()) {
        toast.error('Enter an offer title')
        return
      }
      const lines = form.customLines
        .map((l) => ({ name: String(l.name || '').trim() }))
        .filter((l) => l.name.length > 0)
      if (lines.length < 1) {
        toast.error('Add at least one food line')
        return
      }
    }

    setSaving(true)
    try {
      const payload = {
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
        badgeLabel: form.badgeLabel.trim() || null,
        startAt: form.startAt ? new Date(form.startAt).toISOString() : null,
        endAt: form.endAt ? new Date(form.endAt).toISOString() : null,
      }

      if (!editingId) {
        const body =
          form.dealKind === 'custom'
            ? {
                ...payload,
                dealKind: 'custom',
                customTitle: form.customTitle.trim(),
                customItems: form.customLines
                  .map((l) => ({ name: String(l.name || '').trim() }))
                  .filter((l) => l.name.length > 0),
                customImageUrl: form.customImageUrl.trim() || null,
                customPriceLabel: form.customPriceLabel.trim() || null,
                ...(mode === 'admin' ? { vendorUid: form.vendorUid.trim() || null } : {}),
              }
            : { ...payload, dealKind: 'catalog', productId: Number(form.productId) }

        const res = await fetch('/api/deals', {
          method: 'POST',
          headers: authHeadersJson(),
          body: JSON.stringify(body),
        })
        let data = {}
        try {
          data = await res.json()
        } catch {
          data = {}
        }
        if (!res.ok) {
          toast.error(data.error || 'Create failed')
          return
        }
        toast.success('Deal created')
      } else {
        const putBody = { ...payload }
        if (form.dealKind === 'custom') {
          putBody.customTitle = form.customTitle.trim()
          putBody.customItems = form.customLines
            .map((l) => ({ name: String(l.name || '').trim() }))
            .filter((l) => l.name.length > 0)
          putBody.customImageUrl = form.customImageUrl.trim() || null
          putBody.customPriceLabel = form.customPriceLabel.trim() || null
          if (mode === 'admin') putBody.vendorUid = form.vendorUid.trim() || null
        }

        const res = await fetch(`/api/deals/${editingId}`, {
          method: 'PUT',
          headers: authHeadersJson(),
          body: JSON.stringify(putBody),
        })
        let data = {}
        try {
          data = await res.json()
        } catch {
          data = {}
        }
        if (!res.ok) {
          toast.error(data.error || 'Update failed')
          return
        }
        toast.success('Deal updated')
      }
      setDialogOpen(false)
      await loadDeals()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (dealId) => {
    const res = await fetch(`/api/deals/${dealId}`, {
      method: 'DELETE',
      headers: authHeadersJson(),
    })
    let data = {}
    try {
      data = await res.json()
    } catch {
      data = {}
    }
    if (!res.ok) {
      toast.error(data.error || 'Delete failed')
      return
    }
    toast.success('Deal removed')
    loadDeals()
  }

  const usedProductIds = new Set(
    deals.filter((d) => d.productId != null).map((d) => d.productId),
  )

  const vendorOptions = useMemo(() => {
    const m = new Map()
    for (const p of products) {
      const vid = p.vendorId ?? p.vendor?.uid
      if (!vid) continue
      const label = p.vendor?.username || p.vendor?.email || String(vid)
      if (!m.has(String(vid))) m.set(String(vid), label)
    }
    return [...m.entries()].map(([uid, label]) => ({ uid, label }))
  }, [products])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 240, gap: 2 }}>
        <CircularProgress size={32} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading food deals…</Typography>
      </Box>
    )
  }

  const headCells =
    mode === 'admin'
      ? ['Order', 'Deal', 'Vendor', 'Badge', 'Schedule', 'Active', '']
      : ['Order', 'Deal', 'Badge', 'Schedule', 'Active', '']

  const colSpan = mode === 'admin' ? 7 : 6

  return (
    <Box>
      {schemaWarning && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 0 }} onClose={() => setSchemaWarning(null)}>
          {schemaWarning}
        </Alert>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <LocalOfferOutlinedIcon sx={{ color: BRAND, fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={800}>
              Food deals management
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {mode === 'admin'
                ? 'Pick an approved catalogue product or a custom offer with your own lines (shown in Today’s Deals).'
                : 'Feature an approved product or advertise a typed bundle — no SKU required.'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={Boolean(schemaWarning)}
          sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, fontWeight: 700 }}
        >
          Add deal
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 0 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'grey.50' }}>
              {headCells.map((h) => (
                <TableCell
                  key={h || 'actions'}
                  align={h === '' ? 'right' : 'left'}
                  sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', color: 'text.secondary' }}
                >
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {deals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} sx={{ textAlign: 'center', py: 8 }}>
                  <Typography color="text.secondary">
                    No deals yet. Add one to populate Today&apos;s Deals on the home catalogue.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              deals.map((row) => (
                <TableRow key={row.dealId} hover>
                  <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.sortOrder}</TableCell>
                  <TableCell>
                    {row.isCustom ? (
                      <>
                        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                          <Typography variant="body2" fontWeight={600}>
                            {row.customTitle || '—'}
                          </Typography>
                          <Chip label="Custom" size="small" sx={{ borderRadius: 0, height: 20, fontSize: 10, fontWeight: 700 }} />
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                          {(row.customItems || []).map((x) => x.name).join(' · ')}
                        </Typography>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" fontWeight={600}>
                          {row.product?.proName || '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          SKU {row.product?.sku}
                        </Typography>
                      </>
                    )}
                  </TableCell>
                  {mode === 'admin' && (
                    <TableCell>
                      <Typography variant="body2">
                        {row.isCustom
                          ? row.ownerUsername || row.vendorUid || 'Platform'
                          : row.product?.vendor?.username || row.product?.vendorId || '—'}
                      </Typography>
                    </TableCell>
                  )}
                  <TableCell>
                    {(typeof row.badgeLabel === 'string' && row.badgeLabel.trim()) ||
                      (row.customPriceLabel && String(row.customPriceLabel).trim()) ||
                      (row.isCustom ? '—' : `${parseFloat(row.product?.discount || 0)}%`)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" display="block" color="text.secondary">
                      {row.startAt ? new Date(row.startAt).toLocaleString() : '—'}
                    </Typography>
                    <Typography variant="caption" display="block" color="text.secondary">
                      → {row.endAt ? new Date(row.endAt).toLocaleString() : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={row.active ? 'Yes' : 'No'}
                      size="small"
                      sx={{
                        borderRadius: 0,
                        fontWeight: 700,
                        bgcolor: row.active ? 'success.lighter' : 'grey.200',
                      }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: 'info.main' }}>
                        <EditOutlinedIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => handleDelete(row.dealId)} sx={{ color: 'error.main' }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={800}>
            {editingId ? 'Edit deal' : 'Add deal'}
          </Typography>
          <IconButton size="small" onClick={() => setDialogOpen(false)} disabled={saving}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {!editingId && (
              <FormControl component="fieldset" variant="standard">
                <FormLabel component="legend" sx={{ fontWeight: 700, fontSize: 13 }}>
                  Deal type
                </FormLabel>
                <RadioGroup
                  row
                  value={form.dealKind}
                  onChange={(e) => setForm({ ...form, dealKind: e.target.value })}
                >
                  <FormControlLabel value="catalog" control={<Radio size="small" />} label="Catalog product" />
                  <FormControlLabel value="custom" control={<Radio size="small" />} label="Custom offer (typed lines)" />
                </RadioGroup>
              </FormControl>
            )}
            {editingId && (
              <Chip
                label={form.dealKind === 'custom' ? 'Custom offer' : 'Catalog product'}
                size="small"
                sx={{ borderRadius: 0, fontWeight: 700, alignSelf: 'flex-start' }}
              />
            )}
            {!editingId && form.dealKind === 'catalog' && (
              <Autocomplete
                size="small"
                fullWidth
                options={products.filter((p) => !usedProductIds.has(p.proId))}
                getOptionLabel={(option) =>
                  typeof option === 'string'
                    ? option
                    : `${option.proName} (SKU: ${option.sku || 'N/A'}) — Rs. ${parseFloat(option.price || 0).toLocaleString()}`
                }
                value={
                  products.find((p) => String(p.proId) === String(form.productId)) || null
                }
                onChange={(_, newValue) => {
                  setForm((prev) => ({ ...prev, productId: newValue ? String(newValue.proId) : '' }))
                }}
                isOptionEqualToValue={(option, value) => String(option.proId) === String(value.proId)}
                filterOptions={(options, { inputValue }) => {
                  const q = inputValue.toLowerCase().trim()
                  return options.filter((p) =>
                    p.proName?.toLowerCase().includes(q) ||
                    p.sku?.toLowerCase().includes(q) ||
                    p.category?.name?.toLowerCase().includes(q) ||
                    p.productCategory?.productCategoryName?.toLowerCase().includes(q)
                  )
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search & Select Product *"
                    placeholder="Type product name, SKU, or category to filter…"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.proId} sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
                      <Typography variant="body2" fontWeight={700}>
                        {option.proName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        SKU: {option.sku || 'N/A'} · Category: {option.productCategory?.productCategoryName || option.category?.name || 'General'} · <Box component="span" sx={{ color: BRAND, fontWeight: 700 }}>Rs. {parseFloat(option.price || 0).toLocaleString()}</Box>
                      </Typography>
                    </Box>
                  </Box>
                )}
                PaperComponent={({ children, ...paperProps }) => (
                  <Paper {...paperProps} sx={{ borderRadius: 0, mt: 0.5 }}>
                    {children}
                  </Paper>
                )}
                noOptionsText="No products found"
              />
            )}
            {form.dealKind === 'custom' && (
              <>
                <TextField
                  size="small"
                  label="Offer title"
                  placeholder="e.g. Family lunch combo"
                  value={form.customTitle}
                  onChange={(e) => setForm({ ...form, customTitle: e.target.value })}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <FormLabel sx={{ fontWeight: 700, fontSize: 13 }}>What&apos;s included (one line each)</FormLabel>
                <Stack spacing={1}>
                  {form.customLines.map((line, idx) => (
                    <Stack key={`line-${idx}`} direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        fullWidth
                        placeholder={`Item ${idx + 1}`}
                        value={line.name}
                        onChange={(e) => {
                          const next = [...form.customLines]
                          next[idx] = { name: e.target.value }
                          setForm({ ...form, customLines: next })
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                      <IconButton
                        size="small"
                        disabled={form.customLines.length <= 1}
                        onClick={() => {
                          const next = form.customLines.filter((_, i) => i !== idx)
                          setForm({ ...form, customLines: next.length ? next : [{ name: '' }] })
                        }}
                        aria-label="Remove line"
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ))}
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setForm({ ...form, customLines: [...form.customLines, { name: '' }] })}
                    sx={{ borderRadius: 0, alignSelf: 'flex-start' }}
                  >
                    Add line
                  </Button>
                </Stack>
                <ImageUploadField
                  label="Deal image (optional)"
                  value={form.customImageUrl}
                  onChange={(url) => setForm({ ...form, customImageUrl: url })}
                  disabled={saving}
                  helperText="Upload JPEG, PNG or WebP — same pipeline as catalogue product images."
                />
                <TextField
                  size="small"
                  label="Or paste image URL"
                  placeholder="https://…"
                  value={form.customImageUrl}
                  onChange={(e) => setForm({ ...form, customImageUrl: e.target.value })}
                  fullWidth
                  helperText="Use this if the image is already hosted elsewhere."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <TextField
                  size="small"
                  label="Price hint (optional)"
                  placeholder="e.g. $12.99, from $8"
                  value={form.customPriceLabel}
                  onChange={(e) => setForm({ ...form, customPriceLabel: e.target.value })}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                {mode === 'admin' && (
                  <FormControl fullWidth size="small">
                    <InputLabel>Vendor (optional)</InputLabel>
                    <Select
                      label="Vendor (optional)"
                      value={form.vendorUid}
                      onChange={(e) => setForm({ ...form, vendorUid: e.target.value })}
                      sx={{ borderRadius: 0 }}
                    >
                      <MenuItem value="">
                        <em>Platform / unassigned</em>
                      </MenuItem>
                      {vendorOptions.map((v) => (
                        <MenuItem key={v.uid} value={v.uid}>
                          {v.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </>
            )}
            {editingId && form.dealKind === 'catalog' && (
              <Typography variant="body2" color="text.secondary">
                Switching product is not supported. Delete this deal and create a new one if you need a different SKU.
              </Typography>
            )}
            <TextField
              size="small"
              label="Sort order"
              type="number"
              value={form.sortOrder}
              onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
              helperText="Lower numbers appear first in Today’s Deals"
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            <TextField
              size="small"
              label="Badge label"
              placeholder="e.g. 10% OFF, Lunch special"
              value={form.badgeLabel}
              onChange={(e) => setForm({ ...form, badgeLabel: e.target.value })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            <TextField
              size="small"
              label="Start"
              type="datetime-local"
              value={form.startAt}
              onChange={(e) => setForm({ ...form, startAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            <TextField
              size="small"
              label="End"
              type="datetime-local"
              value={form.endAt}
              onChange={(e) => setForm({ ...form, endAt: e.target.value })}
              InputLabelProps={{ shrink: true }}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: BRAND },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: BRAND },
                  }}
                />
              }
              label="Active on storefront"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={saving} sx={{ borderRadius: 0 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0 }}
          >
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
