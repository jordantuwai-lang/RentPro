export interface ClerkUserRecord {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: Array<{ emailAddress: string }>;
  publicMetadata: Record<string, unknown>;
  createdAt: number;
}

export interface UserListItem {
  clerkId: string;
  firstName: string | null;
  lastName: string | null;
  email: string | undefined;
  role: string;
  branch: string;
  branchId: string;
  createdAt: number;
}
