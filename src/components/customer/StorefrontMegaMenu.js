'use client'

import React, { useState, useMemo } from 'react'
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  IconButton,
  Divider,
  Backdrop,
} from '@mui/material'
import {
  Close as CloseIcon,
  Fastfood as FastfoodIcon,
  LocalGroceryStore as GroceryIcon,
  Devices as TechIcon,
  Cake as BakeryIcon,
  Category as CategoryIcon,
  Bolt as BoltIcon,
  LocalShipping as ShippingIcon,
  Star as StarIcon,
  Storefront as StoreIcon,
  ArrowForward as ArrowForwardIcon,
  RestartAlt as ResetIcon,
} from '@mui/icons-material'

// Get appropriate icon for category based on code or name
function getCategoryIcon(code = '', name = '') {
  const str = `${code} ${name}`.toLowerCase()
  if (str.includes('food') || str.includes('dining') || str.includes('burger') || str.includes('pizza')) {
    return <FastfoodIcon sx={{ fontSize: 18 }} />
  }
  if (str.includes('grocer') || str.includes('supermarket') || str.includes('produce') || str.includes('fruit')) {
    return <GroceryIcon sx={{ fontSize: 18 }} />
  }
  if (str.includes('tech') || str.includes('electron') || str.includes('laptop') || str.includes('mobile')) {
    return <TechIcon sx={{ fontSize: 18 }} />
  }
  if (str.includes('baker') || str.includes('dessert') || str.includes('sweet') || str.includes('cake')) {
    return <BakeryIcon sx={{ fontSize: 18 }} />
  }
  return <CategoryIcon sx={{ fontSize: 18 }} />
}

