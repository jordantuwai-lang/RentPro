import { Vehicle, VehiclePhoto } from '@prisma/client';

export type VehicleWithPhotos = Vehicle & {
  photos: (VehiclePhoto & { url: string })[];
};

export interface FleetSummary {
  total: number;
  available: number;
  onHire: number;
  inRepair: number;
  inService: number;
  notAvailable: number;
}
