'use client'

import { useRef, useState } from 'react'
import { uploadProductImage } from '@/lib/imageUpload'

import Box              from '@mui/material/Box'
import Typography       from '@mui/material/Typography'
import Button           from '@mui/material/Button'
import IconButton       from '@mui/material/IconButton'
import CircularProgress from '@mui/material/CircularProgress'
import LinearProgress   from '@mui/material/LinearProgress'
import Stack            from '@mui/material/Stack'

import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined'
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import DeleteOutlineIcon       from '@mui/icons-material/DeleteOutline'
import ErrorOutlineIcon        from '@mui/icons-material/ErrorOutline'
import ImageOutlinedIcon       from '@mui/icons-material/ImageOutlined'

const BRAND = '#D70F64'
const ACCEPT = 'image/jpeg,image/png,image/webp,image/jpg'

/**
 * ImageUploadField
 * Props:
 *  label      — field label
 *  required   — shows * in label
 *  value      — current URL (controlled)
 *  onChange   — (url: string) => void  called with URL after upload, or '' on clear
 *  disabled   — disables interactions
 *  helperText — shown below the box
 */
export default function ImageUploadField({ label, required, value, onChange, disabled, helperText }) {
  const inputRef          = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [preview, setPreview]     = useState(value || '')

  // Sync preview if parent resets value
  // (simple — no deep dep tracking needed here)

  const handleClick = () => {
    if (disabled || uploading) return
    inputRef.current?.click()
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Local preview immediately
    const objectUrl = URL.createObjectURL(file)
    setPreview(objectUrl)
    setError('')
    setUploading(true)

    const result = await uploadProductImage(file)

    if (result.success && result.url) {
      setPreview(result.url)
      onChange(result.url)
    } else {
      setError(result.error || 'Upload failed. Please try again.')
      setPreview('')
      onChange('')
    }
    setUploading(false)
    // Reset input so the same file can be re-selected
    e.target.value = ''
  }

  const handleClear = () => {
    setPreview('')
    setError('')
    onChange('')
  }

  const hasImage = !!preview && !error

  return (
    <Box>
      {/* Label */}
      <Typography variant="body2" fontWeight={600} color="text.secondary" mb={0.75}>
        {label}{required && <span style={{ color: BRAND }}> *</span>}
      </Typography>

      {/* Upload box */}
      <Box
        onClick={!hasImage ? handleClick : undefined}
        sx={{
          border: `2px dashed`,
          borderColor: error ? 'error.main' : hasImage ? BRAND : 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: hasImage ? 'transparent' : 'grey.50',
          cursor: (!hasImage && !disabled && !uploading) ? 'pointer' : 'default',
          transition: 'border-color 0.2s',
          '&:hover': (!hasImage && !disabled && !uploading)
            ? { borderColor: BRAND, bgcolor: `${BRAND}08` }
            : {},
          position: 'relative',
          minHeight: 120,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Hidden file input */}
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          style={{ display: 'none' }}
          onChange={handleFile}
          disabled={disabled || uploading}
        />

        {/* Uploading state */}
        {uploading && (
          <Stack alignItems="center" spacing={1} sx={{ p: 2, width: '100%' }}>
            <CircularProgress size={28} sx={{ color: BRAND }} />
            <Typography variant="caption" color="text.secondary">Uploading…</Typography>
            <LinearProgress sx={{ width: '80%', '& .MuiLinearProgress-bar': { bgcolor: BRAND } }} />
          </Stack>
        )}

        {/* Image preview */}
        {hasImage && !uploading && (
          <Box sx={{ position: 'relative', width: '100%' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt={label}
              style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
            />
            {/* Overlay actions */}
            <Stack
              direction="row"
              spacing={1}
              sx={{
                position: 'absolute', top: 6, right: 6,
                bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 1, px: 0.5,
              }}
            >
              <IconButton size="small" onClick={handleClick} sx={{ color: '#fff' }} title="Replace">
                <CloudUploadOutlinedIcon fontSize="small" />
              </IconButton>
              <IconButton size="small" onClick={handleClear} sx={{ color: '#ff6b6b' }} title="Remove">
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Stack>
            {/* Success badge */}
            <Box sx={{
              position: 'absolute', bottom: 6, left: 6,
              bgcolor: 'rgba(0,0,0,0.55)', borderRadius: 1, px: 1, py: 0.25,
              display: 'flex', alignItems: 'center', gap: 0.5,
            }}>
              <CheckCircleOutlinedIcon sx={{ color: '#4ade80', fontSize: 14 }} />
              <Typography variant="caption" sx={{ color: '#fff', fontSize: 11 }}>Uploaded</Typography>
            </Box>
          </Box>
        )}

        {/* Empty state */}
        {!hasImage && !uploading && (
          <Stack alignItems="center" spacing={1} sx={{ p: 3 }}>
            {error
              ? <ErrorOutlineIcon sx={{ color: 'error.main', fontSize: 36 }} />
              : <ImageOutlinedIcon sx={{ color: 'text.disabled', fontSize: 36 }} />
            }
            <Typography variant="body2" color={error ? 'error.main' : 'text.secondary'} textAlign="center">
              {error || 'Click to browse & upload'}
            </Typography>
            {!error && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<CloudUploadOutlinedIcon />}
                onClick={handleClick}
                sx={{
                  textTransform: 'none', borderColor: BRAND, color: BRAND,
                  '&:hover': { bgcolor: `${BRAND}10`, borderColor: BRAND },
                }}
              >
                Choose Image
              </Button>
            )}
            {error && (
              <Button size="small" variant="text" onClick={handleClick}
                sx={{ textTransform: 'none', color: BRAND }}>
                Try again
              </Button>
            )}
          </Stack>
        )}
      </Box>

      {/* Helper text */}
      {helperText && !error && (
        <Typography variant="caption" color="text.disabled" mt={0.5} display="block">
          {helperText}
        </Typography>
      )}
    </Box>
  )
}
