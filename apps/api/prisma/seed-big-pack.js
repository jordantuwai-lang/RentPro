const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ─── helpers ────────────────────────────────────────────────────────────────

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n, len = 6) {
  return String(n).padStart(len, '0');
}

// ─── data pools ─────────────────────────────────────────────────────────────

const firstNames = [
  'Liam','Noah','Oliver','Elijah','James','Ethan','Lucas','Mason','Aiden','Logan',
  'Sophia','Emma','Ava','Isabella','Mia','Charlotte','Amelia','Harper','Evelyn','Abigail',
  'Michael','Daniel','Matthew','Henry','Alexander','Benjamin','Jackson','Sebastian','Jack','Owen',
  'Olivia','Emily','Elizabeth','Sofia','Avery','Ella','Scarlett','Grace','Chloe','Victoria',
  'William','Ryan','Nathan','Tyler','Brandon','Dylan','Jordan','Connor','Caleb','Jayden',
];

const lastNames = [
  'Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor',
  'Anderson','Thomas','Jackson','White','Harris','Martin','Thompson','Moore','Young','Allen',
  'King','Wright','Scott','Torres','Nguyen','Hill','Flores','Green','Adams','Nelson',
  'Baker','Hall','Rivera','Campbell','Mitchell','Carter','Roberts','Gomez','Phillips','Evans',
  'Turner','Diaz','Parker','Cruz','Edwards','Collins','Reyes','Stewart','Morris','Sanchez',
];

const suburbs = [
  { name: 'Frankston', postcode: '3199', state: 'VIC' },
  { name: 'Dandenong', postcode: '3175', state: 'VIC' },
  { name: 'Ringwood', postcode: '3134', state: 'VIC' },
  { name: 'Sunshine', postcode: '3020', state: 'VIC' },
  { name: 'Werribee', postcode: '3030', state: 'VIC' },
  { name: 'Cranbourne', postcode: '3977', state: 'VIC' },
  { name: 'Pakenham', postcode: '3810', state: 'VIC' },
  { name: 'Epping', postcode: '3076', state: 'VIC' },
  { name: 'Hoppers Crossing', postcode: '3029', state: 'VIC' },
  { name: 'Moorabbin', postcode: '3189', state: 'VIC' },
  { name: 'Broadmeadows', postcode: '3047', state: 'VIC' },
  { name: 'Footscray', postcode: '3011', state: 'VIC' },
  { name: 'Reservoir', postcode: '3073', state: 'VIC' },
  { name: 'Clayton', postcode: '3168', state: 'VIC' },
  { name: 'Oakleigh', postcode: '3166', state: 'VIC' },
];

const streetNames = [
  'Station Road','High Street','Church Street','Victoria Street','Main Road',
  'Park Avenue','George Street','Elizabeth Street','William Street','King Street',
  'Queen Street','Railway Parade','Bridge Road','Princes Highway','Nepean Highway',
];

function randomAddress() {
  const s = pick(suburbs);
  return {
    address: `${Math.floor(Math.random() * 150) + 1} ${pick(streetNames)}`,
    suburb: s.name,
    postcode: s.postcode,
    state: s.state,
  };
}

