import { PrismaClient, UserRole } from '@prisma/client';
import { hashSecret } from '../src/auth/password-hash';

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_SEED_USERNAME || 'admin';
  const password = process.env.ADMIN_SEED_PASSWORD || 'change_me_123';

  if (password.length < 8) {
    throw new Error('ADMIN_SEED_PASSWORD must be at least 8 characters long.');
  }

  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    console.warn(`Admin user "${username}" already exists.`);
    return;
  }

  const passwordHash = await hashSecret(password);
  await prisma.user.create({
    data: {
      username,
      passwordHash,
      role: UserRole.admin,
    },
  });

  console.warn(
    `Admin user "${username}" created. Change the password on first login.`,
  );
}

main()
  .catch((error) => {
    console.error('Failed to seed admin user:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
