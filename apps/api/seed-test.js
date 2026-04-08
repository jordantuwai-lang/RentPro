const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding...');

  const branches = await prisma.branch.findMany();
  const kpk = branches.find(b => b.code === 'KPK');
  const cob = branches.find(b => b.code === 'COB');

  console.log('Branches:', branches.map(b => b.code));

  // Add 10 vehicles
  const vehicleData = [
    { registration: 'TEST001', make: 'Toyota', model: 'Corolla', year: 2022, colour: 'White', category: 'Small', state: 'VIC', branchId: kpk.id },
    { registration: 'TEST002', make: 'Toyota', model: 'Camry', year: 2023, colour: 'Silver', category: 'Medium', state: 'VIC', branchId: kpk.id },
    { registration: 'TEST003', make: 'Mazda', model: 'CX-5', year: 2022, colour: 'Red', category: 'SUV', state: 'VIC', branchId: kpk.id },
    { registration: 'TEST004', make: 'Hyundai', model: 'Tucson', year: 2023, colour: 'Blue', category: 'SUV', state: 'VIC', branchId: kpk.id },
    { registration: 'TEST005', make: 'Kia', model: 'Carnival', year: 2022, colour: 'Black', category: 'Van', state: 'VIC', branchId: kpk.id },
    { registration: 'TEST006', make: 'Honda', model: 'Civic', year: 2023, colour: 'White', category: 'Small', state: 'VIC', branchId: cob.id },
    { registration: 'TEST007', make: 'Nissan', model: 'X-Trail', year: 2022, colour: 'Grey', category: 'SUV', state: 'VIC', branchId: cob.id },
    { registration: 'TEST008', make: 'Ford', model: 'Ranger', year: 2023, colour: 'White', category: 'Ute', state: 'VIC', branchId: cob.id },
    { registration: 'TEST009', make: 'Volkswagen', model: 'Golf', year: 2022, colour: 'Blue', category: 'Small', state: 'VIC', branchId: cob.id },
    { registration: 'TEST010', make: 'Mitsubishi', model: 'Outlander', year: 2023, colour: 'Silver', category: 'SUV', state: 'VIC', branchId: cob.id },
  ];

  const vehicles = [];
  for (const v of vehicleData) {
    const existing = await prisma.vehicle.findUnique({ where: { registration: v.registration } });
    if (!existing) {
      const vehicle = await prisma.vehicle.create({ data: { ...v, status: 'AVAILABLE' } });
      vehicles.push(vehicle);
      console.log('Created vehicle:', v.registration);
    } else {
      vehicles.push(existing);
      console.log('Vehicle exists:', v.registration);
    }
  }

  // Get or create counter
  let counter = await prisma.reservationCounter.findUnique({ where: { id: 1 } });
  if (!counter) {
    counter = await prisma.reservationCounter.create({ data: { id: 1, current: 1010 } });
  }

  // Add 3 reservations
  const customers = [
    { firstName: 'Sarah', lastName: 'Thompson', phone: '0412345678', email: 'sarah.thompson@gmail.com', licenceNumber: 'VIC123456' },
    { firstName: 'James', lastName: 'Wilson', phone: '0423456789', email: 'james.wilson@gmail.com', licenceNumber: 'VIC234567' },
    { firstName: 'Emma', lastName: 'Davis', phone: '0434567890', email: 'emma.davis@gmail.com', licenceNumber: 'VIC345678' },
  ];

  const statuses = ['PENDING', 'ACTIVE', 'PENDING'];
  const vehicleIndexes = [0, 1, 5];
  const createdReservations = [];

  for (let i = 0; i < 3; i++) {
    const current = counter.current + 1;
    await prisma.reservationCounter.update({ where: { id: 1 }, data: { current } });
    counter.current = current;
    const rezNumber = `REZ${current}`;

    const reservation = await prisma.reservation.create({
      data: {
        reservationNumber: rezNumber,
        customer: { create: customers[i] },
        vehicle: { connect: { id: vehicles[vehicleIndexes[i]].id } },
        startDate: new Date(),
        status: statuses[i],
      },
    });
    createdReservations.push(reservation);
    console.log('Created reservation:', rezNumber);
  }

  // Get Jackie driver
  const jackie = await prisma.user.findFirst({ where: { firstName: 'Jackie' } });

  // Add deliveries
  const deliveryData = [
    { address: '52 Translink Drive', suburb: 'Keilor Park' },
    { address: '14 Main Street', suburb: 'Essendon' },
    { address: '8 Park Avenue', suburb: 'Moonee Ponds' },
  ];

  for (let i = 0; i < 3; i++) {
    const existing = await prisma.delivery.findUnique({ where: { reservationId: createdReservations[i].id } });
    if (!existing) {
      const scheduledAt = new Date();
      scheduledAt.setHours(8 + i * 2, 0, 0, 0);
      scheduledAt.setDate(scheduledAt.getDate() + i);

      await prisma.delivery.create({
        data: {
          reservationId: createdReservations[i].id,
          driverId: jackie ? jackie.id : undefined,
          address: deliveryData[i].address,
          suburb: deliveryData[i].suburb,
          scheduledAt,
          status: 'SCHEDULED',
          notes: `Delivery for ${createdReservations[i].reservationNumber}`,
        },
      });
      console.log('Created delivery for', createdReservations[i].reservationNumber);
    }
  }

  console.log('Done!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