const vehiclePool = [
  { make: 'Toyota', model: 'Corolla', category: 'Small', colour: 'White' },
  { make: 'Toyota', model: 'Camry', category: 'Medium', colour: 'Silver' },
  { make: 'Toyota', model: 'RAV4', category: 'SUV', colour: 'Grey' },
  { make: 'Toyota', model: 'HiLux', category: 'Ute', colour: 'White' },
  { make: 'Toyota', model: 'Kluger', category: 'SUV', colour: 'Black' },
  { make: 'Mazda', model: 'CX-5', category: 'SUV', colour: 'Soul Red' },
  { make: 'Mazda', model: 'Mazda3', category: 'Small', colour: 'Blue' },
  { make: 'Mazda', model: 'CX-9', category: 'SUV', colour: 'White' },
  { make: 'Hyundai', model: 'Tucson', category: 'SUV', colour: 'Grey' },
  { make: 'Hyundai', model: 'i30', category: 'Small', colour: 'Silver' },
  { make: 'Hyundai', model: 'Santa Fe', category: 'SUV', colour: 'Black' },
  { make: 'Kia', model: 'Sportage', category: 'SUV', colour: 'White' },
  { make: 'Kia', model: 'Cerato', category: 'Small', colour: 'Blue' },
  { make: 'Kia', model: 'Carnival', category: 'Van', colour: 'Grey' },
  { make: 'Kia', model: 'Stinger', category: 'Medium', colour: 'Black' },
  { make: 'Honda', model: 'Civic', category: 'Small', colour: 'White' },
  { make: 'Honda', model: 'CR-V', category: 'SUV', colour: 'Silver' },
  { make: 'Honda', model: 'Jazz', category: 'Small', colour: 'Red' },
  { make: 'Nissan', model: 'X-Trail', category: 'SUV', colour: 'White' },
  { make: 'Nissan', model: 'Navara', category: 'Ute', colour: 'Grey' },
  { make: 'Ford', model: 'Ranger', category: 'Ute', colour: 'White' },
  { make: 'Ford', model: 'Escape', category: 'SUV', colour: 'Blue' },
  { make: 'Ford', model: 'Puma', category: 'Small', colour: 'Orange' },
  { make: 'Mitsubishi', model: 'Outlander', category: 'SUV', colour: 'White' },
  { make: 'Mitsubishi', model: 'ASX', category: 'SUV', colour: 'Silver' },
  { make: 'Mitsubishi', model: 'Triton', category: 'Ute', colour: 'White' },
  { make: 'Subaru', model: 'Forester', category: 'SUV', colour: 'Grey' },
  { make: 'Subaru', model: 'Outback', category: 'SUV', colour: 'Silver' },
  { make: 'Volkswagen', model: 'Golf', category: 'Small', colour: 'White' },
  { make: 'Volkswagen', model: 'Tiguan', category: 'SUV', colour: 'Black' },
  { make: 'Volkswagen', model: 'Amarok', category: 'Ute', colour: 'Grey' },
  { make: 'Mercedes-Benz', model: 'C-Class', category: 'Medium', colour: 'Black' },
  { make: 'Mercedes-Benz', model: 'GLC', category: 'SUV', colour: 'Silver' },
  { make: 'BMW', model: '3 Series', category: 'Medium', colour: 'White' },
  { make: 'BMW', model: 'X3', category: 'SUV', colour: 'Grey' },
  { make: 'Audi', model: 'A4', category: 'Medium', colour: 'Silver' },
  { make: 'Audi', model: 'Q5', category: 'SUV', colour: 'Black' },
  { make: 'Lexus', model: 'RX', category: 'SUV', colour: 'White' },
  { make: 'Lexus', model: 'IS', category: 'Medium', colour: 'Black' },
  { make: 'Jeep', model: 'Wrangler', category: 'SUV', colour: 'Green' },
];

const years = [2020, 2021, 2022, 2023, 2024];

const insurerCodes = ['AAMI','ALLIANZ','RACV','BUDGET','GIO','NRMA','QBE','SUNCORP'];

const sourceOfBusiness = ['Repairer','Tow Operator','Insurance Company','Direct','Body Shop'];

const claimStatuses = ['OPEN','IN_PROGRESS','CLOSED'];
const resStatuses = ['ACTIVE','PENDING','COMPLETED','DRAFT'];

