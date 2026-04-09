const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const chargeTypes = [
    { name: 'Fuel', defaultAmount: 50 },
    { name: 'Tolls', defaultAmount: 20 },
    { name: 'Excess', defaultAmount: 500 },
    { name: 'Additional Days', defaultAmount: 80 },
    { name: 'Cleaning Fee', defaultAmount: 150 },
  ];

  for (const ct of chargeTypes) {
    const existing = await prisma.chargeType.findUnique({ where: { name: ct.name } });
    if (!existing) {
      await prisma.chargeType.create({ data: ct });
      console.log('Created charge type:', ct.name);
    } else {
      console.log('Exists:', ct.name);
    }
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
