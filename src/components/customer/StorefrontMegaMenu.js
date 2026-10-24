'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Typography,
  Stack,
  Button,
  Chip,
  Divider,
} from '@mui/material'
import {
  Fastfood as FastfoodIcon,
  LocalGroceryStore as GroceryIcon,
  Devices as TechIcon,
  Cake as BakeryIcon,
  Category as CategoryIcon,
  ChevronRight as ChevronRightIcon,
  Bolt as BoltIcon,
  LocalShipping as ShippingIcon,
  Star as StarIcon,
  Storefront as StoreIcon,
  ArrowForward as ArrowForwardIcon,
  RestartAlt as ResetIcon,
  Check as CheckIcon,
  WidgetsOutlined as AllIcon,
} from '@mui/icons-material'
import { useLanguage } from '@/contexts/LanguageContext'

// Get appropriate icon for category based on code or name
function getCategoryIcon(code = '', name = '') {
  const str = `${code} ${name}`.toLowerCase()
  if (str.includes('food') || str.includes('dining') || str.includes('burger') || str.includes('pizza')) {
    return <FastfoodIcon sx={{ fontSize: 17 }} />
  }
  if (str.includes('grocer') || str.includes('supermarket') || str.includes('produce') || str.includes('fruit')) {
    return <GroceryIcon sx={{ fontSize: 17 }} />
  }
  if (str.includes('tech') || str.includes('electron') || str.includes('laptop') || str.includes('mobile')) {
    return <TechIcon sx={{ fontSize: 17 }} />
  }
  if (str.includes('baker') || str.includes('dessert') || str.includes('sweet') || str.includes('cake')) {
    return <BakeryIcon sx={{ fontSize: 17 }} />
  }
  return <CategoryIcon sx={{ fontSize: 17 }} />
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
  const { t, isRTL } = useLanguage()

  // Currently highlighted category in the dropdown (for instant preview of subcategories)
  const [highlightedCatId, setHighlightedCatId] = useState(null)

  // Initialize highlighted category when menu opens
  useEffect(() => {
    if (open) {
      if (selectedCategory && selectedCategory !== 'all') {
        setHighlightedCatId(String(selectedCategory))
      } else if (categories.length > 0) {
        setHighlightedCatId(String(categories[0].id))
      } else {
        setHighlightedCatId('all')
      }
    }
  }, [open, selectedCategory, categories])

  // Total products across all categories
  const totalProducts = useMemo(() => {
    return categories.reduce((sum, c) => sum + (c._count?.products || 0), 0)
  }, [categories])

  // Currently active/highlighted category object
  const activeCategory = useMemo(() => {
    if (!highlightedCatId || highlightedCatId === 'all') return null
    return categories.find((c) => String(c.id) === String(highlightedCatId)) || null
  }, [highlightedCatId, categories])

  // Keyboard navigation for categories (ArrowDown, ArrowUp, Enter, Escape)
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }

      const allIds = ['all', ...categories.map((c) => String(c.id))]
      const currentIndex = allIds.indexOf(highlightedCatId || 'all')

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        const nextIndex = (currentIndex + 1) % allIds.length
        setHighlightedCatId(allIds[nextIndex])
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prevIndex = (currentIndex - 1 + allIds.length) % allIds.length
        setHighlightedCatId(allIds[prevIndex])
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (highlightedCatId === 'all') {
          onSelectCategory('all')
        } else if (highlightedCatId) {
          onSelectCategory(highlightedCatId)
        }
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, highlightedCatId, categories, onSelectCategory, onClose])

  if (!open) return null

  return (
    <Box
      onClick={(e) => e.stopPropagation()}
      sx={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        left: isRTL ? 'auto' : 0,
        right: isRTL ? 0 : 'auto',
        direction: isRTL ? 'rtl' : 'ltr',
        width: { xs: '96vw', sm: 580, md: 660 },
        maxWidth: '96vw',
        bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
        color: isDark ? '#F1F5F9' : '#0F172A',
        borderRadius: 0,
        border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
        boxShadow: isDark
          ? '0 20px 50px rgba(0,0,0,0.85), 0 0 25px rgba(37,99,235,0.18)'
          : '0 20px 50px rgba(15,23,42,0.15), 0 0 20px rgba(37,99,235,0.06)',
        zIndex: 1400,
        overflow: 'hidden',
        animation: 'navDropdownFadeIn 0.16s cubic-bezier(0.16, 1, 0.3, 1)',
        '@keyframes navDropdownFadeIn': {
          '0%': { opacity: 0, transform: 'translateY(-6px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
      }}
    >
      {/* ── Two-Column Navigable Split Layout (No images, ultra-fast & clean) ── */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, minHeight: 330, maxHeight: 420 }}>
        
        {/* ── Left Column: Categories List (Navigable via Mouse or Keyboard) ── */}
        <Box
          sx={{
            width: { xs: '100%', sm: 250, md: 270 },
            borderRight: { xs: 'none', sm: !isRTL && (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0') },
            borderLeft: { xs: 'none', sm: isRTL && (isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0') },
            borderBottom: { xs: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0', sm: 'none' },
            bgcolor: isDark ? '#060A14' : '#F8FAFC',
            p: 1,
            overflowY: 'auto',
            '&::-webkit-scrollbar': { width: '4px' },
            '&::-webkit-scrollbar-thumb': { bgcolor: isDark ? 'rgba(255,255,255,0.15)' : '#CBD5E1' },
          }}
        >
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              px: 1.5,
              py: 0.75,
              fontSize: 10.5,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 0.75,
              color: isDark ? '#94A3B8' : '#64748B',
            }}
          >
            {t('departments') || 'Categories'}
          </Typography>

          {/* Option: All Collections */}
          <Box
            onClick={() => {
              onSelectCategory('all')
              onClose()
            }}
            onMouseEnter={() => setHighlightedCatId('all')}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 1.2,
              px: 1.5,
              cursor: 'pointer',
              borderRadius: 0,
              transition: 'background-color 0.15s ease',
              bgcolor:
                highlightedCatId === 'all'
                  ? isDark
                    ? 'rgba(37, 99, 235, 0.16)'
                    : '#EFF6FF'
                  : 'transparent',
              color:
                highlightedCatId === 'all'
                  ? THEME?.primary || '#2563EB'
                  : isDark
                  ? '#E2E8F0'
                  : '#1E293B',
              '&:hover': {
                bgcolor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
                color: THEME?.primary || '#2563EB',
              },
            }}
          >
            <Stack direction="row" spacing={1.25} alignItems="center">
              <AllIcon sx={{ fontSize: 18, color: THEME?.primary || '#2563EB' }} />
              <Typography variant="body2" sx={{ fontWeight: 700, fontSize: 13 }}>
                {t('allCollections') || 'All Collections'}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center">
              <Chip
                label={`${totalProducts || 161}`}
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
              {selectedCategory === 'all' && (
                <CheckIcon sx={{ fontSize: 16, color: THEME?.primary || '#2563EB' }} />
              )}
            </Stack>
          </Box>

          <Divider sx={{ my: 0.75, borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }} />

          {/* Dynamic Categories from API */}
          {categories.map((cat) => {
            const isHighlighted = String(highlightedCatId) === String(cat.id)
            const isSelected = String(selectedCategory) === String(cat.id)
            const icon = getCategoryIcon(cat.code, cat.name)
            const count = cat._count?.products || 0

            return (
              <Box
                key={cat.id}
                onClick={() => {
                  onSelectCategory(String(cat.id))
                  onClose()
                }}
                onMouseEnter={() => setHighlightedCatId(String(cat.id))}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  p: 1.1,
                  px: 1.5,
                  cursor: 'pointer',
                  borderRadius: 0,
                  transition: 'background-color 0.12s ease',
                  bgcolor: isHighlighted
                    ? isDark
                      ? 'rgba(37, 99, 235, 0.16)'
                      : '#EFF6FF'
                    : 'transparent',
                  color: isHighlighted
                    ? THEME?.primary || '#2563EB'
                    : isDark
                    ? '#E2E8F0'
                    : '#1E293B',
                  '&:hover': {
                    bgcolor: isDark ? 'rgba(37, 99, 235, 0.16)' : '#EFF6FF',
                    color: THEME?.primary || '#2563EB',
                  },
                }}
              >
                <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                  <Box
                    sx={{
                      color: isHighlighted || isSelected ? THEME?.primary || '#2563EB' : isDark ? '#94A3B8' : '#64748B',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    {icon}
                  </Box>
                  <Typography
                    variant="body2"
                    noWrap
                    sx={{
                      fontWeight: isHighlighted || isSelected ? 800 : 600,
                      fontSize: 13,
                    }}
                  >
                    {t(cat.name) || cat.name}
                  </Typography>
                </Stack>

                <Stack direction="row" spacing={0.5} alignItems="center">
                  <Chip
                    label={`${count}`}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: 10,
                      fontWeight: 800,
                      borderRadius: 0,
                      bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                      color: isDark ? '#94A3B8' : '#475569',
                    }}
                  />
                  <ChevronRightIcon
                    sx={{
                      fontSize: 16,
                      color: isHighlighted ? THEME?.primary || '#2563EB' : isDark ? '#64748B' : '#94A3B8',
                      transform: isRTL ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </Stack>
              </Box>
            )
          })}
        </Box>

        {/* ── Right Column: Subcategories & Quick Department Navigation ── */}
        <Box
          sx={{
            flex: 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            overflowY: 'auto',
            bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
          }}
        >
          {activeCategory ? (
            <Box>
              {/* Category Header Bar */}
              <Box
                onClick={() => {
                  onSelectCategory(String(activeCategory.id))
                  onClose()
                }}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  pb: 1.5,
                  mb: 1.5,
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                  '&:hover .browse-title': { color: THEME?.primary || '#2563EB' },
                }}
              >
                <Box>
                  <Typography
                    className="browse-title"
                    variant="subtitle2"
                    sx={{ fontWeight: 800, fontSize: 14, color: isDark ? '#FFFFFF' : '#0F172A' }}
                  >
                    {t(activeCategory.name) || activeCategory.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}>
                    {activeCategory.description ? (t(activeCategory.description) || activeCategory.description) : (t('browseAllCatalog') || 'Browse all catalog items')}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: THEME?.primary || '#2563EB' }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11 }}>
                    {t('viewAll') || 'View All'} ({activeCategory._count?.products || 0})
                  </Typography>
                  <ArrowForwardIcon sx={{ fontSize: 12, transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                </Stack>
              </Box>

              {/* Subcategories List */}
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1,
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: isDark ? '#94A3B8' : '#64748B',
                }}
              >
                {t('subcategories') || 'Subcategories'} ({activeCategory.subCategories?.length || 0})
              </Typography>

              {Array.isArray(activeCategory.subCategories) && activeCategory.subCategories.length > 0 ? (
                <Stack spacing={0.5}>
                  {activeCategory.subCategories.map((sub) => (
                    <Box
                      key={sub.subCatId}
                      onClick={() => {
                        onSelectCategory(String(activeCategory.id))
                        if (onSelectSubcategory) {
                          onSelectSubcategory(sub.subCatId)
                        }
                        onClose()
                      }}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        p: 1,
                        px: 1.25,
                        cursor: 'pointer',
                        borderRadius: 0,
                        border: isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
                        transition: 'all 0.12s ease',
                        '&:hover': {
                          bgcolor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
                          borderColor: isDark ? 'rgba(37, 99, 235, 0.3)' : '#BFDBFE',
                          transform: isRTL ? 'translateX(-3px)' : 'translateX(3px)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: THEME?.primary || '#2563EB' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12.5 }}>
                          {t(sub.subCatName) || sub.subCatName}
                        </Typography>
                      </Stack>
                      <ChevronRightIcon sx={{ fontSize: 14, color: isDark ? '#64748B' : '#94A3B8', transform: isRTL ? 'rotate(180deg)' : 'none' }} />
                    </Box>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ py: 2, textAlign: 'center' }}>
                  <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>
                    {t('clickAboveToBrowse') || 'Click above to browse all products in'} {t(activeCategory.name) || activeCategory.name}
                  </Typography>
                </Box>
              )}
            </Box>
          ) : (
            /* 'All Collections' preview state */
            <Box>
              <Box
                onClick={() => {
                  onSelectCategory('all')
                  onClose()
                }}
                sx={{
                  pb: 1.5,
                  mb: 1.5,
                  borderBottom: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                  cursor: 'pointer',
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, fontSize: 14, color: isDark ? '#FFFFFF' : '#0F172A' }}>
                  {t('allDepartmentsCollections') || 'All Departments & Collections'}
                </Typography>
                <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}>
                  {t('browseCompleteCatalog') || `Browse our complete catalog of ${totalProducts || 161}+ verified vendor products.`}
                </Typography>
              </Box>

              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  mb: 1,
                  fontSize: 10.5,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: isDark ? '#94A3B8' : '#64748B',
                }}
              >
                {t('featuredDepartments') || 'Featured Departments'}
              </Typography>

              <Stack spacing={0.5}>
                {categories.map((c) => (
                  <Box
                    key={c.id}
                    onClick={() => {
                      onSelectCategory(String(c.id))
                      onClose()
                    }}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 0.9,
                      px: 1.2,
                      cursor: 'pointer',
                      borderRadius: 0,
                      '&:hover': {
                        bgcolor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
                        transform: isRTL ? 'translateX(-3px)' : 'translateX(3px)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: THEME?.primary || '#2563EB' }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12.5 }}>
                        {t(c.name) || c.name}
                      </Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11, fontWeight: 700 }}>
                      {c._count?.products || 0} {t('items') || 'items'}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}

          {/* Quick Filters Footer Bar */}
          <Box sx={{ mt: 2, pt: 1.5, borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0' }}>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip
                icon={<BoltIcon sx={{ fontSize: '13px !important', color: '#F59E0B' }} />}
                label={t('flashDrops') || 'Flash Drops'}
                size="small"
                onClick={() => {
                  if (onApplyFilter) onApplyFilter('deals')
                  onClose()
                }}
                sx={{
                  height: 22,
                  fontSize: 10.5,
                  fontWeight: 700,
                  borderRadius: 0,
                  bgcolor: isDark ? 'rgba(245, 158, 11, 0.1)' : '#FEF3C7',
                  color: isDark ? '#FBBF24' : '#B45309',
                  border: isDark ? '1px solid rgba(245, 158, 11, 0.25)' : '1px solid rgba(245, 158, 11, 0.3)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isDark ? 'rgba(245, 158, 11, 0.2)' : '#FDE68A' },
                }}
              />

              <Chip
                icon={<ShippingIcon sx={{ fontSize: '13px !important', color: '#10B981' }} />}
                label={t('freeDelivery') || 'Free Delivery'}
                size="small"
                onClick={() => {
                  if (onApplyFilter) onApplyFilter('freeDelivery')
                  onClose()
                }}
                sx={{
                  height: 22,
                  fontSize: 10.5,
                  fontWeight: 700,
                  borderRadius: 0,
                  bgcolor: isDark ? 'rgba(16, 185, 129, 0.1)' : '#D1FAE5',
                  color: isDark ? '#34D399' : '#065F46',
                  border: isDark ? '1px solid rgba(16, 185, 129, 0.25)' : '1px solid rgba(16, 185, 129, 0.3)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#A7F3D0' },
                }}
              />

              <Chip
                icon={<StarIcon sx={{ fontSize: '13px !important', color: '#FBBF24' }} />}
                label={t('topRated') || 'Top Rated'}
                size="small"
                onClick={() => {
                  if (onApplyFilter) onApplyFilter('highRating')
                  onClose()
                }}
                sx={{
                  height: 22,
                  fontSize: 10.5,
                  fontWeight: 700,
                  borderRadius: 0,
                  bgcolor: isDark ? 'rgba(251, 191, 36, 0.1)' : '#FEF3C7',
                  color: isDark ? '#FBBF24' : '#92400E',
                  border: isDark ? '1px solid rgba(251, 191, 36, 0.25)' : '1px solid rgba(251, 191, 36, 0.3)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: isDark ? 'rgba(251, 191, 36, 0.2)' : '#FDE68A' },
                }}
              />

              <Button
                size="small"
                onClick={() => {
                  onSelectCategory('all')
                  if (onApplyFilter) onApplyFilter('reset')
                  onClose()
                }}
                startIcon={<ResetIcon sx={{ fontSize: 13 }} />}
                sx={{
                  height: 22,
                  p: 0,
                  px: 0.75,
                  fontSize: 10.5,
                  fontWeight: 700,
                  color: '#EF4444',
                  textTransform: 'none',
                  borderRadius: 0,
                  ml: isRTL ? '0 !important' : 'auto !important',
                  mr: isRTL ? 'auto !important' : '0 !important',
                  '&:hover': { bgcolor: isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEE2E2' },
                }}
              >
                {t('clear') || 'Reset'}
              </Button>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
