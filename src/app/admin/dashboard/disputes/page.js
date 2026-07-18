'use client'

import DashboardLayout from '@/components/layout/DashboardLayout'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Card from '@mui/material/Card'
import CardContent from '@mui/material/CardContent'

export default function AdminDisputesPage() {
  return (
    <DashboardLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h5" fontWeight={700} mb={3}>Disputes</Typography>
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <CardContent sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary" fontWeight={600}>
              Disputes Module Coming Soon
            </Typography>
            <Typography variant="body2" color="text.disabled" mt={1}>
              This feature is currently under development and will be available in a future update.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  )
}
