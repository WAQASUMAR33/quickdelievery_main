const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Get all vendor UIDs
  const vendors = await prisma.users.findMany({
    where: { role: 'VENDOR' },
    select: { id: true, uid: true, email: true, username: true },
  });

  if (vendors.length === 0) {
    console.log('No vendor accounts found.');
    return;
  }

  const vendorIds  = vendors.map(v => v.id);
  const vendorUids = vendors.map(v => v.uid);
  const vendorEmails = vendors.map(v => v.email);

  console.log(`Deleting ${vendors.length} vendor accounts...`);
  vendors.forEach(v => console.log(`  - [${v.id}] ${v.username} (${v.email})`));
  console.log('');

  // 1. Delete Business profiles linked to vendor emails
  const bizDel = await prisma.business.deleteMany({
    where: { email: { in: vendorEmails } },
  });
  console.log(`Deleted ${bizDel.count} business profile(s).`);

  // 2. Delete Products created/owned by these vendors
  const prodDel = await prisma.product.deleteMany({
    where: { vendorId: { in: vendorUids } },
  });
  console.log(`Deleted ${prodDel.count} product(s).`);

  // 3. Delete FoodDeals owned by vendors
  const dealDel = await prisma.foodDeal.deleteMany({
    where: { vendorUid: { in: vendorUids } },
  });
  console.log(`Deleted ${dealDel.count} food deal(s).`);

  // 4. Delete Favorites where vendorUid matches
  const favDel = await prisma.favorite.deleteMany({
    where: { vendorUid: { in: vendorUids } },
  });
  console.log(`Deleted ${favDel.count} favorite(s).`);

  // 5. Delete CustomerProfile if any vendor has one
  const custDel = await prisma.customerProfile.deleteMany({
    where: { userId: { in: vendorUids } },
  });
  console.log(`Deleted ${custDel.count} customer profile(s).`);

  // 6. Delete the Users themselves
  const userDel = await prisma.users.deleteMany({
    where: { id: { in: vendorIds } },
  });
  console.log(`Deleted ${userDel.count} user account(s).`);

  console.log('\n✅ All vendor accounts and associated data deleted successfully.');
}

main().catch(e => {
  console.error('❌ Error during deletion:', e.message);
  process.exit(1);
}).finally(() => prisma.$disconnect());
