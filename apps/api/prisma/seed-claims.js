const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding repairers...');

  const repairer1 = await prisma.repairer.create({
    data: {
      name: 'Bayside Smash Repairs',
      phone: '03 9555 1234',
      email: 'info@baysidesmash.com.au',
      address: '12 Bay Road',
      suburb: 'Sandringham',
      postcode: '3191',
      state: 'VIC',
    },
  });

  const repairer2 = await prisma.repairer.create({
    data: {
      name: 'North Side Auto Body',
      phone: '03 9444 5678',
      email: 'info@northsideauto.com.au',
      address: '88 Preston Street',
      suburb: 'Northcote',
      postcode: '3070',
      state: 'VIC',
    },
  });

  const repairer3 = await prisma.repairer.create({
    data: {
      name: 'Eastern Smash Repairs',
      phone: '03 9888 9012',
      email: 'info@easternsmash.com.au',
      address: '45 Whitehorse Road',
      suburb: 'Nunawading',
      postcode: '3131',
      state: 'VIC',
    },
  });

  console.log('Repairers created.');

  // Fetch first insurer
  const insurers = await prisma.insurer.findMany({ take: 3 });
  if (insurers.length === 0) {
    console.log('No insurers found — skipping claims.');
    return;
  }

  console.log('Seeding customers and reservations...');

  const customer1 = await prisma.customer.create({
    data: {
      firstName: 'Jordan',
      lastName: 'Tuwai-Lang',
      phone: '0412 345 678',
      email: 'jordan@example.com',
      licenceNumber: 'VIC123456',
    },
  });

  const customer2 = await prisma.customer.create({
    data: {
      firstName: 'Emily',
      lastName: 'Chen',
      phone: '0423 456 789',
      email: 'emily@example.com',
      licenceNumber: 'VIC234567',
    },
  });

  const customer3 = await prisma.customer.create({
    data: {
      firstName: 'Liam',
      lastName: 'Nguyen',
      phone: '0434 567 890',
      email: 'liam@example.com',
      licenceNumber: 'VIC345678',
    },
  });

  // Fetch a vehicle
  const vehicles = await prisma.vehicle.findMany({ take: 3 });

  const reservation1 = await prisma.reservation.create({
    data: {
      reservationNumber: 'REZ9001',
      status: 'ACTIVE',
      startDate: new Date('2026-03-31'),
      customer: { connect: { id: customer1.id } },
      vehicle: vehicles[0] ? { connect: { id: vehicles[0].id } } : undefined,
      sourceOfBusiness: 'Repairer',
      partnerName: 'Bayside Smash Repairs',
    },
  });

  const reservation2 = await prisma.reservation.create({
    data: {
      reservationNumber: 'REZ9002',
      status: 'ACTIVE',
      startDate: new Date('2026-04-04'),
      customer: { connect: { id: customer2.id } },
      vehicle: vehicles[1] ? { connect: { id: vehicles[1].id } } : undefined,
      sourceOfBusiness: 'Tow Operator',
    },
  });

  const reservation3 = await prisma.reservation.create({
    data: {
      reservationNumber: 'REZ9003',
      status: 'COMPLETED',
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-04-10'),
      customer: { connect: { id: customer3.id } },
      vehicle: vehicles[2] ? { connect: { id: vehicles[2].id } } : undefined,
      sourceOfBusiness: 'Repairer',
    },
  });

  console.log('Reservations created. Seeding claims...');

  await prisma.claim.create({
    data: {
      claimNumber: 'CLM-000001',
      status: 'IN_PROGRESS',
      claimReference: 'AAMI-2026-48821',
      sourceOfBusiness: 'Repairer',
      reservation: { connect: { id: reservation1.id } },
      insurer: { connect: { id: insurers[0].id } },
      repairer: { connect: { id: repairer1.id } },
      notes: {
        create: [
          { note: 'File opened. Customer confirmed not at fault.', authorName: 'Sarah L.', createdAt: new Date('2026-04-02T10:02:00') },
          { note: 'Insurer accepted liability. Waiting on repairer to confirm repair timeline.', authorName: 'Sarah L.', createdAt: new Date('2026-04-05T09:14:00') },
        ],
      },
    },
  });

  await prisma.claim.create({
    data: {
      claimNumber: 'CLM-000002',
      status: 'OPEN',
      claimReference: 'NRMA-2026-33291',
      sourceOfBusiness: 'Tow Operator',
      reservation: { connect: { id: reservation2.id } },
      insurer: { connect: { id: insurers[1].id } },
      repairer: { connect: { id: repairer2.id } },
      notes: {
        create: [
          { note: 'Claim lodged. Awaiting insurer response.', authorName: 'Marcus T.', createdAt: new Date('2026-04-04T11:30:00') },
        ],
      },
    },
  });

  await prisma.claim.create({
    data: {
      claimNumber: 'CLM-000003',
      status: 'CLOSED',
      claimReference: 'ALLIANZ-2026-19922',
      sourceOfBusiness: 'Repairer',
      reservation: { connect: { id: reservation3.id } },
      insurer: { connect: { id: insurers[2].id } },
      repairer: { connect: { id: repairer3.id } },
      notes: {
        create: [
          { note: 'Claim resolved. Invoice paid by insurer.', authorName: 'Sarah L.', createdAt: new Date('2026-04-10T14:00:00') },
        ],
      },
    },
  });

  console.log('Done! 3 repairers, 3 reservations, 3 claims seeded.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
  
