'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import { authFetch } from '@/lib/apiClient'

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
import RemoveIcon         from '@mui/icons-material/Remove'
import CloseIcon          from '@mui/icons-material/Close'
import DeleteOutlineIcon  from '@mui/icons-material/DeleteOutline'
import EditOutlinedIcon   from '@mui/icons-material/EditOutlined'
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined'
import SaveOutlinedIcon   from '@mui/icons-material/SaveOutlined'
import ImageUploadField   from '@/components/ui/ImageUploadField'

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

  // Search input state for the product picker autocomplete
  const [productSearchValue, setProductSearchValue] = useState(null)

  const [form, setForm] = useState({
    dealKind: 'catalog', // 'catalog' (products bundle) or 'custom' (typed lines)
    selectedProducts: [], // array of { proId, proName, sku, price, image, quantity }
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
    try {
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
    } catch (err) {
      console.error('Error loading deals:', err)
      setDeals([])
    }
  }, [])

  const loadProducts = useCallback(async () => {
    try {
      const headers = { ...authHeadersJson() }
      const res = await fetch('/api/products?type=products', { headers })
      const data = await res.json().catch(() => ({}))
      if (!data.success || !Array.isArray(data.data)) {
        setProducts([])
        return
      }
      let list = data.data
      if (mode === 'vendor' && userData?.uid) {
        const vendorList = list.filter((p) => String(p.vendorId || p.creatorId || '') === String(userData.uid))
        if (vendorList.length > 0) {
          list = vendorList
        }
      }
      const eligible = list.filter((p) => p && (p.proName || p.name))
      setProducts(eligible)
    } catch (err) {
      console.error('Error loading products for deals:', err)
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

  // Reload products whenever auth status changes or dialog opens
  useEffect(() => {
    if (userData?.uid) {
      loadProducts()
    }
  }, [userData?.uid, loadProducts])

  const openCreate = () => {
    setEditingId(null)
    setProductSearchValue(null)
    setForm({
      dealKind: 'catalog',
      selectedProducts: [],
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
    loadProducts()
    setDialogOpen(true)
  }

  const openEdit = (row) => {
    setEditingId(row.dealId)
    setProductSearchValue(null)
    const custom = row.isCustom

    // Rebuild selectedProducts for catalog / multi-product deals
    let selProducts = []
    if (row.customItems && row.customItems.length > 0) {
      selProducts = row.customItems.map((item) => ({
        proId: item.proId || null,
        proName: item.name || '',
        sku: item.sku || '',
        price: item.price != null ? Number(item.price) : 0,
        image: item.image || '',
        quantity: item.quantity ? Number(item.quantity) : 1,
      }))
    } else if (row.productId != null && row.product) {
      selProducts = [{
        proId: row.productId,
        proName: row.product.proName || 'Product',
        sku: row.product.sku || '',
        price: parseFloat(row.product.price || 0),
        image: Array.isArray(row.product.proImages) ? row.product.proImages[0] : (row.product.proImages || ''),
        quantity: 1,
      }]
    }

    setForm({
      dealKind: custom && (!selProducts.length || selProducts.every(p => !p.proId)) ? 'custom' : 'catalog',
      selectedProducts: selProducts,
      sortOrder: row.sortOrder ?? 0,
      active: !!row.active,
      badgeLabel: row.badgeLabel || '',
      startAt: toLocalInputValue(row.startAt),
      endAt: toLocalInputValue(row.endAt),
      customTitle: row.customTitle || (row.product?.proName || ''),
      customLines:
        custom && row.customItems?.length
          ? row.customItems.map((x) => ({ name: x.name || '' }))
          : [{ name: '' }],
      customImageUrl: row.customImageUrl || (row.product?.proImages?.[0] || ''),
      customPriceLabel: row.customPriceLabel || '',
      vendorUid: row.vendorUid || '',
    })
    loadProducts()
    setDialogOpen(true)
  }

  // Handle adding a product to the multi-product deal
  const handleAddProductToDeal = (product) => {
    if (!product) return
    const existingIndex = form.selectedProducts.findIndex((p) => String(p.proId) === String(product.proId))
    let nextList
    if (existingIndex >= 0) {
      nextList = [...form.selectedProducts]
      nextList[existingIndex].quantity = (nextList[existingIndex].quantity || 1) + 1
    } else {
      const img = Array.isArray(product.proImages) ? product.proImages[0] : (product.proImages || '')
      nextList = [
        ...form.selectedProducts,
        {
          proId: product.proId,
          proName: product.proName,
          sku: product.sku || '',
          price: parseFloat(product.price || 0),
          image: img,
          quantity: 1,
        },
      ]
    }

    // Auto-fill title and image if empty
    const autoTitle = form.customTitle.trim()
      ? form.customTitle
      : nextList.map((p) => `${p.quantity > 1 ? `${p.quantity}x ` : ''}${p.proName}`).join(' + ')

    const autoImg = form.customImageUrl.trim()
      ? form.customImageUrl
      : (nextList[0]?.image || '')

    setForm((prev) => ({
      ...prev,
      selectedProducts: nextList,
      customTitle: autoTitle,
      customImageUrl: autoImg,
    }))
    setProductSearchValue(null)
  }

  const handleUpdateProductQuantity = (proId, newQty) => {
    const qty = Math.max(1, parseInt(newQty, 10) || 1)
    const nextList = form.selectedProducts.map((p) =>
      String(p.proId) === String(proId) ? { ...p, quantity: qty } : p
    )
    setForm((prev) => ({ ...prev, selectedProducts: nextList }))
  }

  const handleRemoveProductFromDeal = (proId) => {
    const nextList = form.selectedProducts.filter((p) => String(p.proId) !== String(proId))
    setForm((prev) => ({ ...prev, selectedProducts: nextList }))
  }

  // Calculate sum of regular prices of all selected products
  const selectedProductsSum = useMemo(() => {
    return form.selectedProducts.reduce((acc, p) => acc + (parseFloat(p.price || 0) * (p.quantity || 1)), 0)
  }, [form.selectedProducts])

  const handleSave = async () => {
    if (form.dealKind === 'catalog') {
      if (form.selectedProducts.length === 0) {
        toast.error('Add at least one product to the deal')
        return
      }
    } else if (form.dealKind === 'custom') {
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
        customImageUrl: form.customImageUrl.trim() || null,
      }

      if (!editingId) {
        let body
        if (form.dealKind === 'custom') {
          body = {
            ...payload,
            dealKind: 'custom',
            customTitle: form.customTitle.trim(),
            customItems: form.customLines
              .map((l) => ({ name: String(l.name || '').trim() }))
              .filter((l) => l.name.length > 0),
            customPriceLabel: form.customPriceLabel.trim() || null,
            ...(mode === 'admin' ? { vendorUid: form.vendorUid.trim() || null } : {}),
          }
        } else {
          // Multi-product or single catalog deal
          const title = form.customTitle.trim() || form.selectedProducts.map((p) => `${p.quantity > 1 ? `${p.quantity}x ` : ''}${p.proName}`).join(' + ')
          const dealItems = form.selectedProducts.map((p) => ({
            proId: p.proId,
            name: p.proName,
            price: p.price,
            quantity: p.quantity || 1,
            image: p.image || null,
            sku: p.sku || null,
          }))

          if (form.selectedProducts.length === 1) {
            // Single product deal
            body = {
              ...payload,
              dealKind: 'catalog',
              productId: Number(form.selectedProducts[0].proId),
              customTitle: title,
              customItems: dealItems,
              customPriceLabel: form.customPriceLabel.trim() || null,
            }
          } else {
            // Multi-product combo deal
            body = {
              ...payload,
              dealKind: 'custom',
              customTitle: title,
              customItems: dealItems,
              customPriceLabel: form.customPriceLabel.trim() || null,
              ...(mode === 'admin' ? { vendorUid: form.vendorUid.trim() || null } : {}),
            }
          }
        }

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
        toast.success('Deal created successfully')
      } else {
        const putBody = {
          ...payload,
          customImageUrl: form.customImageUrl.trim() || null,
        }

        if (form.dealKind === 'catalog') {
          const title = form.customTitle.trim() || form.selectedProducts.map((p) => `${p.quantity > 1 ? `${p.quantity}x ` : ''}${p.proName}`).join(' + ')
          const dealItems = form.selectedProducts.map((p) => ({
            proId: p.proId,
            name: p.proName,
            price: p.price,
            quantity: p.quantity || 1,
            image: p.image || null,
            sku: p.sku || null,
          }))
          putBody.customTitle = title
          putBody.customItems = dealItems
          putBody.customPriceLabel = form.customPriceLabel.trim() || null
        } else {
          putBody.customTitle = form.customTitle.trim()
          putBody.customItems = form.customLines
            .map((l) => ({ name: String(l.name || '').trim() }))
            .filter((l) => l.name.length > 0)
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
        toast.success('Deal updated successfully')
      }
      setDialogOpen(false)
      await loadDeals()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (dealId) => {
    if (!confirm('Are you sure you want to delete this deal?')) return
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
    toast.success('Deal deleted')
    await loadDeals()
  }

  const vendorOptions = useMemo(() => {
    const map = new Map()
    deals.forEach((d) => {
      if (d.vendorUid && d.ownerUsername) map.set(d.vendorUid, d.ownerUsername)
      if (d.product?.vendorId && d.product?.vendor?.username) {
        map.set(d.product.vendorId, d.product.vendor.username)
      }
    })
    return Array.from(map.entries()).map(([uid, label]) => ({ uid, label }))
  }, [deals])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 280, gap: 2 }}>
        <CircularProgress size={28} sx={{ color: BRAND }} />
        <Typography color="text.secondary">Loading food deals…</Typography>
      </Box>
    )
  }

  const headCells =
    mode === 'admin'
      ? ['Order', 'Deal Name', 'Vendor', 'Price / Badge', 'Schedule', 'Active', '']
      : ['Order', 'Deal Name', 'Price / Badge', 'Schedule', 'Active', '']

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
                ? 'Create multi-product bundles, catalog deals, and custom promotional offers.'
                : 'Feature single or multi-product combos and special meal deals.'}
            </Typography>
          </Box>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          disabled={Boolean(schemaWarning)}
          sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#2e5f22' }, borderRadius: 0, fontWeight: 700 }}
        >
          Add deal
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 0 }}>
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
              deals.map((row) => {
                const dealThumbnail =
                  row.customImageUrl ||
                  (row.customItems?.[0]?.image) ||
                  (row.product?.proImages?.[0]) ||
                  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=80'

                const dealDisplayName =
                  row.customTitle ||
                  row.badgeLabel ||
                  (row.customItems?.length ? row.customItems.map((x) => x.name).join(' + ') : '') ||
                  row.product?.proName ||
                  'Special Deal'

                return (
                  <TableRow key={row.dealId} hover>
                    <TableCell sx={{ fontVariantNumeric: 'tabular-nums' }}>{row.sortOrder}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          component="img"
                          src={dealThumbnail}
                          alt="Deal"
                          sx={{
                            width: 48,
                            height: 48,
                            objectFit: 'cover',
                            border: '1px solid #e2e8f0',
                            bgcolor: '#f8fafc',
                            flexShrink: 0,
                          }}
                          onError={(e) => {
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=120&q=80'
                          }}
                        />
                        <Box sx={{ minWidth: 0 }}>
                          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
                            <Typography variant="body2" fontWeight={700}>
                              {dealDisplayName}
                            </Typography>
                            {row.customItems?.length > 1 && (
                              <Chip
                                label={`${row.customItems.length} Items Combo`}
                                size="small"
                                sx={{ borderRadius: 0, height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#e0e7ff', color: '#4338ca' }}
                              />
                            )}
                          </Stack>
                          {row.customItems && row.customItems.length > 0 ? (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                              Includes: {row.customItems.map((x) => `${x.quantity > 1 ? `${x.quantity}x ` : ''}${x.name}`).join(' + ')}
                            </Typography>
                          ) : row.product ? (
                            <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                              Product: {row.product.proName} (SKU: {row.product.sku || 'N/A'})
                            </Typography>
                          ) : null}
                        </Box>
                      </Stack>
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
                      <Stack spacing={0.5}>
                        {row.customPriceLabel && (
                          <Typography variant="body2" fontWeight={700} color={BRAND}>
                            {row.customPriceLabel}
                          </Typography>
                        )}
                        {row.badgeLabel && (
                          <Chip
                            label={row.badgeLabel}
                            size="small"
                            sx={{ borderRadius: 0, height: 20, fontSize: 10, fontWeight: 700, bgcolor: '#fef3c7', color: '#b45309', alignSelf: 'flex-start' }}
                          />
                        )}
                        {!row.customPriceLabel && !row.badgeLabel && !row.isCustom && (
                          <Typography variant="caption" color="text.secondary">
                            {parseFloat(row.product?.discount || 0)}% OFF
                          </Typography>
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" display="block" color="text.secondary">
                        {row.startAt ? new Date(row.startAt).toLocaleString() : 'Always'}
                      </Typography>
                      {row.endAt && (
                        <Typography variant="caption" display="block" color="text.secondary">
                          → {new Date(row.endAt).toLocaleString()}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.active ? 'Active' : 'Inactive'}
                        size="small"
                        sx={{
                          borderRadius: 0,
                          fontWeight: 700,
                          bgcolor: row.active ? '#dcfce7' : '#f1f5f9',
                          color: row.active ? '#166534' : '#64748b',
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
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" fontWeight={800}>
            {editingId ? 'Edit Deal' : 'Create Deal'}
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
                  Deal Type
                </FormLabel>
                <RadioGroup
                  row
                  value={form.dealKind}
                  onChange={(e) => setForm({ ...form, dealKind: e.target.value })}
                >
                  <FormControlLabel value="catalog" control={<Radio size="small" />} label="Select Catalog Products (Single / Multi-Product Combo)" />
                  <FormControlLabel value="custom" control={<Radio size="small" />} label="Custom Offer (Typed lines)" />
                </RadioGroup>
              </FormControl>
            )}

            {/* ── CATALOG MULTI-PRODUCT SELECTION ── */}
            {form.dealKind === 'catalog' && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box>
                  <FormLabel sx={{ fontWeight: 700, fontSize: 13, mb: 0.5, display: 'block' }}>
                    Search & Add Products to this Deal
                  </FormLabel>
                  <Autocomplete
                    size="small"
                    fullWidth
                    options={products}
                    value={productSearchValue}
                    getOptionLabel={(option) =>
                      typeof option === 'string'
                        ? option
                        : `${option.proName} (SKU: ${option.sku || 'N/A'}) — Rs. ${parseFloat(option.price || 0).toLocaleString()}`
                    }
                    onChange={(_, newValue) => {
                      if (newValue) {
                        handleAddProductToDeal(newValue)
                      }
                    }}
                    filterOptions={(options, { inputValue }) => {
                      const q = inputValue.toLowerCase().trim()
                      if (!q) return options
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
                        placeholder={products.length === 0 ? "Loading products..." : "Click or type to search and add products to deal…"}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                      />
                    )}
                    renderOption={(props, option) => {
                      const img = Array.isArray(option.proImages) ? option.proImages[0] : (option.proImages || '')
                      return (
                        <Box component="li" {...props} key={option.proId} sx={{ py: 1, borderBottom: '1px solid #f1f5f9' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ width: '100%' }}>
                            {img && (
                              <Box
                                component="img"
                                src={img}
                                alt={option.proName}
                                sx={{ width: 36, height: 36, objectFit: 'cover', border: '1px solid #e2e8f0' }}
                              />
                            )}
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography variant="body2" fontWeight={700}>
                                {option.proName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                SKU: {option.sku || 'N/A'} · Category: {option.productCategory?.productCategoryName || option.category?.name || 'General'} · <Box component="span" sx={{ color: BRAND, fontWeight: 700 }}>Rs. {parseFloat(option.price || 0).toLocaleString()}</Box>
                              </Typography>
                            </Box>
                          </Stack>
                        </Box>
                      )
                    }}
                    PaperComponent={({ children, ...paperProps }) => (
                      <Paper {...paperProps} sx={{ borderRadius: 0, mt: 0.5 }}>
                        {children}
                      </Paper>
                    )}
                    noOptionsText={products.length === 0 ? "No products found in catalog" : "No matching products found"}
                  />
                </Box>

                {/* Selected products table */}
                {form.selectedProducts.length > 0 && (
                  <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>
                    <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                      <Typography variant="subtitle2" fontWeight={800}>
                        Products Included in Deal ({form.selectedProducts.length})
                      </Typography>
                    </Box>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#fafafa' }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12 }}>Product</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: 12, width: 140 }} align="center">Quantity</TableCell>
                          <TableCell sx={{ width: 48 }} align="right"></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {form.selectedProducts.map((p) => (
                          <TableRow key={p.proId || p.proName}>
                            <TableCell>
                              <Stack direction="row" spacing={1.5} alignItems="center">
                                {p.image && (
                                  <Box
                                    component="img"
                                    src={p.image}
                                    alt={p.proName}
                                    sx={{ width: 36, height: 36, objectFit: 'cover', border: '1px solid #e2e8f0', flexShrink: 0 }}
                                  />
                                )}
                                <Box sx={{ minWidth: 0 }}>
                                  <Typography variant="body2" fontWeight={700}>
                                    {p.proName}
                                  </Typography>
                                  {p.sku && (
                                    <Typography variant="caption" color="text.secondary">
                                      SKU: {p.sku}
                                    </Typography>
                                  )}
                                </Box>
                              </Stack>
                            </TableCell>
                            <TableCell align="center">
                              <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateProductQuantity(p.proId, (p.quantity || 1) - 1)}
                                  disabled={p.quantity <= 1}
                                  sx={{ border: '1px solid #e2e8f0', borderRadius: 0, p: 0.5 }}
                                >
                                  <RemoveIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                                <Typography variant="body2" fontWeight={700} sx={{ minWidth: 28, textAlign: 'center' }}>
                                  {p.quantity || 1}
                                </Typography>
                                <IconButton
                                  size="small"
                                  onClick={() => handleUpdateProductQuantity(p.proId, (p.quantity || 1) + 1)}
                                  sx={{ border: '1px solid #e2e8f0', borderRadius: 0, p: 0.5 }}
                                >
                                  <AddIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Stack>
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveProductFromDeal(p.proId)}
                                sx={{ color: 'error.main' }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Paper>
                )}

                <TextField
                  size="small"
                  label="Deal Title / Offer Name"
                  placeholder="e.g. Mega Combo: Zinger Burger + Fries + Drink"
                  value={form.customTitle}
                  onChange={(e) => setForm({ ...form, customTitle: e.target.value })}
                  fullWidth
                  helperText="Leave empty to automatically use the product names combo."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />

                <TextField
                  size="small"
                  label="Deal Price / Special Offer Price (PKR)"
                  placeholder="e.g. Rs. 990 or 20% OFF"
                  value={form.customPriceLabel}
                  onChange={(e) => setForm({ ...form, customPriceLabel: e.target.value })}
                  fullWidth
                  helperText="Special discounted price for this deal/combo."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />

                <ImageUploadField
                  label="Deal Promotional Banner / Image"
                  value={form.customImageUrl}
                  onChange={(url) => setForm({ ...form, customImageUrl: url })}
                  disabled={saving}
                  helperText="Upload a promotional deal banner or combo photo."
                />
              </Box>
            )}

            {/* ── CUSTOM OFFER (TYPED LINES) ── */}
            {form.dealKind === 'custom' && (
              <>
                <TextField
                  size="small"
                  label="Offer title *"
                  placeholder="e.g. Family lunch combo"
                  value={form.customTitle}
                  onChange={(e) => setForm({ ...form, customTitle: e.target.value })}
                  fullWidth
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
                />
                <FormLabel sx={{ fontWeight: 700, fontSize: 13 }}>What&apos;s included in this deal (one line each)</FormLabel>
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
                  label="Deal image"
                  value={form.customImageUrl}
                  onChange={(url) => setForm({ ...form, customImageUrl: url })}
                  disabled={saving}
                  helperText="Upload JPEG, PNG or WebP image."
                />
                <TextField
                  size="small"
                  label="Price hint / Deal Price"
                  placeholder="e.g. Rs. 990 or from Rs. 450"
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

            {/* ── COMMON DEAL SETTINGS ── */}
            <Divider sx={{ my: 0.5 }} />

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
              label="Badge label (e.g. 20% OFF, Mega Combo, Limited Time)"
              placeholder="e.g. 20% OFF, Super Saver"
              value={form.badgeLabel}
              onChange={(e) => setForm({ ...form, badgeLabel: e.target.value })}
              fullWidth
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
            />
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                size="small"
                label="Start Time (Optional)"
                type="datetime-local"
                value={form.startAt}
                onChange={(e) => setForm({ ...form, startAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
              <TextField
                size="small"
                label="End Time (Optional)"
                type="datetime-local"
                value={form.endAt}
                onChange={(e) => setForm({ ...form, endAt: e.target.value })}
                InputLabelProps={{ shrink: true }}
                fullWidth
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 0 } }}
              />
            </Stack>
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
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#2e5f22' }, borderRadius: 0, fontWeight: 700 }}
          >
            {editingId ? 'Update Deal' : 'Create Deal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
