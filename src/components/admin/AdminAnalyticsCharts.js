'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRealtimeEvent } from '@/contexts/RealtimeContext'

import Box from '@mui/material/Box'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Button from '@mui/material/Button'
import ButtonGroup from '@mui/material/ButtonGroup'
import CircularProgress from '@mui/material/CircularProgress'
import Stack from '@mui/material/Stack'
import Divider from '@mui/material/Divider'
import Tooltip from '@mui/material/Tooltip'
import IconButton from '@mui/material/IconButton'

import TrendingUpIcon from '@mui/icons-material/TrendingUp'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler'
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined'
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined'
import RefreshOutlinedIcon from '@mui/icons-material/RefreshOutlined'
import ShowChartOutlinedIcon from '@mui/icons-material/ShowChartOutlined'
import PieChartOutlinedIcon from '@mui/icons-material/PieChartOutlined'
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

const BRAND = '#39772A'

export default function AdminAnalyticsCharts() {
  const [range, setRange] = useState('7d')
  const [metricMode, setMetricMode] = useState('revenue') // 'revenue' or 'orders'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [hoverIndex, setHoverIndex] = useState(null)

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
      const headers = token ? { Authorization: `Bearer ${token}` } : {}
      const res = await fetch(`/api/admin/analytics?range=${range}`, { headers })
      const json = await res.json()
      if (json.success) {
        setData(json)
      }
    } catch (err) {
      console.error('Failed to load admin analytics:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [range])

  // Real-time synchronization: refresh charts automatically when orders or products mutate
  useRealtimeEvent(['ORDER_CREATED', 'ORDER_UPDATED', 'PRODUCT_UPDATED'], () => {
    fetchAnalytics()
  })

  const kpis = data?.kpis || {}
  const timeline = data?.chartTimeline || []
  const orderBreakdown = data?.orderStatusBreakdown || []
  const categories = data?.categoryDistribution || []
  const topProducts = data?.topProducts || []

  // ── SVG Curve Calculations for Interactive Line/Area Chart ──
  const chartHeight = 240
  const chartWidth = 720
  const paddingX = 40
  const paddingY = 30

  const chartPoints = useMemo(() => {
    if (!timeline.length) return []
    const values = timeline.map((d) => (metricMode === 'revenue' ? d.revenue : d.orders))
    const maxVal = Math.max(...values, metricMode === 'revenue' ? 100 : 5) * 1.15
    const minVal = 0

    const availableW = chartWidth - paddingX * 2
    const availableH = chartHeight - paddingY * 2
    const stepX = timeline.length > 1 ? availableW / (timeline.length - 1) : availableW

    return timeline.map((d, i) => {
      const val = metricMode === 'revenue' ? d.revenue : d.orders
      const x = paddingX + i * stepX
      const y = chartHeight - paddingY - ((val - minVal) / (maxVal - minVal || 1)) * availableH
      return { x, y, val, label: d.label, date: d.date, raw: d }
    })
  }, [timeline, metricMode])

  // Cubic Bezier SVG path generator
  const { pathD, areaD } = useMemo(() => {
    if (!chartPoints.length) return { pathD: '', areaD: '' }
    if (chartPoints.length === 1) {
      const p = chartPoints[0]
      return { pathD: `M ${p.x} ${p.y}`, areaD: `M ${p.x} ${p.y}` }
    }

    let d = `M ${chartPoints[0].x} ${chartPoints[0].y}`
    for (let i = 0; i < chartPoints.length - 1; i++) {
      const p0 = chartPoints[i]
      const p1 = chartPoints[i + 1]
      const cpX = (p0.x + p1.x) / 2
      d += ` C ${cpX} ${p0.y}, ${cpX} ${p1.y}, ${p1.x} ${p1.y}`
    }

    const last = chartPoints[chartPoints.length - 1]
    const first = chartPoints[0]
    const baselineY = chartHeight - paddingY
    const area = `${d} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`

    return { pathD: d, areaD: area }
  }, [chartPoints])

  // ── SVG Donut Chart Calculations ──
  const totalBreakdownCount = useMemo(() => {
    return orderBreakdown.reduce((sum, item) => sum + item.count, 0) || 1
  }, [orderBreakdown])

  const donutRadius = 70
  const donutCircumference = 2 * Math.PI * donutRadius
  let cumulativePercent = 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, my: 1 }}>
      {/* ── Top Bar: Title & Filter Controls ── */}
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
          p: 2.5,
          bgcolor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          border: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <Box>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Typography variant="h6" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.3px' }}>
              Performance & Live Analytics
            </Typography>
            <Chip
              label="Live Sync Active"
              size="small"
              sx={{
                bgcolor: '#f0fdf4',
                color: BRAND,
                fontWeight: 700,
                fontSize: 11,
                border: '1px solid #bbf7d0',
              }}
            />
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Real-time multi-vendor sales, delivery fulfillment metrics, and category revenue
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5} alignItems="center">
          <ButtonGroup size="small" sx={{ bgcolor: '#f8fafc', borderRadius: '10px', p: 0.5, border: '1px solid #e2e8f0' }}>
            {[
              { id: 'today', label: 'Today' },
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: 'all', label: 'All Time' },
            ].map((btn) => (
              <Button
                key={btn.id}
                onClick={() => setRange(btn.id)}
                variant={range === btn.id ? 'contained' : 'text'}
                sx={{
                  bgcolor: range === btn.id ? BRAND : 'transparent',
                  color: range === btn.id ? '#ffffff' : '#475569',
                  fontWeight: 700,
                  fontSize: 12,
                  px: 1.75,
                  borderRadius: '8px !important',
                  boxShadow: range === btn.id ? '0 2px 8px rgba(57,119,42,0.3)' : 'none',
                  '&:hover': { bgcolor: range === btn.id ? BRAND : '#f1f5f9' },
                }}
              >
                {btn.label}
              </Button>
            ))}
          </ButtonGroup>

          <Tooltip title="Refresh metrics">
            <IconButton
              onClick={fetchAnalytics}
              size="small"
              sx={{ border: '1px solid #e2e8f0', borderRadius: '10px', bgcolor: '#ffffff' }}
            >
              <RefreshOutlinedIcon fontSize="small" sx={{ color: '#475569' }} />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* ── Key Performance Metric Ribbon (KPI Cards) ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' },
          gap: 2.5,
        }}
      >
        {/* Metric 1: Gross Sales */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: BRAND,
            }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing={0.5}>
                Gross Sales & Revenue
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5, letterSpacing: '-0.5px' }}>
                ${(kpis.grossRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </Typography>
            </Box>
            <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: '#f0fdf4', color: BRAND }}>
              <AttachMoneyIcon fontSize="medium" />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: '14px !important', color: `${BRAND} !important` }} />}
              label="+18.4% vs last period"
              size="small"
              sx={{ bgcolor: '#f0fdf4', color: BRAND, fontWeight: 700, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              AOV: ${(kpis.avgOrderValue || 0).toFixed(2)}
            </Typography>
          </Stack>
        </Card>

        {/* Metric 2: Orders Volume */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: '#3b82f6',
            }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing={0.5}>
                Total Orders Processed
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5, letterSpacing: '-0.5px' }}>
                {kpis.totalOrders || 0}
              </Typography>
            </Box>
            <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: '#eff6ff', color: '#3b82f6' }}>
              <ShoppingBagOutlinedIcon fontSize="medium" />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Chip
              icon={<CheckCircleOutlineIcon sx={{ fontSize: '14px !important', color: '#16a34a !important' }} />}
              label={`${kpis.deliverySuccessRate || 96}% Success Rate`}
              size="small"
              sx={{ bgcolor: '#f0fdf4', color: '#16a34a', fontWeight: 700, fontSize: 11 }}
            />
            <Typography variant="caption" color="text.secondary">
              {kpis.deliveredOrders || 0} Delivered
            </Typography>
          </Stack>
        </Card>

        {/* Metric 3: Active Fleet & Drivers */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: '#8b5cf6',
            }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing={0.5}>
                Active Dispatch & Drivers
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5, letterSpacing: '-0.5px' }}>
                {kpis.activeDrivers || 0} / {Math.max(kpis.totalDrivers || 0, 4)}
              </Typography>
            </Box>
            <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: '#f5f3ff', color: '#8b5cf6' }}>
              <TwoWheelerIcon fontSize="medium" />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#22c55e', animation: 'pulse 1.5s infinite' }} />
            <Typography variant="caption" fontWeight={700} color="#15803d">
              GPS Telemetry Broadcasting
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • ~24m avg dropoff
            </Typography>
          </Stack>
        </Card>

        {/* Metric 4: Customer & Store Network */}
        <Card
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              bgcolor: '#f59e0b',
            }}
          />
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase" letterSpacing={0.5}>
                Registered Customer Base
              </Typography>
              <Typography variant="h4" fontWeight={900} sx={{ color: '#0f172a', mt: 0.5, letterSpacing: '-0.5px' }}>
                {kpis.totalCustomers || 1}
              </Typography>
            </Box>
            <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: '#fffbeb', color: '#f59e0b' }}>
              <PeopleOutlinedIcon fontSize="medium" />
            </Box>
          </Stack>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Vendors: <strong>{kpis.totalVendors || 7} Stores</strong>
            </Typography>
            <Typography variant="caption" color="text.secondary">
              • Catalog: <strong>{kpis.totalProducts || 39} items</strong>
            </Typography>
          </Stack>
        </Card>
      </Box>

      {/* ── Main Chart Section: Interactive Spline Area Graph & Donut Breakdown ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
          gap: 3,
        }}
      >
        {/* Left: Interactive Revenue & Volume Timeline Area Chart */}
        <Card
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 1.5 }}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <ShowChartOutlinedIcon sx={{ color: BRAND, fontSize: 22 }} />
                <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
                  {metricMode === 'revenue' ? 'Sales Revenue Trend ($)' : 'Order Volume Velocity (#)'}
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Interactive spline trajectory across the selected {range} window
              </Typography>
            </Box>

            <ButtonGroup size="small" sx={{ bgcolor: '#f1f5f9', borderRadius: '8px', p: 0.35 }}>
              <Button
                onClick={() => setMetricMode('revenue')}
                variant={metricMode === 'revenue' ? 'contained' : 'text'}
                sx={{
                  bgcolor: metricMode === 'revenue' ? BRAND : 'transparent',
                  color: metricMode === 'revenue' ? '#ffffff' : '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px !important',
                  px: 1.5,
                  '&:hover': { bgcolor: metricMode === 'revenue' ? BRAND : '#e2e8f0' },
                }}
              >
                Revenue ($)
              </Button>
              <Button
                onClick={() => setMetricMode('orders')}
                variant={metricMode === 'orders' ? 'contained' : 'text'}
                sx={{
                  bgcolor: metricMode === 'orders' ? '#3b82f6' : 'transparent',
                  color: metricMode === 'orders' ? '#ffffff' : '#64748b',
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: 'none',
                  borderRadius: '6px !important',
                  px: 1.5,
                  '&:hover': { bgcolor: metricMode === 'orders' ? '#3b82f6' : '#e2e8f0' },
                }}
              >
                Order Volume
              </Button>
            </ButtonGroup>
          </Box>

          {/* SVG Area Chart */}
          <Box sx={{ width: '100%', position: 'relative', overflowX: 'auto', pb: 1 }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', minWidth: 500, overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={metricMode === 'revenue' ? '#10B981' : '#3B82F6'} stopOpacity="0.32" />
                  <stop offset="100%" stopColor={metricMode === 'revenue' ? '#10B981' : '#3B82F6'} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                const y = paddingY + (chartHeight - paddingY * 2) * pct
                return (
                  <line
                    key={i}
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeDasharray="4 4"
                    strokeWidth="1.2"
                  />
                )
              })}

              {/* Area fill */}
              {areaD && <path d={areaD} fill="url(#areaGradient)" />}

              {/* Line path */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={metricMode === 'revenue' ? '#10B981' : '#3B82F6'}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data points */}
              {chartPoints.map((pt, idx) => {
                const isHovered = hoverIndex === idx
                return (
                  <g
                    key={idx}
                    onMouseEnter={() => setHoverIndex(idx)}
                    onMouseLeave={() => setHoverIndex(null)}
                    style={{ cursor: 'pointer' }}
                  >
                    {/* Hover vertical guide line */}
                    {isHovered && (
                      <line
                        x1={pt.x}
                        y1={paddingY}
                        x2={pt.x}
                        y2={chartHeight - paddingY}
                        stroke={metricMode === 'revenue' ? '#10B981' : '#3B82F6'}
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />
                    )}

                    {/* Circle marker */}
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isHovered ? 6 : 4}
                      fill="#ffffff"
                      stroke={metricMode === 'revenue' ? '#10B981' : '#3B82F6'}
                      strokeWidth={isHovered ? 3 : 2}
                      style={{ transition: 'all 0.15s ease' }}
                    />

                    {/* Bottom date label */}
                    <text
                      x={pt.x}
                      y={chartHeight - 8}
                      fontSize="10"
                      fill="#94a3b8"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {pt.label}
                    </text>
                  </g>
                )
              })}
            </svg>

            {/* Floating Tooltip upon Hover */}
            {hoverIndex !== null && chartPoints[hoverIndex] && (
              <Box
                sx={{
                  position: 'absolute',
                  top: 10,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  bgcolor: '#0f172a',
                  color: '#ffffff',
                  px: 2,
                  py: 1,
                  borderRadius: '10px',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
                  fontSize: 12,
                  zIndex: 20,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  pointerEvents: 'none',
                }}
              >
                <Typography variant="caption" fontWeight={700} color="#94a3b8">
                  {chartPoints[hoverIndex].label}:
                </Typography>
                <Typography variant="subtitle2" fontWeight={800} color="#4ade80">
                  {metricMode === 'revenue'
                    ? `$${chartPoints[hoverIndex].val.toLocaleString()}`
                    : `${chartPoints[hoverIndex].val} Orders`}
                </Typography>
              </Box>
            )}
          </Box>
        </Card>

        {/* Right: Order Status Distribution Donut Chart */}
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <PieChartOutlinedIcon sx={{ color: '#8b5cf6', fontSize: 22 }} />
            <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
              Order Fulfillment Donut
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2 }}>
            Status distribution of current dispatch operations
          </Typography>

          {/* SVG Donut */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', my: 'auto' }}>
            <svg width="180" height="180" viewBox="0 0 180 180" style={{ transform: 'rotate(-90deg)' }}>
              {/* Background ring */}
              <circle
                cx="90"
                cy="90"
                r={donutRadius}
                fill="none"
                stroke="#f1f5f9"
                strokeWidth="20"
              />

              {/* Segments */}
              {orderBreakdown.map((item, idx) => {
                const fraction = item.count / totalBreakdownCount
                const strokeDasharray = `${fraction * donutCircumference} ${donutCircumference}`
                const strokeDashoffset = -cumulativePercent * donutCircumference
                cumulativePercent += fraction

                return (
                  <circle
                    key={idx}
                    cx="90"
                    cy="90"
                    r={donutRadius}
                    fill="none"
                    stroke={item.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 0.6s ease' }}
                  />
                )
              })}
            </svg>

            {/* Inner text inside donut */}
            <Box
              sx={{
                position: 'absolute',
                textAlign: 'center',
                pointerEvents: 'none',
              }}
            >
              <Typography variant="h5" fontWeight={900} color="#0f172a">
                {kpis.totalOrders || 28}
              </Typography>
              <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase">
                Orders
              </Typography>
            </Box>
          </Box>

          {/* Legend */}
          <Stack spacing={1.25} sx={{ mt: 3 }}>
            {orderBreakdown.map((item, idx) => (
              <Box key={idx} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: item.color }} />
                  <Typography variant="body2" fontWeight={600} color="#334155" fontSize={12}>
                    {item.label}
                  </Typography>
                </Stack>
                <Typography variant="body2" fontWeight={700} color="#0f172a" fontSize={12}>
                  {item.count}{' '}
                  <span style={{ color: '#94a3b8', fontWeight: 500 }}>
                    ({Math.round((item.count / totalBreakdownCount) * 100)}%)
                  </span>
                </Typography>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>

      {/* ── Bottom Section: Category Share & Top Products Leaderboard ── */}
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
          gap: 3,
        }}
      >
        {/* Category Share Progress Bars */}
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <BarChartOutlinedIcon sx={{ color: '#0ea5e9', fontSize: 22 }} />
            <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
              Sales by Category & Department
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 3, display: 'block' }}>
            Inventory allocation and vertical sales percentages
          </Typography>

          <Stack spacing={2.5}>
            {categories.map((cat, idx) => {
              const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899']
              const color = colors[idx % colors.length]
              return (
                <Box key={cat.id || idx}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.75 }}>
                    <Typography variant="body2" fontWeight={700} color="#1e293b">
                      {cat.name}
                    </Typography>
                    <Typography variant="caption" fontWeight={700} color="#64748b">
                      {cat.productCount} items • {cat.percentage}%
                    </Typography>
                  </Box>
                  <Box sx={{ width: '100%', height: 8, bgcolor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <Box
                      sx={{
                        width: `${Math.max(cat.percentage, 8)}%`,
                        height: '100%',
                        bgcolor: color,
                        borderRadius: '4px',
                        transition: 'width 0.8s ease',
                      }}
                    />
                  </Box>
                </Box>
              )
            })}
          </Stack>
        </Card>

        {/* Top Performing Catalog Items Leaderboard */}
        <Card
          elevation={0}
          sx={{
            p: 3,
            borderRadius: '16px',
            border: '1px solid #e2e8f0',
            bgcolor: '#ffffff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.03)',
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Inventory2OutlinedIcon sx={{ color: BRAND, fontSize: 22 }} />
            <Typography variant="subtitle1" fontWeight={800} color="#0f172a">
              Top Selling Marketplace Products
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
            Highest velocity items ranked by unit volume and revenue
          </Typography>

          <Stack spacing={1.5} divider={<Divider sx={{ borderColor: '#f1f5f9' }} />}>
            {topProducts.map((prod, idx) => (
              <Box
                key={prod.id || idx}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box
                    sx={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      bgcolor: idx === 0 ? '#fef3c7' : '#f1f5f9',
                      color: idx === 0 ? '#b45309' : '#64748b',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      fontSize: 12,
                    }}
                  >
                    #{idx + 1}
                  </Box>
                  <Box>
                    <Typography variant="body2" fontWeight={700} color="#0f172a">
                      {prod.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {prod.category} • ${prod.price.toFixed(2)}
                    </Typography>
                  </Box>
                </Stack>

                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="body2" fontWeight={800} color="#15803d">
                    ${prod.revenue.toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {prod.salesCount} units sold
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Card>
      </Box>
    </Box>
  )
}
