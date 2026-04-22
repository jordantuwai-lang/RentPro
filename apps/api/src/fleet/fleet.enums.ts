/**
 * Fleet Service Enums
 * 
 * Defines all enum types used in the fleet management module.
 * These enums are derived from the Prisma schema and ensure
 * type safety across the fleet service and controllers.
 */

/**
 * VehicleStatus - Tracks the operational state of a vehicle
 * 
 * AVAILABLE - Vehicle is ready for rental
 * ON_HIRE - Vehicle is currently rented out
 * IN_REPAIR - Vehicle is undergoing repairs (no customer)
 * BOOKED_FOR_REPAIR - Vehicle has a repair appointment scheduled
 * IN_SERVICE - Vehicle is undergoing maintenance/service (no customer)
 * BOOKED_FOR_SERVICE - Vehicle has a service appointment scheduled
 * CLEAN_NEEDED - Vehicle needs cleaning before next rental
 * NOT_AVAILABLE - Vehicle is temporarily unavailable (generic hold)
 * WITH_STAFF - Vehicle is with a staff member (not for rent)
 * RESERVED_FOR_TRANSPORT - Vehicle is reserved for company transport
 * RETIRED - Vehicle is permanently retired from fleet
 */
export enum VehicleStatus {
  AVAILABLE = 'AVAILABLE',
  BOOKED_FOR_REPAIR = 'BOOKED_FOR_REPAIR',
  BOOKED_FOR_SERVICE = 'BOOKED_FOR_SERVICE',
  CLEAN_NEEDED = 'CLEAN_NEEDED',
  IN_REPAIR = 'IN_REPAIR',
  IN_SERVICE = 'IN_SERVICE',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
  ON_HIRE = 'ON_HIRE',
  RESERVED_FOR_TRANSPORT = 'RESERVED_FOR_TRANSPORT',
  RETIRED = 'RETIRED',
  WITH_STAFF = 'WITH_STAFF',
}

/**
 * Vehicle Status Categories
 * 
 * Helper object to group vehicle statuses by availability
 * Useful for filtering and UI state management
 */
export const VehicleStatusCategories = {
  AVAILABLE_FOR_HIRE: [VehicleStatus.AVAILABLE],
  
  UNAVAILABLE: [
    VehicleStatus.NOT_AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
    VehicleStatus.RETIRED,
  ],
  
  IN_USE: [
    VehicleStatus.ON_HIRE,
    VehicleStatus.WITH_STAFF,
    VehicleStatus.RESERVED_FOR_TRANSPORT,
  ],
  
  IN_MAINTENANCE: [
    VehicleStatus.IN_REPAIR,
    VehicleStatus.IN_SERVICE,
    VehicleStatus.BOOKED_FOR_REPAIR,
    VehicleStatus.BOOKED_FOR_SERVICE,
  ],
};

/**
 * Get human-readable label for a vehicle status
 */
export const VehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.AVAILABLE]: 'Available',
  [VehicleStatus.BOOKED_FOR_REPAIR]: 'Booked for Repair',
  [VehicleStatus.BOOKED_FOR_SERVICE]: 'Booked for Service',
  [VehicleStatus.CLEAN_NEEDED]: 'Needs Cleaning',
  [VehicleStatus.IN_REPAIR]: 'In Repair',
  [VehicleStatus.IN_SERVICE]: 'In Service',
  [VehicleStatus.NOT_AVAILABLE]: 'Not Available',
  [VehicleStatus.ON_HIRE]: 'On Hire',
  [VehicleStatus.RESERVED_FOR_TRANSPORT]: 'Reserved for Transport',
  [VehicleStatus.RETIRED]: 'Retired',
  [VehicleStatus.WITH_STAFF]: 'With Staff',
};

/**
 * Allowed status transitions for vehicles
 * Defines which statuses a vehicle can transition to from each status
 * 
 * This ensures vehicles follow proper state machine logic
 */
export const VehicleStatusTransitions: Record<VehicleStatus, VehicleStatus[]> = {
  [VehicleStatus.AVAILABLE]: [
    VehicleStatus.ON_HIRE,
    VehicleStatus.WITH_STAFF,
    VehicleStatus.BOOKED_FOR_REPAIR,
    VehicleStatus.BOOKED_FOR_SERVICE,
    VehicleStatus.NOT_AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
  ],
  
  [VehicleStatus.ON_HIRE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.IN_REPAIR]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.BOOKED_FOR_REPAIR]: [
    VehicleStatus.IN_REPAIR,
    VehicleStatus.AVAILABLE,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.IN_SERVICE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.BOOKED_FOR_SERVICE]: [
    VehicleStatus.IN_SERVICE,
    VehicleStatus.AVAILABLE,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.CLEAN_NEEDED]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.NOT_AVAILABLE]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
    VehicleStatus.RETIRED,
  ],
  
  [VehicleStatus.WITH_STAFF]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.RESERVED_FOR_TRANSPORT]: [
    VehicleStatus.AVAILABLE,
    VehicleStatus.CLEAN_NEEDED,
    VehicleStatus.NOT_AVAILABLE,
  ],
  
  [VehicleStatus.RETIRED]: [
    // Retired vehicles cannot transition to other statuses
  ],
};

/**
 * Check if a status transition is allowed
 */
export function isValidStatusTransition(
  from: VehicleStatus,
  to: VehicleStatus,
): boolean {
  const allowedTransitions = VehicleStatusTransitions[from];
  return allowedTransitions ? allowedTransitions.includes(to) : false;
}
