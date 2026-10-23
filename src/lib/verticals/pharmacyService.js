import { prisma } from '../prisma.js'

/**
 * Pharmacy & Healthcare Specialized Service
 * State Machine: pending_rx_review -> approved -> dispensed (or rejected)
 */

export const RX_STATUS = {
  PENDING_REVIEW: 'pending_rx_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DISPENSED: 'dispensed',
}

/**
 * Upload a customer prescription
 */
export async function uploadPrescription({ userId, patientName, doctorName, fileUrl }) {
  if (!userId) throw new Error('Customer user ID is required')
  if (!patientName) throw new Error('Patient name is required')
  if (!fileUrl) throw new Error('Prescription document/image is required')

  const rx = await prisma.prescription.create({
    data: {
      userId: parseInt(userId, 10),
      patientName,
      doctorName: doctorName || 'Licensed Medical Practitioner',
      fileUrl,
      status: RX_STATUS.PENDING_REVIEW,
    },
  })

  return rx
}

/**
 * Pharmacist review & verification state transition
 */
export async function reviewPrescription({
  prescriptionId,
  status,
  licenseNumber,
  pharmacistNotes,
  reviewedBy,
}) {
  const rxId = parseInt(prescriptionId, 10)
  const existing = await prisma.prescription.findUnique({
    where: { id: rxId },
  })

  if (!existing) throw new Error('Prescription not found')

  if (![RX_STATUS.APPROVED, RX_STATUS.REJECTED, RX_STATUS.DISPENSED].includes(status)) {
    throw new Error(`Invalid status transition: ${status}`)
  }

  if (status === RX_STATUS.APPROVED && !licenseNumber) {
    throw new Error('Mandatory pharmacist license number required for approval')
  }

  const updated = await prisma.prescription.update({
    where: { id: rxId },
    data: {
      status,
      licenseNumber: licenseNumber || existing.licenseNumber,
      pharmacistNotes: pharmacistNotes || existing.pharmacistNotes,
      reviewedBy: reviewedBy || 'Licensed Pharmacist Staff',
      reviewedAt: new Date(),
    },
  })

  return updated
}

/**
 * Validate that all prescription items in the cart have an approved prescription
 */
export async function validatePrescriptionForItems({ userId, items, prescriptionId }) {
  const rxRequiredItems = items.filter(
    (item) => item.isPrescriptionRequired || item.vertical === 'PHARMACY'
  )

  if (rxRequiredItems.length === 0) {
    return { valid: true, requiresRx: false }
  }

  if (!prescriptionId) {
    throw new Error(
      `Prescription enforcement violation: The following medicines require an approved doctor prescription before checkout: ${rxRequiredItems
        .map((i) => i.proName || i.name)
        .join(', ')}`
    )
  }

  const rx = await prisma.prescription.findFirst({
    where: {
      id: parseInt(prescriptionId, 10),
      userId: parseInt(userId, 10),
    },
  })

  if (!rx) {
    throw new Error('Referenced prescription was not found for this user account')
  }

  if (rx.status !== RX_STATUS.APPROVED) {
    throw new Error(
      `Prescription #${rx.id} is currently in '${rx.status}' state. Only approved prescriptions can be dispensed.`
    )
  }

  return { valid: true, requiresRx: true, prescription: rx }
}