const noteTemplates = [
  'File opened. Customer confirmed not at fault.',
  'Insurer contacted. Awaiting liability confirmation.',
  'Repairer confirmed repair start date.',
  'Customer called — vehicle performing well.',
  'Insurer accepted liability. Claim proceeding.',
  'Assessment booked for next week.',
  'Repair timeline extended by 5 days.',
  'Third party insurer pursuing recovery.',
  'Invoice submitted to insurer.',
  'Claim finalised. Vehicle returned.',
];

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 Starting big seed pack...\n');

  // ── look up required references ──────────────────────────────────────────

  const branches = await prisma.branch.findMany();
  const kpk = branches.find(b => b.code === 'KPK');
  const cob = branches.find(b => b.code === 'COB');

  if (!kpk || !cob) {
    throw new Error('KPK or COB branch not found. Run the main seed first.');
  }

  const insurers = await prisma.insurer.findMany();
  if (insurers.length === 0) {
    throw new Error('No insurers found. Run the main seed first.');
  }

  const repairers = await prisma.repairer.findMany();
  // repairers are optional for non-claim reservations

  // ── ensure reservation counter exists ───────────────────────────────────

  let counter = await prisma.reservationCounter.findUnique({ where: { id: 1 } });
  if (!counter) {
    counter = await prisma.reservationCounter.create({ data: { id: 1, current: 1000 } });
  }
  let rezNum = counter.current;

  async function nextRezNum() {
    rezNum += 1;
    return `REZ${rezNum}`;
  }

  // ── 1. CREATE 100 VEHICLES ───────────────────────────────────────────────

  console.log('🚗 Creating 100 vehicles...');

  const vehicles = [];
  const usedRegs = new Set();

  // Check existing test regs to avoid conflicts
  const existingVehicles = await prisma.vehicle.findMany({
    where: { registration: { startsWith: 'BP' } },
    select: { registration: true },
  });
  existingVehicles.forEach(v => usedRegs.add(v.registration));

  for (let i = 1; i <= 100; i++) {
    const reg = `BP${pad(i, 4)}`;
    if (usedRegs.has(reg)) {
      const existing = await prisma.vehicle.findUnique({ where: { registration: reg } });
      if (existing) { vehicles.push(existing); continue; }
    }

    const spec = vehiclePool[(i - 1) % vehiclePool.length];
    const branch = i <= 60 ? kpk : cob; // 60 at KPK, 40 at COB
    const year = years[(i - 1) % years.length];
    // First 20 are ON_HIRE, rest AVAILABLE (a few others scattered)
    const status = i <= 20 ? 'ON_HIRE'
      : i <= 25 ? 'IN_REPAIR'
      : i <= 27 ? 'CLEAN_NEEDED'
      : 'AVAILABLE';

    const vehicle = await prisma.vehicle.create({
      data: {
        registration: reg,
        make: spec.make,
        model: spec.model,
        year,
        colour: spec.colour,
        category: spec.category,
        state: 'VIC',
        status,
        branch: { connect: { id: branch.id } },
      },
    });
    vehicles.push(vehicle);
    usedRegs.add(reg);
  }

  console.log(`   ✅ ${vehicles.length} vehicles created\n`);

  // ── 2. CREATE 50 CUSTOMERS ───────────────────────────────────────────────

  console.log('👤 Creating 50 customers...');

  const customers = [];
  for (let i = 0; i < 50; i++) {
    const fn = firstNames[i % firstNames.length];
    const ln = lastNames[i % lastNames.length];
    const customer = await prisma.customer.create({
      data: {
        firstName: fn,
        lastName: ln,
        phone: `04${String(Math.floor(Math.random() * 90000000) + 10000000)}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`,
        licenceNumber: `VIC${pad(100000 + i)}`,
      },
    });
    customers.push(customer);
  }

  console.log(`   ✅ ${customers.length} customers created\n`);

  // ── 3. CREATE 50 RESERVATIONS (20 ACTIVE on-hire, 30 mixed) ─────────────

  console.log('📋 Creating 50 reservations...');

  const reservations = [];

  // First 20: ACTIVE, linked to the 20 ON_HIRE vehicles → these become on-hire files
  for (let i = 0; i < 20; i++) {
    const rezNumber = await nextRezNum();
    const customer = customers[i];
    const vehicle = vehicles[i]; // vehicles[0..19] are ON_HIRE
    const startDaysAgo = Math.floor(Math.random() * 20) + 3;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDaysAgo);

    const addr = randomAddress();
    const sob = pick(sourceOfBusiness);

    const rez = await prisma.reservation.create({
      data: {
        reservationNumber: rezNumber,
        fileNumber: `KPKRP-${200 + i}`,
        status: 'ACTIVE',
        startDate,
        customer: { connect: { id: customer.id } },
        vehicle: { connect: { id: vehicle.id } },
        sourceOfBusiness: sob,
      },
    });
    reservations.push(rez);
  }

  // Remaining 30 reservations: mixed statuses, some with vehicles, some without
  const mixedStatuses = ['PENDING','PENDING','COMPLETED','COMPLETED','DRAFT','ACTIVE'];
  for (let i = 20; i < 50; i++) {
    const rezNumber = await nextRezNum();
    const customer = customers[i];
    const status = mixedStatuses[(i - 20) % mixedStatuses.length];

    // Assign vehicles 20-49 (AVAILABLE range) to these where possible
    const vehicleIndex = 27 + (i - 20); // starts at index 27 (past the repair/clean ones)
    const vehicle = vehicleIndex < vehicles.length ? vehicles[vehicleIndex] : null;

    const startDaysAgo = status === 'COMPLETED' ? 30 + Math.floor(Math.random() * 30) : Math.floor(Math.random() * 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - startDaysAgo);
    const endDate = status === 'COMPLETED' ? new Date(startDate.getTime() + (Math.floor(Math.random() * 14) + 3) * 86400000) : null;

    const sob = pick(sourceOfBusiness);

    const rez = await prisma.reservation.create({
      data: {
        reservationNumber: rezNumber,
        fileNumber: status !== 'DRAFT' ? `COBRP-${100 + (i - 20)}` : null,
        status,
        startDate,
        endDate,
        customer: { connect: { id: customer.id } },
        vehicle: vehicle ? { connect: { id: vehicle.id } } : undefined,
        sourceOfBusiness: sob,
      },
    });
    reservations.push(rez);
  }

  // Update counter in DB
  await prisma.reservationCounter.update({ where: { id: 1 }, data: { current: rezNum } });

  console.log(`   ✅ ${reservations.length} reservations created\n`);

  // ── 4. CREATE 20 CLAIMS (linked to the 20 ACTIVE on-hire reservations) ──

  console.log('⚖️  Creating 20 claims...');

  const claimReservations = reservations.slice(0, 20);

  for (let i = 0; i < 20; i++) {
    const rez = claimReservations[i];
    const insurer = insurers[i % insurers.length];
    const repairer = repairers.length > 0 ? repairers[i % repairers.length] : undefined;
    const claimStatus = claimStatuses[i % claimStatuses.length];
    const claimNum = `CLM-${pad(100 + i)}`;
    const claimRef = `${insurer.code}-2026-${pad(50000 + i)}`;

    const note1 = noteTemplates[i % noteTemplates.length];
    const note2 = noteTemplates[(i + 3) % noteTemplates.length];

    await prisma.claim.create({
      data: {
        claimNumber: claimNum,
        claimReference: claimRef,
        sourceOfBusiness: rez.sourceOfBusiness || 'Repairer',
        status: claimStatus,
        reservation: { connect: { id: rez.id } },
        insurer: { connect: { id: insurer.id } },
        repairer: repairer ? { connect: { id: repairer.id } } : undefined,
        notes: {
          create: [
            { note: note1, authorName: pick(['Sarah L.', 'Marcus T.', 'Priya K.', 'James O.']), createdAt: new Date(rez.startDate.getTime() + 86400000) },
            { note: note2, authorName: pick(['Sarah L.', 'Marcus T.', 'Priya K.', 'James O.']), createdAt: new Date(rez.startDate.getTime() + 3 * 86400000) },
          ],
        },
      },
    });
  }

  console.log('   ✅ 20 claims created\n');

  // ── 5. CREATE 7 DAYS OF DELIVERIES (5 DEL + 3 RET + 1 EXC per day) ──────

  console.log('🚚 Creating 7 days of delivery schedule...');

  // We need reservations to attach deliveries to — use the 20 on-hire ones
  // and some of the mixed ones. Deliveries need unique reservationId so we
  // spread across reservations that don't already have a delivery.
  const deliveryRezPool = [...reservations]; // 50 available, each can only have 1 delivery
  let rezPoolIndex = 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const jobPattern = [
    ...Array(5).fill('DELIVERY'),
    ...Array(3).fill('RETURN'),
    'EXCHANGE',
  ]; // 9 jobs per day

  const deliveryTimes = ['08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30','12:00'];

  let totalDeliveries = 0;

  for (let day = 0; day < 7; day++) {
    const jobDate = new Date(today);
    jobDate.setDate(today.getDate() + day);

    for (let j = 0; j < jobPattern.length; j++) {
      const jobType = jobPattern[j];
      const rez = deliveryRezPool[rezPoolIndex % deliveryRezPool.length];
      rezPoolIndex++;

      // Check if this reservation already has a delivery
      const existingDelivery = await prisma.delivery.findUnique({
        where: { reservationId: rez.id },
      });
      if (existingDelivery) continue; // skip if already used

      const [hh, mm] = deliveryTimes[j].split(':').map(Number);
      const scheduledAt = new Date(jobDate);
      scheduledAt.setHours(hh, mm, 0, 0);

      const addr = randomAddress();

      await prisma.delivery.create({
        data: {
          reservation: { connect: { id: rez.id } },
          address: addr.address,
          suburb: addr.suburb,
          scheduledAt,
          status: day === 0 ? pick(['SCHEDULED', 'DISPATCHED', 'EN_ROUTE']) : 'SCHEDULED',
          jobType,
          notes: jobType === 'EXCHANGE' ? 'Vehicle swap — confirm both plate numbers on arrival.' : null,
        },
      });
      totalDeliveries++;
    }
  }

  console.log(`   ✅ ${totalDeliveries} delivery jobs created across 7 days\n`);

  // ── summary ──────────────────────────────────────────────────────────────

  console.log('─────────────────────────────────────────');
  console.log('✅  Big seed pack complete!');
  console.log(`   Vehicles:      100 (20 ON_HIRE, 5 IN_REPAIR/CLEAN, 75 AVAILABLE)`);
  console.log(`   Customers:     50`);
  console.log(`   Reservations:  50 (20 ACTIVE on-hire, 30 mixed)`);
  console.log(`   Claims:        20 (linked to the 20 on-hire files)`);
  console.log(`   Deliveries:    ${totalDeliveries} jobs over 7 days (5 DEL + 3 RET + 1 EXC/day)`);
  console.log('─────────────────────────────────────────');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
