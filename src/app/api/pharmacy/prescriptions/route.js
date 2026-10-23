import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadPrescription } from '@/lib/verticals/pharmacyService'

export async function POST(request) {
  try {
    const body = await request.json()
    const { userId, patientName, doctorName, fileUrl } = body

    if (!userId || !patientName || !fileUrl) {
      return NextResponse.json(
        { error: 'userId, patientName, and fileUrl are required' },
        { status: 400 }
      )
    }

    const prescription = await uploadPrescription({
      userId,
      patientName,
      doctorName,
      fileUrl,
    })

    return NextResponse.json({
      success: true,
      prescription,
      message: 'Prescription uploaded successfully. A licensed pharmacist is reviewing your submission.',
    })
  } catch (error) {
    console.error('Prescription upload error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')

    const where = {}
    if (userId) where.userId = parseInt(userId, 10)
    if (status) where.status = status

    const prescriptions = await prisma.prescription.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, username: true, email: true, phoneNumber: true },
        },
      },
    })

    return NextResponse.json({ success: true, prescriptions })
  } catch (error) {
    console.error('Fetch prescriptions error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
