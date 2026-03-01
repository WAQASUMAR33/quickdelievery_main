'use client'

import { useState, useEffect, useCallback } from 'react'
import toast from 'react-hot-toast'

import Box               from '@mui/material/Box'
import Paper             from '@mui/material/Paper'
import Typography        from '@mui/material/Typography'
import Stack             from '@mui/material/Stack'
import Button            from '@mui/material/Button'
import IconButton        from '@mui/material/IconButton'
import TextField         from '@mui/material/TextField'
import InputAdornment    from '@mui/material/InputAdornment'
import Dialog            from '@mui/material/Dialog'
import DialogTitle       from '@mui/material/DialogTitle'
import DialogContent     from '@mui/material/DialogContent'
import DialogActions     from '@mui/material/DialogActions'
import DialogContentText from '@mui/material/DialogContentText'
import CircularProgress  from '@mui/material/CircularProgress'
import Chip              from '@mui/material/Chip'
import Tooltip           from '@mui/material/Tooltip'
import { DataGrid }      from '@mui/x-data-grid'

import SearchIcon           from '@mui/icons-material/Search'
import AddIcon              from '@mui/icons-material/Add'
import EditOutlinedIcon     from '@mui/icons-material/EditOutlined'
import DeleteOutlineIcon    from '@mui/icons-material/DeleteOutline'
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined'

const BRAND = '#D70F64'

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    '&:hover fieldset': { borderColor: BRAND },
    '&.Mui-focused fieldset': { borderColor: BRAND },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: BRAND },
}

export default function BusinessCategoriesManagement() {
  const [rows, setRows]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(0)
  const [pageSize, setPageSize]   = useState(10)
  const [total, setTotal]         = useState(0)

  // Add / Edit dialog
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing]       = useState(null) // null = add, obj = edit
  const [titleValue, setTitleValue] = useState('')
  const [saving, setSaving]         = useState(false)

  // Delete confirm dialog
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting]         = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: (page + 1).toString(),
        limit: pageSize.toString(),
        search,
      })
      const res  = await fetch(`/api/admin/business-categories?${params}`)
      const data = await res.json()
      if (data.success) {
        setRows(data.data)
        setTotal(data.pagination.total)
      } else {
        toast.error(data.error || 'Failed to load categories')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, search])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset page when search changes
  useEffect(() => { setPage(0) }, [search])

  const openAdd = () => {
    setEditing(null)
    setTitleValue('')
    setDialogOpen(true)
  }

  const openEdit = (row) => {
    setEditing(row)
    setTitleValue(row.categoryTitle)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    if (saving) return
    setDialogOpen(false)
    setTitleValue('')
    setEditing(null)
  }

  const handleSave = async () => {
    if (!titleValue.trim()) {
      toast.error('Category title is required')
      return
    }
    setSaving(true)
    try {
      const method = editing ? 'PUT' : 'POST'
      const body   = editing
        ? { id: editing.id, categoryTitle: titleValue.trim() }
        : { categoryTitle: titleValue.trim() }

      const res  = await fetch('/api/admin/business-categories', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(editing ? 'Category updated' : 'Category created')
        setDialogOpen(false)
        fetchData()
      } else {
        toast.error(data.error || 'Save failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res  = await fetch(`/api/admin/business-categories?id=${deleteTarget.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Category deleted')
        setDeleteTarget(null)
        fetchData()
      } else {
        toast.error(data.error || 'Delete failed')
      }
    } catch {
      toast.error('Network error')
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      field: 'id',
      headerName: 'ID',
      width: 80,
      sortable: false,
    },
    {
      field: 'categoryTitle',
      headerName: 'Category Title',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 180,
      valueFormatter: (value) =>
        value ? new Date(value).toLocaleDateString('en-PK', { dateStyle: 'medium' }) : '—',
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      renderCell: ({ row }) => (
        <Stack direction="row" spacing={0.5} alignItems="center" height="100%">
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: BRAND }}>
              <EditOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteTarget(row)} sx={{ color: 'error.main' }}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      ),
    },
  ]

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <CategoryOutlinedIcon sx={{ color: BRAND, fontSize: 32 }} />
          <Box>
            <Typography variant="h5" fontWeight={700}>Business Categories</Typography>
            <Typography variant="body2" color="text.secondary">
              Manage categories for vendor businesses
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip label={`${total} total`} size="small" sx={{ bgcolor: `${BRAND}18`, color: BRAND, fontWeight: 600 }} />
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={openAdd}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, borderRadius: 0, textTransform: 'none', fontWeight: 600 }}
          >
            Add Category
          </Button>
        </Stack>
      </Stack>

      {/* Search */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, borderRadius: 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search categories…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={fieldSx}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* DataGrid */}
      <Paper variant="outlined" sx={{ borderRadius: 0, overflow: 'hidden' }}>
        <DataGrid
          rows={rows}
          columns={columns}
          loading={loading}
          rowCount={total}
          paginationMode="server"
          paginationModel={{ page, pageSize }}
          onPaginationModelChange={({ page: p, pageSize: ps }) => {
            setPage(p)
            setPageSize(ps)
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': { bgcolor: '#fafafa' },
            '& .MuiDataGrid-row:hover': { bgcolor: `${BRAND}08` },
            '& .MuiDataGrid-cell:focus': { outline: 'none' },
          }}
        />
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editing ? 'Edit Category' : 'Add New Category'}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Category Title"
            value={titleValue}
            onChange={(e) => setTitleValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave() }}
            sx={{ mt: 1, ...fieldSx }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CategoryOutlinedIcon sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} disabled={saving} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            sx={{ bgcolor: BRAND, '&:hover': { bgcolor: '#b00d52' }, textTransform: 'none', fontWeight: 600 }}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 0 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Category</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete <strong>{deleteTarget?.categoryTitle}</strong>? This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
            startIcon={deleting ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