export default function StorefrontMegaMenu({
  open,
  onClose,
  categories = [],
  selectedCategory = 'all',
  onSelectCategory,
  onSelectSubcategory,
  onApplyFilter,
  isDark = true,
  THEME = {},
}) {
  const [activeVertical, setActiveVertical] = useState('ALL')

  // Extract unique verticals
  const verticals = useMemo(() => {
    const set = new Set(categories.map((c) => c.vertical).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [categories])

  // Filter categories by active vertical tab
  const filteredCategories = useMemo(() => {
    if (activeVertical === 'ALL') return categories
    return categories.filter((c) => c.vertical === activeVertical)
  }, [categories, activeVertical])

  // Calculate total products across all categories
  const totalProducts = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)
  }, [categories])

  if (!open) return null

  return (
    <Backdrop
      open={open}
      onClick={onClose}
      sx={{
        zIndex: 1450,
        bgcolor: isDark ? 'rgba(0, 0, 0, 0.7)' : 'rgba(15, 23, 42, 0.4)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        pt: { xs: 9, sm: 11, md: 14 },
        px: { xs: 1, sm: 2 },
      }}
    >
      <Box
        onClick={(e) => e.stopPropagation()}
        sx={{
          width: { xs: '98vw', sm: '92vw', md: 880, lg: 980 },
          maxWidth: '100%',
          bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
          color: isDark ? '#F1F5F9' : '#0F172A',
          borderRadius: 0,
          border: isDark ? '1px solid rgba(255,255,255,0.14)' : '1px solid #CBD5E1',
          boxShadow: isDark
            ? '0 25px 70px rgba(0,0,0,0.9), 0 0 35px rgba(37,99,235,0.25)'
            : '0 25px 70px rgba(15,23,42,0.22), 0 0 25px rgba(37,99,235,0.1)',
          zIndex: 1460,
          overflow: 'hidden',
          animation: 'megaMenuFadeIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          '@keyframes megaMenuFadeIn': {
            '0%': { opacity: 0, transform: 'translateY(-10px) scale(0.98)' },
            '100%': { opacity: 1, transform: 'translateY(0) scale(1)' },
          },
        }}
      >
      {/* ── 1. TOP HEADER & VERTICAL SELECTOR ── */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          pb: 1.5,
          borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          bgcolor: isDark ? '#060A14' : '#F8FAFC',
        }}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: -0.3, fontSize: { xs: 15, sm: 17 } }}>
                Explore All Departments & Collections
              </Typography>
              <Chip
                label={`${totalProducts || 161}+ Items`}
                size="small"
                sx={{
                  height: 20,
                  fontSize: 10,
                  fontWeight: 800,
                  bgcolor: isDark ? 'rgba(37, 99, 235, 0.2)' : 'rgba(37, 99, 235, 0.1)',
                  color: THEME?.primary || '#2563EB',
                  borderRadius: 0,
                  border: `1px solid ${isDark ? 'rgba(37, 99, 235, 0.4)' : 'rgba(37, 99, 235, 0.25)'}`,
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>
              Select a department or subcategory to instantly browse curated multi-vendor catalogs.
            </Typography>
          </Box>

          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: isDark ? '#94A3B8' : '#64748B',
              borderRadius: 0,
              '&:hover': { bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0', color: isDark ? '#FFFFFF' : '#0F172A' },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>

        {/* Vertical Category Filter Pills */}
        <Stack direction="row" spacing={1} sx={{ overflowX: 'auto', pb: 0.5, '&::-webkit-scrollbar': { display: 'none' } }}>
          {verticals.map((v) => {
            const isActive = activeVertical === v
            const label =
              v === 'ALL'
                ? 'All Departments'
                : v === 'FOOD'
                ? '🍔 Food & Dining'
                : v === 'GROCERY'
                ? '🛒 Fresh Groceries'
                : v === 'SHOP'
                ? '💻 Tech & Gadgets'
                : v
            return (
              <Button
                key={v}
                onClick={() => setActiveVertical(v)}
                size="small"
                sx={{
                  borderRadius: 0,
                  textTransform: 'none',
                  fontSize: 12,
                  fontWeight: isActive ? 800 : 600,
                  px: 1.75,
                  py: 0.5,
                  color: isActive ? '#FFFFFF' : isDark ? '#CBD5E1' : '#475569',
                  bgcolor: isActive ? (THEME?.primary || '#2563EB') : isDark ? 'rgba(255,255,255,0.05)' : '#E2E8F0',
                  border: isActive
                    ? `1px solid ${THEME?.primary || '#2563EB'}`
                    : isDark
                    ? '1px solid rgba(255,255,255,0.08)'
                    : '1px solid #CBD5E1',
                  '&:hover': {
                    bgcolor: isActive ? THEME?.primaryDark || '#1D4ED8' : isDark ? 'rgba(255,255,255,0.1)' : '#CBD5E1',
                  },
                }}
              >
                {label}
              </Button>
            )
          })}

          <Button
            onClick={() => {
              onSelectCategory('all')
              onClose()
            }}
            size="small"
            startIcon={<ResetIcon sx={{ fontSize: 14 }} />}
            sx={{
              borderRadius: 0,
              textTransform: 'none',
              fontSize: 12,
              fontWeight: 700,
              ml: 'auto !important',
              color: isDark ? '#94A3B8' : '#64748B',
              '&:hover': { color: THEME?.primary || '#2563EB' },
            }}
          >
            Show All
          </Button>
        </Stack>
      </Box>

      {/* ── 2. CATEGORY TILES GRID ── */}
      <Box
        sx={{
          p: { xs: 2, sm: 2.5 },
          maxHeight: '52vh',
          overflowY: 'auto',
          '&::-webkit-scrollbar': { width: '6px' },
          '&::-webkit-scrollbar-track': { bgcolor: isDark ? '#0A0F1D' : '#F1F5F9' },
          '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' },
        }}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 2,
          }}
        >
          {filteredCategories.map((cat) => {
            const isSelected = String(selectedCategory) === String(cat.id)
            const icon = getCategoryIcon(cat.code, cat.name)
            const productCount = cat._count?.products || 0

            return (
              <Box
                key={cat.id}
                sx={{
                  p: 2,
                  bgcolor: isDark ? (isSelected ? 'rgba(37, 99, 235, 0.12)' : 'rgba(255,255,255,0.03)') : isSelected ? '#EFF6FF' : '#F8FAFC',
                  border: isDark
                    ? isSelected
                      ? '1px solid #2563EB'
                      : '1px solid rgba(255,255,255,0.08)'
                    : isSelected
                    ? '1px solid #2563EB'
                    : '1px solid #E2E8F0',
                  borderRadius: 0,
                  transition: 'all 0.2s ease',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  '&:hover': {
                    borderColor: THEME?.primary || '#2563EB',
                    bgcolor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
                    transform: 'translateY(-2px)',
                    boxShadow: isDark ? '0 8px 20px rgba(0,0,0,0.5)' : '0 8px 20px rgba(37,99,235,0.08)',
                  },
                }}
                onClick={() => {
                  onSelectCategory(String(cat.id))
                  onClose()
                }}
              >
                {/* Category Header with Image/Icon + Name */}
                <Box>
                  <Stack direction="row" spacing={1.5} alignItems="center" mb={1}>
                    {cat.image ? (
                      <Box
                        component="img"
                        src={cat.image}
                        alt={cat.name}
                        sx={{
                          width: 38,
                          height: 38,
                          objectFit: 'cover',
                          borderRadius: 0,
                          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
                        }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: 38,
                          height: 38,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: isDark ? 'rgba(37, 99, 235, 0.2)' : '#DBEAFE',
                          color: THEME?.primary || '#2563EB',
                          borderRadius: 0,
                        }}
                      >
                        {icon}
                      </Box>
                    )}

                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontWeight: 800,
                            color: isDark ? '#FFFFFF' : '#0F172A',
                            fontSize: 13.5,
                            lineHeight: 1.2,
                          }}
                          noWrap
                        >
                          {cat.name}
                        </Typography>
                        <Chip
                          label={`${productCount}`}
                          size="small"
                          sx={{
                            height: 18,
                            fontSize: 10,
                            fontWeight: 800,
                            borderRadius: 0,
                            bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
                            color: isDark ? '#94A3B8' : '#475569',
                          }}
                        />
                      </Stack>
                      <Typography
                        variant="caption"
                        sx={{
                          color: isDark ? '#94A3B8' : '#64748B',
                          fontSize: 11,
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          mt: 0.25,
                        }}
                      >
                        {cat.description || 'Explore products & top brands'}
                      </Typography>
                    </Box>
                  </Stack>

                  {/* Subcategories Pill Chips */}
                  {Array.isArray(cat.subCategories) && cat.subCategories.length > 0 && (
                    <Box sx={{ mt: 1.25 }}>
                      <Stack direction="row" flexWrap="wrap" gap={0.6}>
                        {cat.subCategories.map((sub) => (
                          <Chip
                            key={sub.subCatId}
                            label={sub.subCatName}
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              onSelectCategory(String(cat.id))
                              if (onSelectSubcategory) {
                                onSelectSubcategory(sub.subCatId)
                              }
                              onClose()
                            }}
                            sx={{
                              height: 22,
                              fontSize: 10.5,
                              fontWeight: 600,
                              borderRadius: 0,
                              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                              color: isDark ? '#CBD5E1' : '#334155',
                              border: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #CBD5E1',
                              cursor: 'pointer',
                              '&:hover': {
                                bgcolor: THEME?.primary || '#2563EB',
                                color: '#FFFFFF',
                                borderColor: THEME?.primary || '#2563EB',
                              },
                            }}
                          />
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Box>

                {/* Bottom Browse Link */}
                <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1.5, pt: 1, borderTop: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid #F1F5F9' }}>
                  <Typography variant="caption" sx={{ fontSize: 11, fontWeight: 700, color: THEME?.primary || '#2563EB' }}>
                    Browse {cat.name}
                  </Typography>
                  <ArrowForwardIcon sx={{ fontSize: 12, color: THEME?.primary || '#2563EB' }} />
                </Stack>
              </Box>
            )
          })}
        </Box>
      </Box>

      {/* ── 3. BOTTOM FILTERS STRIP ── */}
      <Box
        sx={{
          p: { xs: 1.5, sm: 2 },
          bgcolor: isDark ? '#060A14' : '#F1F5F9',
          borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 1.5,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11.5, color: isDark ? '#94A3B8' : '#64748B', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Quick Filters:
          </Typography>

          <Button
            size="small"
            startIcon={<BoltIcon sx={{ color: '#F59E0B' }} />}
            onClick={() => {
              if (onApplyFilter) onApplyFilter('deals')
              onClose()
            }}
            sx={{
              borderRadius: 0,
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'none',
              px: 1.5,
              py: 0.3,
              color: isDark ? '#F1F5F9' : '#0F172A',
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
              '&:hover': { bgcolor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FEF3C7', borderColor: '#F59E0B' },
            }}
          >
            Flash Drops Only
          </Button>

          <Button
            size="small"
            startIcon={<ShippingIcon sx={{ color: '#10B981' }} />}
            onClick={() => {
              if (onApplyFilter) onApplyFilter('freeDelivery')
              onClose()
            }}
            sx={{
              borderRadius: 0,
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'none',
              px: 1.5,
              py: 0.3,
              color: isDark ? '#F1F5F9' : '#0F172A',
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
              '&:hover': { bgcolor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5', borderColor: '#10B981' },
            }}
          >
            Free Delivery
          </Button>

          <Button
            size="small"
            startIcon={<StarIcon sx={{ color: '#FBBF24' }} />}
            onClick={() => {
              if (onApplyFilter) onApplyFilter('highRating')
              onClose()
            }}
            sx={{
              borderRadius: 0,
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'none',
              px: 1.5,
              py: 0.3,
              color: isDark ? '#F1F5F9' : '#0F172A',
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
              '&:hover': { bgcolor: isDark ? 'rgba(251, 191, 36, 0.15)' : '#FEF3C7', borderColor: '#FBBF24' },
            }}
          >
            Top Rated (4.0+)
          </Button>

          <Button
            size="small"
            startIcon={<StoreIcon sx={{ color: '#06B6D4' }} />}
            onClick={() => {
              if (onApplyFilter) onApplyFilter('stores')
              onClose()
            }}
            sx={{
              borderRadius: 0,
              fontSize: 11.5,
              fontWeight: 700,
              textTransform: 'none',
              px: 1.5,
              py: 0.3,
              color: isDark ? '#F1F5F9' : '#0F172A',
              bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
              '&:hover': { bgcolor: isDark ? 'rgba(6, 182, 212, 0.15)' : '#CFFAFE', borderColor: '#06B6D4' },
            }}
          >
            Brand Boutiques
          </Button>
        </Stack>

        <Button
          size="small"
          onClick={() => {
            onSelectCategory('all')
            if (onApplyFilter) onApplyFilter('reset')
            onClose()
          }}
          startIcon={<ResetIcon sx={{ fontSize: 14 }} />}
          sx={{
            borderRadius: 0,
            textTransform: 'none',
            fontSize: 11.5,
            fontWeight: 800,
            color: '#EF4444',
            '&:hover': { bgcolor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEE2E2' },
          }}
        >
          Reset All
        </Button>
      </Box>
    </Box>
    </Backdrop>
  )
}
