import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed/index';

export async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL must be set before running the seed');
  }

  const client = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });

  try {
    await seedDatabase(client);
  } finally {
    await client.$disconnect();
  }
}

if (require.main === module) {
  main()
    .then(() => {
      console.log('Seed completed: demo data is ready.');
    })
    .catch((error: unknown) => {
      console.error(error);
      process.exit(1);
    });
}
