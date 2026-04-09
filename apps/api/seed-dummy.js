const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  { firstName: 'James', lastName: 'Thornton', source: 'Repairer', partner: 'Smith Smash Repairs', status: 'ACTIVE', daysAgo: 1 },
  { firstName: 'Sarah', lastName: 'Mitchell', source: 'Tow Operator', partner: 'City Towing', status: 'PENDING', daysAgo: 3 },
  { firstName: 'Michael', lastName: 'Chen', source: 'Marketing', partner: null, status: 'DRAFT', daysAgo: 5 },
  { firstName: 'Emma', lastName: 'Nguyen', source: 'Repairer', partner: 'Prestige Panel Works', status: 'COMPLETED', daysAgo: 8 },
  { firstName: 'Liam', lastName: 'Patel', source: 'Corporate Partnerships', partner: null, status: 'ACTIVE', daysAgo: 10 },
  { firstName: 'Olivia', lastName: 'Brown', source: 'Tow Operator', partner: 'Quick Tow Services', status: 'CANCELLED', daysAgo: 14 },
  { firstName: 'Noah', lastName: 'Williams', source: 'Repairer', partner: 'North Side Auto', status: 'PENDING', daysAgo: 18 },
  { firstName: 'Ava', lastName: 'Thompson', source: 'Marketing', partner: null, status: 'COMPLETED', daysAgo: 22 },
  { firstName: 'Ethan', lastName: 'Garcia', source: 'Repairer', partner: 'Elite Collision Centre', status: 'ACTIVE', daysAgo: 27 },
  { firstName: 'Isabella', lastName: 'Lee', source: 'Corporate Partnerships', partner: null, status: 'DRAFT', daysAgo: 30 },
];

async function main() {
  const counter = await prisma.reservationCounter.findFirst();
  const vehicle = await prisma.vehicle.findFirst();
  let current = counter?.current || 1001;

  if (!vehicle) {
    console.log('No vehicles found — add a vehicle to fleet first!');
    return;
  }

  for (const r of data) {
    current++;
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - r.daysAgo);

    await prisma.reservation.create({
      data: {
        reservationNumber: 'REZ' + current,
        customer: {
          create: {
            firstName: r.firstName,
            lastName: r.lastName,
            phone: '04' + Math.floor(10000000 + Math.random() * 90000000),
            email: r.firstName.toLowerCase() + '.' + r.lastName.toLowerCase() + '@example.com',
          }
        },
        vehicle: { connect: { id: vehicle.id } },
        startDate: createdAt,
        status: r.status,
        sourceOfBusiness: r.source,
        partnerName: r.partner,
        createdAt: createdAt,
      }
    });
    console.log('Created REZ' + current + ' — ' + r.firstName + ' ' + r.lastName);
  }

  if (counter) {
    await prisma.reservationCounter.update({ where: { id: counter.id }, data: { current } });
  }
  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
