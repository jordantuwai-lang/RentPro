-- CreateTable
CREATE TABLE "PaymentCard" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "cardType" TEXT NOT NULL,
    "cardNumber" TEXT NOT NULL,
    "expiryDate" TEXT NOT NULL,
    "cardholderName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdditionalDriver" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "licenceNumber" TEXT NOT NULL,
    "licenceExpiry" TEXT,
    "dob" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdditionalDriver_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PaymentCard" ADD CONSTRAINT "PaymentCard_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdditionalDriver" ADD CONSTRAINT "AdditionalDriver_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
