const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.category.findMany({ select: { id: true, name: true, code: true, status: true, vertical: true } })
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error)
  .finally(() => prisma.$disconnect());
