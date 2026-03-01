const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
require('dotenv').config();

async function createUser() {
  const args = process.argv.slice(2);
  
  if (args.length < 3) {
    console.log('Usage: node scripts/create-user.js <email> <password> <displayName> [role] [phoneNumber]');
    console.log('Example: node scripts/create-user.js test@example.com password123 "Test User" CUSTOMER +1234567890');
    process.exit(1);
  }

  const [email, password, displayName, role = 'CUSTOMER', phoneNumber = ''] = args;
  const prisma = new PrismaClient();

  try {
    console.log(`Creating user: ${email}...`);

    // Generate a random UID for backward compatibility
    const uid = crypto.randomUUID();
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Check if user exists
    const existingUser = await prisma.users.findUnique({
      where: { email: email }
    });

    let dbUser;
    if (existingUser) {
        console.log(`User found in DB (ID: ${existingUser.id}). Updating...`);
        dbUser = await prisma.users.update({
            where: { id: existingUser.id },
            data: {
                username: displayName,
                password: hashedPassword, // Store hashed password
                role: role,
                phoneNumber: phoneNumber,
                // Ensure UID is set if missing
                uid: existingUser.uid || uid,
                emailVerification: true
            }
        });
    } else {
        console.log('Creating new user in Database...');
        dbUser = await prisma.users.create({
            data: {
                email,
                username: displayName,
                password: hashedPassword,
                role: role,
                phoneNumber: phoneNumber,
                uid: uid,
                emailVerification: true,
                createdAt: new Date(),
                updatedAt: new Date()
            }
        });
    }

    console.log(`User created/updated successfully.`);
    console.log(`ID: ${dbUser.id}`);
    console.log(`Email: ${dbUser.email}`);
    console.log(`Role: ${dbUser.role}`);
    console.log(`UID: ${dbUser.uid}`);

  } catch (error) {
    console.error('Error creating user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUser();
