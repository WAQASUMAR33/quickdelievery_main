'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Box,
  Typography,
  Stack,
  IconButton,
  Button,
  Chip,
  CircularProgress,
  ClickAwayListener,
} from '@mui/material'
import {
  Search as SearchIcon,
  Close as CloseIcon,
  WidgetsOutlined as MegaMenuIcon,
  KeyboardArrowDown as ArrowDownIcon,
  History as HistoryIcon,
  TrendingUp as TrendingIcon,
  Storefront as StoreIcon,
  ArrowForward as ArrowForwardIcon,
  DeleteOutline as DeleteIcon,
  Fastfood as FastfoodIcon,
  LocalGroceryStore as GroceryIcon,
  Devices as TechIcon,
  Cake as BakeryIcon,
  Category as CategoryIcon,
  CameraAlt as CameraIcon,
  AutoAwesome as SparklesIcon,
  Tune as FilterIcon,
} from '@mui/icons-material'
import { getProductUrl } from '@/lib/productSlug'
import StorefrontMegaMenu from './StorefrontMegaMenu'
import VisualSearchModal from './VisualSearchModal'
import FacetedFilterDrawer from './FacetedFilterDrawer'

const RECENT_SEARCHES_KEY = 'quickdelivery_recent_searches'
const TRENDING_TAGS = [
  'Double Truffle Smash',
  'Neapolitan Pizza',
  'Organic Strawberries',
  'Butter Croissants',
  'Laptop Workstation',
  'Gaming Mouse',
]

function getCategoryIcon(code = '', name = '') {
  const str = `${code} ${name}`.toLowerCase()
  if (str.includes('food') || str.includes('dining') || str.includes('burger')) return <FastfoodIcon sx={{ fontSize: 16 }} />
  if (str.includes('grocer') || str.includes('produce')) return <GroceryIcon sx={{ fontSize: 16 }} />
  if (str.includes('tech') || str.includes('laptop') || str.includes('mobile')) return <TechIcon sx={{ fontSize: 16 }} />
  if (str.includes('baker') || str.includes('croissant')) return <BakeryIcon sx={{ fontSize: 16 }} />
  return <CategoryIcon sx={{ fontSize: 16 }} />
}

