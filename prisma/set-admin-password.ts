/**
 * Sets (or creates) the admin account's password from ADMIN_EMAIL / ADMIN_PASSWORD in .env.
 *
 *   npm run admin:set-password
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const OLD_PUBLIC_PASSWORD = 'AdminJeopardy2026!';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env first.');
  }
  if (password === OLD_PUBLIC_PASSWORD) {
    throw new Error('ADMIN_PASSWORD is still the old public default. Choose a new one in .env.');
  }
  if (password.length < 10) {
    throw new Error('ADMIN_PASSWORD must be at least 10 characters.');
  }

  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await prisma.admin.upsert({
      where: { email },
      update: { passwordHash },
      create: { email, passwordHash, name: 'CyberGuardian Admin' },
    });

    // Remove any other admin accounts (e.g. one still using the old default)
    const removed = await prisma.admin.deleteMany({ where: { NOT: { id: admin.id } } });

    console.log(`Admin password updated for ${admin.email}.`);
    if (removed.count) console.log(`Removed ${removed.count} other admin account(s).`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
