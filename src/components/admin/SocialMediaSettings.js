'use client'

import React, { useState, useEffect } from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'
import TextField from '@mui/material/TextField'
import Switch from '@mui/material/Switch'
import IconButton from '@mui/material/IconButton'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import CircularProgress from '@mui/material/CircularProgress'
import Alert from '@mui/material/Alert'
import Tooltip from '@mui/material/Tooltip'
import Paper from '@mui/material/Paper'

import AddIcon from '@mui/icons-material/Add'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward'
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward'
import OpenInNewIcon from '@mui/icons-material/OpenInNew'
import RefreshIcon from '@mui/icons-material/Refresh'
import ShareOutlinedIcon from '@mui/icons-material/ShareOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'

import SocialIcon, { SOCIAL_PRESETS } from '@/components/common/SocialIcon'

const BRAND = '#39772A'
const BRAND_DARK = '#4ade80'

export default function SocialMediaSettings() {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [successMsg, setSuccessMsg] = useState(null)

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    link: '',
    icon: 'facebook',
    customIconUrl: '',
    isActive: true,
    sortOrder: 0,
  })

  // Delete Confirm Dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState(null)

  const fetchLinks = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/social-links')
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to fetch social media links')
      }
      setLinks(json.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLinks()
  }, [])

  const handleOpenAdd = () => {
    const nextOrder = links.length > 0 ? Math.max(...links.map(l => l.sortOrder ?? 0)) + 1 : 0
    setEditingItem(null)
    setFormData({
      title: '',
      link: 'https://',
      icon: 'facebook',
      customIconUrl: '',
      isActive: true,
      sortOrder: nextOrder,
    })
    setDialogOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    const isPreset = SOCIAL_PRESETS.some(p => p.id === item.icon)
    setFormData({
      title: item.title,
      link: item.link,
      icon: isPreset ? item.icon : 'custom',
      customIconUrl: isPreset ? '' : item.icon,
      isActive: item.isActive,
      sortOrder: item.sortOrder ?? 0,
    })
    setDialogOpen(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) {
      setError('Please provide a title for this account')
      return
    }
    if (!formData.link.trim() || formData.link === 'https://') {
      setError('Please provide a valid destination URL')
      return
    }

    const finalIcon = formData.icon === 'custom' 
      ? (formData.customIconUrl.trim() || 'globe')
      : formData.icon

    try {
      setSaving(true)
      setError(null)

      if (editingItem) {
        // PUT update
        const res = await fetch(`/api/admin/social-links/${editingItem.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            link: formData.link,
            icon: finalIcon,
            isActive: formData.isActive,
            sortOrder: formData.sortOrder,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update')
        setSuccessMsg(`Updated "${formData.title}" successfully!`)
      } else {
        // POST create
        const res = await fetch('/api/admin/social-links', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            link: formData.link,
            icon: finalIcon,
            isActive: formData.isActive,
            sortOrder: formData.sortOrder,
          }),
        })
        const json = await res.json()
        if (!res.ok || !json.success) throw new Error(json.error || 'Failed to create')
        setSuccessMsg(`Added "${formData.title}" successfully!`)
      }

      setDialogOpen(false)
      fetchLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    try {
      setSaving(true)
      setError(null)
      const res = await fetch(`/api/admin/social-links/${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to delete')
      setSuccessMsg('Social account removed successfully!')
      setDeleteConfirmId(null)
      fetchLinks()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (item) => {
    try {
      const newActive = !item.isActive
      // Optimistic update
      setLinks(prev => prev.map(l => l.id === item.id ? { ...l, isActive: newActive } : l))

      const res = await fetch(`/api/admin/social-links/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newActive }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to toggle status')
      }
    } catch (err) {
      setError(err.message)
      fetchLinks()
    }
  }

  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction
    if (targetIndex < 0 || targetIndex >= links.length) return

    const newLinks = [...links]
    const temp = newLinks[index]
    newLinks[index] = newLinks[targetIndex]
    newLinks[targetIndex] = temp

    // Reassign sortOrder sequentially
    const updatedItems = newLinks.map((l, i) => ({ id: l.id, sortOrder: i }))
    setLinks(newLinks.map((l, i) => ({ ...l, sortOrder: i })))

    try {
      const res = await fetch('/api/admin/social-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedItems }),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.error || 'Failed to update order')
    } catch (err) {
      setError(err.message)
      fetchLinks()
    }
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Notifications */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {successMsg && (
        <Alert severity="success" icon={<CheckCircleOutlineIcon fontSize="inherit" />} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {/* Action Header Card */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            display: 'flex',
            flexDirection: { xs: 'column', sm: 'row' },
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', sm: 'center' },
            gap: 2,
            bgcolor: (theme) => theme.palette.mode === 'dark' ? 'background.paper' : '#f8fafc',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
              sx={{
                width: 42,
                height: 42,
                borderRadius: 2,
                bgcolor: '#39772A15',
                color: BRAND,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShareOutlinedIcon />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                Social Media Management
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Configure official brand channels dynamically rendered in the website footer and mobile app
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5, alignSelf: { xs: 'stretch', sm: 'center' } }}>
            <Button
              variant="outlined"
              size="small"
              onClick={fetchLinks}
              startIcon={<RefreshIcon />}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleOpenAdd}
              startIcon={<AddIcon />}
              sx={{
                bgcolor: BRAND,
                '&:hover': { bgcolor: '#2e6122' },
                textTransform: 'none',
                fontWeight: 700,
                px: 2,
              }}
            >
              Add Social Account
            </Button>
          </Box>
        </Box>
      </Card>

      {/* Live Footer Preview Box */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2.5 }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="subtitle2" fontWeight={700} color="text.primary">
              Live Customer Footer Preview
            </Typography>
            <Typography variant="caption" color="text.secondary">
              This is how your active social links appear to visitors on the storefront
            </Typography>
          </Box>
          <Chip
            size="small"
            label={`${links.filter(l => l.isActive).length} Active`}
            color="success"
            variant="outlined"
          />
        </Box>

        {/* Dual Mode Preview */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
          {/* Light Theme Footer Preview */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#f1f5f9',
              border: '1px solid #cbd5e1',
            }}
          >
            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
              Light Mode Storefront
            </Typography>
            <div className="flex flex-wrap items-center gap-2">
              {links.filter(l => l.isActive).length === 0 ? (
                <span className="text-xs text-slate-400 italic">No active links configured</span>
              ) : (
                links.filter(l => l.isActive).map(link => (
                  <a
                    key={link.id}
                    href={link.link}
                    target="_blank"
                    rel="noreferrer"
                    title={link.title}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-white hover:bg-blue-600 text-slate-600 hover:text-white border border-slate-200 shadow-sm transition-all"
                  >
                    <SocialIcon icon={link.icon} size={16} />
                  </a>
                ))
              )}
            </div>
          </Paper>

          {/* Dark Theme Footer Preview */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
              borderRadius: 2,
              bgcolor: '#0a0f1d',
              border: '1px solid #1e293b',
            }}
          >
            <Typography variant="caption" fontWeight={700} color="#94a3b8" sx={{ display: 'block', mb: 1.5 }}>
              Dark Mode Storefront
            </Typography>
            <div className="flex flex-wrap items-center gap-2">
              {links.filter(l => l.isActive).length === 0 ? (
                <span className="text-xs text-slate-500 italic">No active links configured</span>
              ) : (
                links.filter(l => l.isActive).map(link => (
                  <a
                    key={link.id}
                    href={link.link}
                    target="_blank"
                    rel="noreferrer"
                    title={link.title}
                    className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-800 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700 transition-all"
                  >
                    <SocialIcon icon={link.icon} size={16} />
                  </a>
                ))
              )}
            </div>
          </Paper>
        </Box>
      </Card>

      {/* Accounts List Table / Cards */}
      <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="subtitle1" fontWeight={700} color="text.primary">
            Configured Accounts ({links.length})
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Use arrows to reorder display sequence
          </Typography>
        </Box>

        <CardContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ p: 6, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={32} sx={{ color: BRAND }} />
              <Typography color="text.secondary">Loading social accounts…</Typography>
            </Box>
          ) : links.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <ShareOutlinedIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.4, mb: 1 }} />
              <Typography variant="h6" fontWeight={600} color="text.secondary">
                No Social Media Accounts Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Click below to add your first social media link (Facebook, Instagram, YouTube, etc.)
              </Typography>
              <Button
                variant="contained"
                onClick={handleOpenAdd}
                startIcon={<AddIcon />}
                sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#2e6122' }, textTransform: 'none' }}
              >
                Add Account
              </Button>
            </Box>
          ) : (
            <Box component="div" sx={{ divideY: '1px solid', divideColor: 'divider' }}>
              {links.map((item, index) => {
                const preset = SOCIAL_PRESETS.find(p => p.id === item.icon)
                return (
                  <Box
                    key={item.id}
                    sx={{
                      p: 2,
                      display: 'flex',
                      flexDirection: { xs: 'column', md: 'row' },
                      alignItems: { xs: 'flex-start', md: 'center' },
                      justifyContent: 'space-between',
                      gap: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:hover': { bgcolor: 'action.hover' },
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    {/* Left: Reorder buttons + Icon badge + Info */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, minWidth: 0 }}>
                      {/* Move up / down buttons */}
                      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => handleMoveOrder(index, -1)}
                          sx={{ p: 0.25 }}
                        >
                          <ArrowUpwardIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                        <IconButton
                          size="small"
                          disabled={index === links.length - 1}
                          onClick={() => handleMoveOrder(index, 1)}
                          sx={{ p: 0.25 }}
                        >
                          <ArrowDownwardIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Box>

                      {/* Branded Icon Badge */}
                      <Box
                        sx={{
                          width: 44,
                          height: 44,
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: preset?.bgColor || '#f1f5f9',
                          color: preset?.color || '#334155',
                          border: '1px solid',
                          borderColor: preset ? `${preset.color}30` : '#e2e8f0',
                          flexShrink: 0,
                        }}
                      >
                        <SocialIcon icon={item.icon} size={22} />
                      </Box>

                      {/* Title & Link */}
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body1" fontWeight={700} color="text.primary" noWrap>
                            {item.title}
                          </Typography>
                          <Chip
                            size="small"
                            label={item.icon}
                            sx={{ height: 20, fontSize: '0.68rem', textTransform: 'capitalize' }}
                          />
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <Typography
                            variant="body2"
                            color="text.secondary"
                            noWrap
                            sx={{
                              maxWidth: { xs: 200, sm: 350, md: 500 },
                              fontSize: '0.8125rem',
                            }}
                          >
                            {item.link}
                          </Typography>
                          <IconButton
                            size="small"
                            component="a"
                            href={item.link}
                            target="_blank"
                            rel="noreferrer"
                            sx={{ p: 0.25, color: 'text.secondary', '&:hover': { color: BRAND } }}
                          >
                            <OpenInNewIcon sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                      </Box>
                    </Box>

                    {/* Right: Active switch + Edit + Delete */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, alignSelf: { xs: 'flex-end', md: 'center' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" fontWeight={600} color={item.isActive ? 'success.main' : 'text.disabled'}>
                          {item.isActive ? 'Active' : 'Disabled'}
                        </Typography>
                        <Switch
                          checked={item.isActive}
                          onChange={() => handleToggleActive(item)}
                          color="success"
                          size="small"
                        />
                      </Box>

                      <Tooltip title="Edit">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenEdit(item)}
                          sx={{
                            color: 'primary.main',
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'primary.light', color: '#fff' },
                          }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirmId(item.id)}
                          sx={{
                            color: 'error.main',
                            bgcolor: 'action.hover',
                            '&:hover': { bgcolor: 'error.main', color: '#fff' },
                          }}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Add / Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          {editingItem ? 'Edit Social Account' : 'Add New Social Account'}
        </DialogTitle>
        <Box component="form" onSubmit={handleSave}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {/* Title */}
            <TextField
              label="Account / Platform Title"
              placeholder="e.g. Facebook, Official Instagram, TikTok"
              fullWidth
              size="small"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />

            {/* Destination URL */}
            <TextField
              label="Destination Link (URL)"
              placeholder="https://instagram.com/martzona"
              fullWidth
              size="small"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
              required
              helperText="Full web link where customers will be redirected when clicking the icon"
            />

            {/* Icon Selection */}
            <Box>
              <Typography variant="subtitle2" fontWeight={700} color="text.primary" sx={{ mb: 1 }}>
                Select Icon / Platform
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))',
                  gap: 1,
                  p: 1.5,
                  bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc',
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {SOCIAL_PRESETS.map((preset) => {
                  const isSelected = formData.icon === preset.id
                  return (
                    <Box
                      key={preset.id}
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          icon: preset.id,
                          link: prev.link === 'https://' || !prev.link ? preset.defaultUrl : prev.link,
                          title: !prev.title || SOCIAL_PRESETS.some(p => p.label === prev.title) ? preset.label : prev.title,
                        }))
                      }}
                      sx={{
                        p: 1,
                        borderRadius: 1.5,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 0.5,
                        cursor: 'pointer',
                        border: '2px solid',
                        borderColor: isSelected ? BRAND : 'transparent',
                        bgcolor: isSelected ? (theme => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff') : 'transparent',
                        boxShadow: isSelected ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                        transition: 'all 0.15s ease',
                        '&:hover': {
                          borderColor: isSelected ? BRAND : 'divider',
                          bgcolor: 'action.hover',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: preset.bgColor,
                          color: preset.color,
                        }}
                      >
                        <SocialIcon icon={preset.id} size={18} />
                      </Box>
                      <Typography variant="caption" fontWeight={isSelected ? 700 : 500} textAlign="center" noWrap sx={{ width: '100%', fontSize: '0.68rem' }}>
                        {preset.label}
                      </Typography>
                    </Box>
                  )
                })}

                {/* Custom Icon Option */}
                <Box
                  onClick={() => setFormData({ ...formData, icon: 'custom' })}
                  sx={{
                    p: 1,
                    borderRadius: 1.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 0.5,
                    cursor: 'pointer',
                    border: '2px solid',
                    borderColor: formData.icon === 'custom' ? BRAND : 'transparent',
                    bgcolor: formData.icon === 'custom' ? (theme => theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff') : 'transparent',
                    boxShadow: formData.icon === 'custom' ? '0 2px 8px rgba(0,0,0,0.08)' : 'none',
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: formData.icon === 'custom' ? BRAND : 'divider',
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 32,
                      height: 32,
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: '#f1f5f9',
                      color: '#475569',
                    }}
                  >
                    <ShareOutlinedIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Typography variant="caption" fontWeight={formData.icon === 'custom' ? 700 : 500} textAlign="center" noWrap sx={{ width: '100%', fontSize: '0.68rem' }}>
                    Custom URL
                  </Typography>
                </Box>
              </Box>

              {/* If Custom Icon Selected */}
              {formData.icon === 'custom' && (
                <TextField
                  label="Custom Icon Image URL"
                  placeholder="https://example.com/icon.svg or /images/..."
                  fullWidth
                  size="small"
                  value={formData.customIconUrl}
                  onChange={(e) => setFormData({ ...formData, customIconUrl: e.target.value })}
                  sx={{ mt: 1.5 }}
                  helperText="Enter direct HTTPS URL or local public path to an SVG or PNG icon"
                />
              )}
            </Box>

            {/* Display Order & Active Toggle */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, alignItems: 'center' }}>
              <TextField
                label="Sort Order"
                type="number"
                size="small"
                value={formData.sortOrder}
                onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 0 })}
                helperText="Lower numbers appear first"
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, pt: 1 }}>
                <Switch
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  color="success"
                />
                <Box>
                  <Typography variant="body2" fontWeight={600}>
                    {formData.isActive ? 'Active & Visible' : 'Hidden'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Show in website footer
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Preview of Button */}
            <Box sx={{ p: 2, bgcolor: (theme) => theme.palette.mode === 'dark' ? '#0f172a' : '#f8fafc', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                Preview Button:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: '#ffffff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }}
                >
                  <SocialIcon
                    icon={formData.icon === 'custom' ? formData.customIconUrl : formData.icon}
                    size={18}
                  />
                </Box>
                <Typography variant="body2" fontWeight={600} color="text.primary">
                  {formData.title || 'Untitled Social Link'}
                </Typography>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button
              disabled={saving}
              onClick={() => setDialogOpen(false)}
              sx={{ textTransform: 'none', color: 'text.secondary' }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={saving && <CircularProgress size={16} color="inherit" />}
              sx={{
                bgcolor: BRAND,
                '&:hover': { bgcolor: '#2e6122' },
                textTransform: 'none',
                fontWeight: 700,
                px: 3,
              }}
            >
              {saving ? 'Saving…' : editingItem ? 'Save Changes' : 'Create Account'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={Boolean(deleteConfirmId)}
        onClose={() => !saving && setDeleteConfirmId(null)}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to permanently delete this social media account? It will be immediately removed from the customer footer and any live storefront links.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            disabled={saving}
            onClick={() => setDeleteConfirmId(null)}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            disabled={saving}
            onClick={() => handleDelete(deleteConfirmId)}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            {saving ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

