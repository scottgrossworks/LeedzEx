// scripts/import.js
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

const filepath = process.argv[2];
if (!filepath) {
  console.error("Usage: node scripts/import.js <path_to_json>");
  process.exit(1);
}

const fullPath = path.resolve(filepath);
const raw = fs.readFileSync(fullPath, 'utf-8');
const incoming = JSON.parse(raw);

// Generate a short suffix
const shortId = crypto.randomBytes(5).toString('hex'); // 10-char hex string
const base = incoming.name ? incoming.name.toLowerCase().replace(/\s+/g, '_') : 'mark';
const customId = `${base}_${shortId}`;

async function main() {
  try {
    const existing = await prisma.mark.findFirst({
      where: { email: incoming.email }
    });

    if (existing) {
      console.log("Entry exists, updating:", existing.id);

      const { id, ...updateData } = incoming; // strip incoming id if present

      const result = await prisma.mark.upsert({
        where: { email: incoming.email },
        update: updateData,
        create: { ...incoming, id: customId }
      });

      console.log("Upsert complete:", result.id);

    } else {
      const result = await prisma.mark.create({
        data: { ...incoming, id: customId }
      });

      console.log("Mark created:", result.id);
    }
  } catch (e) {
    console.error("Import failed:", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
