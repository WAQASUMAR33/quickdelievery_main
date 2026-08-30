const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const vendors = await prisma.users.findMany({
    where: { role: 'VENDOR' },
    select: {
      id: true,
      uid: true,
      username: true,
      email: true,
      phoneNumber: true,
      emailVerification: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log(`Found ${vendors.length} vendor account(s):\n`);
  vendors.forEach((v, i) => {
    console.log(`[${i + 1}] ID: ${v.id} | UID: ${v.uid}`);
    console.log(`    Name:    ${v.username}`);
    console.log(`    Email:   ${v.email}`);
    console.log(`    Phone:   ${v.phoneNumber}`);
    console.log(`    Verified: ${v.emailVerification}`);
    console.log(`    Created: ${v.createdAt}`);
    console.log('');
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