export default function StorefrontHeaderSearch({
  searchQuery,
  setSearchQuery,
  searchCategory,
  setSearchCategory,
  categories = [],
  onSearchSubmit,
  onApplyFilter,
  onSelectSubcategory,
  onAiSearchResults,
  isDark = true,
  t = (k) => k,
  THEME = {},
}) {
  const router = useRouter()
  const [megaMenuOpen, setMegaMenuOpen] = useState(false)
  const [suggestionsOpen, setSuggestionsOpen] = useState(false)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [suggestions, setSuggestions] = useState({ products: [], categories: [], vendors: [] })
  const [recentSearches, setRecentSearches] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)

  // AI & Advanced Feature States
  const [visualModalOpen, setVisualModalOpen] = useState(false)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)
  const [isAiMode, setIsAiMode] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiInterpretation, setAiInterpretation] = useState(null)
  const [searchFacets, setSearchFacets] = useState({})

  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceTimer = useRef(null)

  // Load recent searches on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY)
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 6))
      }
    } catch {}
  }, [])

  // Listen for global toggleMegaMenu event (e.g. from subnav "All Departments")
  useEffect(() => {
    const handleToggle = () => {
      setMegaMenuOpen((prev) => !prev)
      setSuggestionsOpen(false)
    }
    window.addEventListener('toggleMegaMenu', handleToggle)
    return () => window.removeEventListener('toggleMegaMenu', handleToggle)
  }, [])

  const saveRecentSearch = useCallback((term) => {
    if (!term || !term.trim()) return
    const clean = term.trim()
    setRecentSearches((prev) => {
      const next = [clean, ...prev.filter((item) => item.toLowerCase() !== clean.toLowerCase())].slice(0, 6)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }, [])

  const removeRecentSearch = (e, term) => {
    e.stopPropagation()
    setRecentSearches((prev) => {
      const next = prev.filter((item) => item !== term)
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next))
      } catch {}
      return next
    })
  }

  const clearAllRecent = (e) => {
    e.stopPropagation()
    setRecentSearches([])
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY)
    } catch {}
  }

  // Fetch live suggestions debounced
  useEffect(() => {
    const q = searchQuery?.trim()
    if (!q) {
      setSuggestions({ products: [], categories: [], vendors: [] })
      setLoadingSuggestions(false)
      return
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    setLoadingSuggestions(true)
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?type=suggestions&q=${encodeURIComponent(q)}`)
        const data = await res.json()
        if (data.success && data.data) {
          setSuggestions(data.data)
        }
      } catch (err) {
        console.error('Error fetching suggestions:', err)
      } finally {
        setLoadingSuggestions(false)
      }
    }, 180)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [searchQuery])

  // Get active category display name
  const activeCategoryLabel = React.useMemo(() => {
    if (searchCategory === 'all') return 'All Collections'
    const found = categories.find((c) => String(c.id) === String(searchCategory))
    return found ? found.name : 'Collections'
  }, [searchCategory, categories])

  const handleExecuteSearch = async (term) => {
    const q = (term !== undefined ? term : searchQuery)?.trim()
    if (!q) return

    saveRecentSearch(q)
    setSuggestionsOpen(false)
    setMegaMenuOpen(false)

    // Conversational query detection or explicit AI mode
    const isConversational = isAiMode || /\b(under|below|less than|for|with|between|cheap|best|in stock)\b/i.test(q)

    if (isConversational) {
      setAiLoading(true)
      try {
        const res = await fetch('/api/ai/nlp-search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: q }),
        })
        const data = await res.json()
        if (data.success) {
          setAiInterpretation(data)
          if (data.facets) setSearchFacets(data.facets)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('aiSearchResults', { detail: data }))
          }
          if (onAiSearchResults) onAiSearchResults(data)
        }
      } catch (err) {
        console.error('AI Search execution error:', err)
      } finally {
        setAiLoading(false)
      }
    }

    if (onSearchSubmit) onSearchSubmit(q)
  }

  const handleSelectProduct = (product) => {
    saveRecentSearch(product.proName)
    setSuggestionsOpen(false)
    const url = getProductUrl(product)
    router.push(url)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleExecuteSearch()
    } else if (e.key === 'Escape') {
      setSuggestionsOpen(false)
      setMegaMenuOpen(false)
    }
  }

  const hasSuggestions =
    suggestions.products.length > 0 ||
    suggestions.categories.length > 0 ||
    suggestions.vendors.length > 0

  return (
    <ClickAwayListener
      onClickAway={() => {
        setSuggestionsOpen(false)
        setMegaMenuOpen(false)
      }}
    >
      <Box
        ref={containerRef}
        sx={{
          position: 'relative',
          flex: 1,
          maxWidth: { xs: '100%', md: 720, lg: 820 },
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          zIndex: 1300,
        }}
      >
        {/* ── Main Sculpted Search Pill Container ── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: '50px',
            p: 0.5,
            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
            border: isDark
              ? megaMenuOpen || suggestionsOpen
                ? '1px solid #2563EB'
                : '1px solid rgba(255,255,255,0.12)'
              : megaMenuOpen || suggestionsOpen
              ? '1px solid #2563EB'
              : '1px solid #CBD5E1',
            boxShadow:
              megaMenuOpen || suggestionsOpen
                ? isDark
                  ? '0 0 25px rgba(37, 99, 235, 0.35)'
                  : '0 0 20px rgba(37, 99, 235, 0.18)'
                : 'none',
            transition: 'all 0.25s ease',
            '&:focus-within': {
              borderColor: THEME?.primary || '#2563EB',
              bgcolor: isDark ? 'rgba(255,255,255,0.09)' : '#FFFFFF',
              boxShadow: isDark ? '0 0 25px rgba(37, 99, 235, 0.35)' : '0 0 20px rgba(37, 99, 235, 0.18)',
            },
          }}
        >
          {/* ── 1. MEGA MENU TRIGGER CAPSULE (replaces simple dropdown) ── */}
          <Button
            onClick={() => {
              setMegaMenuOpen((prev) => !prev)
              setSuggestionsOpen(false)
            }}
            size="small"
            startIcon={<MegaMenuIcon sx={{ fontSize: 16, color: THEME?.primary || '#2563EB' }} />}
            endIcon={
              <ArrowDownIcon
                sx={{
                  fontSize: 16,
                  color: isDark ? '#94A3B8' : '#64748B',
                  transform: megaMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            }
            sx={{
              bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#E2E8F0',
              color: isDark ? '#E2E8F0' : '#1E293B',
              height: 38,
              px: 2,
              borderRadius: '50px',
              fontSize: 12.5,
              fontWeight: 800,
              minWidth: 155,
              maxWidth: 200,
              textTransform: 'none',
              border: 'none',
              whiteSpace: 'nowrap',
              '& .MuiButton-startIcon': { mr: 0.75 },
              '& .MuiButton-endIcon': { ml: 0.75 },
              '&:hover': {
                bgcolor: isDark ? 'rgba(255,255,255,0.14)' : '#CBD5E1',
              },
            }}
          >
            <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeCategoryLabel}
            </Box>
          </Button>

          {/* ── 2. LIVE SEARCH TEXT INPUT ── */}
          <Box
            ref={inputRef}
            component="input"
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setSuggestionsOpen(true)
              setMegaMenuOpen(false)
            }}
            onFocus={() => {
              setSuggestionsOpen(true)
              setMegaMenuOpen(false)
            }}
            onKeyDown={handleKeyDown}
            placeholder={
              isAiMode
                ? 'Ask AI: "black waterproof jacket under $50", "cheap gaming mouse"…'
                : t('searchPlaceholder') || 'Search 161+ items, burgers, tech, groceries, brands…'
            }
            sx={{
              flex: 1,
              height: 38,
              px: 2,
              border: 'none',
              outline: 'none',
              bgcolor: 'transparent',
              color: isDark ? '#FFFFFF' : '#0F172A',
              fontSize: 13.5,
              fontWeight: 500,
              fontFamily: 'inherit',
              '&::placeholder': { color: isAiMode ? '#3B82F6' : isDark ? '#64748B' : '#94A3B8' },
            }}
          />

          {/* Loading Spinner */}
          {(loadingSuggestions || aiLoading) && (
            <CircularProgress size={16} sx={{ color: THEME?.primary || '#2563EB', mr: 1 }} />
          )}

          {/* Clear Input Button */}
          {searchQuery && (
            <IconButton
              size="small"
              onClick={() => {
                setSearchQuery('')
                setAiInterpretation(null)
                inputRef.current?.focus()
              }}
              sx={{
                p: 0.5,
                mr: 0.5,
                color: isDark ? '#94A3B8' : '#64748B',
                '&:hover': { color: isDark ? '#FFFFFF' : '#0F172A' },
              }}
            >
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          )}

          {/* ── AI Search Mode Toggle Pill ── */}
          <Button
            size="small"
            onClick={() => setIsAiMode((prev) => !prev)}
            startIcon={<SparklesIcon sx={{ fontSize: '13px !important', color: isAiMode ? '#FFFFFF' : '#3B82F6' }} />}
            sx={{
              height: 30,
              px: 1.2,
              borderRadius: '20px',
              textTransform: 'none',
              fontSize: 11.5,
              fontWeight: 800,
              bgcolor: isAiMode ? '#2563EB' : isDark ? 'rgba(37, 99, 235, 0.14)' : '#EFF6FF',
              color: isAiMode ? '#FFFFFF' : '#2563EB',
              border: isAiMode ? '1px solid #3B82F6' : '1px solid rgba(37, 99, 235, 0.3)',
              boxShadow: isAiMode ? '0 0 12px rgba(37, 99, 235, 0.5)' : 'none',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              mr: 0.5,
              '&:hover': {
                bgcolor: isAiMode ? '#1D4ED8' : isDark ? 'rgba(37, 99, 235, 0.25)' : '#DBEAFE',
              },
            }}
          >
            {isAiMode ? 'AI ON' : 'AI'}
          </Button>

          {/* ── Visual Search Camera Icon Button ── */}
          <IconButton
            size="small"
            title="Visual Search with Photo (Gemini Vision)"
            onClick={() => setVisualModalOpen(true)}
            sx={{
              p: 0.75,
              mr: 0.25,
              color: isDark ? '#94A3B8' : '#64748B',
              '&:hover': {
                color: '#2563EB',
                bgcolor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
              },
            }}
          >
            <CameraIcon sx={{ fontSize: 19 }} />
          </IconButton>

          {/* ── Faceted Filters Drawer Trigger ── */}
          <IconButton
            size="small"
            title="Dynamic Multi-Faceted Filters"
            onClick={() => setFilterDrawerOpen(true)}
            sx={{
              p: 0.75,
              mr: 0.5,
              color: isDark ? '#94A3B8' : '#64748B',
              '&:hover': {
                color: '#2563EB',
                bgcolor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
              },
            }}
          >
            <FilterIcon sx={{ fontSize: 19 }} />
          </IconButton>

          {/* ── 3. SEARCH ACTION BUTTON ── */}
          <IconButton
            onClick={() => handleExecuteSearch()}
            sx={{
              width: 38,
              height: 38,
              background: THEME?.gradient || 'linear-gradient(135deg, #2563EB 0%, #4F46E5 50%, #7C3AED 100%)',
              color: '#FFFFFF',
              borderRadius: '50%',
              boxShadow: '0 4px 15px rgba(37, 99, 235, 0.45)',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'scale(1.05)' },
            }}
          >
            <SearchIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        {/* ── Active AI NLP Intent Badge Strip ── */}
        {aiInterpretation && (
          <Box
            sx={{
              mt: 1,
              px: 2,
              py: 1,
              bgcolor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
              border: isDark ? '1px solid rgba(37, 99, 235, 0.3)' : '1px solid #BFDBFE',
              borderRadius: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1} sx={{ flex: 1, flexWrap: 'wrap' }}>
              <Chip
                size="small"
                icon={<SparklesIcon sx={{ fontSize: '12px !important', color: '#FFFFFF !important' }} />}
                label={aiInterpretation.isAiPowered ? 'Gemini AI Search' : 'Smart Intent'}
                sx={{
                  borderRadius: 0,
                  bgcolor: '#2563EB',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 10.5,
                  height: 22,
                }}
              />
              <Typography variant="caption" sx={{ fontWeight: 600, color: isDark ? '#E2E8F0' : '#1E293B', fontSize: 12 }}>
                {aiInterpretation.explanation}
              </Typography>

              {aiInterpretation.extractedFilters?.color && (
                <Chip
                  size="small"
                  label={`Color: ${aiInterpretation.extractedFilters.color}`}
                  sx={{ borderRadius: 0, height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#DBEAFE' }}
                />
              )}
              {aiInterpretation.extractedFilters?.maxPrice && (
                <Chip
                  size="small"
                  label={`Max: $${aiInterpretation.extractedFilters.maxPrice}`}
                  sx={{ borderRadius: 0, height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#DBEAFE' }}
                />
              )}
              {aiInterpretation.extractedFilters?.brand && (
                <Chip
                  size="small"
                  label={`Brand: ${aiInterpretation.extractedFilters.brand}`}
                  sx={{ borderRadius: 0, height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: isDark ? 'rgba(255,255,255,0.08)' : '#DBEAFE' }}
                />
              )}
              {aiInterpretation.extractedFilters?.inStock && (
                <Chip
                  size="small"
                  label="In Stock Only"
                  sx={{ borderRadius: 0, height: 20, fontSize: 10.5, fontWeight: 700, bgcolor: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
                />
              )}
            </Stack>

            <IconButton
              size="small"
              onClick={() => {
                setAiInterpretation(null)
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('clearAiSearch'))
                }
              }}
              sx={{ p: 0.25, color: isDark ? '#94A3B8' : '#64748B' }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        )}

        {/* ── Visual Search Modal (Gemini Vision) ── */}
        <VisualSearchModal
          open={visualModalOpen}
          onClose={() => setVisualModalOpen(false)}
          isDark={isDark}
        />

        {/* ── Faceted Filters Drawer ── */}
        <FacetedFilterDrawer
          open={filterDrawerOpen}
          onClose={() => setFilterDrawerOpen(false)}
          facets={searchFacets}
          isDark={isDark}
          onFilterChange={(appliedFilters) => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('applyFacetedFilters', { detail: appliedFilters }))
            }
          }}
          onResetFilters={() => {
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('clearFacetedFilters'))
            }
          }}
        />

        {/* ── 4. MEGA MENU POPOVER ── */}
        <StorefrontMegaMenu
          open={megaMenuOpen}
          onClose={() => setMegaMenuOpen(false)}
          categories={categories}
          selectedCategory={searchCategory}
          onSelectCategory={(catId) => {
            setSearchCategory(catId)
            setMegaMenuOpen(false)
            if (onSearchSubmit) onSearchSubmit(searchQuery)
          }}
          onSelectSubcategory={(subCatId) => {
            if (onSelectSubcategory) onSelectSubcategory(subCatId)
            setMegaMenuOpen(false)
            if (onSearchSubmit) onSearchSubmit(searchQuery)
          }}
          onApplyFilter={onApplyFilter}
          isDark={isDark}
          THEME={THEME}
        />

        {/* ── 5. LIVE SEARCH SUGGESTIONS & RECENT SEARCHES DROPDOWN ── */}
        {suggestionsOpen && !megaMenuOpen && (
          <Box
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1.25,
              bgcolor: isDark ? '#0A0F1D' : '#FFFFFF',
              color: isDark ? '#F1F5F9' : '#0F172A',
              borderRadius: 0,
              border: isDark ? '1px solid rgba(255,255,255,0.12)' : '1px solid #CBD5E1',
              boxShadow: isDark
                ? '0 24px 60px rgba(0,0,0,0.85), 0 0 25px rgba(37,99,235,0.15)'
                : '0 24px 60px rgba(15,23,42,0.18), 0 0 20px rgba(37,99,235,0.06)',
              overflow: 'hidden',
              zIndex: 1350,
              maxHeight: '65vh',
              overflowY: 'auto',
              animation: 'suggestionsSlideDown 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
              '@keyframes suggestionsSlideDown': {
                '0%': { opacity: 0, transform: 'translateY(-6px)' },
                '100%': { opacity: 1, transform: 'translateY(0)' },
              },
            }}
          >
            {/* ── Empty Query State: Recent Searches + Trending ── */}
            {!searchQuery.trim() && (
              <Box sx={{ p: 2.5 }}>
                {/* Recent Searches */}
                {recentSearches.length > 0 && (
                  <Box mb={2.5}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.25}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <HistoryIcon sx={{ fontSize: 16, color: THEME?.primary || '#2563EB' }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11.5, letterSpacing: 0.5, textTransform: 'uppercase', color: isDark ? '#94A3B8' : '#64748B' }}>
                          Recent Searches
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        onClick={clearAllRecent}
                        sx={{ fontSize: 11, fontWeight: 700, color: '#EF4444', textTransform: 'none', p: 0, minWidth: 0 }}
                      >
                        Clear All
                      </Button>
                    </Stack>

                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {recentSearches.map((term) => (
                        <Chip
                          key={term}
                          label={term}
                          size="small"
                          onClick={() => {
                            setSearchQuery(term)
                            handleExecuteSearch(term)
                          }}
                          onDelete={(e) => removeRecentSearch(e, term)}
                          deleteIcon={<CloseIcon sx={{ fontSize: 14 }} />}
                          sx={{
                            borderRadius: 0,
                            fontWeight: 600,
                            fontSize: 12,
                            bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                            color: isDark ? '#E2E8F0' : '#1E293B',
                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0',
                            '&:hover': {
                              bgcolor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF',
                              borderColor: THEME?.primary || '#2563EB',
                            },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Popular / Trending Searches */}
                <Box mb={2}>
                  <Stack direction="row" alignItems="center" spacing={1} mb={1.25}>
                    <TrendingIcon sx={{ fontSize: 16, color: '#F59E0B' }} />
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11.5, letterSpacing: 0.5, textTransform: 'uppercase', color: isDark ? '#94A3B8' : '#64748B' }}>
                      Popular Trending Searches
                    </Typography>
                  </Stack>

                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {TRENDING_TAGS.map((tag) => (
                      <Chip
                        key={tag}
                        label={tag}
                        size="small"
                        onClick={() => {
                          setSearchQuery(tag)
                          handleExecuteSearch(tag)
                        }}
                        sx={{
                          borderRadius: 0,
                          fontWeight: 600,
                          fontSize: 12,
                          bgcolor: isDark ? 'rgba(245, 158, 11, 0.08)' : '#FEF3C7',
                          color: isDark ? '#FBBF24' : '#B45309',
                          border: isDark ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(245, 158, 11, 0.3)',
                          cursor: 'pointer',
                          '&:hover': {
                            bgcolor: isDark ? 'rgba(245, 158, 11, 0.18)' : '#FDE68A',
                            borderColor: '#F59E0B',
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Quick Collections Shortcut */}
                <Box pt={1.5} borderTop={isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E2E8F0'}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 12 }}>
                      Looking for specific departments?
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => {
                        setMegaMenuOpen(true)
                        setSuggestionsOpen(false)
                      }}
                      endIcon={<ArrowForwardIcon sx={{ fontSize: 14 }} />}
                      sx={{
                        fontSize: 12,
                        fontWeight: 800,
                        textTransform: 'none',
                        color: THEME?.primary || '#2563EB',
                        p: 0,
                      }}
                    >
                      Open Mega Menu
                    </Button>
                  </Stack>
                </Box>
              </Box>
            )}

            {/* ── Active Query State: Matching Products, Categories & Stores ── */}
            {searchQuery.trim() && (
              <Box>
                {/* 1. Category matches */}
                {suggestions.categories.length > 0 && (
                  <Box sx={{ p: 1.5, px: 2, bgcolor: isDark ? '#060A14' : '#F8FAFC', borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#94A3B8' : '#64748B', display: 'block', mb: 1 }}>
                      Categories
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {suggestions.categories.map((cat) => (
                        <Chip
                          key={cat.id}
                          icon={getCategoryIcon(cat.code, cat.name)}
                          label={`In ${cat.name}`}
                          size="small"
                          onClick={() => {
                            setSearchCategory(String(cat.id))
                            handleExecuteSearch()
                          }}
                          sx={{
                            borderRadius: 0,
                            fontWeight: 700,
                            fontSize: 11.5,
                            bgcolor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#DBEAFE',
                            color: THEME?.primary || '#2563EB',
                            border: `1px solid ${isDark ? 'rgba(37, 99, 235, 0.3)' : 'rgba(37, 99, 235, 0.2)'}`,
                            cursor: 'pointer',
                            '&:hover': { bgcolor: THEME?.primary || '#2563EB', color: '#FFFFFF' },
                          }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* 2. Vendor / Store matches */}
                {suggestions.vendors.length > 0 && (
                  <Box sx={{ p: 1.5, px: 2, borderBottom: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E2E8F0' }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#94A3B8' : '#64748B', display: 'block', mb: 1 }}>
                      Verified Stores & Kitchens
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      {suggestions.vendors.map((vendor) => (
                        <Box
                          key={vendor.id}
                          onClick={() => {
                            if (onApplyFilter) onApplyFilter(`vendor:${vendor.businessName}`)
                            handleExecuteSearch()
                          }}
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            p: 0.75,
                            px: 1.25,
                            bgcolor: isDark ? 'rgba(255,255,255,0.04)' : '#F1F5F9',
                            border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1',
                            borderRadius: 0,
                            cursor: 'pointer',
                            '&:hover': {
                              borderColor: THEME?.secondary || '#06B6D4',
                              bgcolor: isDark ? 'rgba(6, 182, 212, 0.1)' : '#E0F2FE',
                            },
                          }}
                        >
                          <StoreIcon sx={{ fontSize: 16, color: '#06B6D4' }} />
                          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12 }}>
                            {vendor.businessName}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* 3. Products matches */}
                <Box sx={{ p: 1 }}>
                  {suggestions.products.length > 0 ? (
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, color: isDark ? '#94A3B8' : '#64748B', display: 'block', px: 1, py: 0.5 }}>
                        Matching Products ({suggestions.products.length})
                      </Typography>
                      {suggestions.products.map((p) => {
                        const img = Array.isArray(p.proImages) && p.proImages[0] ? p.proImages[0] : null
                        const hasDiscount = parseFloat(p.discount || 0) > 0 || (p.salePrice && parseFloat(p.salePrice) < parseFloat(p.price))
                        const displayPrice = p.salePrice || p.price

                        return (
                          <Box
                            key={p.proId}
                            onClick={() => handleSelectProduct(p)}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.25,
                              px: 1.5,
                              cursor: 'pointer',
                              borderRadius: 0,
                              transition: 'all 0.15s ease',
                              '&:hover': {
                                bgcolor: isDark ? 'rgba(37, 99, 235, 0.12)' : '#EFF6FF',
                              },
                            }}
                          >
                            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: 1 }}>
                              {img ? (
                                <Box
                                  component="img"
                                  src={img}
                                  alt={p.proName}
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    objectFit: 'cover',
                                    borderRadius: 0,
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #CBD5E1',
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <Box
                                  sx={{
                                    width: 44,
                                    height: 44,
                                    bgcolor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 0,
                                    flexShrink: 0,
                                  }}
                                >
                                  <CategoryIcon sx={{ fontSize: 20, color: isDark ? '#94A3B8' : '#64748B' }} />
                                </Box>
                              )}

                              <Box sx={{ minWidth: 0, flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 700,
                                    color: isDark ? '#FFFFFF' : '#0F172A',
                                    fontSize: 13,
                                  }}
                                  noWrap
                                >
                                  {p.proName}
                                </Typography>
                                <Stack direction="row" spacing={1} alignItems="center" mt={0.25}>
                                  {p.category?.name && (
                                    <Typography variant="caption" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontSize: 11 }}>
                                      {p.category.name}
                                    </Typography>
                                  )}
                                  {p.vendor?.username && (
                                    <>
                                      <Box sx={{ width: 3, height: 3, borderRadius: '50%', bgcolor: 'text.disabled' }} />
                                      <Typography variant="caption" sx={{ color: THEME?.primary || '#2563EB', fontWeight: 600, fontSize: 11 }}>
                                        {p.vendor.username}
                                      </Typography>
                                    </>
                                  )}
                                </Stack>
                              </Box>
                            </Stack>

                            {/* Price Column */}
                            <Box sx={{ textAlign: 'right', pl: 2, flexShrink: 0 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: isDark ? '#F1F5F9' : '#0F172A', fontSize: 13.5 }}>
                                ${Number(displayPrice).toFixed(2)}
                              </Typography>
                              {hasDiscount && (
                                <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                                  <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.disabled', fontSize: 10.5 }}>
                                    ${Number(p.price).toFixed(2)}
                                  </Typography>
                                  <Chip
                                    label={`-${p.discount || 10}%`}
                                    size="small"
                                    sx={{
                                      height: 16,
                                      fontSize: 9,
                                      fontWeight: 900,
                                      bgcolor: '#EF4444',
                                      color: '#FFFFFF',
                                      borderRadius: 0,
                                      px: 0.25,
                                    }}
                                  />
                                </Stack>
                              )}
                            </Box>
                          </Box>
                        )
                      })}
                    </Box>
                  ) : (
                    !loadingSuggestions && (
                      <Box sx={{ py: 3, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: isDark ? '#94A3B8' : '#64748B', fontWeight: 600 }}>
                          No direct product matches for "{searchQuery}"
                        </Typography>
                        <Typography variant="caption" sx={{ color: isDark ? '#64748B' : '#94A3B8', display: 'block', mt: 0.5 }}>
                          Press Enter to search all departments and descriptions
                        </Typography>
                      </Box>
                    )
                  )}
                </Box>

                {/* Footer: View all results bar */}
                <Box
                  onClick={() => handleExecuteSearch()}
                  sx={{
                    p: 1.5,
                    bgcolor: isDark ? '#060A14' : '#F1F5F9',
                    borderTop: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #CBD5E1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: isDark ? 'rgba(37, 99, 235, 0.15)' : '#EFF6FF' },
                  }}
                >
                  <Typography variant="caption" sx={{ fontWeight: 800, fontSize: 12, color: THEME?.primary || '#2563EB' }}>
                    Press Enter to view all results for "{searchQuery}"
                  </Typography>
                  <ArrowForwardIcon sx={{ fontSize: 16, color: THEME?.primary || '#2563EB' }} />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </ClickAwayListener>
  )
}
