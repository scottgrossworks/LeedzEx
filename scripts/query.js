// scripts/query.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const key = args[0];
const val = args[1];

if (!key || !val) {
  console.error("Usage: node scripts/query.js <field> <value>");
  process.exit(1);
}

async function main() {
  const where = {};
  where[key] = val;

  try {
    const results = await prisma.mark.findMany({ where });
    console.log(JSON.stringify(results, null, 2));
  } catch (e) {
    console.error("Query failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
