export function isBranchFiltered(branchId?: string): branchId is string {
  return !!branchId && branchId !== 'null' && branchId !== 'all';
}
