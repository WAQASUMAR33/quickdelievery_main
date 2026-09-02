export async function GET() {
  return Response.json({
    success: true,
    data: [],
    pagination: { page: 1, limit: 10, total: 0, pages: 0 },
  })
}

export async function POST() {
  return Response.json({ success: false, error: 'Business categories are discontinued' }, { status: 410 })
}

export async function PUT() {
  return Response.json({ success: false, error: 'Business categories are discontinued' }, { status: 410 })
}

export async function DELETE() {
  return Response.json({ success: false, error: 'Business categories are discontinued' }, { status: 410 })
}
