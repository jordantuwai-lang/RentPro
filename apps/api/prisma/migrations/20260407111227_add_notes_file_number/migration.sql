-- CreateTable
CREATE TABLE "ReservationNote" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "authorName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReservationNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FileNumberCounter" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "KPK" INTEGER NOT NULL DEFAULT 1000,
    "COB" INTEGER NOT NULL DEFAULT 1000,

    CONSTRAINT "FileNumberCounter_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ReservationNote" ADD CONSTRAINT "ReservationNote_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "Reservation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
