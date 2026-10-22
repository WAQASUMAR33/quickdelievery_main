'use client'

import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Slider,
  Checkbox,
  FormControlLabel,
  Stack,
  Chip,
  Divider,
  Switch,
  TextField,
  Rating,
} from '@mui/material'
import {
  Close as CloseIcon,
  Tune as TuneIcon,
  RotateCcw as ResetIcon,
  Check as CheckIcon,
  AttachMoney as MoneyIcon,
  LocalShipping as ShippingIcon,
  Inventory2 as StockIcon,
  Star as StarIcon,
  Category as CategoryIcon,
} from '@mui/icons-material'

export default function FacetedFilterDrawer({
  open,
  onClose,
  facets = {},
  selectedFilters = {},
  onFilterChange,
  onResetFilters,
  totalResults = 0,
  isDark = true,
}) {
  // Local working copy of filters
  const [localPrice, setLocalPrice] = useState([
    selectedFilters.minPrice ?? 0,
    selectedFilters.maxPrice ?? 2000,
  ])
  const [selectedBrands, setSelectedBrands] = useState(selectedFilters.brands || [])
  const [selectedColors, setSelectedColors] = useState(selectedFilters.colors || [])
  const [inStockOnly, setInStockOnly] = useState(selectedFilters.inStock || false)
  const [freeDeliveryOnly, setFreeDeliveryOnly] = useState(selectedFilters.freeDelivery || false)
  const [minRating, setMinRating] = useState(selectedFilters.minRating || 0)

  // Sync when drawer opens or selectedFilters change
  useEffect(() => {
    setLocalPrice([
      selectedFilters.minPrice ?? facets.priceRange?.min ?? 0,
      selectedFilters.maxPrice ?? facets.priceRange?.max ?? 2000,
    ])
    setSelectedBrands(selectedFilters.brands || [])
    setSelectedColors(selectedFilters.colors || [])
    setInStockOnly(selectedFilters.inStock || false)
    setFreeDeliveryOnly(selectedFilters.freeDelivery || false)
    setMinRating(selectedFilters.minRating || 0)
  }, [open, selectedFilters, facets])

  const availableBrands = facets.brands || []
  const availableColors = facets.colors || []
  const maxPriceRange = Math.max(facets.priceRange?.max || 1000, 500)

  const handleBrandToggle = (brand) => {
    setSelectedBrands((prev) => {
      if (prev.includes(brand)) return prev.filter((b) => b !== brand)
      return [...prev, brand]
    })
  }

  const handleColorToggle = (color) => {
    setSelectedColors((prev) => {
      if (prev.includes(color)) return prev.filter((c) => c !== color)
      return [...prev, color]
    })
  }

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({
        minPrice: localPrice[0],
        maxPrice: localPrice[1],
        brands: selectedBrands,
        colors: selectedColors,
        inStock: inStockOnly,
        freeDelivery: freeDeliveryOnly,
        minRating,
      })
    }
    onClose()
  }

  const handleClear = () => {
    setLocalPrice([0, maxPriceRange])
    setSelectedBrands([])
    setSelectedColors([])
    setInStockOnly(false)
    setFreeDeliveryOnly(false)
    setMinRating(0)
    if (onResetFilters) onResetFilters()
  }

  const activeFilterCount =
    (selectedBrands.length > 0 ? 1 : 0) +
    (selectedColors.length > 0 ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (freeDeliveryOnly ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (localPrice[0] > 0 || localPrice[1] < maxPriceRange ? 1 : 0)

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 400, md: 440 },
          bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
          color: isDark ? '#F8FAFC' : '#0F172A',
          borderRadius: 0, // 0px sharp corners
          borderLeft: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: isDark ? '-10px 0 35px rgba(0,0,0,0.8)' : '-5px 0 25px rgba(0,0,0,0.1)',
        },
      }}
    >
      {/* ── Drawer Header ── */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2.5,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box
            sx={{
              width: 34,
              height: 34,
              bgcolor: 'rgba(37, 99, 235, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#3B82F6',
              border: '1px solid rgba(37, 99, 235, 0.3)',
            }}
          >
            <TuneIcon sx={{ fontSize: 18 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, fontSize: 16 }}>
              Multi-Faceted Filters
            </Typography>
            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
              {activeFilterCount > 0 ? `${activeFilterCount} active filters applied` : 'Refine search results'}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              onClick={handleClear}
              startIcon={<ResetIcon sx={{ fontSize: 14 }} />}
              sx={{
                borderRadius: 0,
                color: '#EF4444',
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'none',
                px: 1,
                '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
              }}
            >
              Reset
            </Button>
          )}
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: isDark ? '#94A3B8' : '#64748B',
              borderRadius: 0,
              '&:hover': { color: isDark ? '#FFFFFF' : '#0F172A' },
            }}
          >
            <CloseIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Stack>
      </Box>

      {/* ── Scrollable Filter Content ── */}
      <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
        {/* ── 1. Price Range Facet ── */}
        <Box sx={{ mb: 3.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Price Range
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: '#2563EB' }}>
              ${localPrice[0]} — ${localPrice[1]}
            </Typography>
          </Stack>

          <Slider
            value={localPrice}
            onChange={(e, val) => setLocalPrice(val)}
            min={0}
            max={maxPriceRange}
            step={5}
            sx={{
              color: '#2563EB',
              height: 6,
              '& .MuiSlider-thumb': {
                width: 16,
                height: 16,
                borderRadius: 0, // Sharp square thumb
                bgcolor: '#2563EB',
                border: '2px solid #FFFFFF',
                '&:focus, &:hover, &.Mui-active': {
                  boxShadow: '0 0 0 6px rgba(37, 99, 235, 0.25)',
                },
              },
              '& .MuiSlider-track': { borderRadius: 0 },
              '& .MuiSlider-rail': {
                bgcolor: isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1',
                borderRadius: 0,
              },
            }}
          />

          <Stack direction="row" spacing={2} sx={{ mt: 1.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mb: 0.5 }}>
                Min ($)
              </Typography>
              <TextField
                size="small"
                type="number"
                value={localPrice[0]}
                onChange={(e) => setLocalPrice([Number(e.target.value) || 0, localPrice[1]])}
                fullWidth
                inputProps={{
                  style: {
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontSize: 13,
                    padding: '6px 10px',
                  },
                }}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                  borderRadius: 0,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
                    borderRadius: 0,
                  },
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', display: 'block', mb: 0.5 }}>
                Max ($)
              </Typography>
              <TextField
                size="small"
                type="number"
                value={localPrice[1]}
                onChange={(e) => setLocalPrice([localPrice[0], Number(e.target.value) || maxPriceRange])}
                fullWidth
                inputProps={{
                  style: {
                    color: isDark ? '#FFFFFF' : '#0F172A',
                    fontSize: 13,
                    padding: '6px 10px',
                  },
                }}
                sx={{
                  bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F8FAFC',
                  borderRadius: 0,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#CBD5E1',
                    borderRadius: 0,
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

        {/* ── 2. Quick Toggles (Stock & Delivery) ── */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
            Availability & Delivery
          </Typography>

          <Stack spacing={1.5}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <StockIcon sx={{ fontSize: 18, color: '#10B981' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                    In-Stock Items Only
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Exclude out of stock inventory
                  </Typography>
                </Box>
              </Stack>
              <Switch
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#2563EB',
                    '& + .MuiSwitch-track': { bgcolor: '#2563EB' },
                  },
                }}
              />
            </Box>

            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0',
              }}
            >
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <ShippingIcon sx={{ fontSize: 18, color: '#3B82F6' }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                    Free Express Delivery
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B' }}>
                    Zero delivery charge
                  </Typography>
                </Box>
              </Stack>
              <Switch
                checked={freeDeliveryOnly}
                onChange={(e) => setFreeDeliveryOnly(e.target.checked)}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: '#2563EB',
                    '& + .MuiSwitch-track': { bgcolor: '#2563EB' },
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />

        {/* ── 3. Seller Rating Facet ── */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
            Minimum Customer Rating
          </Typography>

          <Stack direction="row" spacing={1}>
            {[
              { val: 0, label: 'All' },
              { val: 3.5, label: '3.5★+' },
              { val: 4.0, label: '4.0★+' },
              { val: 4.5, label: '4.5★+' },
            ].map((r) => {
              const active = minRating === r.val
              return (
                <Button
                  key={r.val}
                  onClick={() => setMinRating(r.val)}
                  size="small"
                  sx={{
                    flex: 1,
                    borderRadius: 0,
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: 12,
                    py: 0.8,
                    bgcolor: active
                      ? '#2563EB'
                      : isDark
                      ? 'rgba(255,255,255,0.04)'
                      : '#F1F5F9',
                    color: active ? '#FFFFFF' : isDark ? '#E2E8F0' : '#1E293B',
                    border: active
                      ? '1px solid #2563EB'
                      : isDark
                      ? '1px solid rgba(255,255,255,0.08)'
                      : '1px solid #CBD5E1',
                    '&:hover': {
                      bgcolor: active ? '#1D4ED8' : isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                    },
                  }}
                >
                  {r.label}
                </Button>
              )
            })}
          </Stack>
        </Box>

        {/* ── 4. Brands Multi-Select Facet ── */}
        {availableBrands.length > 0 && (
          <>
            <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />
            <Box sx={{ mb: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Brand ({availableBrands.length})
                </Typography>
                {selectedBrands.length > 0 && (
                  <Button
                    size="small"
                    onClick={() => setSelectedBrands([])}
                    sx={{ fontSize: 11, color: '#2563EB', textTransform: 'none', p: 0, minWidth: 0 }}
                  >
                    Clear
                  </Button>
                )}
              </Stack>

              <Box sx={{ maxHeight: 180, overflowY: 'auto', pr: 0.5 }}>
                {availableBrands.map((b) => {
                  const checked = selectedBrands.includes(b.name)
                  return (
                    <Box
                      key={b.name}
                      onClick={() => handleBrandToggle(b.name)}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        py: 0.6,
                        px: 1,
                        cursor: 'pointer',
                        borderRadius: 0,
                        bgcolor: checked
                          ? isDark
                            ? 'rgba(37, 99, 235, 0.12)'
                            : 'rgba(37, 99, 235, 0.08)'
                          : 'transparent',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC',
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Checkbox
                          checked={checked}
                          size="small"
                          sx={{
                            p: 0.25,
                            borderRadius: 0,
                            color: isDark ? '#64748B' : '#94A3B8',
                            '&.Mui-checked': { color: '#2563EB' },
                          }}
                        />
                        <Typography variant="body2" sx={{ fontSize: 13, fontWeight: checked ? 700 : 500 }}>
                          {b.name}
                        </Typography>
                      </Stack>
                      <Chip
                        size="small"
                        label={b.count}
                        sx={{
                          height: 18,
                          fontSize: 10,
                          borderRadius: 0,
                          bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                          color: isDark ? '#94A3B8' : '#64748B',
                        }}
                      />
                    </Box>
                  )
                })}
              </Box>
            </Box>
          </>
        )}

        {/* ── 5. Colors Facet ── */}
        {availableColors.length > 0 && (
          <>
            <Divider sx={{ my: 2.5, borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0' }} />
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5, mb: 1.5 }}>
                Color
              </Typography>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {availableColors.map((c) => {
                  const active = selectedColors.includes(c.name)
                  return (
                    <Chip
                      key={c.name}
                      label={`${c.name} (${c.count})`}
                      onClick={() => handleColorToggle(c.name)}
                      icon={active ? <CheckIcon sx={{ fontSize: '13px !important' }} /> : undefined}
                      sx={{
                        borderRadius: 0,
                        fontSize: 11,
                        fontWeight: active ? 800 : 500,
                        bgcolor: active
                          ? '#2563EB'
                          : isDark
                          ? 'rgba(255,255,255,0.06)'
                          : '#F1F5F9',
                        color: active ? '#FFFFFF' : isDark ? '#E2E8F0' : '#1E293B',
                        border: active
                          ? '1px solid #2563EB'
                          : isDark
                          ? '1px solid rgba(255,255,255,0.1)'
                          : '1px solid #CBD5E1',
                        cursor: 'pointer',
                        '&:hover': {
                          bgcolor: active ? '#1D4ED8' : isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0',
                        },
                      }}
                    />
                  )
                })}
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* ── Drawer Footer / Action Bar ── */}
      <Box
        sx={{
          p: 2.5,
          borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          bgcolor: isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFC',
        }}
      >
        <Button
          fullWidth
          variant="contained"
          onClick={handleApply}
          sx={{
            py: 1.4,
            borderRadius: 0,
            textTransform: 'none',
            fontWeight: 800,
            fontSize: 14,
            bgcolor: '#2563EB',
            color: '#FFFFFF',
            boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
            '&:hover': { bgcolor: '#1D4ED8' },
          }}
        >
          Apply Filters {totalResults > 0 ? `(${totalResults} items)` : ''}
        </Button>
      </Box>
    </Drawer>
  )
}
