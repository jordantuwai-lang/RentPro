const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const classes = [
  { code: 'A', description: 'Small Hatchback',       example: 'Kia Picanto / Hyundai i20',          sortOrder: 1 },
  { code: 'B', description: 'Medium Hatchback',      example: 'Toyota Yaris / Mazda 2',             sortOrder: 2 },
  { code: 'C', description: 'Small Sedan',           example: 'Toyota Corolla / Mazda 3',           sortOrder: 3 },
  { code: 'D', description: 'Medium Sedan',          example: 'Toyota Camry / Mazda 6',             sortOrder: 4 },
  { code: 'E', description: 'Large Sedan',           example: 'Kia Stinger / Skoda Octavia',        sortOrder: 5 },
  { code: 'F', description: 'Prestige Sedan',        example: 'BMW 3 Series / Mercedes C-Class',    sortOrder: 6 },
  { code: 'G', description: 'Small SUV',             example: 'Mazda CX-3 / Toyota Yaris Cross',    sortOrder: 7 },
  { code: 'H', description: 'Medium SUV',            example: 'Toyota RAV4 / Mazda CX-5',           sortOrder: 8 },
  { code: 'I', description: 'Large SUV',             example: 'Toyota Kluger / Hyundai Santa Fe',   sortOrder: 9 },
  { code: 'J', description: 'Prestige SUV',          example: 'BMW X5 / Mercedes GLE',              sortOrder: 10 },
  { code: 'K', description: 'Light Commercial',      example: 'Toyota HiAce / Ford Transit',        sortOrder: 11 },
  { code: 'L', description: 'Ute',                   example: 'Toyota HiLux / Ford Ranger',         sortOrder: 12 },
  { code: 'M', description: 'People Mover',          example: 'Kia Carnival / Toyota Tarago',       sortOrder: 13 },
  { code: 'N', description: 'Prestige People Mover', example: 'Mercedes V-Class',                   sortOrder: 14 },
];

async function main() {
  for (const c of classes) {
    await prisma.vehicleClass.upsert({
      where: { code: c.code },
      update: { description: c.description, example: c.example, sortOrder: c.sortOrder },
      create: c,
    });
    console.log(`✓ Class ${c.code} — ${c.description}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
