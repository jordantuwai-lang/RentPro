// Mirrors apps/api/src/auth/roles.constants.ts CLAIMS_ROLES — keep in sync manually
// (no shared package between apps/web and apps/api in this monorepo today).
export const CLAIMS_ROLES = [
  'ADMIN',
  'LEADERSHIP',
  'OPS_MANAGER',
  'BRANCH_MANAGER',
  'CLAIMS_MANAGER',
  'CLAIMS_TEAM_IN',
  'CLAIMS_TEAM_OUT',
  'CLAIMS_TEAM_LIABILITY',
  'RECOVERY_MANAGER',
] as const;
