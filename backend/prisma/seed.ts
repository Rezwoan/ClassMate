import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script. Extended in a later phase to create a demo user with a semester,
 * courses, classes, quizzes and homework for local development.
 */
async function main() {
  const userCount = await prisma.user.count();
  console.log(`[seed] database reachable — ${userCount} user(s) present.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
