import { useUser } from '@clerk/nextjs';
import { CLAIMS_ROLES } from '@/lib/roles';

export function useUserRole() {
  const { user } = useUser();
  const role = user?.publicMetadata?.role as string | undefined;
  return {
    role,
    isClaimsRole: !!role && (CLAIMS_ROLES as readonly string[]).includes(role),
  };
}
