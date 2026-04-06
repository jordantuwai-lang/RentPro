import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding RentPro database...');

  const kpk = await prisma.branch.upsert({
    where: { code: 'KPK' },
    update: {},
    create: {
      name: 'Keilor Park',
      code: 'KPK',
      address: '2 Trantara Court, Keilor Park VIC 3042',
      phone: '03 9000 0001',
    },
  });

  const cob = await prisma.branch.upsert({
    where: { code: 'COB' },
    update: {},
    create: {
      name: 'Coburg',
      code: 'COB',
      address: '123 Sydney Road, Coburg VIC 3058',
      phone: '03 9000 0002',
    },
  });

  console.log('Branches created: KPK, COB');

  const vehicles = [
    { registration: '1ABC123', make: 'Toyota', model: 'Corolla', year: 2022, colour: 'White', category: 'Small', branchId: kpk.id },
    { registration: '2DEF456', make: 'Toyota', model: 'Camry', year: 2023, colour: 'Silver', category: 'Medium', branchId: kpk.id },
    { registration: '3GHI789', make: 'Mazda', model: 'CX-5', year: 2022, colour: 'Black', category: 'SUV', branchId: kpk.id },
    { registration: '4JKL012', make: 'Hyundai', model: 'i30', year: 2021, colour: 'Blue', category: 'Small', branchId: kpk.id },
    { registration: '5MNO345', make: 'Kia', model: 'Cerato', year: 2023, colour: 'Red', category: 'Small', branchId: kpk.id },
    { registration: '6PQR678', make: 'Toyota', model: 'RAV4', year: 2023, colour: 'White', category: 'SUV', branchId: cob.id },
    { registration: '7STU901', make: 'Mazda', model: 'Mazda3', year: 2022, colour: 'Grey', category: 'Small', branchId: cob.id },
    { registration: '8VWX234', make: 'Honda', model: 'CR-V', year: 2021, colour: 'Silver', category: 'SUV', branchId: cob.id },
    { registration: '9YZA567', make: 'Hyundai', model: 'Tucson', year: 2023, colour: 'Black', category: 'SUV', branchId: cob.id },
    { registration: '0BCD890', make: 'Kia', model: 'Sportage', year: 2022, colour: 'White', category: 'SUV', branchId: cob.id },
  ];

  for (const v of vehicles) {
    await prisma.vehicle.upsert({
      where: { registration: v.registration },
      update: {},
      create: v,
    });
  }

  console.log('Vehicles created: 10 vehicles across KPK and COB');

  const insurers = [
    { name: 'AAMI', code: 'AAMI', phone: '13 22 44', email: 'claims@aami.com.au' },
    { name: 'Allianz', code: 'ALLIANZ', phone: '13 10 00', email: 'claims@allianz.com.au' },
    { name: 'RACV', code: 'RACV', phone: '13 72 28', email: 'claims@racv.com.au' },
    { name: 'Budget Direct', code: 'BUDGET', phone: '1300 139 422', email: 'claims@budgetdirect.com.au' },
    { name: 'GIO', code: 'GIO', phone: '13 10 10', email: 'claims@gio.com.au' },
    { name: 'NRMA', code: 'NRMA', phone: '13 21 32', email: 'claims@nrma.com.au' },
    { name: 'QBE', code: 'QBE', phone: '13 32 44', email: 'claims@qbe.com.au' },
    { name: 'Suncorp', code: 'SUNCORP', phone: '13 11 55', email: 'claims@suncorp.com.au' },
  ];

  for (const i of insurers) {
    await prisma.insurer.upsert({
      where: { code: i.code },
      update: {},
      create: i,
    });
  }

  console.log('Insurers created: 8 major Australian insurers');
  console.log('Seeding complete!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
