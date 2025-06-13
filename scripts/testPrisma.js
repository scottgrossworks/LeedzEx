// test_prisma.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    console.log("Connecting to Prisma...");
    await prisma.$connect();
    console.log("✅ Connected successfully");

    const test = await prisma.mark.findMany();
    console.log("✅ Query succeeded. Found:", test.length, "records");

    await prisma.$disconnect();
  } catch (err) {
    console.error("❌ Prisma error:");
    console.error(err.stack || err.message);
    process.exit(1);
  }
})();
