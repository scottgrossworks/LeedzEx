// scripts/remove.js
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const key = args[0];
const val = args[1];

if (!key || !val) {
  console.error("Usage: node scripts/remove.js <field> <value>");
  process.exit(1);
}

async function main() {
  try {
    const deleted = await prisma.mark.deleteMany({
      where: {
        [key]: val
      }
    });

    console.log(`Deleted ${deleted.count} record(s).`);
  } catch (e) {
    console.error("Delete failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
